import React, { useState } from 'react';
import { DATABASE_SCHEMA_SQL } from '../../lib/databaseSchemaSql';
import { Database, ShieldCheck, Cpu, Copy, Check, X, FileCode } from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'architecture' | 'algorithm'>('sql');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(DATABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Modelagem de Dados & Arquitetura Multi-Tenant
              </h2>
              <p className="text-xs text-neutral-400">
                Especificação técnica completa com PostgreSQL, RLS e Algoritmo de Slots
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

        {/* Tab selection */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-800 bg-neutral-950/30">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Schema SQL (DDL & RLS)
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Regras de Isolamento Multi-Tenant
          </button>
          <button
            onClick={() => setActiveTab('algorithm')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'algorithm'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Lógica do Algoritmo de Horários
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-neutral-300">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Script DDL executável para PostgreSQL, Supabase ou Neon com Row Level Security.
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md hover:bg-amber-500/20 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar SQL'}
                </button>
              </div>

              <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed">
                {DATABASE_SCHEMA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-5 leading-relaxed text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm">1. Isolamento por Tenant (Tenant ID)</h3>
                <p className="text-neutral-400">
                  Cada registro nas tabelas <code className="text-amber-400">services</code>, <code className="text-amber-400">barbers</code>, <code className="text-amber-400">schedules</code>, <code className="text-amber-400">time_blocks</code>, <code className="text-amber-400">appointments</code> e <code className="text-amber-400">clients</code> possui uma chave estrangeira direta obrigatória <code className="text-amber-400">tenant_id UUID</code>.
                </p>
                <p className="text-neutral-400">
                  O roteamento do cliente é resolvido via o campo <code className="text-amber-400">slug VARCHAR UNIQUE</code> na tabela <code className="text-amber-400">tenants</code> (ex: <span className="text-neutral-200">/vintage-navalha</span>).
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm">2. Políticas de RLS (Row Level Security)</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
                  <li><strong className="text-neutral-200">Acesso Público:</strong> Visitantes só possuem permissão SELECT para serviços e barbeiros ativos do tenant correspondente, e permissão INSERT restrita para criação de novos agendamentos.</li>
                  <li><strong className="text-neutral-200">Acesso do Barbeiro/Admin:</strong> Apenas o usuário proprietário autenticado (<code className="text-amber-400">auth.uid() == owner_user_id</code>) possui permissões ALL (SELECT, INSERT, UPDATE, DELETE) sobre as tabelas da sua barbearia.</li>
                  <li><strong className="text-neutral-200">Privacidade de Clientes:</strong> A lista de clientes e dados financeiros nunca é exposta no link público do cliente.</li>
                </ul>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm">3. Índices Estratégicos</h3>
                <p className="text-neutral-400">
                  Para suportar dezenas de milhares de requisições de consulta de slots simultâneas sem latência:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><code className="text-amber-400">idx_tenants_slug</code>: Busca em O(1) do tenant ao abrir o link.</li>
                  <li><code className="text-amber-400">idx_appointments_lookup (tenant_id, barber_id, appointment_date, status)</code>: Busca imediata para cálculo de conflitos de agenda.</li>
                  <li><code className="text-amber-400">idx_clients_tenant_phone (tenant_id, phone)</code>: Identificação rápida de clientes recorrentes sem necessidade de login por senha.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'algorithm' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm">Cálculo de Horários Disponíveis Sem Sobreposição</h3>
                <p className="text-neutral-400">
                  O algoritmo implementado em <code className="text-amber-400">src/lib/slotCalculator.ts</code> opera em 4 etapas estritas:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-neutral-400">
                  <li><strong className="text-neutral-200">Jornada de Trabalho:</strong> Obtém o horário de abertura e fechamento para o dia da semana específico (0 a 6).</li>
                  <li><strong className="text-neutral-200">Soma da Duração:</strong> Soma a duração em minutos de todos os serviços selecionados pelo cliente (<code className="text-amber-400">totalDuration</code>).</li>
                  <li><strong className="text-neutral-200">Janela Deslizante:</strong> Itera a jornada em incrementos regulares de 30 minutos calculando o intervalo proposto <code className="text-amber-400">[slotStart, slotStart + totalDuration]</code>.</li>
                  <li><strong className="text-neutral-200">Verificação de Colisão:</strong>
                    <div className="mt-1 p-2 bg-neutral-900 rounded font-mono text-[11px] text-amber-300">
                      hasOverlap = Math.max(slotStart, occupiedStart) &lt; Math.min(slotEnd, occupiedEnd)
                    </div>
                    Elimina slots que colidam com intervalos de almoço cadastrados, bloqueios manuais ou outros agendamentos ativos na mesma data.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
