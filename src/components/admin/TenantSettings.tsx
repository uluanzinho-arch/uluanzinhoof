import React, { useState, useRef } from 'react';
import { Tenant } from '../../types';
import { Store, Phone, MapPin, Instagram, Key, Check, Save, Camera, Upload, Image } from 'lucide-react';

interface TenantSettingsProps {
  tenant: Tenant;
  onUpdateTenant: (updated: Tenant) => void;
}

export const TenantSettings: React.FC<TenantSettingsProps> = ({
  tenant,
  onUpdateTenant,
}) => {
  const [formData, setFormData] = useState<Tenant>({ ...tenant });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync if tenant prop changes
  React.useEffect(() => {
    setFormData({ ...tenant });
  }, [tenant]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, logoUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, coverUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-100">
          Configurações da Barbearia
        </h2>
        <p className="text-xs text-neutral-400">
          Personalize a foto do perfil, foto de capa, informações de contato e WhatsApp do seu estabelecimento
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        {/* Photos (Logo & Cover) Section */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
          <h3 className="text-xs font-semibold text-neutral-200">
            Fotos do Perfil & Capa da Barbearia
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Profile Logo */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <img
                src={formData.logoUrl || '/src/assets/images/barber_avatar_master_1791911756901.jpg'}
                alt="Logo da Barbearia"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400 bg-neutral-800 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-200 block">
                  Foto do Perfil (Logo)
                </span>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Trocar Foto do Perfil
                </button>
              </div>
            </div>

            {/* Cover photo */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverUpload}
                accept="image/*"
                className="hidden"
              />
              <img
                src={formData.coverUrl || '/src/assets/images/barber_shop_interior_1791911756156.jpg'}
                alt="Capa da Barbearia"
                referrerPolicy="no-referrer"
                className="w-24 h-16 rounded-xl object-cover border border-neutral-700 bg-neutral-800 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-200 block">
                  Banner / Capa
                </span>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Trocar Capa
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nome da Barbearia
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Slug Exclusivo do Link
            </label>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
              <span className="pl-3 text-xs text-neutral-500 select-none font-mono">
                barber.link/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="w-full px-2 py-2 bg-transparent text-xs font-mono text-amber-400 focus:outline-none font-medium"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Slogan / Bio Curta
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              WhatsApp para Confirmações e Notificações
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(79) 98868-4933"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Os clientes receberão mensagens e enviarão comprovantes para este número.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Instagram (@perfil)
            </label>
            <div className="relative">
              <Instagram className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@uluanzinhobarbeiro"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Endereço Físico
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua Principal, 79 - Centro"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Cidade / Estado
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Aracaju - SE"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Chave Pix (Opcional para adiantamentos)
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={formData.pixKey || ''}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              placeholder="79988684933"
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-in fade-in">
                <Check className="w-4 h-4" /> Alterações salvas com sucesso!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};
