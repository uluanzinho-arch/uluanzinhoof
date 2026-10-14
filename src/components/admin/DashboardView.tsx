import React, { useState } from 'react';
import {
  Tenant,
  Barber,
  Appointment,
  AppointmentStatus,
  TimeBlock,
  PaymentMethod,
  PaymentStatus,
} from '../../types';
import { DashboardMetrics } from '../../lib/storage';
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle,
  Share2,
  Lock,
  Phone,
  ChevronRight,
  Sparkles,
  Scissors,
  CheckCircle2,
  XCircle,
  Clock3,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmModal } from './ConfirmModal';

interface DashboardViewProps {
  tenant: Tenant;
  barbers: Barber[];
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  metrics: DashboardMetrics;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdatePayment?: (id: string, method?: PaymentMethod, status?: PaymentStatus) => void;
  onOpenShareModal: () => void;
  onOpenBlockModal: () => void;
  onOpenClientView: () => void;
  onOpenQuickBookingModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenant,
  barbers,
  appointments,
  timeBlocks,
  metrics,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onUpdatePayment,
  onOpenShareModal,
  onOpenBlockModal,
  onOpenClientView,
  onOpenQuickBookingModal,
}) => {
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [timeMetricPeriod, setTimeMetricPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = appointments
    .filter((a) => a.date === selectedTimelineDate)
    .filter((a) => (selectedBarberFilter === 'all' ? true : a.barberId === selectedBarberFilter))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Filtrar bloqueios do dia selecionado
  const dayBlocks = timeBlocks
    .filter((b) => b.date === selectedTimelineDate)
    .filter((b) => (selectedBarberFilter === 'all' ? true : b.barberId === selectedBarberFilter));

  const statusConfig: Record<
    AppointmentStatus,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    pending: {
      label: 'Pendente',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      icon: Clock3,
    },
    confirmed: {
      label: 'Confirmado',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      icon: CheckCircle2,
    },
    completed: {
      label: 'Concluído',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelado',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
      icon: XCircle,
    },
  };

  const totalClients = metrics.recurringClientsCount + metrics.newClientsCount;
  const recurringPercent = totalClients > 0 ? Math.round((metrics.recurringClientsCount / totalClients) * 100) : 65;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner / Quick Actions */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="font-semibold text-amber-400">{tenant.name}</span>
              <span aria-hidden="true">·</span>
              <span>Painel</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{format(new Date(), "EEE, dd/MM", { locale: ptBR })}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-100">
              Visão Geral & Agenda Diária
            </h1>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Gerencie atendimentos em tempo real, acompanhe o faturamento e compartilhe seu link exclusivo.
            </p>
          </div>

          {/* Quick Action buttons (3-column grid on mobile, flex on desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {onOpenQuickBookingModal && (
              <button
                onClick={onOpenQuickBookingModal}
                className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-neutral-100 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 rounded-lg transition-colors text-center"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+ Agendar</span>
              </button>
            )}

            <button
              onClick={onOpenBlockModal}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-lg transition-colors text-center"
            >
              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Bloquear</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm text-center"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS SECTION (DIA, SEMANA, MÊS) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Indicadores Principais
          </h2>

          {/* Period selector (3-segment grid on mobile, compact on desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setTimeMetricPeriod('day')}
              className={`py-1.5 sm:py-1 px-2.5 text-xs font-medium rounded-md transition-colors text-center ${
                timeMetricPeriod === 'day'
                  ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setTimeMetricPeriod('week')}
              className={`py-1.5 sm:py-1 px-2.5 text-xs font-medium rounded-md transition-colors text-center ${
                timeMetricPeriod === 'week'
                  ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setTimeMetricPeriod('month')}
              className={`py-1.5 sm:py-1 px-2.5 text-xs font-medium rounded-md transition-colors text-center ${
                timeMetricPeriod === 'month'
                  ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {/* 2x2 grid on mobile, 4 columns on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Atendimentos */}
          <div className="p-3.5 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] sm:text-xs font-medium truncate">Clientes</span>
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-neutral-100 font-mono tabular-nums">
                {timeMetricPeriod === 'day' && metrics.appointmentsToday}
                {timeMetricPeriod === 'week' && metrics.appointmentsWeek}
                {timeMetricPeriod === 'month' && metrics.appointmentsMonth}
              </div>
              <div className="text-[10px] sm:text-xs text-neutral-500 mt-1 truncate">
                <span>D: <strong className="text-neutral-300 font-mono">{metrics.appointmentsToday}</strong></span>
                <span className="mx-1">·</span>
                <span>S: <strong className="text-neutral-300 font-mono">{metrics.appointmentsWeek}</strong></span>
                <span className="mx-1">·</span>
                <span>M: <strong className="text-neutral-300 font-mono">{metrics.appointmentsMonth}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: Faturamento Estimado */}
          <div className="p-3.5 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] sm:text-xs font-medium truncate">Faturamento</span>
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums truncate">
                R${' '}
                {timeMetricPeriod === 'day' && metrics.revenueToday.toFixed(0)}
                {timeMetricPeriod === 'week' && metrics.revenueWeek.toFixed(0)}
                {timeMetricPeriod === 'month' && metrics.revenueMonth.toFixed(0)}
              </div>
              <div className="text-[10px] sm:text-xs text-neutral-500 mt-1 truncate">
                <span>D: <strong className="text-neutral-300 font-mono">R${metrics.revenueToday.toFixed(0)}</strong></span>
                <span className="mx-1">·</span>
                <span>S: <strong className="text-neutral-300 font-mono">R${metrics.revenueWeek.toFixed(0)}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 3: Ticket Médio */}
          <div className="p-3.5 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] sm:text-xs font-medium truncate">Ticket Médio</span>
              <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-neutral-100 font-mono tabular-nums">
                R$ {metrics.averageTicket.toFixed(2)}
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-1 truncate">
                Média por atendimento
              </p>
            </div>
          </div>

          {/* Card 4: Recorrência de Clientes */}
          <div className="p-3.5 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] sm:text-xs font-medium truncate">Fidelização</span>
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-neutral-100 font-mono tabular-nums">
                {recurringPercent}%
              </div>
              <div className="text-[10px] sm:text-xs text-neutral-500 mt-1 truncate">
                <span>Rec: <strong className="text-neutral-300 font-mono">{metrics.recurringClientsCount}</strong></span>
                <span className="mx-1">·</span>
                <span>Novos: <strong className="text-neutral-300 font-mono">{metrics.newClientsCount}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS & INDICATORS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Comparativo Mensal */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Evolução Mensal de Faturamento & Atendimentos
              </h3>
              <p className="text-xs text-neutral-400">
                Comparativo de crescimento nos últimos 5 meses
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              +68% nos últimos 4 meses
            </div>
          </div>

          {/* Clean Bar Visualization */}
          <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2">
            {metrics.monthlyComparison.map((m, idx) => {
              const maxRev = 7000;
              const heightPct = Math.min(Math.round((m.revenue / maxRev) * 100), 100);
              const isCurrent = idx === metrics.monthlyComparison.length - 1;

              return (
                <div key={m.monthName} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[11px] font-mono text-neutral-400 opacity-80 group-hover:opacity-100 transition-opacity tabular-nums">
                    R$ {m.revenue}
                  </div>
                  <div className="w-full max-w-[48px] bg-neutral-800 rounded-t-md relative flex items-end h-32 overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isCurrent
                          ? 'bg-amber-400 group-hover:bg-amber-300'
                          : 'bg-neutral-600 group-hover:bg-neutral-500'
                      }`}
                    />
                  </div>
                  <div className="text-xs font-medium text-neutral-300">
                    {m.monthName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Serviços Mais Vendidos */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-100">
              Serviços Mais Vendidos
            </h3>
            <Scissors className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-3.5">
            {metrics.topServices.map((svc, i) => {
              const highestCount = metrics.topServices[0]?.count || 1;
              const percentage = Math.round((svc.count / highestCount) * 100);

              return (
                <div key={svc.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-200 truncate pr-2">
                      {i + 1}. {svc.name}
                    </span>
                    <span className="font-mono text-amber-400 shrink-0 tabular-nums">
                      {svc.count}x (R$ {svc.totalRevenue.toFixed(0)})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-amber-400/80 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* GESTÃO DIÁRIA: TIMELINE & STATUS DOS AGENDAMENTOS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Linha do Tempo Diária (Agenda de Atendimentos)
            </h2>
            <p className="text-xs text-neutral-400">
              Controle em tempo real de horários, clientes e atualizações de status
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {/* Date filter */}
            <input
              type="date"
              value={selectedTimelineDate}
              onChange={(e) => setSelectedTimelineDate(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
            />

            {/* Barber filter */}
            <select
              value={selectedBarberFilter}
              onChange={(e) => setSelectedBarberFilter(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Barbeiros</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Table / Cards */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          {/* Day blocks notification if any */}
          {dayBlocks.length > 0 && (
            <div className="p-3 bg-red-950/20 border-b border-red-900/30 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Horários bloqueados hoje:{' '}
                {dayBlocks.map((b) => `${b.startTime} - ${b.endTime} (${b.reason})`).join(', ')}
              </span>
            </div>
          )}

          {dayAppointments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
              <div className="text-sm font-medium text-neutral-300">
                Nenhum agendamento para esta data
              </div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Compartilhe o link da barbearia com seus clientes ou faça um agendamento rápido de teste.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenClientView}
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  Abrir Link do Cliente
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {dayAppointments.map((app) => {
                const barber = barbers.find((b) => b.id === app.barberId);
                const currentStatus = statusConfig[app.status];

                return (
                  <div
                    key={app.id}
                    className="p-3.5 sm:p-4 hover:bg-neutral-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                  >
                    {/* Top Row on Mobile: Time Pill + Status + Delete */}
                    <div className="flex items-start justify-between md:justify-start gap-3 w-full md:w-auto">
                      {/* Time pill */}
                      <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg px-2.5 py-1.5 text-center shrink-0 min-w-[76px]">
                        <div className="text-xs sm:text-sm font-bold font-mono text-amber-400 tabular-nums">
                          {app.startTime}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 tabular-nums">
                          até {app.endTime}
                        </div>
                        <div className="text-[9px] text-neutral-400 font-mono">
                          {app.totalDurationMinutes} min
                        </div>
                      </div>

                      {/* Client & Service details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-100 truncate">
                            {app.clientName}
                          </span>
                          <span className="text-xs text-neutral-500">·</span>
                          <a
                            href={`https://wa.me/55${app.clientPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-mono"
                          >
                            <Phone className="w-3 h-3" />
                            {app.clientPhone}
                          </a>
                        </div>

                        <div className="text-xs text-neutral-300 flex items-center gap-1.5 flex-wrap">
                          <Scissors className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{app.serviceNames.join(' + ')}</span>
                        </div>

                        <div className="flex items-center flex-wrap gap-2 text-[11px] text-neutral-400 pt-0.5">
                          <span>Profissional: <strong className="text-neutral-200">{barber?.name || 'Geral'}</strong></span>
                          <span>·</span>
                          <span className="text-amber-400 font-mono font-bold tabular-nums">R$ {app.totalPrice.toFixed(2)}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-neutral-300">
                            {app.paymentMethod === 'pix' && <QrCode className="w-3 h-3 text-emerald-400" />}
                            {(app.paymentMethod === 'credit_card' || app.paymentMethod === 'debit_card') && <CreditCard className="w-3 h-3 text-blue-400" />}
                            {(app.paymentMethod === 'cash' || app.paymentMethod === 'on_site') && <Banknote className="w-3 h-3 text-amber-400" />}
                            <span>
                              {app.paymentMethod === 'pix' ? 'Pix' :
                               app.paymentMethod === 'credit_card' ? 'Cartão' :
                               app.paymentMethod === 'debit_card' ? 'Débito' : 'Dinheiro'}
                            </span>
                          </span>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdatePayment) {
                                const nextStatus = app.paymentStatus === 'paid' ? 'pending' : 'paid';
                                onUpdatePayment(app.id, app.paymentMethod, nextStatus);
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                              app.paymentStatus === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                            title="Clique para alternar status de pagamento (Pago / Pendente)"
                          >
                            {app.paymentStatus === 'paid' ? '✓ Pago' : 'Pendente'}
                          </button>
                        </div>
                      </div>

                      {/* Mobile Delete Button on top right */}
                      <button
                        type="button"
                        onClick={() => setAppointmentToDelete(app)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors md:hidden shrink-0"
                        title="Excluir Agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Actions Row (Status dropdown & WhatsApp reminder & Desktop Delete) */}
                    <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t border-neutral-850 md:border-t-0 w-full md:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-neutral-500 hidden sm:inline">Status:</span>
                        <select
                          value={app.status}
                          onChange={(e) =>
                            onUpdateAppointmentStatus(app.id, e.target.value as AppointmentStatus)
                          }
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border focus:outline-none cursor-pointer ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                        >
                          <option value="pending" className="bg-neutral-900 text-neutral-200">Pendente</option>
                          <option value="confirmed" className="bg-neutral-900 text-neutral-200">Confirmado</option>
                          <option value="completed" className="bg-neutral-900 text-neutral-200">Concluído</option>
                          <option value="cancelled" className="bg-neutral-900 text-neutral-200">Cancelado</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick WhatsApp Reminder */}
                        <a
                          href={`https://api.whatsapp.com/send?phone=55${app.clientPhone.replace(/\D/g, '')}&text=${encodeURIComponent(
                            `Olá ${app.clientName}! Passando para confirmar seu horário na ${tenant.name} hoje às ${app.startTime}. Nos vemos em breve! 💈`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                          title="Enviar lembrete via WhatsApp"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Lembrete</span>
                        </a>

                        {/* Desktop Delete Button */}
                        <button
                          type="button"
                          onClick={() => setAppointmentToDelete(app)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors hidden md:block"
                          title="Excluir Agendamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* In-App Confirmation Modal for Deletion (Zero dependency on window.confirm) */}
      <ConfirmModal
        isOpen={!!appointmentToDelete}
        title="Excluir Agendamento"
        description="Tem certeza que deseja apagar permanentemente este agendamento? Esta ação removerá o registro e liberará o horário imediatamente na agenda para novos clientes."
        details={
          appointmentToDelete
            ? [
                { label: 'Cliente', value: appointmentToDelete.clientName },
                { label: 'Telefone', value: appointmentToDelete.clientPhone },
                {
                  label: 'Horário',
                  value: `${appointmentToDelete.startTime} às ${appointmentToDelete.endTime} (${format(
                    new Date(appointmentToDelete.date + 'T00:00:00'),
                    'dd/MM/yyyy'
                  )})`,
                },
                {
                  label: 'Serviço(s)',
                  value: appointmentToDelete.serviceNames.join(' + '),
                },
                {
                  label: 'Valor',
                  value: `R$ ${appointmentToDelete.totalPrice.toFixed(2)}`,
                },
              ]
            : []
        }
        confirmText="Sim, Apagar Agendamento"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (appointmentToDelete) {
            onDeleteAppointment(appointmentToDelete.id);
            setAppointmentToDelete(null);
          }
        }}
        onClose={() => setAppointmentToDelete(null)}
      />
    </div>
  );
};
