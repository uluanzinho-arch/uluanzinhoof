import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types';
import { Plus, Edit2, Trash2, Check, Sparkles, Layers, DollarSign, Calendar } from 'lucide-react';

interface BarbershopPlansTabProps {
  tenantId: string;
  plans: SubscriptionPlan[];
  onSavePlan: (plan: SubscriptionPlan) => void;
  onDeletePlan: (planId: string) => void;
}

export const BarbershopPlansTab: React.FC<BarbershopPlansTabProps> = ({
  tenantId,
  plans,
  onSavePlan,
  onDeletePlan,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    interval: 'monthly',
    price: 99.0,
    description: '',
    benefits: ['Cortes de cabelo ilimitados no mês', 'Atendimento preferencial', 'Bebida de cortesia'],
    isActive: true,
  });
  const [newBenefitInput, setNewBenefitInput] = useState('');

  const tenantPlans = plans.filter((p) => p.tenantId === tenantId);

  const handleOpenAdd = () => {
    setEditingPlan({
      id: `plan-${tenantId}-${Date.now()}`,
      tenantId,
      name: '',
      interval: 'monthly',
      price: 99.0,
      description: '',
      benefits: ['Cortes de cabelo ilimitados no mês', 'Atendimento preferencial'],
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim()) return;
    const current = editingPlan.benefits || [];
    setEditingPlan({
      ...editingPlan,
      benefits: [...current, newBenefitInput.trim()],
    });
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    const current = editingPlan.benefits || [];
    setEditingPlan({
      ...editingPlan,
      benefits: current.filter((_, i) => i !== index),
    });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan.name || !editingPlan.price) return;

    onSavePlan({
      id: editingPlan.id || `plan-${tenantId}-${Date.now()}`,
      tenantId,
      name: editingPlan.name.trim(),
      interval: editingPlan.interval || 'monthly',
      price: Number(editingPlan.price),
      description: editingPlan.description?.trim() || '',
      benefits: editingPlan.benefits || [],
      isActive: editingPlan.isActive ?? true,
      createdAt: editingPlan.createdAt || new Date().toISOString(),
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Planos de Assinatura & Clube VIP</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Ofereça planos mensais, trimestrais e anuais com receita recorrente para seus clientes
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Criar Novo Plano</span>
        </button>
      </div>

      {/* Grid de Planos da Barbearia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tenantPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              plan.isActive
                ? 'bg-neutral-900/80 border-neutral-800'
                : 'bg-neutral-900/40 border-neutral-800/60 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-mono uppercase">
                  {plan.interval === 'monthly' && 'Mensal'}
                  {plan.interval === 'quarterly' && 'Trimestral'}
                  {plan.interval === 'semiannual' && 'Semestral'}
                  {plan.interval === 'annual' && 'Anual'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Editar Plano"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja excluir o plano "${plan.name}"?`)) {
                        onDeletePlan(plan.id);
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Excluir Plano"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-neutral-100">{plan.name}</h3>
              <div className="text-2xl font-black text-amber-400 font-mono my-2">
                R$ {plan.price.toFixed(2)}
                <span className="text-xs font-normal text-neutral-400">
                  {plan.interval === 'monthly' && '/mês'}
                  {plan.interval === 'quarterly' && '/trimestre'}
                  {plan.interval === 'semiannual' && '/semestre'}
                  {plan.interval === 'annual' && '/ano'}
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                {plan.description || 'Sem descrição cadastrada.'}
              </p>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-neutral-400">Benefícios incluídos:</span>
                <ul className="space-y-1 text-xs text-neutral-300">
                  {plan.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="text-neutral-500">
                {plan.isActive ? '🟢 Visível para clientes' : '⚪ Inativo'}
              </span>
              <button
                onClick={() => onSavePlan({ ...plan, isActive: !plan.isActive })}
                className="text-amber-400 hover:underline text-[11px]"
              >
                {plan.isActive ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição de Plano */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-100">
              {editingPlan.id ? 'Configurar Plano de Assinatura' : 'Novo Plano'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nome do Plano <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingPlan.name || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="ex: Clube VIP Mensal (Cortes Ilimitados)"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Periodicidade <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={editingPlan.interval || 'monthly'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, interval: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Preço (R$) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Descrição Curta
                </label>
                <textarea
                  rows={2}
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Explique o diferencial deste plano para seus clientes..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Benefícios */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-300">
                  Benefícios Incluídos
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    placeholder="Adicionar benefício (ex: 1 Barba cortesia)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                  {(editingPlan.benefits || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-neutral-950 text-xs text-neutral-300 border border-neutral-800"
                    >
                      <span>✓ {b}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-neutral-500 hover:text-rose-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold rounded-xl"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
