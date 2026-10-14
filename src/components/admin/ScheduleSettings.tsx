import React, { useState, useEffect } from 'react';
import { ScheduleConfig, TimeBlock, Barber } from '../../types';
import { Clock, Calendar, AlertOctagon, Trash2, Check, Shield, Sparkles } from 'lucide-react';
import { generateDefaultSchedules } from '../../lib/mockData';

const DAYS_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

interface ScheduleSettingsProps {
  tenantId: string;
  barbers: Barber[];
  schedules: ScheduleConfig[];
  timeBlocks: TimeBlock[];
  onSaveSchedule: (schedule: ScheduleConfig) => void;
  onDeleteBlock: (blockId: string) => void;
  onOpenBlockModal: () => void;
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({
  tenantId,
  barbers,
  schedules,
  timeBlocks,
  onSaveSchedule,
  onDeleteBlock,
  onOpenBlockModal,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [savedSuccessDay, setSavedSuccessDay] = useState<number | null>(null);

  const existingBarberSchedules = schedules
    .filter((s) => s.barberId === selectedBarberId)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  // Se o barbeiro secundário não tem horários, auto-gera imediatamente
  useEffect(() => {
    if (selectedBarberId && existingBarberSchedules.length === 0) {
      const generated = generateDefaultSchedules(tenantId, selectedBarberId);
      generated.forEach((sch) => onSaveSchedule(sch));
    }
  }, [selectedBarberId, existingBarberSchedules.length, tenantId]);

  const barberSchedules =
    existingBarberSchedules.length > 0
      ? existingBarberSchedules
      : generateDefaultSchedules(tenantId, selectedBarberId);

  const barberBlocks = timeBlocks.filter((b) => b.barberId === selectedBarberId);

  const handleUpdate = (schedule: ScheduleConfig, field: keyof ScheduleConfig, value: any) => {
    const updated = { ...schedule, [field]: value };
    onSaveSchedule(updated);
    setSavedSuccessDay(schedule.dayOfWeek);
    setTimeout(() => setSavedSuccessDay(null), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Barber Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">
            Horários de Funcionamento & Pausas
          </h2>
          <p className="text-xs text-neutral-400">
            Defina o expediente semanal e intervalos de almoço para o cálculo automático de horários livres
          </p>
        </div>

        {barbers.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Profissional:</span>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Days Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Grade Semanal de Expediente
            </h3>
          </div>
          <span className="text-xs text-neutral-500">
            Alterações são salvas em tempo real
          </span>
        </div>

        <div className="divide-y divide-neutral-800/80">
          {barberSchedules.map((sch) => (
            <div
              key={sch.id}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                sch.isWorking ? 'bg-neutral-900/60' : 'bg-neutral-950/40 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3 w-48">
                <input
                  type="checkbox"
                  id={`work-${sch.id}`}
                  checked={sch.isWorking}
                  onChange={(e) => handleUpdate(sch, 'isWorking', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-800 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor={`work-${sch.id}`}
                  className="text-xs font-medium text-neutral-200 cursor-pointer"
                >
                  {DAYS_NAMES[sch.dayOfWeek]}
                </label>
              </div>

              {sch.isWorking ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Abertura
                    </label>
                    <input
                      type="time"
                      value={sch.startTime}
                      onChange={(e) => handleUpdate(sch, 'startTime', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Fechamento
                    </label>
                    <input
                      type="time"
                      value={sch.endTime}
                      onChange={(e) => handleUpdate(sch, 'endTime', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Início Almoço
                    </label>
                    <input
                      type="time"
                      value={sch.breakStart}
                      onChange={(e) => handleUpdate(sch, 'breakStart', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Fim Almoço
                    </label>
                    <input
                      type="time"
                      value={sch.breakEnd}
                      onChange={(e) => handleUpdate(sch, 'breakEnd', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-xs text-neutral-500 italic py-2">
                  Barbearia fechada neste dia da semana.
                </div>
              )}

              <div className="w-16 flex justify-end">
                {savedSuccessDay === sch.dayOfWeek && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Salvo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Time Blocks Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Bloqueios Pontuais de Agenda ({barberBlocks.length})
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Pausas extras, ausências, consultas ou reuniões
            </p>
          </div>

          <button
            onClick={onOpenBlockModal}
            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
          >
            + Adicionar Bloqueio
          </button>
        </div>

        {barberBlocks.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            Nenhum bloqueio pontual ativo no momento. Todos os horários da grade regular estão livres para agendamentos.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {barberBlocks.map((blk) => (
              <div
                key={blk.id}
                className="p-4 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <span className="font-semibold text-neutral-200">{blk.reason}</span>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>Data: {blk.date}</span>
                      <span>·</span>
                      <span className="font-mono text-neutral-300">
                        {blk.startTime} às {blk.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteBlock(blk.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-md transition-colors"
                  title="Desbloquear horário"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
