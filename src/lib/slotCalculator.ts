import { ScheduleConfig, Appointment, TimeBlock, TimeSlot } from '../types';

/**
 * Converte string no formato "HH:mm" para minutos desde as 00:00
 */
export function timeToMinutes(timeStr: string | undefined): number {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return 0;
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}

/**
 * Converte minutos para string formatada "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem:
 * Intervalo 1: [start1, end1)
 * Intervalo 2: [start2, end2)
 */
export function hasOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return Math.max(start1, start2) < Math.min(end1, end2);
}

export interface CalculateSlotsParams {
  date: string; // "YYYY-MM-DD"
  scheduleConfig?: ScheduleConfig; // Configuração do dia da semana
  appointments: Appointment[];    // Agendamentos já marcados para a data e profissional
  timeBlocks: TimeBlock[];         // Bloqueios avulsos (almoço, ausência)
  serviceDurationMinutes?: number; // Duração total requerida pelo cliente
  slotIntervalMinutes?: number;   // Intervalo de busca (padrão: 30 minutos)
}

/**
 * Algoritmo Robusto de Horários Livres:
 * Garante que os horários estejam 100% disponíveis e funcionando em todos os perfis.
 * Se uma configuração de expediente específica não for encontrada, aplica horários
 * comerciais padrões (08:00 às 19:30) com intervalo de almoço flexível.
 */
export function calculateAvailableSlots({
  scheduleConfig,
  appointments = [],
  timeBlocks = [],
  serviceDurationMinutes = 30,
  slotIntervalMinutes = 30,
}: CalculateSlotsParams): TimeSlot[] {
  // Garantir duração mínima de 15 minutos para exibição de vagas
  const duration = Math.max(15, serviceDurationMinutes || 30);
  const interval = Math.max(15, slotIntervalMinutes || 30);

  // Configuração segura com fallback para garantir disponibilidade total
  const isWorking = scheduleConfig !== undefined ? scheduleConfig.isWorking : true;

  // Se o dia estiver explicitamente marcado como não trabalha
  if (scheduleConfig && !scheduleConfig.isWorking) {
    return [];
  }

  const startTimeStr = scheduleConfig?.startTime || '08:00';
  const endTimeStr = scheduleConfig?.endTime || '19:30';

  let workStartMin = timeToMinutes(startTimeStr);
  let workEndMin = timeToMinutes(endTimeStr);

  if (workStartMin >= workEndMin || workEndMin === 0) {
    workStartMin = 8 * 60;  // 08:00
    workEndMin = 19 * 60 + 30; // 19:30
  }

  const breakStartMin = scheduleConfig?.breakStart ? timeToMinutes(scheduleConfig.breakStart) : null;
  const breakEndMin = scheduleConfig?.breakEnd ? timeToMinutes(scheduleConfig.breakEnd) : null;

  // Filtrar apenas agendamentos ativos (desconsidera cancelados)
  const activeAppointments = (appointments || []).filter(
    (app) => app && app.status !== 'cancelled'
  );

  const slots: TimeSlot[] = [];

  // Percorrer a jornada de trabalho com passo definido
  for (let current = workStartMin; current + duration <= workEndMin; current += interval) {
    const slotEnd = current + duration;
    const timeLabel = minutesToTime(current);
    const endTimeLabel = minutesToTime(slotEnd);

    let isAvailable = true;
    let reason = '';

    // 1. Verificar colisão com intervalo de almoço / pausa padrão
    if (breakStartMin !== null && breakEndMin !== null && breakStartMin < breakEndMin) {
      if (hasOverlap(current, slotEnd, breakStartMin, breakEndMin)) {
        isAvailable = false;
        reason = 'Intervalo de Almoço';
      }
    }

    // 2. Verificar colisão com bloqueios avulsos (ex: almoço extra, imprevisto)
    if (isAvailable && timeBlocks && timeBlocks.length > 0) {
      for (const block of timeBlocks) {
        if (!block || !block.startTime || !block.endTime) continue;
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        if (hasOverlap(current, slotEnd, blockStart, blockEnd)) {
          isAvailable = false;
          reason = `Bloqueado (${block.reason || 'Indisponível'})`;
          break;
        }
      }
    }

    // 3. Verificar colisão com agendamentos existentes
    if (isAvailable && activeAppointments.length > 0) {
      for (const app of activeAppointments) {
        if (!app.startTime || !app.endTime) continue;
        const appStart = timeToMinutes(app.startTime);
        const appEnd = timeToMinutes(app.endTime);
        if (hasOverlap(current, slotEnd, appStart, appEnd)) {
          isAvailable = false;
          reason = 'Horário Ocupado';
          break;
        }
      }
    }

    slots.push({
      time: timeLabel,
      endTime: endTimeLabel,
      isAvailable,
      reason: isAvailable ? undefined : reason,
    });
  }

  // Garantir que sempre retorne slots se a jornada for válida
  return slots;
}
