import React, { useState } from 'react';
import {
  Tenant,
  UserAccount,
  PlatformSettings,
  SubscriptionPlan,
  Appointment,
  Barber,
} from '../../types';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  DollarSign,
  Users,
  Settings,
  Layers,
  ExternalLink,
  ChevronRight,
  LogOut,
  Save,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Scissors,
  Check,
  Gift,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getBarbers, grantTrialPlan, toggleTenantStatus, assignPlanToTenant } from '../../lib/storage';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  accounts: UserAccount[];
  platformSettings: PlatformSettings;
  plans: SubscriptionPlan[];
  appointments: Appointment[];
  onApproveTenant: (tenantId: string) => void;
  onSelectTenantToManage: (tenantSlug: string) => void;
  onOpenClientView: (tenantSlug: string) => void;
  onUpdatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
  onSavePlan: (plan: SubscriptionPlan) => void;
  onDeleteTenant?: (tenantId: string) => void;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  accounts,
  platformSettings,
  plans,
  appointments,
  onApproveTenant,
  onSelectTenantToManage,
  onOpenClientView,
  onUpdatePlatformSettings,
  onSavePlan,
  onDeleteTenant,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'finances' | 'plans'>('tenants');

  // Form states para configurações financeiras do desenvolvedor
  const [feeInput, setFeeInput] = useState(platformSettings.onboardingFee.toString());
  const [platformPctInput, setPlatformPctInput] = useState(platformSettings.platformCommissionPercent.toString());
  const [barberPctInput, setBarberPctInput] = useState(platformSettings.defaultBarberCommissionPercent.toString());
  const [partnerPctInput, setPartnerPctInput] = useState(platformSettings.partnerCommissionPercent.toString());
  const [pixKeyInput, setPixKeyInput] = useState(platformSettings.pixKey);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Modal para conceder plano teste
  const [trialModalTenant, setTrialModalTenant] = useState<Tenant | null>(null);
  const [trialDaysInput, setTrialDaysInput] = useState<number>(15);

  // Modal para atribuir plano diretamente
  const [assignPlanTenant, setAssignPlanTenant] = useState<Tenant | null>(null);
  const [selectedPlanToAssign, setSelectedPlanToAssign] = useState<string>(plans[0]?.name || 'Plano Mensal Pro');

  // Cálculos globais
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter((t) => t.status === 'active' || t.onboardingPaid).length;
  const pendingTenantsCount = tenants.filter((t) => t.status === 'pending_payment' && !t.onboardingPaid).length;

  const totalPlatformAppointments = appointments.length;
  const totalGrossRevenue = appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

  const platformCut = (totalGrossRevenue * platformSettings.platformCommissionPercent) / 100;
  const totalOnboardingCollected = activeTenantsCount * platformSettings.onboardingFee;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePlatformSettings({
      onboardingFee: parseFloat(feeInput) || 0,
      platformCommissionPercent: parseFloat(platformPctInput) || 0,
      defaultBarberCommissionPercent: parseFloat(barberPctInput) || 0,
      partnerCommissionPercent: parseFloat(partnerPctInput) || 0,
      pixKey: pixKeyInput.trim(),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleConfirmTrialGrant = () => {
    if (!trialModalTenant) return;
    grantTrialPlan(trialModalTenant.id, trialDaysInput);
    setTrialModalTenant(null);
  };

  const handleConfirmPlanAssign = () => {
    if (!assignPlanTenant) return;
    assignPlanToTenant(assignPlanTenant.id, selectedPlanToAssign);
    setAssignPlanTenant(null);
  };

  const formatDateSafe = (isoStr: string) => {
    try {
      return format(parseISO(isoStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Header - Zion Connect Branding */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-wider text-neutral-100 uppercase">
                  Zion <span className="text-amber-400">Connect</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  Painel Geral / Desenvolvedor
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Autonomia Total, Aprovação de Contas & Planos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-neutral-700 cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Metrics Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Barbearias Cadastradas</span>
              <Store className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-100 font-mono">
              {totalTenantsCount}
            </div>
            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{activeTenantsCount} ativas</span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">{pendingTenantsCount} aguardando aprovação</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Taxa Única de Adesão</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              R$ {platformSettings.onboardingFee.toFixed(2)}
            </div>
            <p className="text-[11px] text-neutral-500">
              Arrecadado: <strong className="text-neutral-300 font-mono">R$ {totalOnboardingCollected.toFixed(2)}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Sua Porcentagem (%)</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {platformSettings.platformCommissionPercent}%
            </div>
            <p className="text-[11px] text-neutral-500">
              Lucro est.: <strong className="text-neutral-300 font-mono">R$ {platformCut.toFixed(2)}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Comissão Barbeiros / Sócios</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400 font-mono">
              {platformSettings.defaultBarberCommissionPercent}% / {platformSettings.partnerCommissionPercent}%
            </div>
            <p className="text-[11px] text-neutral-500">
              Definido pelo desenvolvedor
            </p>
          </div>
        </div>

        {/* ALERTA URGENTE: Barbearias Aguardando Sua Aprovação */}
        {pendingTenantsCount > 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-neutral-900 border-2 border-amber-500/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                  <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <span>Novas Barbearias Aguardando Sua Aprovação ({pendingTenantsCount})</span>
                  </h3>
                  <p className="text-xs text-neutral-300">
                    O acesso dessas barbearias está pausado até você aprovar o pagamento ou liberar um plano teste.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tenants
                .filter((t) => t.status === 'pending_payment' && !t.onboardingPaid)
                .map((t) => {
                  const owner = accounts.find((a) => a.tenantId === t.id);
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-neutral-950/90 border border-amber-500/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-neutral-100">{t.name}</h4>
                          <p className="text-xs text-amber-400 font-mono">slug: {t.slug}</p>
                          <p className="text-xs text-neutral-400">{t.address}, {t.city}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                          ⏳ Aguardando Aprovação
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-neutral-300 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
                        <div className="flex items-center justify-between">
                          <span>📅 <strong>Data de Cadastro:</strong></span>
                          <span className="text-neutral-200 font-mono">{formatDateSafe(t.createdAt)}</span>
                        </div>
                        <div>👤 <strong>Responsável:</strong> {owner?.fullName || 'Não informado'}</div>
                        <div>📱 <strong>WhatsApp:</strong> <span className="font-mono text-emerald-400 font-semibold">{t.phone}</span></div>
                        <div>✉️ <strong>Login:</strong> <code className="text-amber-400">{owner?.username}</code> ({owner?.email})</div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onApproveTenant(t.id)}
                          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Aprovar Acesso Imediato</span>
                        </button>

                        <button
                          onClick={() => setTrialModalTenant(t)}
                          className="py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Dar Teste Grátis</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tenants'
                ? 'bg-amber-400 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Barbearias & Aprovações ({tenants.length})</span>
            {pendingTenantsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingTenantsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'plans'
                ? 'bg-amber-400 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Planos de Assinatura & Promessas</span>
          </button>

          <button
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'finances'
                ? 'bg-amber-400 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Taxas, Porcentagens & PIX</span>
          </button>
        </div>

        {/* TAB 1: LISTA DE BARBEARIAS & APROVAÇÃO */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-100">
                  Gestão de Barbearias & Liberação de Acesso
                </h3>
                <p className="text-xs text-neutral-400">
                  Aprove cadastros pendentes, conceda planos de teste gratuitos e gerencie barbearias diretamente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenants.map((t) => {
                const ownerAcc = accounts.find((a) => a.tenantId === t.id);
                const isPending = t.status === 'pending_payment' && !t.onboardingPaid;
                const tenantBarbers = getBarbers(t.id);

                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isPending
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.logoUrl || '/src/assets/images/barber_avatar_master_1791911756901.jpg'}
                          alt={t.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover bg-neutral-800 border border-neutral-700"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-neutral-100 leading-tight">
                              {t.name}
                            </h4>
                            {isPending ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                ⏳ Aguardando Aprovação
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Acesso Aprovado
                              </span>
                            )}

                            {t.trialEndsAt && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                                Teste até {formatDateSafe(t.trialEndsAt).split(' às')[0]}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-400 font-mono mt-0.5">
                            slug: {t.slug}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data de Aquisição / Cadastro */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800/80">
                      <span>📅 Data de Cadastro: <strong className="text-neutral-200">{formatDateSafe(t.createdAt)}</strong></span>
                      <span className="text-amber-400 font-semibold">{t.activePlanName || 'Plano Pro'}</span>
                    </div>

                    {/* Endereço e Responsável */}
                    <div className="space-y-1.5 py-2 border-y border-neutral-800/80 text-xs text-neutral-300">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{t.address || 'Endereço não informado'}, {t.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono text-neutral-200">{t.phone}</span>
                      </div>
                      {ownerAcc && (
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Dono: <strong className="text-neutral-200">{ownerAcc.fullName}</strong> ({ownerAcc.email} · <code className="text-amber-400">{ownerAcc.username}</code>)</span>
                        </div>
                      )}
                    </div>

                    {/* Barbeiros da Barbearia & Suas Datas de Criação */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Profissionais da Equipe ({tenantBarbers.length}):</span>
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {tenantBarbers.map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-[11px] px-2.5 py-1 bg-neutral-950 rounded-lg text-neutral-300 border border-neutral-800/60">
                            <span className="font-medium">{b.name} ({b.role})</span>
                            <span className="text-neutral-500 font-mono">{b.commissionRate || 50}% comissão</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ações para o Desenvolvedor */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {isPending ? (
                        <button
                          onClick={() => onApproveTenant(t.id)}
                          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Aprovar Acesso Imediato</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleTenantStatus(t.id)}
                          className={`py-1.5 px-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                            t.status === 'active'
                              ? 'bg-neutral-800 text-neutral-400 hover:text-rose-400 border-neutral-700'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {t.status === 'active' ? 'Pausar Acesso' : 'Reativar'}
                        </button>
                      )}

                      {/* Botão de Conceder Plano Teste */}
                      <button
                        onClick={() => setTrialModalTenant(t)}
                        className="py-1.5 px-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Liberar período de teste grátis"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Dar Plano Teste</span>
                      </button>

                      <button
                        onClick={() => onSelectTenantToManage(t.slug)}
                        className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
                        title="Entrar como esta barbearia para gerenciar"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gerenciar</span>
                      </button>

                      <button
                        onClick={() => onOpenClientView(t.slug)}
                        className="py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ver página pública de agendamento"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteTenant && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir a barbearia "${t.name}"? Esta ação removerá a barbearia e suas contas.`)) {
                              onDeleteTenant(t.id);
                            }
                          }}
                          className="py-1.5 px-2.5 bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors border border-neutral-700 cursor-pointer"
                          title="Excluir barbearia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PLANOS DE ASSINATURA DA PLATAFORMA & PROMESSAS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Planos de Assinatura do Zion Connect</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Tudo o que a plataforma promete e disponibiliza para as barbearias parceiras
              </p>
            </div>

            {/* Banner de Compromisso e Recursos Prometidos */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Recursos Prometidos & Entregues pela Plataforma
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-300">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
                  <span className="font-bold text-neutral-100 block">Agendamento Online 24/7</span>
                  <p className="text-neutral-400 text-[11px]">
                    Sem sobreposição, com cálculo dinâmico de vagas livres e link mobile-first exclusivo.
                  </p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
                  <span className="font-bold text-neutral-100 block">Barbeiros Sócios & Comissões</span>
                  <p className="text-neutral-400 text-[11px]">
                    Login individual para a equipe, link exclusivo por cadeira e cálculo de comissão em %.
                  </p>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
                  <span className="font-bold text-neutral-100 block">Clube VIP & Recorrência</span>
                  <p className="text-neutral-400 text-[11px]">
                    Assinaturas mensais, trimestrais e anuais com receita previsível todo mês.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de Planos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {plans
                .filter((p) => !p.tenantId)
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-bold text-neutral-100">
                          {plan.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 uppercase font-mono">
                          {plan.price === 0 ? 'Gratuito' : plan.interval}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-amber-400 font-mono my-2">
                        {plan.price === 0 ? (
                          'R$ 0,00'
                        ) : (
                          <>
                            R$ {plan.price.toFixed(2)}
                            <span className="text-xs font-normal text-neutral-400">
                              {plan.interval === 'monthly' && '/mês'}
                              {plan.interval === 'quarterly' && '/trimestre'}
                              {plan.interval === 'annual' && '/ano'}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                        {plan.description}
                      </p>

                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        {plan.benefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.5]" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">● Disponível</span>
                      <button
                        onClick={() => {
                          setSelectedPlanToAssign(plan.name);
                          setAssignPlanTenant(tenants[0] || null);
                        }}
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        Atribuir a Barbearia
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURAÇÃO DE TAXAS E PORCENTAGENS */}
        {activeTab === 'finances' && (
          <div className="max-w-2xl bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" />
                <span>Configuração de Taxas e Porcentagens</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Defina a taxa de adesão que cada nova barbearia paga, e as porcentagens padrão sobre cortes e serviços
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configurações atualizadas com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Taxa Única de Adesão por Barbearia (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Cobrado do dono da barbearia após o cadastro inicial para liberar acesso total.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Porcentagem da Plataforma (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={platformPctInput}
                    onChange={(e) => setPlatformPctInput(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Comissão Padrão Barbeiro (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={barberPctInput}
                    onChange={(e) => setBarberPctInput(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Porcentagem Sócios (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={partnerPctInput}
                    onChange={(e) => setPartnerPctInput(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Chave PIX do Desenvolvedor (para recebimento das adesões)
                </label>
                <input
                  type="text"
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  placeholder="ex: uluanzinho@gmail.com ou CPF"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/20 text-xs space-y-2">
                <span className="font-semibold text-amber-400">Simulação de Repasse em R$ 1.000,00 de faturamento:</span>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-300 font-mono pt-1">
                  <div>
                    <span className="text-neutral-500">Zion ({platformPctInput}%):</span>
                    <p className="text-emerald-400 font-bold">R$ {((1000 * parseFloat(platformPctInput || '0')) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Barbeiro ({barberPctInput}%):</span>
                    <p className="text-sky-400 font-bold">R$ {((1000 * parseFloat(barberPctInput || '0')) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Sócios ({partnerPctInput}%):</span>
                    <p className="text-amber-400 font-bold">R$ {((1000 * parseFloat(partnerPctInput || '0')) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Configurações de Taxa</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modal para Conceder Plano Teste */}
      {trialModalTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span>Disponibilizar Plano Teste</span>
              </h3>
              <button
                type="button"
                onClick={() => setTrialModalTenant(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Liberar acesso cortesia imediato para a barbearia <strong className="text-amber-400">{trialModalTenant.name}</strong> para que eles testem o sistema na prática.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                Selecione o Período de Teste:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 15, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTrialDaysInput(days)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      trialDaysInput === days
                        ? 'bg-purple-500 text-white border-purple-400 shadow-md'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {days} Dias Grátis
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setTrialModalTenant(null)}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTrialGrant}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20"
              >
                Liberar {trialDaysInput} Dias Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Atribuir Plano */}
      {assignPlanTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Atribuir Plano</span>
              </h3>
              <button
                type="button"
                onClick={() => setAssignPlanTenant(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Barbearia:
              </label>
              <select
                value={assignPlanTenant.id}
                onChange={(e) => {
                  const found = tenants.find((t) => t.id === e.target.value);
                  if (found) setAssignPlanTenant(found);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Plano a Atribuir:
              </label>
              <select
                value={selectedPlanToAssign}
                onChange={(e) => setSelectedPlanToAssign(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100"
              >
                {plans
                  .filter((p) => !p.tenantId)
                  .map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} - R$ {p.price.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setAssignPlanTenant(null)}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPlanAssign}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs"
              >
                Confirmar Atribuição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
