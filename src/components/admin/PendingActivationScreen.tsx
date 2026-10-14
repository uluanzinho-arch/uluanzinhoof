import React, { useState } from 'react';
import { Tenant, UserAccount, PlatformSettings, SubscriptionPlan } from '../../types';
import {
  Scissors,
  CheckCircle2,
  Clock,
  DollarSign,
  Copy,
  Check,
  MessageSquare,
  LogOut,
  Sparkles,
  ShieldCheck,
  Store,
  Layers,
} from 'lucide-react';

interface PendingActivationScreenProps {
  tenant: Tenant;
  account: UserAccount;
  platformSettings: PlatformSettings;
  plans: SubscriptionPlan[];
  onSimulatePayment: () => void;
  onLogout: () => void;
}

export const PendingActivationScreen: React.FC<PendingActivationScreenProps> = ({
  tenant,
  account,
  platformSettings,
  plans,
  onSimulatePayment,
  onLogout,
}) => {
  const [copiedPix, setCopiedPix] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');

  const platformPlans = plans.filter((p) => !p.tenantId);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(platformSettings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black">
              <Scissors className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-neutral-100 uppercase">
                Zion <span className="text-amber-400">Connect</span>
              </span>
              <p className="text-[10px] text-neutral-400">Ativação de Conta</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition-colors border border-neutral-700"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">
            Bem-vindo ao <span className="text-amber-400">Zion Connect</span>!
          </h1>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Sua barbearia <strong className="text-neutral-200">{tenant.name}</strong> foi cadastrada com sucesso. Para liberar acesso completo ao painel de gestão e agendamentos, efetue o pagamento da taxa única de adesão.
          </p>
        </div>

        {/* Resumo do Cadastro */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-400 pb-2 border-b border-neutral-800">
            <span>Responsável: <strong className="text-neutral-200">{account.fullName}</strong></span>
            <span>Usuário: <code className="text-amber-400 font-mono">{account.username}</code></span>
          </div>
          <p className="text-neutral-400">
            Endereço da barbearia: <strong className="text-neutral-200">{tenant.address}, {tenant.city}</strong>
          </p>
          <p className="text-neutral-400">
            Serviços já criados: <strong className="text-neutral-200">Corte, Barba, Combo e Acabamento</strong>
          </p>
        </div>

        {/* Taxa de Adesão & PIX */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/90 border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Taxa Única de Adesão da Barbearia
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              Pagamento Único
            </span>
          </div>

          <div className="text-3xl font-black text-neutral-100 font-mono">
            R$ {platformSettings.onboardingFee.toFixed(2)}
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <span className="text-xs text-neutral-400 block">
              Pague via Chave PIX:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={platformSettings.pixKey}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 font-mono"
              />
              <button
                type="button"
                onClick={handleCopyPix}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Opções de Planos de Continuidade */}
          {platformPlans.length > 0 && (
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Escolha seu Plano do Zion Connect:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {platformPlans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400 shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-neutral-100 block">{p.name}</span>
                      <span className="text-sm font-black text-amber-400 font-mono mt-1 block">
                        R$ {p.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                Status: <strong>Aguardando Aprovação do Desenvolvedor</strong>. Assim que seu pagamento for confirmado ou plano cortesia for liberado por Luan, o acesso será liberado instantaneamente.
              </span>
            </div>

            <a
              href={`https://wa.me/55${platformSettings.pixKey.replace(/\D/g, '') || '79988684933'}?text=${encodeURIComponent(
                `Olá Luan! Realizei o cadastro da barbearia *${tenant.name}* (Responsável: ${account.fullName}, Usuário: ${account.username}) no Zion Connect e enviei o pagamento da taxa de adesão de R$ ${platformSettings.onboardingFee.toFixed(2)}. Gostaria de solicitar a liberação do acesso!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>Enviar Comprovante de Pagamento no WhatsApp do Luan</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-neutral-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-400" />
              <span>Voltar para a Tela de Login</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-3 text-center text-xs text-neutral-500">
        <span>Zion Connect · Ativação Rápida & Segura</span>
      </footer>
    </div>
  );
};
