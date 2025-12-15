import React, { useState } from 'react';
import { Button } from './Button';
import { fetchAddressByCep } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (identifier: string, pass: string, remember: boolean) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  onRegister: (data: { name: string; phone: string; cpf: string; birthDate: string; cep: string; city: string; street: string; number: string; district: string; complement: string; password: string }) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  logo?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister, logo }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form Data
  const [identifier, setIdentifier] = useState(''); // Phone or Admin User
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Register Data
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regCep, setRegCep] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regComplement, setRegComplement] = useState('');
  const [regPass, setRegPass] = useState('');

  if (!isOpen) return null;

  // Formatting Helpers
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1');
  };

  const handleCepChange = (val: string) => {
      const nums = val.replace(/\D/g, '');
      let masked = nums;
      if (nums.length > 5) {
          masked = nums.slice(0, 5) + '-' + nums.slice(5, 8);
      }
      setRegCep(masked);
  };

  const handleCepBlur = async () => {
    const rawCep = regCep.replace(/\D/g, '');
    if (rawCep.length === 8) {
      setLoading(true);
      const data = await fetchAddressByCep(rawCep);
      if (data) {
        setRegCity(data.city);
        setRegStreet(data.street);
        setRegDistrict(data.district);
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'login') {
      setLoading(true);
      try {
        const result = await onLogin(identifier, password, remember);
        if (result.success) {
          onClose();
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Erro ao fazer login. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      // Validation
      if (regPass.length !== 6) {
        setError('A senha deve ter exatamente 6 dígitos.');
        return;
      }
      if (!regStreet || !regNumber) {
          setError('Preencha o endereço completo.');
          return;
      }
      
      setLoading(true);
      
      try {
        const result = await onRegister({
          name: regName,
          phone: regPhone,
          cpf: regCpf,
          birthDate: regBirthDate,
          cep: regCep,
          city: regCity,
          street: regStreet,
          number: regNumber,
          district: regDistrict,
          complement: regComplement,
          password: regPass
        });
        
        if (result.success) {
          onClose();
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Erro ao cadastrar. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setShowPassword(false);
    setIdentifier(''); setPassword('');
    setRegName(''); setRegPhone(''); setRegCpf(''); setRegBirthDate('');
    setRegCep(''); setRegCity(''); 
    setRegStreet(''); setRegNumber(''); setRegDistrict(''); setRegComplement('');
    setRegPass('');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm p-8 overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full p-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          {logo ? (
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden border border-gray-100">
               <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-600 to-red-600 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-900/50 mb-3">
              LV
            </div>
          )}
          <h2 className="text-xl font-bold text-white">Bem-vindo ao Lojista VIP</h2>
          <p className="text-sm text-gray-400 mt-1">Acesse sua conta para ver suas compras</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700 mb-6">
          <button 
            className={`flex-1 pb-2 text-sm font-bold transition-colors ${mode === 'login' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-gray-300'}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button 
            className={`flex-1 pb-2 text-sm font-bold transition-colors ${mode === 'register' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-gray-300'}`}
            onClick={() => switchMode('register')}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Celular ou Usuário Admin</label>
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm text-white placeholder-gray-500"
                  placeholder="Seu número"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 mb-1">Senha</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm text-white placeholder-gray-500"
                  placeholder="••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-7 text-gray-500 hover:text-white"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-600 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="remember" className="text-xs text-gray-400">Salvar senha</label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Celular (WhatsApp)</label>
                <input 
                  type="tel" 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 mb-1">CPF</label>
                      <input 
                        type="text" 
                        value={regCpf}
                        onChange={(e) => setRegCpf(formatCPF(e.target.value))}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                  </div>
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 mb-1">Nascimento</label>
                      <input 
                        type="text" 
                        value={regBirthDate}
                        onChange={(e) => setRegBirthDate(formatDate(e.target.value))}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                  </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 mb-1">CEP</label>
                  <input 
                    type="text" 
                    value={regCep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={handleCepBlur}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    value={regCity}
                    readOnly
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-gray-500 outline-none text-sm font-bold"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                  <div className="flex-[2]">
                      <label className="block text-xs font-bold text-gray-400 mb-1">Rua</label>
                      <input 
                        value={regStreet}
                        onChange={e => setRegStreet(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                        placeholder="Rua..."
                        required
                      />
                  </div>
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 mb-1">Nº</label>
                      <input 
                        value={regNumber}
                        onChange={e => setRegNumber(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                        placeholder="123"
                        required
                      />
                  </div>
              </div>

              <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 mb-1">Bairro</label>
                      <input 
                        value={regDistrict}
                        onChange={e => setRegDistrict(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                        placeholder="Bairro"
                        required
                      />
                  </div>
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-400 mb-1">Comp. (Opcional)</label>
                      <input 
                        value={regComplement}
                        onChange={e => setRegComplement(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                        placeholder="Apto, Bloco..."
                      />
                  </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 mb-1">Crie uma senha de 6 dígitos</label>
                <input 
                  type={showPassword ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={6}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-600 outline-none text-sm text-white placeholder-gray-500"
                  placeholder="123456"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-7 text-gray-500 hover:text-white"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

          <div className="pt-2">
            <Button type="submit" className="w-full !bg-orange-600 hover:!bg-orange-700 text-white font-bold" isLoading={loading}>
              {mode === 'login' ? 'Entrar' : 'Cadastrar e Entrar'}
            </Button>
          </div>
        </form>
      </div>
      <style>{`
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};