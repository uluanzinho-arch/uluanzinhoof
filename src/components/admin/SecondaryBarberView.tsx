import React, { useState } from 'react';
import {
  Tenant,
  Barber,
  Appointment,
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  UserAccount,
  Service,
  TimeBlock,
} from '../../types';
import {
  Scissors,
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  Check,
  X,
  DollarSign,
  TrendingUp,
  LogOut,
  User,
  Sparkles,
  Percent,
  Share2,
  Copy,
  MessageSquare,
  Plus,
  ExternalLink,
  Ban,
  Trash2,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecondaryBarberViewProps {
  tenant: Tenant;
  barber: Barber;
  account: UserAccount;
  appointments: Appointment[];
  services?: Service[];
  timeBlocks?: TimeBlock[];
  onUpdateStatus: (appId: string, status: AppointmentStatus) => void;
  onUpdatePayment: (appId: string, method?: PaymentMethod, status?: PaymentStatus) => void;
  onAddQuickBooking?: (appointment: Appointment) => void;
  onSaveTimeBlock?: (block: TimeBlock) => void;
  onDeleteTimeBlock?: (blockId: string) => void;
  onOpenClientView?: () => void;
  onLogout: () => void;
}

export const SecondaryBarberView: React.FC<SecondaryBarberViewProps> = ({
  tenant,
  barber,
  account,
  appointments,
  services = [],
  timeBlocks = [],
  onUpdateStatus,
  onUpdatePayment,
  onAddQuickBooking,
  onSaveTimeBlock,
  onDeleteTimeBlock,
  onOpenClientView,
  onLogout,
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQuickBookModalOpen, setIsQuickBookModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // States de bloqueio de horário
  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('13:00');
  const [blockReason, setBlockReason] = useState('Horário de Almoço');

  // Form states para novo agendamento de balcão
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || '');
  const [newSlotTime, setNewSlotTime] = useState('15:00');

  // Filtrar APENAS os agendamentos deste barbeiro secundário / sócio
  const myAppointments = appointments.filter((a) => a.barberId === barber.id);
  const myAppointmentsSelectedDate = myAppointments.filter((a) => a.date === selectedDate);

  const commissionRate = barber.commissionRate || account.commissionRate || 50;

  // Cálculos financeiros pessoais do barbeiro
  const validToday = myAppointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');
  const grossTotalToday = validToday.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
  const myCommissionToday = (grossTotalToday * commissionRate) / 100;
  const completedCountToday = validToday.filter((a) => a.status === 'completed').length;

  // Link exclusivo de agendamento deste barbeiro sócio
  const shareUrl = `${window.location.origin}/?tenant=${tenant.slug}&barber=${barber.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim() || !onAddQuickBooking) return;

    const selectedSvc = services.find((s) => s.id === newServiceId) || services[0] || {
      id: 'srv-corte',
      name: 'Corte Clássico & Degradê',
      price: 45,
      durationMinutes: 30,
    };

    const [h, m] = newSlotTime.split(':').map(Number);
    const endMinutes = h * 60 + m + (selectedSvc.durationMinutes || 30);
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newApp: Appointment = {
      id: `app-quick-${Date.now()}`,
      tenantId: tenant.id,
      barberId: barber.id,
      clientName: newClientName.trim(),
      clientPhone: newClientPhone.trim(),
      serviceIds: [selectedSvc.id],
      serviceNames: [selectedSvc.name],
      date: selectedDate,
      startTime: newSlotTime,
      endTime: endTimeStr,
      totalDurationMinutes: selectedSvc.durationMinutes || 30,
      totalPrice: selectedSvc.price || 45,
      status: 'confirmed',
      paymentMethod: 'on_site',
      paymentStatus: 'pending',
      notes: 'Encaixe de balcão realizado pelo barbeiro.',
      createdAt: new Date().toISOString(),
    };

    onAddQuickBooking(newApp);
    setNewClientName('');
    setNewClientPhone('');
    setIsQuickBookModalOpen(false);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveTimeBlock) return;
    const newBlock: TimeBlock = {
      id: `block-${Date.now()}`,
      tenantId: tenant.id,
      barberId: barber.id,
      date: selectedDate,
      startTime: blockStart,
      endTime: blockEnd,
      reason: blockReason || 'Pausa / Almoço',
      createdAt: new Date().toISOString(),
    };
    onSaveTimeBlock(newBlock);
    setIsBlockModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={barber.avatarUrl || '/src/assets/images/barber_classic_cut_1791911756740.jpg'}
              alt={barber.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 bg-neutral-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-neutral-100">
                  {barber.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-mono">
                  {commissionRate}% comissão
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                <strong className="text-neutral-300 font-medium">{tenant.name}</strong> · Zion Connect
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenClientView) onOpenClientView();
                else window.open(shareUrl, '_blank');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors border border-neutral-700 cursor-pointer"
              title="Abrir página pública como cliente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Página do Cliente</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Meu Link de Agendamento</span>
              <span className="sm:hidden">Link</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-neutral-700 cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Banner com Link Rápido de Compartilhamento */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Seu Link Exclusivo para Clientes
            </span>
            <p className="text-xs text-neutral-300">
              Envie para seus clientes agendarem diretamente na sua cadeira com seus horários livres.
            </p>
            <code className="text-[11px] text-amber-300 font-mono bg-neutral-950/80 px-2.5 py-1 rounded-md inline-block border border-neutral-800">
              {shareUrl}
            </code>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Fala galera! Agende seu corte ou barba diretamente comigo (${barber.name}) na barbearia ${tenant.name} pelo meu link exclusivo: ${shareUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp</span>
            </a>
          </div>
        </div>

        {/* KPI Cards do Barbeiro Secundário */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <span className="text-xs text-neutral-400">Cortes Hoje</span>
            <div className="text-2xl font-bold text-neutral-100 font-mono">
              {validToday.length}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              {completedCountToday} concluídos
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <span className="text-xs text-neutral-400">Faturamento Bruto</span>
            <div className="text-2xl font-bold text-neutral-200 font-mono">
              R$ {grossTotalToday.toFixed(2)}
            </div>
            <p className="text-[11px] text-neutral-500">
              Produção do dia
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Sua Comissão ({commissionRate}%)
            </span>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              R$ {myCommissionToday.toFixed(2)}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Líquido a receber hoje
            </p>
          </div>
        </div>

        {/* Navegação de Datas & Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[0, 1, 2, 3].map((offset) => {
              const d = addDays(new Date(), offset);
              const dateStr = format(d, 'yyyy-MM-dd');
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : format(d, 'dd/MM (EEE)', { locale: ptBR })}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold transition-colors border border-neutral-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Meus Horários</span>
            </button>

            {onSaveTimeBlock && (
              <button
                onClick={() => setIsBlockModalOpen(true)}
                className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold transition-colors border border-red-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5 text-red-400" />
                <span>Bloquear Horário / Almoço</span>
              </button>
            )}

            {onAddQuickBooking && (
              <button
                onClick={() => setIsQuickBookModalOpen(true)}
                className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl text-xs font-bold transition-colors border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Encaixe de Balcão</span>
              </button>
            )}
          </div>
        </div>

        {/* Pausas e Bloqueios Pessoais do Dia */}
        {timeBlocks.filter((b) => b.barberId === barber.id && b.date === selectedDate).length > 0 && (
          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 space-y-2">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5" />
              <span>Pausas e Bloqueios na sua cadeira para esta data:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {timeBlocks
                .filter((b) => b.barberId === barber.id && b.date === selectedDate)
                .map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <span className="font-mono text-amber-400">
                      {block.startTime} às {block.endTime}
                    </span>
                    <span className="text-neutral-400">· {block.reason}</span>
                    {onDeleteTimeBlock && (
                      <button
                        type="button"
                        onClick={() => onDeleteTimeBlock(block.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                        title="Desbloquear horário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Lista de Atendimentos Pessoais */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Agendamentos para Minha Cadeira</span>
              </h3>
              <p className="text-xs text-neutral-400">
                {format(new Date(selectedDate + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-300 bg-neutral-800 px-2.5 py-1 rounded-lg">
              {myAppointmentsSelectedDate.length} agendado(s)
            </span>
          </div>

          {myAppointmentsSelectedDate.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs space-y-2">
              <Calendar className="w-8 h-8 text-neutral-700 mx-auto" />
              <p>Nenhum agendamento para sua cadeira nesta data.</p>
              <p className="text-[11px] text-neutral-600">
                Compartilhe seu link ou realize um encaixe de balcão pelo botão acima.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointmentsSelectedDate.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-100">
                        {app.clientName}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-bold">
                        {app.startTime} - {app.endTime}
                      </span>
                      {app.status === 'completed' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                          Concluído
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">
                      ✂️ {app.serviceNames.join(' + ')}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 pt-0.5 font-mono">
                      <span>Valor: R$ {app.totalPrice.toFixed(2)}</span>
                      <span>·</span>
                      <span className="text-amber-400 font-semibold">
                        Sua comissão: R$ {((app.totalPrice * commissionRate) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {app.status !== 'completed' ? (
                      <button
                        onClick={() => {
                          onUpdateStatus(app.id, 'completed');
                          onUpdatePayment(app.id, app.paymentMethod, 'paid');
                        }}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Marcar Concluído</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Atendido
                      </span>
                    )}

                    <a
                      href={`https://wa.me/55${app.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${app.clientName}! Aqui é o barbeiro ${barber.name} da ${tenant.name}. Confirmando seu horário de ${app.startTime} hoje!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-lg text-xs transition-colors"
                      title="Chamar no WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Compartilhamento */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Compartilhar Minha Cadeira</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Ao enviar este link, o cliente abrirá diretamente a página de agendamento com você (<strong className="text-neutral-200">{barber.name}</strong>) já selecionado.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Link Direto:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl"
                >
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Fala galera! Agende seu horário diretamente comigo (${barber.name}) na ${tenant.name}: ${shareUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar pelo WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Modal de Horários do Barbeiro */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Meus Horários de Atendimento</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Segunda a Sexta:</span>
                  <span className="text-amber-400 font-mono">08:00 às 19:30</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Pausa de almoço:</span>
                  <span className="font-mono">12:00 às 13:00</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Sábado:</span>
                  <span className="text-amber-400 font-mono">08:00 às 19:00</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Pausa de almoço:</span>
                  <span className="font-mono">12:30 às 13:30</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Domingo:</span>
                  <span className="text-amber-400 font-mono">09:00 às 14:00</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Encaixe Rápido de Balcão */}
      {isQuickBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Novo Encaixe de Balcão</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickBookModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickBooking} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nome do Cliente <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Telefone / WhatsApp <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="(79) 99999-9999"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Serviço
                </label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Horário Hoje
                </label>
                <input
                  type="time"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsQuickBookModalOpen(false)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl text-xs font-bold"
                >
                  Salvar Encaixe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Bloqueio de Horário / Almoço */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                <span>Bloquear Horário / Almoço</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Motivo da Pausa / Bloqueio
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="ex: Horário de Almoço, Médico, Intervalo"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Término
                  </label>
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
