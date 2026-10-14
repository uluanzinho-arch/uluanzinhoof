import React, { useState } from 'react';
import {
  Scissors,
  Lock,
  Mail,
  User,
  Phone,
  Store,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  login,
  resetPassword,
  registerNewTenant,
  getPlatformSettings,
  getPlatformPlans,
} from '../../lib/storage';
import { AuthSession } from '../../types';

interface AuthModalOrScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  onOpenPublicClientDemo: () => void;
}

export const AuthModalOrScreen: React.FC<AuthModalOrScreenProps> = ({
  onLoginSuccess,
  onOpenPublicClientDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados de Cadastro
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regShopAddress, setRegShopAddress] = useState('');
  const [regShopCity, setRegShopCity] = useState('');
  const [regShopPhone, setRegShopPhone] = useState('');
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<boolean>(false);

  // Estados de Redefinição de Senha
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const platformSettings = getPlatformSettings();
  const platformPlans = getPlatformPlans();

  // Handler de Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Por favor, informe seu e-mail/usuário e a sua senha.');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      const result = login(loginIdentifier, loginPassword);
      setLoginLoading(false);
      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setLoginError(result.message || 'Credenciais inválidas. Verifique os dados.');
      }
    }, 200);
  };

  // Handler de Cadastro
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regStep === 1) {
      if (!regFullName.trim() || !regEmail.trim() || !regUsername.trim() || !regPhone.trim() || !regPassword.trim()) {
        setRegError('Preencha todos os campos obrigatórios do responsável.');
        return;
      }
      if (regPassword.length < 6) {
        setRegError('A senha de acesso deve ter pelo menos 6 caracteres.');
        return;
      }
      setRegStep(2);
      return;
    }

    // Step 2
    if (!regShopName.trim() || !regShopAddress.trim() || !regShopCity.trim()) {
      setRegError('Por favor, informe o nome, endereço completo e cidade da barbearia.');
      return;
    }

    try {
      const { account } = registerNewTenant({
        fullName: regFullName,
        email: regEmail,
        username: regUsername,
        phone: regPhone,
        password: regPassword,
        shopName: regShopName,
        shopAddress: regShopAddress,
        shopCity: regShopCity,
        shopPhone: regShopPhone || regPhone,
      });

      // Salva no estado para exibir confirmação e preparar login
      setLoginIdentifier(regUsername);
      setLoginPassword(regPassword);
      setRegSuccess(true);
      // NÃO entra automaticamente! Permanece na tela com a opção clara de voltar e fazer login
    } catch (err) {
      setRegError('Ocorreu um erro ao registrar a conta. Verifique os dados.');
    }
  };

  // Handler de Redefinição de Senha
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);

    if (!forgotIdentifier.trim() || !forgotPhone.trim() || !forgotNewPassword.trim()) {
      setForgotMessage({ type: 'error', text: 'Preencha todos os campos para redefinir sua senha.' });
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    const res = resetPassword(forgotIdentifier, forgotNewPassword);
    if (res.success) {
      setForgotMessage({ type: 'success', text: res.message });
      setLoginIdentifier(forgotIdentifier);
      setLoginPassword(forgotNewPassword);
      setTimeout(() => {
        setActiveTab('login');
      }, 2000);
    } else {
      setForgotMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Brand Bar */}
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md px-4 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-neutral-100 uppercase">
                Zion <span className="text-amber-400">Connect</span>
              </span>
              <p className="text-[10px] text-neutral-400 -mt-1 font-medium">
                Gestão & Agendamento Inteligente para Barbearias
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPublicClientDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ver Demonstração do</span> Cliente
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* Navigation Tabs (Login / Cadastro / Recuperação) */}
        <div className="bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 flex gap-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Cadastrar Barbearia
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot');
              setForgotMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'forgot'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Esqueci Senha
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-100">
                Acesse o <span className="text-amber-400">Zion Connect</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Entre com seu e-mail ou nome de usuário e senha
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  E-mail ou Nome de Usuário <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="ex: uluanzinho@gmail.com ou luanmaster"
                    autoComplete="username"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Senha de Acesso <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    autoComplete="current-password"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
              >
                {loginLoading ? (
                  <span>Verificando credenciais...</span>
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: CADASTRO DE NOVA BARBEARIA */}
        {activeTab === 'register' && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
            {/* Botão de retorno rápido para Login no topo */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setRegError(null);
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer"
              >
                <span>← Voltar para Fazer Login</span>
              </button>
              <span className="text-xs text-neutral-500">
                Já tem acesso? <strong onClick={() => setActiveTab('login')} className="text-amber-400 hover:underline cursor-pointer">Entrar</strong>
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-100">
                  Criar Conta no <span className="text-amber-400">Zion Connect</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  Etapa {regStep} de 2
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {regStep === 1
                  ? 'Informe seus dados pessoais de acesso'
                  : 'Informe os dados da barbearia para endereço e agenda'}
              </p>
            </div>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-6 rounded-2xl bg-neutral-950 border border-amber-500/30 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-100">
                    Cadastro Enviado com Sucesso!
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    A barbearia <strong className="text-neutral-200">{regShopName}</strong> foi cadastrada. O seu perfil aguarda liberação pelo <strong className="text-amber-400">Desenvolvedor Geral</strong> para acesso total.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-left text-xs space-y-1 font-mono text-neutral-300">
                  <div><span className="text-neutral-500">Usuário:</span> {regUsername}</div>
                  <div><span className="text-neutral-500">E-mail:</span> {regEmail}</div>
                  <div><span className="text-neutral-500">Barbearia:</span> {regShopName}</div>
                  <div><span className="text-neutral-500">Endereço:</span> {regShopAddress}, {regShopCity}</div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegSuccess(false);
                      setRegStep(1);
                      setActiveTab('login');
                    }}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    <span>Voltar e Fazer Login</span>
                  </button>

                  <a
                    href={`https://wa.me/5579988684933?text=${encodeURIComponent(
                      `Olá! Realizei o cadastro da barbearia *${regShopName}* (Usuário: ${regUsername}) no Zion Connect e aguardo a aprovação de acesso!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Avisar Administrador via WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {!regSuccess && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {regStep === 1 ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Nome Completo do Responsável <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="ex: Luan da Silva"
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          E-mail de Acesso <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="seuemail@exemplo.com"
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Nome de Usuário (Login Rápido) <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          placeholder="ex: luanzinho"
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Telefone / WhatsApp <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="(79) 98868-4933"
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Senha de Acesso <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mínimo 6 dígitos"
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
                    >
                      <span>Avançar para Dados da Barbearia</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      >
                        Já possui uma conta? <strong className="text-amber-400 underline">Fazer Login</strong>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Nome da Barbearia / Estabelecimento <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={regShopName}
                        onChange={(e) => setRegShopName(e.target.value)}
                        placeholder="ex: Barbearia Stylus Prime"
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Endereço Completo (Rua, Número, Bairro) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={regShopAddress}
                        onChange={(e) => setRegShopAddress(e.target.value)}
                        placeholder="ex: Rua das Flores, 79 - Centro"
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Cidade / UF <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={regShopCity}
                          onChange={(e) => setRegShopCity(e.target.value)}
                          placeholder="ex: Aracaju - SE"
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          WhatsApp Comercial da Loja
                        </label>
                        <input
                          type="tel"
                          value={regShopPhone}
                          onChange={(e) => setRegShopPhone(e.target.value)}
                          placeholder="(79) 98868-4933"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    {/* Destaque sobre Taxa Única e Serviços já configurados */}
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/20 text-xs space-y-2">
                      <div className="flex items-center justify-between text-amber-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>Pronto para uso imediato</span>
                        </span>
                        <span>Taxa de adesão: R$ {platformSettings.onboardingFee.toFixed(2)}</span>
                      </div>
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        Ao finalizar, sua barbearia já estará com endereço registrado, opções de cortes (Degradê, Barba, Combo) e horários de agendamento 100% disponíveis.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors"
                      >
                        ← Voltar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Concluir Cadastro</span>
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      >
                        Já possui uma conta? <strong className="text-amber-400 underline">Fazer Login</strong>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        )}

        {/* TAB 3: ESQUECI MINHA SENHA */}
        {activeTab === 'forgot' && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-100">
                Redefinir <span className="text-amber-400">Senha</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Recupere o acesso à sua conta de forma rápida e segura
              </p>
            </div>

            {forgotMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  forgotMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {forgotMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{forgotMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  E-mail ou Nome de Usuário <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Seu e-mail ou username"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Telefone / WhatsApp de Confirmação <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="(79) 98868-4933"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nova Senha de Acesso <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 6 dígitos)"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
              >
                <span>Salvar Nova Senha e Entrar</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 text-center text-xs text-neutral-500">
        <p>
          <strong className="text-neutral-400">Zion Connect</strong> · Plataforma Segura com Autenticação & Gestão Multi-Tenant
        </p>
      </footer>
    </div>
  );
};
