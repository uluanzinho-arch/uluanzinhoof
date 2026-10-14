import React, { useState, useEffect } from 'react';
import {
  Tenant,
  Barber,
  Service,
  ScheduleConfig,
  Appointment,
  TimeBlock,
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  AuthSession,
  SubscriptionPlan,
  PlatformSettings,
} from './types';
import {
  initializeStorage,
  getTenants,
  getTenantBySlug,
  getBarbers,
  getServices,
  getSchedules,
  getTimeBlocks,
  getAppointments,
  saveService,
  deleteService,
  saveSchedule,
  addTimeBlock,
  deleteTimeBlock,
  saveAppointment,
  updateAppointmentStatus,
  updateAppointmentPayment,
  deleteAppointment,
  saveBarber,
  deleteBarber,
  calculateDashboardMetrics,
  updateTenant,
  resetStorage,
  getAuthSession,
  setAuthSession,
  logout,
  getAccounts,
  approveTenantPayment,
  deleteTenant,
  getPlatformSettings,
  updatePlatformSettings,
  getSubscriptionPlans,
  saveSubscriptionPlan,
  deleteSubscriptionPlan,
} from './lib/storage';
import { DashboardView } from './components/admin/DashboardView';
import { BarbersManagement } from './components/admin/BarbersManagement';
import { ServicesManagement } from './components/admin/ServicesManagement';
import { ScheduleSettings } from './components/admin/ScheduleSettings';
import { TenantSettings } from './components/admin/TenantSettings';
import { BarbershopPlansTab } from './components/admin/BarbershopPlansTab';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { SecondaryBarberView } from './components/admin/SecondaryBarberView';
import { PendingActivationScreen } from './components/admin/PendingActivationScreen';
import { AuthModalOrScreen } from './components/auth/AuthModalOrScreen';
import { SqlSchemaModal } from './components/admin/SqlSchemaModal';
import { ShareModal } from './components/admin/ShareModal';
import { BlockTimeModal } from './components/admin/BlockTimeModal';
import { QuickBookingModal } from './components/admin/QuickBookingModal';
import { ClientBookingFlow } from './components/client/ClientBookingFlow';
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  Settings,
  Database,
  ExternalLink,
  Share2,
  RefreshCw,
  Store,
  Phone,
  Users,
  LogOut,
  Layers,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Inicializar dados do banco local
  useEffect(() => {
    initializeStorage();
  }, []);

  // Parâmetros de link direto (ex: /?tenant=slug&barber=barber-123)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlTenantSlug = urlParams?.get('tenant');
  const urlBarberId = urlParams?.get('barber');

  // Sessão persistente de autenticação (sem pedir login 2x!)
  const [session, setSessionState] = useState<AuthSession | null>(() => getAuthSession());

  // Tenants e seleção
  const [tenants, setTenants] = useState<Tenant[]>(() => getTenants());
  const [currentTenantSlug, setCurrentTenantSlug] = useState<string>(() => {
    if (urlTenantSlug) {
      const match = getTenants().find((t) => t.slug.toLowerCase() === urlTenantSlug.toLowerCase());
      if (match) return match.slug;
    }
    const sess = getAuthSession();
    if (sess?.user?.tenantId) {
      const userTenant = getTenants().find((t) => t.id === sess.user.tenantId);
      if (userTenant) return userTenant.slug;
    }
    return getTenants()[0]?.slug || 'uluanzinhobarbeiro';
  });

  // Modo de visualização: se veio de link de cliente/barbeiro, abre imediatamente em 'client'
  const [viewMode, setViewMode] = useState<'admin' | 'client'>(() => {
    if (urlTenantSlug || urlBarberId) return 'client';
    return 'admin';
  });
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'barbers' | 'services' | 'schedules' | 'plans' | 'settings'>('dashboard');

  // Super Admin impersonando uma barbearia específica
  const [impersonatingTenantSlug, setImpersonatingTenantSlug] = useState<string | null>(null);

  // Modais administrativos
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isQuickBookingModalOpen, setIsQuickBookingModalOpen] = useState(false);

  // Sincronizar dados do tenant selecionado
  const activeSlug = impersonatingTenantSlug || currentTenantSlug;
  const currentTenant = getTenantBySlug(activeSlug) || tenants[0];

  const [barbers, setBarbers] = useState<Barber[]>(getBarbers(currentTenant.id));
  const [services, setServices] = useState<Service[]>(getServices(currentTenant.id));
  const [schedules, setSchedules] = useState<ScheduleConfig[]>(getSchedules(currentTenant.id));
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(getTimeBlocks(currentTenant.id));
  const [appointments, setAppointments] = useState<Appointment[]>(getAppointments(currentTenant.id));
  const [plans, setPlans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [platformSettings, setPlatformSettingsState] = useState<PlatformSettings>(getPlatformSettings());

  // Recarregar dados quando mudar o tenant
  useEffect(() => {
    if (currentTenant) {
      setBarbers(getBarbers(currentTenant.id));
      setServices(getServices(currentTenant.id));
      setSchedules(getSchedules(currentTenant.id));
      setTimeBlocks(getTimeBlocks(currentTenant.id));
      setAppointments(getAppointments(currentTenant.id));
      setPlans(getSubscriptionPlans());
    }
  }, [activeSlug, currentTenant.id]);

  const refreshTenantData = () => {
    const freshTenants = getTenants();
    setTenants(freshTenants);
    const active = freshTenants.find((t) => t.slug === activeSlug) || freshTenants[0];
    if (active) {
      setBarbers(getBarbers(active.id));
      setServices(getServices(active.id));
      setSchedules(getSchedules(active.id));
      setTimeBlocks(getTimeBlocks(active.id));
      setAppointments(getAppointments(active.id));
      setPlans(getSubscriptionPlans());
    }
    setPlatformSettingsState(getPlatformSettings());
  };

  // Autenticação Handlers
  const handleLoginSuccess = (newSession: AuthSession) => {
    setSessionState(newSession);
    setAuthSession(newSession);

    // Se a conta for de uma barbearia específica, sincroniza o tenant
    if (newSession.user.tenantId) {
      const t = getTenants().find((item) => item.id === newSession.user.tenantId);
      if (t) {
        setCurrentTenantSlug(t.slug);
      }
    }
    setViewMode('admin');
  };

  const handleLogout = () => {
    logout();
    setSessionState(null);
    setImpersonatingTenantSlug(null);
    setViewMode('admin');
  };

  // Handlers de barbeiros
  const handleSaveBarber = (barber: Barber) => {
    saveBarber(barber);
    setBarbers(getBarbers(currentTenant.id));
    setSchedules(getSchedules(currentTenant.id));
  };

  const handleDeleteBarber = (barberId: string) => {
    deleteBarber(barberId);
    setBarbers(getBarbers(currentTenant.id));
    setSchedules(getSchedules(currentTenant.id));
  };

  const handleDeleteTenant = (tenantId: string) => {
    deleteTenant(tenantId);
    refreshTenantData();
  };

  // Handlers de serviços
  const handleSaveService = (service: Service) => {
    saveService(service);
    setServices(getServices(currentTenant.id));
  };

  const handleDeleteService = (serviceId: string) => {
    deleteService(serviceId);
    setServices(getServices(currentTenant.id));
  };

  // Handlers de horários e expediente
  const handleSaveSchedule = (schedule: ScheduleConfig) => {
    saveSchedule(schedule);
    setSchedules(getSchedules(currentTenant.id));
  };

  const handleSaveTimeBlock = (block: TimeBlock) => {
    addTimeBlock(block);
    setTimeBlocks(getTimeBlocks(currentTenant.id));
  };

  const handleDeleteTimeBlock = (blockId: string) => {
    deleteTimeBlock(blockId);
    setTimeBlocks(getTimeBlocks(currentTenant.id));
  };

  // Handlers de agendamentos
  const handleUpdateStatus = (appId: string, status: AppointmentStatus) => {
    updateAppointmentStatus(appId, status);
    setAppointments(getAppointments(currentTenant.id));
  };

  const handleUpdatePayment = (appId: string, method?: PaymentMethod, status?: PaymentStatus) => {
    updateAppointmentPayment(appId, method, status);
    setAppointments(getAppointments(currentTenant.id));
  };

  const handleDeleteAppointment = (appId: string) => {
    deleteAppointment(appId);
    setAppointments(getAppointments(currentTenant.id));
  };

  const handleBookAppointment = (app: Appointment) => {
    saveAppointment(app);
    setAppointments(getAppointments(currentTenant.id));
  };

  const handleUpdateTenantInfo = (updated: Tenant) => {
    updateTenant(updated);
    setTenants(getTenants());
    setCurrentTenantSlug(updated.slug);
  };

  const handleApproveTenant = (tenantId: string) => {
    approveTenantPayment(tenantId);
    refreshTenantData();
  };

  const handleUpdatePlatformSettings = (newSettings: Partial<PlatformSettings>) => {
    const updated = updatePlatformSettings(newSettings);
    setPlatformSettingsState(updated);
  };

  const handleSavePlan = (plan: SubscriptionPlan) => {
    saveSubscriptionPlan(plan);
    setPlans(getSubscriptionPlans());
  };

  const handleDeletePlan = (planId: string) => {
    deleteSubscriptionPlan(planId);
    setPlans(getSubscriptionPlans());
  };

  // Métricas do dashboard calculadas dinamicamente
  const metrics = calculateDashboardMetrics(currentTenant.id);

  // =========================================================================
  // 1. VISÃO DO CLIENTE (LINK PÚBLICO DE AGENDAMENTO)
  // =========================================================================
  if (viewMode === 'client') {
    return (
      <ClientBookingFlow
        tenant={currentTenant}
        barbers={barbers}
        services={services}
        schedules={schedules}
        appointments={appointments}
        timeBlocks={timeBlocks}
        initialBarberId={urlBarberId || undefined}
        onBookAppointment={handleBookAppointment}
        onBackToAdmin={() => setViewMode('admin')}
      />
    );
  }

  // =========================================================================
  // 2. TELA DE AUTENTICAÇÃO / LOGIN (SE NÃO ESTIVER LOGADO)
  // =========================================================================
  if (!session) {
    return (
      <AuthModalOrScreen
        onLoginSuccess={handleLoginSuccess}
        onOpenPublicClientDemo={() => setViewMode('client')}
      />
    );
  }

  // =========================================================================
  // 3. PERFIL DO SUPER ADMIN / DESENVOLVEDOR GERAL (uluanzinho@gmail.com)
  // =========================================================================
  if (session.user.role === 'super_admin' && !impersonatingTenantSlug) {
    return (
      <SuperAdminDashboard
        tenants={tenants}
        accounts={getAccounts()}
        platformSettings={platformSettings}
        plans={plans}
        appointments={getAppointments(currentTenant.id)}
        onApproveTenant={handleApproveTenant}
        onSelectTenantToManage={(slug) => setImpersonatingTenantSlug(slug)}
        onOpenClientView={(slug) => {
          setCurrentTenantSlug(slug);
          setViewMode('client');
        }}
        onUpdatePlatformSettings={handleUpdatePlatformSettings}
        onSavePlan={handleSavePlan}
        onDeleteTenant={handleDeleteTenant}
        onLogout={handleLogout}
      />
    );
  }

  // =========================================================================
  // 4. PERFIL DO BARBEIRO SECUNDÁRIO (ACESSO ISOLADO APENAS AOS SEUS CLIENTES)
  // =========================================================================
  if (session.user.role === 'secondary_barber') {
    const myBarber =
      barbers.find((b) => b.id === session.user.barberId || b.userId === session.user.id) ||
      barbers[0];

    return (
      <SecondaryBarberView
        tenant={currentTenant}
        barber={myBarber}
        account={session.user}
        appointments={appointments}
        services={services}
        timeBlocks={timeBlocks}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePayment={handleUpdatePayment}
        onAddQuickBooking={handleBookAppointment}
        onSaveTimeBlock={handleSaveTimeBlock}
        onDeleteTimeBlock={handleDeleteTimeBlock}
        onOpenClientView={() => setViewMode('client')}
        onLogout={handleLogout}
      />
    );
  }

  // =========================================================================
  // 5. BARBEARIA PENDENTE DE ATIVAÇÃO / TAXA DE ADESÃO
  // =========================================================================
  if (
    session.user.role === 'tenant_owner' &&
    currentTenant.status === 'pending_payment' &&
    !currentTenant.onboardingPaid
  ) {
    return (
      <PendingActivationScreen
        tenant={currentTenant}
        account={session.user}
        platformSettings={platformSettings}
        plans={plans}
        onSimulatePayment={() => {
          handleApproveTenant(currentTenant.id);
        }}
        onLogout={handleLogout}
      />
    );
  }

  // =========================================================================
  // 6. PAINEL ADMINISTRATIVO COMPLETO DA BARBEARIA (ZION CONNECT WORKSPACE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Super Admin Impersonation Notice (se o desenvolvedor estiver gerenciando uma barbearia) */}
      {session.user.role === 'super_admin' && impersonatingTenantSlug && (
        <div className="bg-amber-500 text-neutral-950 px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>
              Modo Desenvolvedor Ativo: Gerenciando barbearia <strong>{currentTenant.name}</strong> ({currentTenant.slug})
            </span>
          </div>

          <button
            onClick={() => setImpersonatingTenantSlug(null)}
            className="flex items-center gap-1.5 px-3 py-1 bg-black text-amber-400 hover:bg-neutral-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel Geral do Desenvolvedor</span>
          </button>
        </div>
      )}

      {/* Top Banner (Desktop / Tablet) */}
      <div className="hidden sm:flex bg-neutral-900 border-b border-neutral-800 text-xs px-4 py-2 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider">
            <Scissors className="w-3.5 h-3.5" />
            <span>Zion Connect</span>
          </div>

          {/* Tenant Switcher dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={activeSlug}
              onChange={(e) => {
                if (session.user.role === 'super_admin') {
                  setImpersonatingTenantSlug(e.target.value);
                } else {
                  setCurrentTenantSlug(e.target.value);
                }
              }}
              className="bg-neutral-950 border border-neutral-700 rounded-md px-2.5 py-1 text-xs font-medium text-neutral-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          <span className="text-neutral-500 flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-emerald-400" />
            <strong className="text-neutral-300 font-mono">{currentTenant.phone}</strong>
            <span>·</span>
            <span>{currentTenant.address}, {currentTenant.city}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-md transition-colors font-medium text-xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Modelagem SQL</span>
          </button>

          <button
            onClick={() => setViewMode('client')}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors text-xs font-medium"
            title="Abrir como cliente no smartphone"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Link do Cliente</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-md transition-colors text-xs font-medium"
            title="Sair da conta"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Main Top Navigation Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Brand zone */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={currentTenant.logoUrl || '/src/assets/images/barber_avatar_master_1791911756901.jpg'}
              alt={currentTenant.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-amber-400/50 bg-neutral-800"
            />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap truncate max-w-[140px] sm:max-w-none">
                {currentTenant.name}
              </span>
              <span className="text-[10px] text-amber-400 font-medium sm:hidden">
                Zion Connect · {currentTenant.phone}
              </span>
            </div>
          </div>

          {/* Desktop Nav links / Tabs */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveAdminTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeAdminTab === 'dashboard'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard & Agenda
            </button>

            <button
              onClick={() => setActiveAdminTab('barbers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeAdminTab === 'barbers'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Barbeiros & Acessos ({barbers.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('services')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeAdminTab === 'services'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Serviços ({services.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('schedules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeAdminTab === 'schedules'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Horários & Pausas
            </button>

            <button
              onClick={() => setActiveAdminTab('plans')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeAdminTab === 'plans'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Planos & Assinaturas
            </button>

            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeAdminTab === 'settings'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Perfil & Endereço
            </button>
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setViewMode('client')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors text-xs font-medium sm:hidden"
              title="Abrir como Cliente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Cliente</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar Link</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors sm:hidden"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-8">
        {activeAdminTab === 'dashboard' && (
          <DashboardView
            tenant={currentTenant}
            barbers={barbers}
            appointments={appointments}
            timeBlocks={timeBlocks}
            metrics={metrics}
            onUpdateAppointmentStatus={handleUpdateStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdatePayment={handleUpdatePayment}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenBlockModal={() => setIsBlockModalOpen(true)}
            onOpenClientView={() => setViewMode('client')}
            onOpenQuickBookingModal={() => setIsQuickBookingModalOpen(true)}
          />
        )}

        {activeAdminTab === 'barbers' && (
          <BarbersManagement
            tenantId={currentTenant.id}
            tenantSlug={currentTenant.slug}
            barbers={barbers}
            onSaveBarber={handleSaveBarber}
            onDeleteBarber={handleDeleteBarber}
          />
        )}

        {activeAdminTab === 'services' && (
          <ServicesManagement
            tenantId={currentTenant.id}
            services={services}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
          />
        )}

        {activeAdminTab === 'schedules' && (
          <ScheduleSettings
            tenantId={currentTenant.id}
            barbers={barbers}
            schedules={schedules}
            timeBlocks={timeBlocks}
            onSaveSchedule={handleSaveSchedule}
            onDeleteBlock={handleDeleteTimeBlock}
            onOpenBlockModal={() => setIsBlockModalOpen(true)}
          />
        )}

        {activeAdminTab === 'plans' && (
          <BarbershopPlansTab
            tenantId={currentTenant.id}
            plans={plans}
            onSavePlan={handleSavePlan}
            onDeletePlan={handleDeletePlan}
          />
        )}

        {activeAdminTab === 'settings' && (
          <TenantSettings
            tenant={currentTenant}
            onUpdateTenant={handleUpdateTenantInfo}
          />
        )}
      </main>

      {/* Dedicated Mobile Bottom Navigation Bar (Fixed & Thumb-friendly) */}
      <nav aria-label="Navegação móvel" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-xl pb-safe shadow-2xl">
        <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-2">
          <button
            onClick={() => setActiveAdminTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              activeAdminTab === 'dashboard'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-colors ${activeAdminTab === 'dashboard' ? 'bg-amber-400/10' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Agenda</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('barbers')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all relative ${
              activeAdminTab === 'barbers'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-colors relative ${activeAdminTab === 'barbers' ? 'bg-amber-400/10' : ''}`}>
              <Users className="w-5 h-5" />
              {barbers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neutral-800 text-neutral-300 text-[9px] rounded-full flex items-center justify-center font-mono border border-neutral-700">
                  {barbers.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Equipe</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('services')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              activeAdminTab === 'services'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-colors ${activeAdminTab === 'services' ? 'bg-amber-400/10' : ''}`}>
              <Scissors className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Serviços</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('plans')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              activeAdminTab === 'plans'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-colors ${activeAdminTab === 'plans' ? 'bg-amber-400/10' : ''}`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Planos</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              activeAdminTab === 'settings'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-md transition-colors ${activeAdminTab === 'settings' ? 'bg-amber-400/10' : ''}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Footer (Desktop / Tablet) */}
      <footer className="hidden sm:block border-t border-neutral-900 bg-neutral-950 py-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-400">Zion Connect</span>
            <span>·</span>
            <span>{currentTenant.name}</span>
            <span>·</span>
            <span className="font-mono text-neutral-400">{currentTenant.phone}</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Ver DDL & RLS
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Link do WhatsApp
            </button>
          </div>
        </div>
      </footer>

      {/* Modais Administrativos */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        tenant={currentTenant}
        onClose={() => setIsShareModalOpen(false)}
        onOpenClientView={() => setViewMode('client')}
      />

      <BlockTimeModal
        isOpen={isBlockModalOpen}
        barbers={barbers}
        tenantId={currentTenant.id}
        onClose={() => setIsBlockModalOpen(false)}
        onSave={handleSaveTimeBlock}
      />

      <QuickBookingModal
        isOpen={isQuickBookingModalOpen}
        tenantId={currentTenant.id}
        barbers={barbers}
        services={services}
        onClose={() => setIsQuickBookingModalOpen(false)}
        onSave={handleBookAppointment}
      />
    </div>
  );
}
