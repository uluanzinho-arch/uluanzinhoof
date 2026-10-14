/**
 * ARQUITETURA DE BANCO DE DADOS POSTGRESQL / SUPABASE
 * Sistema SaaS Multi-tenant para Barbearias e Salões de Beleza
 *
 * Características:
 * - Isolamento por `tenant_id` (UUID) em todas as entidades
 * - Slug único indexado para roteamento de links públicos personalizados
 * - Row Level Security (RLS) habilitado com políticas para Admin e Acesso Público
 * - Índices otimizados para consultas de disponibilidade de agenda em alta velocidade
 */

export const DATABASE_SCHEMA_SQL = `-- ============================================================================
-- 1. HABILITAR EXTENSÕES E CONFIGURAÇÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABELA: TENANTS (Barbearias / Assinantes do SaaS)
-- ============================================================================
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,               -- Ex: "vintage-navalha" -> app.barber.com/vintage-navalha
    name VARCHAR(120) NOT NULL,                     -- Nome fantasia da barbearia
    tagline VARCHAR(200),                           -- Frase ou slogan
    owner_user_id UUID,                             -- ID do usuário Auth (Supabase/Firebase auth)
    phone VARCHAR(20) NOT NULL,                     -- WhatsApp de contato comercial
    address TEXT,                                   -- Endereço físico
    city VARCHAR(100),                              -- Cidade / UF
    instagram VARCHAR(80),                          -- @instagram
    pix_key VARCHAR(120),                           -- Chave Pix opcional para adiantamentos
    theme_color VARCHAR(10) DEFAULT '#D97706',      -- Cor primária customizável da barbearia
    logo_url TEXT,
    cover_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- ============================================================================
-- 3. TABELA: BARBERS (Profissionais da Barbearia)
-- ============================================================================
CREATE TABLE public.barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(60) DEFAULT 'Barbeiro',             -- 'Master Barber', 'Colorista', etc.
    bio TEXT,
    is_default BOOLEAN DEFAULT FALSE,               -- Barbeiro pré-selecionado se loja individual
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_barbers_tenant ON public.barbers(tenant_id);

-- ============================================================================
-- 4. TABELA: SERVICES (Serviços Oferecidos)
-- ============================================================================
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,                     -- Ex: "Corte Clássico", "Barba Terapia"
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,  -- Duração estimada em minutos
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,     -- Preço em Reais (R$)
    category VARCHAR(50) DEFAULT 'Corte',           -- 'Corte', 'Barba', 'Combo', 'Tratamento'
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_tenant ON public.services(tenant_id);

-- ============================================================================
-- 5. TABELA: SCHEDULES (Grade de Horários de Funcionamento)
-- ============================================================================
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Seg ... 6=Sáb
    start_time TIME NOT NULL DEFAULT '09:00:00',     -- Horário de início do expediente
    end_time TIME NOT NULL DEFAULT '19:00:00',       -- Horário de término do expediente
    break_start TIME DEFAULT '12:00:00',            -- Início do almoço/pausa
    break_end TIME DEFAULT '13:00:00',              -- Fim do almoço/pausa
    is_working BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_barber_day UNIQUE (tenant_id, barber_id, day_of_week)
);

CREATE INDEX idx_schedules_tenant_barber ON public.schedules(tenant_id, barber_id);

-- ============================================================================
-- 6. TABELA: CLIENTS (Base de Clientes Cadastrados)
-- ============================================================================
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,                     -- WhatsApp higienizado (Ex: "5511999999999")
    appointments_count INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    last_visit TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_client_phone UNIQUE (tenant_id, phone)
);

CREATE INDEX idx_clients_tenant_phone ON public.clients(tenant_id, phone);

-- ============================================================================
-- 7. TABELA: TIME_BLOCKS (Bloqueios Manuais / Almoço / Imprevistos)
-- ============================================================================
CREATE TABLE public.time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(150) NOT NULL,                   -- Ex: "Almoço estendido", "Consulta médica"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_blocks_date ON public.time_blocks(tenant_id, barber_id, block_date);

-- ============================================================================
-- 8. TABELA: APPOINTMENTS (Agendamentos)
-- ============================================================================
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name VARCHAR(120) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,                 -- Data no formato YYYY-MM-DD
    start_time TIME NOT NULL,                       -- Horário de início
    end_time TIME NOT NULL,                         -- Horário de término (calculado)
    total_duration_minutes INTEGER NOT NULL,        -- Duração somada dos serviços
    total_price NUMERIC(10, 2) NOT NULL,            -- Valor total somado
    status appointment_status DEFAULT 'pending',
    services_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array com [{id, name, price, duration}]
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices vitais para verificação rápida de colisão de horários
CREATE INDEX idx_appointments_lookup 
    ON public.appointments(tenant_id, barber_id, appointment_date, status);

CREATE INDEX idx_appointments_date_time 
    ON public.appointments(appointment_date, start_time, end_time);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT E SEGURANÇA
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Regra 1: Qualquer visitante pode consultar dados públicos do tenant pelo slug
CREATE POLICY "Public read tenant by slug"
    ON public.tenants FOR SELECT
    USING (is_active = TRUE);

-- Regra 2: Qualquer visitante pode listar serviços e profissionais ativos do tenant
CREATE POLICY "Public read active services"
    ON public.services FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read active barbers"
    ON public.barbers FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read schedules"
    ON public.schedules FOR SELECT
    USING (TRUE);

CREATE POLICY "Public read active appointments for slot calculation"
    ON public.appointments FOR SELECT
    USING (status != 'cancelled');

-- Regra 3: Cliente público pode inserir novo agendamento
CREATE POLICY "Public can insert appointment"
    ON public.appointments FOR INSERT
    WITH CHECK (TRUE);

-- Regra 4: O dono autenticado do Tenant tem controle total sobre seus dados
CREATE POLICY "Tenant admin full access on tenants"
    ON public.tenants FOR ALL
    USING (owner_user_id = auth.uid());

CREATE POLICY "Tenant admin full access on barbers"
    ON public.barbers FOR ALL
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant admin full access on services"
    ON public.services FOR ALL
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant admin full access on appointments"
    ON public.appointments FOR ALL
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant admin full access on clients"
    ON public.clients FOR ALL
    USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()));
`;
