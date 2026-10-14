import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  details?: {
    label: string;
    value: string;
  }[];
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  details,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-100 rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isDestructive
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-6 h-6 stroke-[2]" />
            ) : (
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            )}
          </div>

          <div className="space-y-1 pr-6">
            <h3 className="text-base font-bold text-neutral-100 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5 text-xs">
            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-neutral-300">
                <span className="text-neutral-500 text-[11px]">{d.label}:</span>
                <span className="font-semibold text-neutral-200 truncate max-w-[220px]">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-950/40'
            }`}
          >
            {isDestructive && <Trash2 className="w-4 h-4" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
