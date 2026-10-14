import React, { useState } from 'react';
import { Tenant } from '../../types';
import { Share2, Copy, Check, MessageSquare, ExternalLink, X, QrCode } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  tenant: Tenant;
  onClose: () => void;
  onOpenClientView: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  tenant,
  onClose,
  onOpenClientView,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicLink = `${window.location.origin}?tenant=${tenant.slug}&view=client`;
  const displaySlugUrl = `barber.link/${tenant.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Fala, meu amigo! 💈 Agende seu horário na *${tenant.name}* direto pelo link exclusivo (em menos de 30 segundos):\n\n${publicLink}\n\nTe esperamos na cadeira!`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Link Exclusivo de Agendamento
              </h2>
              <p className="text-xs text-neutral-400">
                Compartilhe com seus clientes para agendamentos rápidos
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Custom Link Box */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Slug Exclusivo da sua Barbearia
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg">
              <span className="pl-3 text-xs font-mono text-neutral-500 select-none">
                https://
              </span>
              <input
                type="text"
                readOnly
                value={displaySlugUrl}
                className="flex-1 bg-transparent text-xs font-mono font-medium text-amber-400 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Direct Sharing Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 text-emerald-300 rounded-lg text-xs font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Compartilhar no WhatsApp
            </a>

            <button
              onClick={() => {
                onClose();
                onOpenClientView();
              }}
              className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              Testar Fluxo do Cliente
            </button>
          </div>

          {/* Barbearia WhatsApp Info */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs flex items-center justify-between">
            <span className="text-neutral-400">WhatsApp Oficial Cadastrado:</span>
            <a
              href={`https://wa.me/55${tenant.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-emerald-400 font-bold hover:underline"
            >
              {tenant.phone}
            </a>
          </div>

          {/* Instagram Tip */}
          <div className="p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-lg text-xs text-neutral-400 space-y-1">
            <span className="font-semibold text-neutral-200">Dica para Instagram:</span>
            <p>
              Cole o link exclusivo na biografia do perfil <span className="text-amber-400">{tenant.instagram || '@uluanzinhobarbeiro'}</span> e coloque nos destaques dos Stories para receber agendamentos automáticos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
