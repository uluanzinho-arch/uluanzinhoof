import React, { useState, useRef } from 'react';
import { Barber } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Star,
  Check,
  X,
  Shield,
  Users,
  Camera,
  Upload,
  Image,
  Share2,
  Copy,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

import { getAccounts, saveAccount, createSecondaryBarber } from '../../lib/storage';

interface BarbersManagementProps {
  tenantId: string;
  tenantSlug?: string;
  barbers: Barber[];
  onSaveBarber: (barber: Barber) => void;
  onDeleteBarber: (barberId: string) => void;
}

export const BarbersManagement: React.FC<BarbersManagementProps> = ({
  tenantId,
  tenantSlug = 'uluanzinhobarbeiro',
  barbers,
  onSaveBarber,
  onDeleteBarber,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [copiedBarberId, setCopiedBarberId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [targetedBarberForPhoto, setTargetedBarberForPhoto] = useState<Barber | null>(null);

  const [currentBarber, setCurrentBarber] = useState<Partial<Barber & { password?: string }>>({
    name: '',
    role: 'Barbeiro Profissional',
    bio: '',
    email: '',
    username: '',
    phone: '',
    commissionRate: 50,
    avatarUrl: '/src/assets/images/barber_avatar_master_1791911756901.jpg',
    isDefault: false,
    isActive: true,
  });

  const filteredBarbers = barbers.filter((b) => {
    if (filter === 'active') return b.isActive;
    if (filter === 'inactive') return !b.isActive;
    return true;
  });

  const handleOpenAdd = () => {
    setCurrentBarber({
      id: `barber-${Date.now()}`,
      tenantId,
      name: '',
      role: 'Barbeiro Profissional',
      bio: '',
      email: '',
      username: '',
      phone: '',
      commissionRate: 50,
      avatarUrl: '/src/assets/images/barber_avatar_master_1791911756901.jpg',
      isDefault: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Barber) => {
    const accounts = getAccounts();
    const acc = accounts.find((a) => a.barberId === b.id || a.email === b.email);
    setCurrentBarber({
      ...b,
      email: b.email || acc?.email || '',
      username: b.username || acc?.username || '',
      phone: b.phone || acc?.phone || '',
      commissionRate: b.commissionRate || acc?.commissionRate || 50,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (b: Barber) => {
    onSaveBarber({ ...b, isActive: !b.isActive });
  };

  const handleSetDefault = (b: Barber) => {
    onSaveBarber({ ...b, isDefault: true, isActive: true });
  };

  // Upload photo handler for form modal
  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCurrentBarber((prev) => ({
          ...prev,
          avatarUrl: event.target!.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick direct photo upload on card
  const handleCardPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetedBarberForPhoto) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSaveBarber({
          ...targetedBarberForPhoto,
          avatarUrl: event.target!.result as string,
        });
        setTargetedBarberForPhoto(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerCardPhotoChange = (barber: Barber) => {
    setTargetedBarberForPhoto(barber);
    cardFileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBarber.name?.trim()) return;

    const barberToSave: Barber = {
      id: currentBarber.id || `barber-${Date.now()}`,
      tenantId,
      name: currentBarber.name.trim(),
      role: currentBarber.role?.trim() || 'Barbeiro Profissional',
      bio: currentBarber.bio?.trim() || '',
      avatarUrl: currentBarber.avatarUrl || '/src/assets/images/barber_avatar_master_1791911756901.jpg',
      email: currentBarber.email?.trim().toLowerCase(),
      username: currentBarber.username?.trim().toLowerCase().replace(/\s+/g, ''),
      phone: currentBarber.phone?.trim(),
      commissionRate: Number(currentBarber.commissionRate) || 50,
      isDefault: currentBarber.isDefault ?? false,
      isActive: currentBarber.isActive ?? true,
    };

    onSaveBarber(barberToSave);

    // Se informou credenciais para login do barbeiro secundário, cria/atualiza conta de acesso
    if (barberToSave.email && currentBarber.password) {
      saveAccount({
        id: `usr-${barberToSave.id}`,
        email: barberToSave.email,
        username: barberToSave.username || barberToSave.email.split('@')[0],
        password: currentBarber.password.trim(),
        fullName: barberToSave.name,
        phone: barberToSave.phone || '',
        role: 'secondary_barber',
        tenantId,
        barberId: barberToSave.id,
        commissionRate: barberToSave.commissionRate,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const defaultAvatars = [
    { label: 'Master Barber', url: '/src/assets/images/barber_avatar_master_1791911756901.jpg' },
    { label: 'Fade Cut', url: '/src/assets/images/barber_classic_cut_1791911756740.jpg' },
  ];

  return (
    <div className="space-y-6">
      {/* Hidden file input for card photo changes */}
      <input
        type="file"
        ref={cardFileInputRef}
        onChange={handleCardPhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Gestão de Barbeiros & Equipe
          </h2>
          <p className="text-xs text-neutral-400">
            Cadastre novos barbeiros, altere fotos de perfil a qualquer momento e gerencie quem está atendendo
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented filter */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Todos ({barbers.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'active'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Ativos ({barbers.filter((b) => b.isActive).length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'inactive'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Saíram / Inativos ({barbers.filter((b) => !b.isActive).length})
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Adicionar Barbeiro
          </button>
        </div>
      </div>

      {/* Barbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBarbers.map((barber) => (
          <div
            key={barber.id}
            className={`p-5 bg-neutral-900 border rounded-xl flex flex-col justify-between transition-colors ${
              barber.isActive
                ? 'border-neutral-800 hover:border-neutral-700'
                : 'border-neutral-800/50 bg-neutral-950/40 opacity-60'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Photo with direct update overlay */}
                  <div className="relative group shrink-0">
                    <img
                      src={barber.avatarUrl || '/src/assets/images/barber_avatar_master_1791911756901.jpg'}
                      alt={barber.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-neutral-700 bg-neutral-800"
                    />
                    <button
                      type="button"
                      onClick={() => triggerCardPhotoChange(barber)}
                      title="Alterar foto do barbeiro"
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-400 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-neutral-100">
                        {barber.name}
                      </h3>
                      {barber.isDefault && (
                        <span title="Barbeiro Padrão" className="text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-400/90 font-medium">
                      {barber.role}
                    </p>
                    <button
                      type="button"
                      onClick={() => triggerCardPhotoChange(barber)}
                      className="text-[10px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 mt-0.5 transition-colors"
                    >
                      <Camera className="w-3 h-3" /> Alterar foto
                    </button>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                    barber.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {barber.isActive ? 'Na Cadeira' : 'Inativo / Saiu'}
                </span>
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2">
                {barber.bio || 'Sem descrição biográfica.'}
              </p>

              {/* Box de Link Exclusivo de Agendamento do Barbeiro Sócio */}
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Link Exclusivo de Agendamento
                  </span>
                  <span className="text-neutral-400 font-mono text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    {barber.commissionRate || 50}% comissão
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/?tenant=${tenantSlug}&barber=${barber.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      setCopiedBarberId(barber.id);
                      setTimeout(() => setCopiedBarberId(null), 2000);
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
                  >
                    {copiedBarberId === barber.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBarberId === barber.id ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Olá! Agende seu horário diretamente comigo (${barber.name}) na barbearia pelo link exclusivo: ${window.location.origin}/?tenant=${tenantSlug}&barber=${barber.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                    title="Enviar pelo WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!barber.isDefault && barber.isActive && (
                  <button
                    onClick={() => handleSetDefault(barber)}
                    className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                    title="Definir como barbeiro padrão da loja"
                  >
                    <Star className="w-3 h-3" />
                    Padrão
                  </button>
                )}
                <button
                  onClick={() => handleToggleStatus(barber)}
                  className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    barber.isActive
                      ? 'text-neutral-400 hover:text-red-400'
                      : 'text-neutral-400 hover:text-emerald-400'
                  }`}
                >
                  {barber.isActive ? (
                    <>
                      <UserX className="w-3 h-3" /> Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3" /> Reativar
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(barber)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors"
                  title="Editar profissional"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBarberToDelete(barber)}
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Excluir profissional"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Barber Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 shrink-0">
              <h3 className="text-sm font-semibold text-neutral-100">
                {currentBarber.id?.startsWith('barber-') &&
                barbers.some((b) => b.id === currentBarber.id)
                  ? 'Editar Barbeiro'
                  : 'Cadastrar Novo Barbeiro'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Photo Upload & Preview Section */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <label className="block text-xs font-semibold text-neutral-200">
                  Foto de Perfil do Barbeiro
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={currentBarber.avatarUrl || '/src/assets/images/barber_avatar_master_1791911756901.jpg'}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 bg-neutral-800 shrink-0 shadow-md"
                  />

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleModalPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition-colors w-full justify-center"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      Escolher Foto do Aparelho
                    </button>

                    <p className="text-[11px] text-neutral-500 text-center">
                      Envie qualquer foto da sua galeria ou câmera
                    </p>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="pt-2 border-t border-neutral-900">
                  <span className="text-[11px] text-neutral-400 block mb-1.5">
                    Ou selecione um modelo pronto:
                  </span>
                  <div className="flex items-center gap-2">
                    {defaultAvatars.map((av) => (
                      <button
                        key={av.url}
                        type="button"
                        onClick={() =>
                          setCurrentBarber({ ...currentBarber, avatarUrl: av.url })
                        }
                        className={`p-1 rounded-full border-2 transition-all ${
                          currentBarber.avatarUrl === av.url
                            ? 'border-amber-400 scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or image URL */}
                <div>
                  <input
                    type="url"
                    placeholder="Ou cole o link direto da imagem..."
                    value={currentBarber.avatarUrl || ''}
                    onChange={(e) =>
                      setCurrentBarber({ ...currentBarber, avatarUrl: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Matheus Navalha"
                  value={currentBarber.name || ''}
                  onChange={(e) =>
                    setCurrentBarber({ ...currentBarber, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Cargo / Especialidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Master Barber, Especialista em Degradê"
                  value={currentBarber.role || ''}
                  onChange={(e) =>
                    setCurrentBarber({ ...currentBarber, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Biografia / Experiência
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 8 anos de experiência em cortes clássicos e visagismo."
                  value={currentBarber.bio || ''}
                  onChange={(e) =>
                    setCurrentBarber({ ...currentBarber, bio: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Comissão por Serviço (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    value={currentBarber.commissionRate || 50}
                    onChange={(e) =>
                      setCurrentBarber({ ...currentBarber, commissionRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(79) 99999-9999"
                    value={currentBarber.phone || ''}
                    onChange={(e) =>
                      setCurrentBarber({ ...currentBarber, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Acesso Individual do Barbeiro Secundário */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    Acesso Individual do Barbeiro (Login Próprio)
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Acesso isolado apenas aos seus clientes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      E-mail de Login
                    </label>
                    <input
                      type="email"
                      placeholder="barbeiro@exemplo.com"
                      value={currentBarber.email || ''}
                      onChange={(e) =>
                        setCurrentBarber({ ...currentBarber, email: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Nome de Usuário (Username)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: carlosfade"
                      value={currentBarber.username || ''}
                      onChange={(e) =>
                        setCurrentBarber({ ...currentBarber, username: e.target.value.toLowerCase().replace(/\s+/g, '') })
                      }
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Senha de Acesso (Deixe em branco se não quiser alterar)
                  </label>
                  <input
                    type="password"
                    placeholder="Definir senha para este barbeiro"
                    value={currentBarber.password || ''}
                    onChange={(e) =>
                      setCurrentBarber({ ...currentBarber, password: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="barberActive"
                    checked={currentBarber.isActive ?? true}
                    onChange={(e) =>
                      setCurrentBarber({ ...currentBarber, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-800 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="barberActive" className="text-xs text-neutral-300 cursor-pointer">
                    Profissional ativo atendendo na barbearia
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="barberDefault"
                    checked={currentBarber.isDefault ?? false}
                    onChange={(e) =>
                      setCurrentBarber({ ...currentBarber, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-800 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="barberDefault" className="text-xs text-neutral-300 cursor-pointer">
                    Definir como barbeiro padrão da loja
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
                >
                  Salvar Barbeiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Barber Modal */}
      <ConfirmModal
        isOpen={!!barberToDelete}
        title="Excluir Barbeiro"
        description="Tem certeza que deseja apagar permanentemente este profissional da barbearia? Esta ação é irreversível."
        details={
          barberToDelete
            ? [
                { label: 'Nome', value: barberToDelete.name },
                { label: 'Cargo', value: barberToDelete.role },
                { label: 'Status', value: barberToDelete.isActive ? 'Ativo' : 'Inativo' },
              ]
            : []
        }
        confirmText="Sim, Apagar Barbeiro"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (barberToDelete) {
            onDeleteBarber(barberToDelete.id);
            setBarberToDelete(null);
          }
        }}
        onClose={() => setBarberToDelete(null)}
      />
    </div>
  );
};
