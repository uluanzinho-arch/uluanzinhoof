import React, { useState } from 'react';
import { Service } from '../../types';
import { Plus, Edit2, Trash2, Clock, DollarSign, Check, X, Scissors } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ServicesManagementProps {
  tenantId: string;
  services: Service[];
  onSaveService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
}

export const ServicesManagement: React.FC<ServicesManagementProps> = ({
  tenantId,
  services,
  onSaveService,
  onDeleteService,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [currentService, setCurrentService] = useState<Partial<Service>>({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 40.0,
    category: 'Corte',
    isActive: true,
  });

  const handleOpenAdd = () => {
    setCurrentService({
      id: `srv-${Date.now()}`,
      tenantId,
      name: '',
      description: '',
      durationMinutes: 30,
      price: 45.0,
      category: 'Corte',
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (svc: Service) => {
    setCurrentService({ ...svc });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService.name || !currentService.price) return;

    onSaveService(currentService as Service);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">
            Catálogo de Serviços
          </h2>
          <p className="text-xs text-neutral-400">
            Gerencie preços, duração estimada e serviços disponíveis para agendamento online
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Services List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className={`p-4 bg-neutral-900 border rounded-xl flex flex-col justify-between transition-colors ${
              svc.isActive ? 'border-neutral-800 hover:border-neutral-700' : 'border-neutral-800/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-amber-400/90 tracking-wide uppercase">
                  {svc.category}
                </span>
                <span className="text-xs text-neutral-400">
                  {svc.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-neutral-100 mb-1">
                {svc.name}
              </h3>
              <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
                {svc.description || 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-neutral-300 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{svc.durationMinutes}m</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-semibold font-mono tabular-nums">
                  <span>R$ {svc.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(svc)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setServiceToDelete(svc)}
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
              <h3 className="text-sm font-semibold text-neutral-100">
                {currentService.id?.startsWith('srv-') && services.some((s) => s.id === currentService.id)
                  ? 'Editar Serviço'
                  : 'Cadastrar Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corte Degrade Navalhado"
                  value={currentService.name || ''}
                  onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Descrição Rápida
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Lavagem com shampoo mentolado, tesoura e finalização."
                  value={currentService.description || ''}
                  onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={currentService.price ?? 40}
                    onChange={(e) => setCurrentService({ ...currentService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono tabular-nums"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Duração Estimada (min)
                  </label>
                  <select
                    value={currentService.durationMinutes ?? 30}
                    onChange={(e) => setCurrentService({ ...currentService, durationMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={40}>40 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos</option>
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1h30)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Categoria
                </label>
                <select
                  value={currentService.category ?? 'Corte'}
                  onChange={(e) => setCurrentService({ ...currentService, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Corte">Corte</option>
                  <option value="Barba">Barba</option>
                  <option value="Combo">Combo</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={currentService.isActive ?? true}
                  onChange={(e) => setCurrentService({ ...currentService, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-800 focus:ring-0"
                />
                <label htmlFor="isActive" className="text-xs text-neutral-300">
                  Disponível para agendamento online de clientes
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Service Modal */}
      <ConfirmModal
        isOpen={!!serviceToDelete}
        title="Excluir Serviço"
        description="Tem certeza que deseja apagar este serviço do catálogo da barbearia?"
        details={
          serviceToDelete
            ? [
                { label: 'Serviço', value: serviceToDelete.name },
                { label: 'Categoria', value: serviceToDelete.category || 'Geral' },
                { label: 'Preço', value: `R$ ${serviceToDelete.price.toFixed(2)}` },
                { label: 'Duração', value: `${serviceToDelete.durationMinutes} min` },
              ]
            : []
        }
        confirmText="Sim, Apagar Serviço"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (serviceToDelete) {
            onDeleteService(serviceToDelete.id);
            setServiceToDelete(null);
          }
        }}
        onClose={() => setServiceToDelete(null)}
      />
    </div>
  );
};
