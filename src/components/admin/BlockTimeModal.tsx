import React, { useState } from 'react';
import { Barber, TimeBlock } from '../../types';
import { Clock, AlertCircle, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface BlockTimeModalProps {
  isOpen: boolean;
  barbers: Barber[];
  tenantId: string;
  onClose: () => void;
  onSave: (block: TimeBlock) => void;
}

export const BlockTimeModal: React.FC<BlockTimeModalProps> = ({
  isOpen,
  barbers,
  tenantId,
  onClose,
  onSave,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('Horário de Almoço');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Outro' ? (customReason.trim() || 'Bloqueio Manual') : reason;

    const newBlock: TimeBlock = {
      id: `block-${Date.now()}`,
      tenantId,
      barberId: selectedBarberId,
      date,
      startTime,
      endTime,
      reason: finalReason,
      createdAt: new Date().toISOString(),
    };

    onSave(newBlock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Bloquear Horário na Agenda
              </h2>
              <p className="text-xs text-neutral-400">
                Impedir agendamentos de clientes neste intervalo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Profissional
            </label>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Data do Bloqueio
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Término
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Motivo do Bloqueio
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="Horário de Almoço">Horário de Almoço</option>
              <option value="Imprevisto Pessoal">Imprevisto Pessoal</option>
              <option value="Pausa para Descanso">Pausa para Descanso</option>
              <option value="Treinamento / Workshop">Treinamento / Workshop</option>
              <option value="Manutenção de Equipamento">Manutenção de Equipamento</option>
              <option value="Outro">Outro Motivo</option>
            </select>
          </div>

          {reason === 'Outro' && (
            <div>
              <input
                type="text"
                placeholder="Descreva o motivo..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs text-neutral-400">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Este período ficará automaticamente indisponível na grade de agendamento online do cliente.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              Salvar Bloqueio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
