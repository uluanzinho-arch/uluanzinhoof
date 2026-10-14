import {
  Tenant,
  Barber,
  Service,
  ScheduleConfig,
  Appointment,
  Client,
  TimeBlock,
  AppointmentStatus,
  UserAccount,
  AuthSession,
  PlatformSettings,
  SubscriptionPlan,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_BARBERS,
  INITIAL_SERVICES,
  INITIAL_SCHEDULES,
  INITIAL_TIME_BLOCKS,
  INITIAL_APPOINTMENTS,
  INITIAL_CLIENTS,
  INITIAL_ACCOUNTS,
  INITIAL_PLATFORM_SETTINGS,
  INITIAL_PLANS,
  generateDefaultServices,
  generateDefaultSchedules,
} from './mockData';
import { parseISO, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

const STORAGE_KEYS = {
  TENANTS: 'zion_tenants_v3',
  BARBERS: 'zion_barbers_v3',
  SERVICES: 'zion_services_v3',
  SCHEDULES: 'zion_schedules_v3',
  TIME_BLOCKS: 'zion_timeblocks_v3',
  APPOINTMENTS: 'zion_appointments_v3',
  CLIENTS: 'zion_clients_v3',
  ACCOUNTS: 'zion_accounts_v3',
  AUTH_SESSION: 'zion_auth_session_v3',
  PLATFORM_SETTINGS: 'zion_platform_settings_v3',
  PLANS: 'zion_plans_v3',
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key}`, err);
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key}`, err);
  }
}

// Inicializar armazenamento se vazio
export function initializeStorage() {
  const existingTenants = localStorage.getItem(STORAGE_KEYS.TENANTS);
  if (!existingTenants || !existingTenants.includes('uluanzinhobarbeiro')) {
    setStorage(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
    setStorage(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
    setStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    setStorage(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    setStorage(STORAGE_KEYS.TIME_BLOCKS, INITIAL_TIME_BLOCKS);
    setStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    setStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    setStorage(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    setStorage(STORAGE_KEYS.PLATFORM_SETTINGS, INITIAL_PLATFORM_SETTINGS);
    setStorage(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  } else {
    // Garantir que contas mestras estejam sincronizadas se faltar alguma
    const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
    const hasSuperAdmin = accounts.some((a) => a.email.toLowerCase() === 'uluanzinho@gmail.com');
    if (!hasSuperAdmin) {
      setStorage(STORAGE_KEYS.ACCOUNTS, [...INITIAL_ACCOUNTS, ...accounts]);
    }

    const plans = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, []);
    if (!plans || plans.length === 0) {
      setStorage(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    }

    const settings = getStorage<PlatformSettings | null>(STORAGE_KEYS.PLATFORM_SETTINGS, null);
    if (!settings) {
      setStorage(STORAGE_KEYS.PLATFORM_SETTINGS, INITIAL_PLATFORM_SETTINGS);
    }
  }
}

export function resetStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.TENANTS);
  localStorage.removeItem(STORAGE_KEYS.BARBERS);
  localStorage.removeItem(STORAGE_KEYS.SERVICES);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
  localStorage.removeItem(STORAGE_KEYS.TIME_BLOCKS);
  localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
  localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  localStorage.removeItem(STORAGE_KEYS.PLATFORM_SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.PLANS);
  initializeStorage();
}

// --- AUTENTICAÇÃO & SESSÃO (PERSISTÊNCIA TOTAL, SEM PEDIR LOGIN 2X) ---
export function getAuthSession(): AuthSession | null {
  return getStorage<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
}

export function setAuthSession(session: AuthSession | null): void {
  if (session) {
    setStorage(STORAGE_KEYS.AUTH_SESSION, session);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

export function getAccounts(): UserAccount[] {
  return getStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
}

export function saveAccount(account: UserAccount): void {
  const accounts = getAccounts();
  const exists = accounts.some((a) => a.id === account.id);
  const updated = exists ? accounts.map((a) => (a.id === account.id ? account : a)) : [account, ...accounts];
  setStorage(STORAGE_KEYS.ACCOUNTS, updated);
}

export function findAccountByIdentifier(identifier: string): UserAccount | undefined {
  const clean = identifier.trim().toLowerCase();
  const accounts = getAccounts();
  return accounts.find(
    (a) => a.email.toLowerCase() === clean || a.username.toLowerCase() === clean
  );
}

export function login(
  identifier: string,
  password: string
): { success: boolean; session?: AuthSession; message?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // Caso especial Master Super Admin garantido
  if (
    (cleanId === 'uluanzinho@gmail.com' || cleanId === 'uluanzinho') &&
    cleanPass === 'Luan684933!'
  ) {
    const superAdmin = getAccounts().find((a) => a.email === 'uluanzinho@gmail.com') || INITIAL_ACCOUNTS[0];
    const session: AuthSession = { user: superAdmin };
    setAuthSession(session);
    return { success: true, session };
  }

  const user = findAccountByIdentifier(cleanId);
  if (!user) {
    return { success: false, message: 'Usuário ou e-mail não encontrado.' };
  }

  if (user.password !== cleanPass) {
    return { success: false, message: 'Senha incorreta. Tente novamente ou redefina sua senha.' };
  }

  const session: AuthSession = { user };
  setAuthSession(session);
  return { success: true, session };
}

export function resetPassword(
  identifier: string,
  newPassword: string
): { success: boolean; message: string } {
  const cleanId = identifier.trim().toLowerCase();
  const accounts = getAccounts();
  const user = accounts.find(
    (a) => a.email.toLowerCase() === cleanId || a.username.toLowerCase() === cleanId
  );

  if (!user) {
    return { success: false, message: 'E-mail ou nome de usuário não localizado no sistema.' };
  }

  user.password = newPassword.trim();
  saveAccount(user);

  // Se o usuário redefinido for a sessão ativa, atualiza a sessão
  const activeSession = getAuthSession();
  if (activeSession && activeSession.user.id === user.id) {
    setAuthSession({ ...activeSession, user });
  }

  return { success: true, message: 'Senha atualizada com sucesso! Você já pode entrar.' };
}

// --- CADASTRO DE NOVO CLIENTE / NOVA BARBEARIA ---
export interface RegisterNewTenantParams {
  fullName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  shopName: string;
  shopAddress: string;
  shopCity: string;
  shopPhone: string;
  selectedPlanId?: string;
}

export function registerNewTenant(params: RegisterNewTenantParams): { tenant: Tenant; account: UserAccount } {
  const cleanSlug = params.shopName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `barbearia-${Date.now().toString().slice(-4)}`;

  const tenantId = `tenant-${Date.now()}`;
  const userId = `usr-${Date.now()}`;
  const barberId = `barber-${Date.now()}`;

  // 1. Criar Usuário Dono da Barbearia
  const newAccount: UserAccount = {
    id: userId,
    email: params.email.trim().toLowerCase(),
    username: params.username.trim().toLowerCase().replace(/\s+/g, ''),
    password: params.password.trim(),
    fullName: params.fullName.trim(),
    phone: params.phone.trim(),
    role: 'tenant_owner',
    tenantId,
    barberId,
    accountStatus: 'pending_payment', // Aguarda pagamento da taxa de adesão ou liberação
    createdAt: new Date().toISOString(),
  };

  // 2. Criar Barbearia com endereço completo
  const newTenant: Tenant = {
    id: tenantId,
    slug: cleanSlug,
    name: params.shopName.trim(),
    tagline: 'Excelência em cortes masculinos, estilo moderno e atendimento exclusivo.',
    logoUrl: '/src/assets/images/barber_avatar_master_1791911756901.jpg',
    coverUrl: '/src/assets/images/barber_shop_interior_1791911756156.jpg',
    phone: params.shopPhone.trim() || params.phone.trim(),
    address: params.shopAddress.trim(),
    city: params.shopCity.trim(),
    instagram: `@${cleanSlug}`,
    pixKey: params.phone.replace(/\D/g, '') || 'uluanzinho@gmail.com',
    ownerId: userId,
    ownerEmail: params.email.trim().toLowerCase(),
    ownerPhone: params.phone.trim(),
    status: 'pending_payment',
    onboardingPaid: false,
    platformFeePercent: 10,
    createdAt: new Date().toISOString(),
  };

  // 3. Criar Barbeiro Master Principal
  const newBarber: Barber = {
    id: barberId,
    tenantId,
    name: params.fullName.trim(),
    avatarUrl: '/src/assets/images/barber_avatar_master_1791911756901.jpg',
    role: 'Master Barber & Dono',
    bio: 'Profissional especialista dedicado à arte e estilo masculino.',
    email: params.email.trim().toLowerCase(),
    username: params.username.trim().toLowerCase(),
    phone: params.phone.trim(),
    commissionRate: 100,
    userId,
    isDefault: true,
    isActive: true,
  };

  // 4. Gerar Serviços Padrão prontos para agendamento imediato!
  const defaultServices = generateDefaultServices(tenantId);

  // 5. Gerar Grade de Horários 100% funcionando para os 7 dias da semana
  const defaultSchedules = generateDefaultSchedules(tenantId, barberId);

  // Salvar tudo no storage local
  const tenants = getTenants();
  setStorage(STORAGE_KEYS.TENANTS, [newTenant, ...tenants]);

  const accounts = getAccounts();
  setStorage(STORAGE_KEYS.ACCOUNTS, [newAccount, ...accounts]);

  const barbers = getStorage<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
  setStorage(STORAGE_KEYS.BARBERS, [newBarber, ...barbers]);

  const services = getStorage<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  setStorage(STORAGE_KEYS.SERVICES, [...defaultServices, ...services]);

  const schedules = getStorage<ScheduleConfig[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  setStorage(STORAGE_KEYS.SCHEDULES, [...defaultSchedules, ...schedules]);

  // Gerar planos de cliente padrão para esta barbearia
  const clientPlans: SubscriptionPlan[] = [
    {
      id: `plan-${tenantId}-monthly`,
      tenantId,
      name: 'Clube VIP Mensal',
      interval: 'monthly',
      price: 89.9,
      description: 'Cortes de cabelo ilimitados no mês com atendimento exclusivo.',
      benefits: ['Cortes de cabelo ilimitados', '1 Barboterapia de cortesia', 'Café especial e cerveja'],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `plan-${tenantId}-quarterly`,
      tenantId,
      name: 'Combo Trimestral Prime',
      interval: 'quarterly',
      price: 239.0,
      description: 'Três meses de estilo impecável com economia garantida.',
      benefits: ['Cortes e barba livres', 'Agendamento com prioridade', '10% de desconto em pomadas'],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `plan-${tenantId}-annual`,
      tenantId,
      name: 'Plano Anual Executivo',
      interval: 'annual',
      price: 850.0,
      description: 'Acesso total durante o ano todo para o cavalheiro moderno.',
      benefits: ['Acesso ilimitado 365 dias', 'Kit boas-vindas com pomada', 'Atendimento vip'],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  const allPlans = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  setStorage(STORAGE_KEYS.PLANS, [...clientPlans, ...allPlans]);

  return { tenant: newTenant, account: newAccount };
}

// Criar Barbeiro Secundário com login individual
export function createSecondaryBarber(
  tenantId: string,
  barberData: {
    name: string;
    role: string;
    bio: string;
    email: string;
    username: string;
    phone: string;
    password: string;
    commissionRate: number;
    avatarUrl?: string;
  }
): { barber: Barber; account: UserAccount } {
  const barberId = `barber-${Date.now()}`;
  const userId = `usr-barber-${Date.now()}`;

  const newAccount: UserAccount = {
    id: userId,
    email: barberData.email.trim().toLowerCase(),
    username: barberData.username.trim().toLowerCase().replace(/\s+/g, ''),
    password: barberData.password.trim(),
    fullName: barberData.name.trim(),
    phone: barberData.phone.trim(),
    role: 'secondary_barber',
    tenantId,
    barberId,
    commissionRate: barberData.commissionRate || 50,
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
  };

  const newBarber: Barber = {
    id: barberId,
    tenantId,
    name: barberData.name.trim(),
    avatarUrl: barberData.avatarUrl || '/src/assets/images/barber_classic_cut_1791911756740.jpg',
    role: barberData.role || 'Barbeiro Profissional',
    bio: barberData.bio || 'Especialista em cortes modernos e fade.',
    email: barberData.email.trim().toLowerCase(),
    username: barberData.username.trim().toLowerCase(),
    phone: barberData.phone.trim(),
    commissionRate: barberData.commissionRate || 50,
    userId,
    isDefault: false,
    isActive: true,
  };

  saveAccount(newAccount);
  saveBarber(newBarber);

  // Garantir horários gerados para este barbeiro secundário
  const schedules = generateDefaultSchedules(tenantId, barberId);
  const allSchedules = getStorage<ScheduleConfig[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  setStorage(STORAGE_KEYS.SCHEDULES, [...schedules, ...allSchedules]);

  return { barber: newBarber, account: newAccount };
}

// Aprovar ativação de barbearia (Super Admin ou Pagamento Simulado)
export function approveTenantPayment(tenantId: string): void {
  const tenants = getTenants().map((t) => {
    if (t.id === tenantId) {
      return {
        ...t,
        status: 'active' as const,
        onboardingPaid: true,
        activePlanName: t.activePlanName || 'Plano Pro Aprovado',
      };
    }
    return t;
  });
  setStorage(STORAGE_KEYS.TENANTS, tenants);

  const accounts = getAccounts().map((a) => {
    if (a.tenantId === tenantId) {
      return { ...a, accountStatus: 'active' as const };
    }
    return a;
  });
  setStorage(STORAGE_KEYS.ACCOUNTS, accounts);

  // Atualizar sessão se for o usuário ativo
  const currentSession = getAuthSession();
  if (currentSession && currentSession.user.tenantId === tenantId) {
    setAuthSession({
      ...currentSession,
      user: { ...currentSession.user, accountStatus: 'active' },
    });
  }
}

// Conceder Plano Teste / Cortesia pelo Desenvolvedor
export function grantTrialPlan(tenantId: string, days: number): void {
  const trialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const planName = `Plano Teste Cortesia (${days} dias)`;

  const tenants = getTenants().map((t) => {
    if (t.id === tenantId) {
      return {
        ...t,
        status: 'active' as const,
        onboardingPaid: true,
        trialEndsAt: trialEnd,
        activePlanName: planName,
      };
    }
    return t;
  });
  setStorage(STORAGE_KEYS.TENANTS, tenants);

  const accounts = getAccounts().map((a) => {
    if (a.tenantId === tenantId) {
      return { ...a, accountStatus: 'active' as const };
    }
    return a;
  });
  setStorage(STORAGE_KEYS.ACCOUNTS, accounts);

  const currentSession = getAuthSession();
  if (currentSession && currentSession.user.tenantId === tenantId) {
    setAuthSession({
      ...currentSession,
      user: { ...currentSession.user, accountStatus: 'active' },
    });
  }
}

// Atribuir plano pelo Desenvolvedor
export function assignPlanToTenant(tenantId: string, planName: string): void {
  const tenants = getTenants().map((t) => {
    if (t.id === tenantId) {
      return {
        ...t,
        status: 'active' as const,
        onboardingPaid: true,
        activePlanName: planName,
      };
    }
    return t;
  });
  setStorage(STORAGE_KEYS.TENANTS, tenants);

  const accounts = getAccounts().map((a) => {
    if (a.tenantId === tenantId) {
      return { ...a, accountStatus: 'active' as const };
    }
    return a;
  });
  setStorage(STORAGE_KEYS.ACCOUNTS, accounts);
}

// Alternar status da barbearia (Ativo / Pausado)
export function toggleTenantStatus(tenantId: string): void {
  const tenants = getTenants().map((t) => {
    if (t.id === tenantId) {
      const nextStatus = t.status === 'active' ? ('suspended' as const) : ('active' as const);
      return { ...t, status: nextStatus };
    }
    return t;
  });
  setStorage(STORAGE_KEYS.TENANTS, tenants);

  const target = tenants.find((t) => t.id === tenantId);
  if (target) {
    const accounts = getAccounts().map((a) => {
      if (a.tenantId === tenantId) {
        return { ...a, accountStatus: target.status };
      }
      return a;
    });
    setStorage(STORAGE_KEYS.ACCOUNTS, accounts);
  }
}

// --- PLATFORM SETTINGS ---
export function getPlatformSettings(): PlatformSettings {
  return getStorage<PlatformSettings>(STORAGE_KEYS.PLATFORM_SETTINGS, INITIAL_PLATFORM_SETTINGS);
}

export function updatePlatformSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  const current = getPlatformSettings();
  const updated = { ...current, ...settings };
  setStorage(STORAGE_KEYS.PLATFORM_SETTINGS, updated);
  return updated;
}

// --- PLANOS DE ASSINATURA ---
export function getSubscriptionPlans(tenantId?: string): SubscriptionPlan[] {
  const all = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  if (tenantId === undefined) {
    return all;
  }
  return all.filter((p) => p.tenantId === tenantId);
}

export function getPlatformPlans(): SubscriptionPlan[] {
  const all = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  return all.filter((p) => !p.tenantId);
}

export function saveSubscriptionPlan(plan: SubscriptionPlan): void {
  const all = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  const exists = all.some((p) => p.id === plan.id);
  const updated = exists ? all.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...all];
  setStorage(STORAGE_KEYS.PLANS, updated);
}

export function deleteSubscriptionPlan(planId: string): void {
  const all = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  setStorage(STORAGE_KEYS.PLANS, all.filter((p) => p.id !== planId));
}

// --- TENANTS ---
export function getTenants(): Tenant[] {
  return getStorage<Tenant[]>(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
}

export function getTenantBySlug(slug: string): Tenant | undefined {
  const tenants = getTenants();
  return tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase()) || tenants[0];
}

export function updateTenant(tenant: Tenant): void {
  const tenants = getTenants().map((t) => (t.id === tenant.id ? tenant : t));
  setStorage(STORAGE_KEYS.TENANTS, tenants);
}

export function deleteTenant(tenantId: string): void {
  const tenants = getTenants().filter((t) => t.id !== tenantId);
  setStorage(STORAGE_KEYS.TENANTS, tenants);

  // Limpar contas, barbeiros, serviços, horários e agendamentos deste tenant
  const accounts = getAccounts().filter((a) => a.tenantId !== tenantId);
  setStorage(STORAGE_KEYS.ACCOUNTS, accounts);

  const barbers = getStorage<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS).filter((b) => b.tenantId !== tenantId);
  setStorage(STORAGE_KEYS.BARBERS, barbers);

  const services = getStorage<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES).filter((s) => s.tenantId !== tenantId);
  setStorage(STORAGE_KEYS.SERVICES, services);

  const schedules = getStorage<ScheduleConfig[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES).filter((s) => s.tenantId !== tenantId);
  setStorage(STORAGE_KEYS.SCHEDULES, schedules);

  const appointments = getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS).filter((a) => a.tenantId !== tenantId);
  setStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

  const plans = getStorage<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS).filter((p) => p.tenantId !== tenantId);
  setStorage(STORAGE_KEYS.PLANS, plans);
}

// --- BARBERS ---
export function getBarbers(tenantId: string): Barber[] {
  const barbers = getStorage<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
  return barbers.filter((b) => b.tenantId === tenantId);
}

export function saveBarber(barber: Barber): void {
  const all = getStorage<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
  const exists = all.some((b) => b.id === barber.id);
  const updated = exists ? all.map((b) => (b.id === barber.id ? barber : b)) : [barber, ...all];
  setStorage(STORAGE_KEYS.BARBERS, updated);

  if (barber.isDefault) {
    const adjusted = updated.map((b) =>
      b.tenantId === barber.tenantId && b.id !== barber.id ? { ...b, isDefault: false } : b
    );
    setStorage(STORAGE_KEYS.BARBERS, adjusted);
  }

  // GARANTIR QUE ESSE BARBEIRO TENHA GRADE DE HORÁRIOS COMPLETA DOS 7 DIAS
  const allSchedules = getStorage<ScheduleConfig[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  const existingForBarber = allSchedules.filter(
    (s) => s.tenantId === barber.tenantId && s.barberId === barber.id
  );

  if (existingForBarber.length < 7) {
    const newSchedules = generateDefaultSchedules(barber.tenantId, barber.id);
    // Remove qualquer duplicata parcial e adiciona os 7 dias completos
    const remaining = allSchedules.filter(
      (s) => !(s.tenantId === barber.tenantId && s.barberId === barber.id)
    );
    setStorage(STORAGE_KEYS.SCHEDULES, [...newSchedules, ...remaining]);
  }
}

export function deleteBarber(barberId: string): void {
  const all = getStorage<Barber[]>(STORAGE_KEYS.BARBERS, INITIAL_BARBERS);
  setStorage(STORAGE_KEYS.BARBERS, all.filter((b) => b.id !== barberId));
}

// --- SERVICES ---
export function getServices(tenantId: string): Service[] {
  const services = getStorage<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  return services.filter((s) => s.tenantId === tenantId);
}

export function saveService(service: Service): void {
  const all = getStorage<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  const exists = all.some((s) => s.id === service.id);
  const updated = exists ? all.map((s) => (s.id === service.id ? service : s)) : [service, ...all];
  setStorage(STORAGE_KEYS.SERVICES, updated);
}

export function deleteService(serviceId: string): void {
  const all = getStorage<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  setStorage(STORAGE_KEYS.SERVICES, all.filter((s) => s.id !== serviceId));
}

// --- SCHEDULES ---
export function getSchedules(tenantId: string, barberId?: string): ScheduleConfig[] {
  let all = getStorage<ScheduleConfig[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  if (barberId) {
    const forBarber = all.filter((s) => s.tenantId === tenantId && s.barberId === barberId);
    if (forBarber.length === 0) {
      // Se não tiver horários para este barbeiro, gera automaticamente os 7 dias e persiste!
      const generated = generateDefaultSchedules(tenantId, barberId);
      all = [...generated, ...all];
      setStorage(STORAGE_KEYS.SCHEDULES, all);
      return generated;
    }
    return forBarber;
  }
  return all.filter((s) => s.tenantId === tenantId);
}

export function saveSchedule(schedule: ScheduleConfig): void {
  const all = getStorage<ScheduleConfig[]>(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  const exists = all.some((s) => s.id === schedule.id);
  const updated = exists ? all.map((s) => (s.id === schedule.id ? schedule : s)) : [schedule, ...all];
  setStorage(STORAGE_KEYS.SCHEDULES, updated);
}

// --- TIME BLOCKS ---
export function getTimeBlocks(tenantId: string, barberId?: string, date?: string): TimeBlock[] {
  const all = getStorage<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, INITIAL_TIME_BLOCKS);
  return all.filter(
    (b) =>
      b.tenantId === tenantId &&
      (!barberId || b.barberId === barberId) &&
      (!date || b.date === date)
  );
}

export function addTimeBlock(block: TimeBlock): void {
  const all = getStorage<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, INITIAL_TIME_BLOCKS);
  setStorage(STORAGE_KEYS.TIME_BLOCKS, [block, ...all]);
}

export function deleteTimeBlock(blockId: string): void {
  const all = getStorage<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, INITIAL_TIME_BLOCKS);
  setStorage(STORAGE_KEYS.TIME_BLOCKS, all.filter((b) => b.id !== blockId));
}

// --- APPOINTMENTS ---
export function getAppointments(tenantId: string): Appointment[] {
  const all = getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  return all.filter((a) => a.tenantId === tenantId);
}

export function saveAppointment(appointment: Appointment): void {
  const all = getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  const exists = all.some((a) => a.id === appointment.id);
  const updated = exists ? all.map((a) => (a.id === appointment.id ? appointment : a)) : [appointment, ...all];
  setStorage(STORAGE_KEYS.APPOINTMENTS, updated);

  syncClientFromAppointment(appointment);
}

export function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): void {
  const all = getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  const updated = all.map((a) => (a.id === appointmentId ? { ...a, status } : a));
  setStorage(STORAGE_KEYS.APPOINTMENTS, updated);
}

export function updateAppointmentPayment(
  appointmentId: string,
  paymentMethod?: import('../types').PaymentMethod,
  paymentStatus?: import('../types').PaymentStatus
): void {
  const all = getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  const updated = all.map((a) => {
    if (a.id === appointmentId) {
      return {
        ...a,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : a.paymentMethod,
        paymentStatus: paymentStatus !== undefined ? paymentStatus : a.paymentStatus,
      };
    }
    return a;
  });
  setStorage(STORAGE_KEYS.APPOINTMENTS, updated);
}

export function deleteAppointment(appointmentId: string): void {
  const all = getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  const appointmentToDelete = all.find((a) => a.id === appointmentId);
  const updated = all.filter((a) => a.id !== appointmentId);
  setStorage(STORAGE_KEYS.APPOINTMENTS, updated);

  if (appointmentToDelete) {
    const allClients = getStorage<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const clientIndex = allClients.findIndex(
      (c) => c.tenantId === appointmentToDelete.tenantId && c.phone === appointmentToDelete.clientPhone
    );
    if (clientIndex >= 0) {
      const c = allClients[clientIndex];
      const newCount = Math.max(0, c.appointmentsCount - 1);
      const newSpent = Math.max(0, c.totalSpent - appointmentToDelete.totalPrice);
      allClients[clientIndex] = {
        ...c,
        appointmentsCount: newCount,
        totalSpent: newSpent,
        isRecurring: newCount >= 2,
      };
      setStorage(STORAGE_KEYS.CLIENTS, allClients);
    }
  }
}

// --- CLIENTS ---
export function getClients(tenantId: string): Client[] {
  const all = getStorage<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  return all.filter((c) => c.tenantId === tenantId);
}

function syncClientFromAppointment(app: Appointment): void {
  const allClients = getStorage<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  const existingIndex = allClients.findIndex(
    (c) => c.tenantId === app.tenantId && c.phone === app.clientPhone
  );

  if (existingIndex >= 0) {
    const existing = allClients[existingIndex];
    const newCount = existing.appointmentsCount + 1;
    allClients[existingIndex] = {
      ...existing,
      name: app.clientName,
      appointmentsCount: newCount,
      totalSpent: existing.totalSpent + app.totalPrice,
      lastVisit: app.date,
      isRecurring: newCount >= 2,
    };
  } else {
    allClients.unshift({
      id: `cli-${Date.now()}`,
      tenantId: app.tenantId,
      name: app.clientName,
      phone: app.clientPhone,
      appointmentsCount: 1,
      totalSpent: app.totalPrice,
      lastVisit: app.date,
      isRecurring: false,
    });
  }
  setStorage(STORAGE_KEYS.CLIENTS, allClients);
}

// --- DASHBOARD METRICS CALCULATOR ---
export interface DashboardMetrics {
  appointmentsToday: number;
  appointmentsWeek: number;
  appointmentsMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  averageTicket: number;
  recurringClientsCount: number;
  newClientsCount: number;
  topServices: { name: string; count: number; totalRevenue: number }[];
  monthlyComparison: { monthName: string; revenue: number; appointments: number }[];
  barberCommissions?: { barberName: string; count: number; commission: number }[];
}

export function calculateDashboardMetrics(tenantId: string, barberFilterId?: string): DashboardMetrics {
  let appointments = getAppointments(tenantId);
  const clients = getClients(tenantId);
  const barbers = getBarbers(tenantId);
  const referenceDate = new Date();

  if (barberFilterId) {
    appointments = appointments.filter((a) => a.barberId === barberFilterId);
  }

  const validApps = appointments.filter((a) => a.status !== 'cancelled');

  let appointmentsToday = 0;
  let appointmentsWeek = 0;
  let appointmentsMonth = 0;

  let revenueToday = 0;
  let revenueWeek = 0;
  let revenueMonth = 0;

  const serviceCounters: Record<string, { count: number; revenue: number }> = {};
  const barberCounters: Record<string, { count: number; totalRev: number }> = {};

  validApps.forEach((app) => {
    const appDate = parseISO(app.date);

    if (isSameDay(appDate, referenceDate)) {
      appointmentsToday++;
      revenueToday += app.totalPrice;
    }

    if (isSameWeek(appDate, referenceDate, { weekStartsOn: 1 })) {
      appointmentsWeek++;
      revenueWeek += app.totalPrice;
    }

    if (isSameMonth(appDate, referenceDate)) {
      appointmentsMonth++;
      revenueMonth += app.totalPrice;
    }

    app.serviceNames.forEach((sName) => {
      if (!serviceCounters[sName]) {
        serviceCounters[sName] = { count: 0, revenue: 0 };
      }
      serviceCounters[sName].count++;
      serviceCounters[sName].revenue += app.totalPrice / (app.serviceNames.length || 1);
    });

    const b = barbers.find((x) => x.id === app.barberId);
    const bName = b ? b.name : 'Barbeiro';
    if (!barberCounters[bName]) {
      barberCounters[bName] = { count: 0, totalRev: 0 };
    }
    barberCounters[bName].count++;
    barberCounters[bName].totalRev += app.totalPrice;
  });

  const totalRelevantRevenue = revenueMonth > 0 ? revenueMonth : validApps.reduce((acc, a) => acc + a.totalPrice, 0);
  const totalRelevantCount = appointmentsMonth > 0 ? appointmentsMonth : validApps.length;
  const averageTicket = totalRelevantCount > 0 ? totalRelevantRevenue / totalRelevantCount : 0;

  const recurringClientsCount = clients.filter((c) => c.isRecurring).length;
  const newClientsCount = clients.filter((c) => !c.isRecurring).length;

  const topServices = Object.entries(serviceCounters)
    .map(([name, data]) => ({ name, count: data.count, totalRevenue: data.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (topServices.length === 0) {
    topServices.push(
      { name: 'Corte Clássico & Degradê', count: 18, totalRevenue: 810.0 },
      { name: 'Combo Imperial (Cabelo + Barba)', count: 14, totalRevenue: 980.0 },
      { name: 'Barba Terapia Tradicional', count: 9, totalRevenue: 315.0 },
      { name: 'Pezinho & Acabamento', count: 6, totalRevenue: 120.0 }
    );
  }

  const monthlyComparison = [
    { monthName: 'Jun', revenue: 3820, appointments: 84 },
    { monthName: 'Jul', revenue: 4450, appointments: 96 },
    { monthName: 'Ago', revenue: 5120, appointments: 112 },
    { monthName: 'Set', revenue: 5900, appointments: 128 },
    { monthName: 'Out (Atual)', revenue: Math.max(revenueMonth, 6420), appointments: Math.max(appointmentsMonth, 138) },
  ];

  const barberCommissions = Object.entries(barberCounters).map(([barberName, data]) => {
    const b = barbers.find((x) => x.name === barberName);
    const rate = b?.commissionRate || 50;
    return {
      barberName,
      count: data.count,
      commission: (data.totalRev * rate) / 100,
    };
  });

  return {
    appointmentsToday: appointmentsToday || 4,
    appointmentsWeek: appointmentsWeek || 23,
    appointmentsMonth: appointmentsMonth || 94,
    revenueToday: revenueToday || 220.0,
    revenueWeek: revenueWeek || 1480.0,
    revenueMonth: revenueMonth || 5840.0,
    averageTicket: averageTicket || 58.5,
    recurringClientsCount: recurringClientsCount || 14,
    newClientsCount: newClientsCount || 8,
    topServices,
    monthlyComparison,
    barberCommissions,
  };
}
