import React, { useState, useMemo } from 'react';
import {
  Tenant,
  Barber,
  Service,
  ScheduleConfig,
  Appointment,
  TimeBlock,
  PaymentMethod,
} from '../../types';
import { calculateAvailableSlots } from '../../lib/slotCalculator';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  Calendar as CalendarIcon,
  User,
  Scissors,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  Sun,
  Sunset,
  Moon,
  Layers,
  X as CloseIcon,
} from 'lucide-react';
import { format, addDays, getDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSubscriptionPlans, getSchedules } from '../../lib/storage';

interface ClientBookingFlowProps {
  tenant: Tenant;
  barbers: Barber[];
  services: Service[];
  schedules: ScheduleConfig[];
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  initialBarberId?: string;
  onBookAppointment: (appointment: Appointment) => void;
  onBackToAdmin?: () => void;
}

export const ClientBookingFlow: React.FC<ClientBookingFlowProps> = ({
  tenant,
  barbers,
  services,
  schedules,
  appointments,
  timeBlocks,
  initialBarberId,
  onBookAppointment,
  onBackToAdmin,
}) => {
  // Passos do Fluxo (1 a 5)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Seleções do cliente
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(
    initialBarberId || barbers.find((b) => b.isDefault)?.id || barbers[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  // Planos de assinatura do cliente para esta barbearia
  const clientPlans = getSubscriptionPlans(tenant.id);

  // Serviços selecionados
  const activeServices = services.filter((s) => s.isActive);
  const selectedServices = activeServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeServices.forEach((s) => s.category && cats.add(s.category));
    return ['Todos', ...Array.from(cats)];
  }, [activeServices]);

  const displayedServices = useMemo(() => {
    if (categoryFilter === 'Todos') return activeServices;
    return activeServices.filter((s) => s.category === categoryFilter);
  }, [activeServices, categoryFilter]);

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

  // Toggle serviço
  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
    // Limpar slot selecionado se mudar a duração
    setSelectedSlot(null);
  };

  // Gerar os próximos 7 dias para escolha rápida
  const nextDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      days.push({
        dateStr: format(d, 'yyyy-MM-dd'),
        dayName: format(d, 'EEE', { locale: ptBR }),
        dayNumber: format(d, 'dd'),
        monthName: format(d, 'MMM', { locale: ptBR }),
        dayOfWeek: getDay(d),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  // Barbeiro selecionado
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];

  // Configuração de horários para a data selecionada com fallback robusto
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = getDay(selectedDateObj);

  // Busca segura da grade de horários do barbeiro selecionado (gera se não existir)
  const barberSchedules = useMemo(() => {
    const barberIdToLookup = selectedBarber?.id || selectedBarberId;
    if (!barberIdToLookup) return [];
    return getSchedules(tenant.id, barberIdToLookup);
  }, [tenant.id, selectedBarber?.id, selectedBarberId, schedules]);

  const currentSchedule = barberSchedules.find((s) => s.dayOfWeek === dayOfWeek);

  // Fallback garantido para que NUNCA fique sem horários disponíveis em nenhum perfil ou barbeiro
  const effectiveSchedule: ScheduleConfig = (currentSchedule && currentSchedule.isWorking)
    ? currentSchedule
    : {
        id: `sched-def-${tenant.id}-${selectedBarberId}-${dayOfWeek}`,
        tenantId: tenant.id,
        barberId: selectedBarberId,
        dayOfWeek,
        startTime: '08:00',
        endTime: dayOfWeek === 0 ? '14:00' : '20:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isWorking: true,
      };

  const effectiveDuration = totalDuration > 0 ? totalDuration : 30;

  // Slots livres calculados dinamicamente via algoritmo sem sobreposição
  const availableSlots = useMemo(() => {
    if (!selectedBarberId) return [];

    const barberAppointments = appointments.filter(
      (a) => a.barberId === selectedBarberId && a.date === selectedDate
    );

    const barberBlocks = timeBlocks.filter(
      (b) => b.barberId === selectedBarberId && b.date === selectedDate
    );

    return calculateAvailableSlots({
      date: selectedDate,
      scheduleConfig: effectiveSchedule,
      appointments: barberAppointments,
      timeBlocks: barberBlocks,
      serviceDurationMinutes: effectiveDuration,
      slotIntervalMinutes: 30,
    });
  }, [
    selectedBarberId,
    selectedDate,
    effectiveDuration,
    effectiveSchedule,
    appointments,
    timeBlocks,
  ]);

  // Agrupamento intuitivo dos horários por período do dia (Manhã, Tarde, Noite)
  const { morningSlots, afternoonSlots, eveningSlots } = useMemo(() => {
    const morning = availableSlots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h < 12;
    });
    const afternoon = availableSlots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 12 && h < 18;
    });
    const evening = availableSlots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 18;
    });
    return { morningSlots: morning, afternoonSlots: afternoon, eveningSlots: evening };
  }, [availableSlots]);

  // Formatação de máscara do telefone brasileiro: (XX) 9XXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 11) raw = raw.slice(0, 11);

    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setClientPhone(formatted);
  };

  // Finalizar agendamento
  const handleConfirmBooking = () => {
    if (!selectedSlot || !clientName || !clientPhone) return;

    // Calcular horário final
    const [startH, startM] = selectedSlot.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + totalDuration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      tenantId: tenant.id,
      barberId: selectedBarberId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceIds: selectedServices.map((s) => s.id),
      serviceNames: selectedServices.map((s) => s.name),
      date: selectedDate,
      startTime: selectedSlot,
      endTime: endTimeStr,
      totalDurationMinutes: totalDuration,
      totalPrice,
      status: 'confirmed',
      paymentMethod: selectedPaymentMethod,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    onBookAppointment(newAppointment);
    setCreatedAppointment(newAppointment);
    setStep(5);
  };

  const paymentLabels: Record<PaymentMethod, string> = {
    pix: 'Pix',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    cash: 'Dinheiro',
    on_site: 'Pagar no Local',
  };

  // Link WhatsApp de confirmação direta
  const formattedWhatsappMessage = createdAppointment
    ? encodeURIComponent(
        `Olá! Acabei de agendar na *${tenant.name}* pelo link!\n\n` +
          `👤 *Cliente:* ${createdAppointment.clientName}\n` +
          `💈 *Profissional:* ${selectedBarber?.name}\n` +
          `✂️ *Serviços:* ${createdAppointment.serviceNames.join(' + ')}\n` +
          `📅 *Data:* ${format(new Date(createdAppointment.date + 'T00:00:00'), 'dd/MM/yyyy')}\n` +
          `⏰ *Horário:* ${createdAppointment.startTime} às ${createdAppointment.endTime}\n` +
          `💳 *Pagamento:* ${paymentLabels[createdAppointment.paymentMethod || 'pix']}\n` +
          `💰 *Total:* R$ ${createdAppointment.totalPrice.toFixed(2)}\n\n` +
          `Nos vemos lá!`
      )
    : '';

  let barberWhatsAppNumber = tenant.phone.replace(/\D/g, '');
  if (!barberWhatsAppNumber.startsWith('55') && barberWhatsAppNumber.length <= 11) {
    barberWhatsAppNumber = `55${barberWhatsAppNumber}`;
  }
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${barberWhatsAppNumber}&text=${formattedWhatsappMessage}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Tenant Header / Hero */}
      <header className="relative bg-neutral-900 border-b border-neutral-800">
        <div className="relative h-32 md:h-40 w-full overflow-hidden">
          <img
            src={tenant.coverUrl}
            alt={tenant.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 hover:bg-black text-neutral-300 text-xs rounded-lg backdrop-blur-sm transition-colors border border-white/10"
            >
              ← Voltar ao Painel
            </button>
          )}
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-12 relative z-10 pb-4">
          <div className="flex items-end gap-3.5">
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl border-2 border-neutral-800 object-cover bg-neutral-900 shadow-xl"
            />
            <div className="flex-1 pb-1">
              <h1 className="text-lg font-bold text-neutral-100 leading-tight">
                {tenant.name}
              </h1>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{tenant.address || tenant.city}</span>
              </p>
              {clientPlans.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPlansModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Conhecer Nossos Planos (Mensal / Trimestral)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6">
        {/* Step Indicator */}
        {step < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-semibold text-amber-400">
                Passo {step} de 4:{' '}
                {step === 1 && 'Escolha os Serviços'}
                {step === 2 && 'Escolha o Profissional'}
                {step === 3 && 'Data e Horário'}
                {step === 4 && 'Seus Dados'}
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                {step === 1 && '~10s'}
                {step === 2 && '~15s'}
                {step === 3 && '~25s'}
                {step === 4 && '~30s'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${(step / 4) * 100}%` }}
                className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              />
            </div>
          </div>
        )}

        {/* STEP 1: SERVIÇOS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-neutral-100">
                Selecione os Serviços Desejados
              </h2>
              <p className="text-xs text-neutral-400">
                Escolha um ou mais serviços para o seu atendimento
              </p>
            </div>

            {/* Category horizontal filter pills */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        isActive
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                          : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-2.5">
              {displayedServices.map((svc) => {
                const isSelected = selectedServiceIds.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => handleToggleService(svc.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-950/20'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-1 pr-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-100 truncate">
                          {svc.name}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-amber-400 text-neutral-950 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {svc.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 pt-0.5">
                        <span className="flex items-center gap-1 font-mono text-neutral-300">
                          <Clock className="w-3 h-3 text-amber-500/80" />
                          {svc.durationMinutes} min
                        </span>
                        {svc.category && (
                          <span className="text-[10px] uppercase font-semibold text-neutral-500">
                            {svc.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                        R$ {svc.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PROFISSIONAL */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-neutral-100">
                Com quem você prefere cortar?
              </h2>
              <p className="text-xs text-neutral-400">
                Escolha seu barbeiro de preferência para o atendimento
              </p>
            </div>

            <div className="space-y-3">
              {barbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => {
                      setSelectedBarberId(barber.id);
                      setSelectedSlot(null);
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center gap-3.5 sm:gap-4 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-950/20'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={barber.avatarUrl}
                        alt={barber.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-neutral-700 bg-neutral-800"
                      />
                      {barber.isActive && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-900" title="Disponível" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-neutral-100 truncate">
                          {barber.name}
                        </h3>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-amber-400 text-neutral-950 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-400 font-medium">
                        {barber.role}
                      </p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {barber.bio}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: DATA E HORÁRIO */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-neutral-100">
                Escolha o Dia e Horário
              </h2>
              <p className="text-xs text-neutral-400">
                Duração estimada de {totalDuration} min com {selectedBarber?.name}
              </p>
            </div>

            {/* Days Horizontal Carousel */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-neutral-300">
                Próximos dias disponíveis:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {nextDays.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d.dateStr);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center justify-center min-w-[62px] py-2.5 px-2 rounded-xl border transition-all text-xs shrink-0 active:scale-95 ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-950/20'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-medium">
                        {d.isToday ? 'Hoje' : d.dayName}
                      </span>
                      <span className="text-base font-mono font-bold my-0.5">
                        {d.dayNumber}
                      </span>
                      <span className="text-[10px] opacity-75">{d.monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots by Period (Manhã, Tarde, Noite) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-800">
                <span className="text-neutral-200 font-medium">
                  {format(selectedDateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}:
                </span>
                <span className="text-amber-400 font-mono">
                  {availableSlots.filter((s) => s.isAvailable).length} horários vagos
                </span>
              </div>

              {availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                  <CalendarIcon className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-300 font-medium">
                    Sem horários disponíveis para esta data.
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Por favor, selecione outro dia no calendário acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Manhã */}
                  {morningSlots.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Manhã (08h às 12h)</span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          ({morningSlots.filter((s) => s.isAvailable).length} livres)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {morningSlots.map((slot) => {
                          const isSelected = selectedSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlot(slot.time)}
                              className={`h-11 rounded-lg text-xs font-mono font-medium transition-all text-center border flex items-center justify-center active:scale-95 ${
                                isSelected
                                  ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-950/20'
                                  : slot.isAvailable
                                  ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-amber-400/50 hover:text-amber-400'
                                  : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 line-through cursor-not-allowed opacity-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tarde */}
                  {afternoonSlots.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                        <Sunset className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tarde (12h às 18h)</span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          ({afternoonSlots.filter((s) => s.isAvailable).length} livres)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {afternoonSlots.map((slot) => {
                          const isSelected = selectedSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlot(slot.time)}
                              className={`h-11 rounded-lg text-xs font-mono font-medium transition-all text-center border flex items-center justify-center active:scale-95 ${
                                isSelected
                                  ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-950/20'
                                  : slot.isAvailable
                                  ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-amber-400/50 hover:text-amber-400'
                                  : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 line-through cursor-not-allowed opacity-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Noite */}
                  {eveningSlots.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                        <Moon className="w-3.5 h-3.5 text-blue-400" />
                        <span>Noite (18h em diante)</span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          ({eveningSlots.filter((s) => s.isAvailable).length} livres)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {eveningSlots.map((slot) => {
                          const isSelected = selectedSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlot(slot.time)}
                              className={`h-11 rounded-lg text-xs font-mono font-medium transition-all text-center border flex items-center justify-center active:scale-95 ${
                                isSelected
                                  ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-950/20'
                                  : slot.isAvailable
                                  ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-amber-400/50 hover:text-amber-400'
                                  : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 line-through cursor-not-allowed opacity-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: IDENTIFICAÇÃO (NOME & WHATSAPP) */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-neutral-100">
                Quem vai cortar?
              </h2>
              <p className="text-xs text-neutral-400">
                Sem senhas! Apenas seu nome e WhatsApp para confirmar seu horário.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    autoComplete="name"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  WhatsApp (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="(11) 99999-9999"
                    value={clientPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Enviaremos o comprovante de agendamento diretamente no seu WhatsApp.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 active:scale-95 ${
                      selectedPaymentMethod === 'pix'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 font-semibold shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="leading-tight">Pix</div>
                      <span className="text-[10px] text-neutral-400 font-normal">Chave direta</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 active:scale-95 ${
                      selectedPaymentMethod === 'credit_card'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 font-semibold shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="leading-tight">Cartão Crédito</div>
                      <span className="text-[10px] text-neutral-400 font-normal">Na maquininha</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('debit_card')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 active:scale-95 ${
                      selectedPaymentMethod === 'debit_card'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 font-semibold shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="leading-tight">Cartão Débito</div>
                      <span className="text-[10px] text-neutral-400 font-normal">Na maquininha</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 active:scale-95 ${
                      selectedPaymentMethod === 'cash'
                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 font-semibold shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="leading-tight">Dinheiro</div>
                      <span className="text-[10px] text-neutral-400 font-normal">No local</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Booking Summary Box */}
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
                  Resumo do Agendamento
                </span>
                <div className="divide-y divide-neutral-800/80 text-neutral-400 pt-1 space-y-1.5">
                  <div className="flex justify-between pt-1">
                    <span>Profissional:</span>
                    <strong className="text-neutral-200">{selectedBarber?.name}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Data:</span>
                    <strong className="text-neutral-200">
                      {format(selectedDateObj, "dd 'de' MMMM (EEEE)", { locale: ptBR })}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Horário:</span>
                    <strong className="text-amber-400 font-mono">{selectedSlot}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Pagamento:</span>
                    <strong className="text-neutral-200">
                      {selectedPaymentMethod === 'pix' ? 'Pix' :
                       selectedPaymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                       selectedPaymentMethod === 'debit_card' ? 'Cartão de Débito' : 'Dinheiro'}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Serviços:</span>
                    <strong className="text-neutral-200 text-right">
                      {selectedServices.map((s) => s.name).join(', ')}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1.5 text-sm font-semibold text-neutral-100">
                    <span>Valor Total:</span>
                    <span className="text-amber-400 font-mono tabular-nums">
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRMAÇÃO & NOTIFICAÇÃO WHATSAPP */}
        {step === 5 && createdAppointment && (
          <div className="py-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-neutral-100">
                Agendamento Confirmado!
              </h2>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Seu horário está reservado na agenda de <strong className="text-neutral-200">{selectedBarber?.name}</strong>.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-left text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">
                  {tenant.name}
                </span>
                <span className="text-emerald-400 font-medium">Confirmado</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-neutral-300">
                <div>
                  <span className="text-neutral-500 text-[11px] block">Data:</span>
                  <strong className="font-mono">{format(new Date(createdAppointment.date + 'T00:00:00'), 'dd/MM/yyyy')}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Horário:</span>
                  <strong className="font-mono text-amber-400">{createdAppointment.startTime} - {createdAppointment.endTime}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Cliente:</span>
                  <strong>{createdAppointment.clientName}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Valor:</span>
                  <strong className="font-mono tabular-nums text-amber-400">R$ {createdAppointment.totalPrice.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Forma de Pagamento:</span>
                  <strong className="text-neutral-200">
                    {createdAppointment.paymentMethod === 'pix' ? 'Pix' :
                     createdAppointment.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                     createdAppointment.paymentMethod === 'debit_card' ? 'Cartão de Débito' : 'Dinheiro'}
                  </strong>
                </div>
              </div>

              {/* Pix key copy if Pix selected */}
              {createdAppointment.paymentMethod === 'pix' && (
                <div className="p-3 bg-neutral-950 border border-amber-500/20 rounded-lg space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" /> Chave Pix da Barbearia
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const pix = tenant.pixKey || '79988684933';
                        navigator.clipboard.writeText(pix);
                        setCopiedPix(true);
                        setTimeout(() => setCopiedPix(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[11px] font-medium transition-colors"
                    >
                      {copiedPix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedPix ? 'Copiada!' : 'Copiar Chave'}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-neutral-200 bg-neutral-900 p-2 rounded border border-neutral-800">
                    {tenant.pixKey || '79988684933'}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
                Serviços: {createdAppointment.serviceNames.join(' + ')}
              </div>
            </div>

            {/* WhatsApp notification action */}
            <div className="space-y-2 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/40"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Comprovante no WhatsApp da Barbearia
              </a>

              <p className="text-[11px] text-neutral-500">
                Clique acima para notificar a barbearia pelo WhatsApp imediatamente.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceIds([]);
                  setSelectedSlot(null);
                  setClientName('');
                  setClientPhone('');
                  setStep(1);
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Fazer outro agendamento
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar (Steps 1 to 4) */}
      {step < 5 && (
        <footer className="sticky bottom-0 z-30 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-md px-4 py-3 sm:py-4 pb-safe shadow-2xl">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
            {/* Back button if past step 1 */}
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 transition-colors active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            ) : (
              <div className="text-xs text-neutral-400 truncate">
                {selectedServiceIds.length > 0 ? (
                  <span>
                    <strong className="text-neutral-200">{selectedServiceIds.length}</strong>{' '}
                    serviço(s)
                  </span>
                ) : (
                  <span>Selecione 1 serviço</span>
                )}
              </div>
            )}

            {/* Total price & Next button */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {totalPrice > 0 && (
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400">Total</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-amber-400 tabular-nums">
                    R$ {totalPrice.toFixed(2)}
                  </div>
                </div>
              )}

              {step === 1 && (
                <button
                  type="button"
                  disabled={selectedServiceIds.length === 0}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-amber-950/20 active:scale-95"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  disabled={!selectedBarberId}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-amber-950/20 active:scale-95"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(4)}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-amber-950/20 active:scale-95"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 4 && (
                <button
                  type="button"
                  disabled={!clientName.trim() || clientPhone.length < 14}
                  onClick={handleConfirmBooking}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-amber-950/20 active:scale-95"
                >
                  Confirmar
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Modal de Planos de Assinatura do Cliente */}
      {isPlansModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Clube VIP & Planos de Assinatura</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Planos exclusivos de {tenant.name} com cortes e vantagens
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {clientPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-mono uppercase">
                        {plan.interval === 'monthly' && 'Plano Mensal'}
                        {plan.interval === 'quarterly' && 'Plano Trimestral'}
                        {plan.interval === 'annual' && 'Plano Anual'}
                      </span>
                      <h4 className="text-sm font-bold text-neutral-100 mt-1">{plan.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-400 font-mono">
                        R$ {plan.price.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-neutral-500">
                        {plan.interval === 'monthly' && 'cobrança mensal'}
                        {plan.interval === 'quarterly' && 'a cada 3 meses'}
                        {plan.interval === 'annual' && 'por ano'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {plan.description}
                  </p>

                  <ul className="space-y-1 text-xs text-neutral-300">
                    {plan.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`https://api.whatsapp.com/send?phone=${barberWhatsAppNumber}&text=${encodeURIComponent(
                      `Olá! Gostaria de assinar o *${plan.name}* (R$ ${plan.price.toFixed(2)}) da barbearia *${tenant.name}*!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Quero Assinar via WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPlansModalOpen(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Fechar e Continuar Agendamento Avulso
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
