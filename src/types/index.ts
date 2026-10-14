export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'on_site';
export type PaymentStatus = 'pending' | 'paid';

export type UserRole = 'super_admin' | 'tenant_owner' | 'secondary_barber';
export type AccountStatus = 'active' | 'pending_payment' | 'suspended';

export interface UserAccount {
  id: string;
  email: string;
  username: string; // Login rápido sem espaços
  password: string; // Senha do usuário
  fullName: string;
  phone: string;
  role: UserRole;
  tenantId?: string; // Barbearia a qual pertence
  barberId?: string; // ID do barbeiro correspondente (para barbeiro secundário ou master)
  commissionRate?: number; // Porcentagem de comissão do barbeiro (ex: 50%)
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface AuthSession {
  user: UserAccount;
  impersonatingTenantId?: string; // Super Admin navegando como barbearia específica
}

export interface PlatformSettings {
  onboardingFee: number; // Taxa única de adesão (ex: R$ 97.00)
  platformCommissionPercent: number; // Porcentagem do Zion Connect (ex: 10%)
  defaultBarberCommissionPercent: number; // Porcentagem padrão de barbeiros (ex: 50%)
  partnerCommissionPercent: number; // Porcentagem de sócios (ex: 15%)
  pixKey: string;
  pixBeneficiary: string;
}

export interface SubscriptionPlan {
  id: string;
  tenantId?: string; // Se nulo/undefined, é plano da plataforma Zion Connect; se definido, é plano da barbearia para seus clientes
  name: string;
  interval: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  price: number;
  description: string;
  benefits: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string;
  coverUrl: string;
  phone: string;
  address: string;
  city: string;
  instagram: string;
  pixKey?: string;
  ownerId?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  status: AccountStatus;
  onboardingPaid: boolean;
  platformFeePercent?: number; // % personalizada da plataforma se houver
  trialEndsAt?: string; // Data de expiração se for plano teste
  activePlanName?: string; // Nome do plano ativo (ex: Plano Teste 15 dias, Plano Mensal Pro)
  createdAt: string;
}

export interface Barber {
  id: string;
  tenantId: string;
  name: string;
  avatarUrl: string;
  role: string;
  bio: string;
  email?: string;
  username?: string;
  phone?: string;
  commissionRate?: number; // % comissão do barbeiro
  userId?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: 'Corte' | 'Barba' | 'Combo' | 'Tratamento' | 'Outros';
  isActive: boolean;
}

export interface ScheduleConfig {
  id: string;
  tenantId: string;
  barberId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string; // '08:00'
  endTime: string;   // '19:30'
  breakStart: string; // '12:00'
  breakEnd: string;   // '13:00'
  isWorking: boolean;
}

export interface TimeBlock {
  id: string;
  tenantId: string;
  barberId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '12:00'
  endTime: string;   // '13:30'
  reason: string;    // 'Almoço', 'Compromisso', 'Treinamento'
  createdAt: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  barberId: string;
  clientName: string;
  clientPhone: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '14:00'
  endTime: string;   // '14:45'
  totalDurationMinutes: number;
  totalPrice: number;
  status: AppointmentStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  appointmentsCount: number;
  totalSpent: number;
  lastVisit: string;
  isRecurring: boolean;
}

export interface TimeSlot {
  time: string; // '14:00'
  endTime: string; // '14:45'
  isAvailable: boolean;
  reason?: string;
}
