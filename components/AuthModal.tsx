import React, { useState } from 'react';
import { Button } from './Button';
import { fetchAddressByCep } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (identifier: string, pass: string, remember: boolean) => { success: boolean; message: string };
  onRegister: (data: { name: string; phone: string; cep: string; city: string; password: string }) => { success: boolean; message: string };
  logo?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister, logo }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form Data
  const [identifier, setIdentifier] = useState(''); // Phone or Admin User
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Register Data
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCep, setRegCep] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPass, setRegPass] = useState('');

  if (!isOpen) return null;

  const handleCepChange = (val: string) => {
      // Remove non-numeric
      const nums = val.replace(/\D/g, '');
      // Mask: 00000-000
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
      const city = await fetchAddressByCep(rawCep);
      if (city) {
        setRegCity(city);
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'login') {
      const result = onLogin(identifier, password, remember);
      if (result.success) {
        onClose();
      } else {
        setError(result.message);
      }
    } else {
      // Validation
      if (regPass.length !== 6) {
        setError('A senha deve ter exatamente 6 dígitos.');
        return;
      }
      
      setLoading(true);
      // Simulate network delay for UX
      await new Promise(r => setTimeout(r, 500));
      
      const result = onRegister({
        name: regName,
        phone: regPhone,
        cep: regCep,
        city: regCity,
        password: regPass
      });
      
      setLoading(false);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.message);
      }
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    // Clear forms
    setIdentifier(''); setPassword('');
    setRegName(''); setRegPhone(''); setRegCep(''); setRegCity(''); setRegPass('');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" /> 
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 overflow-hidden animate-scale-up">
        <div className="text-center mb-6">
          {logo ? (
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden border border-gray-100">
               <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-orange-600 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
              LV
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-800">Bem-vindo ao Lojista VIP</h2>
          <p className="text-sm text-gray-500 mt-1">Acesse sua conta para ver suas compras</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-6">
          <button 
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${mode === 'login' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button 
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${mode === 'register' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}
            onClick={() => switchMode('register')}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Celular ou Usuário Admin</label>
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="Seu número"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="••••••"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="remember" className="text-xs text-gray-600">Salvar senha</label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Celular (WhatsApp)</label>
                <input 
                  type="tel" 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                  <input 
                    type="text" 
                    value={regCep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={handleCepBlur}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    value={regCity}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Crie uma senha de 6 dígitos</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  maxLength={6}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="123456"
                  required
                />
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <div className="pt-2">
            <Button type="submit" className="w-full !bg-orange-600 hover:!bg-orange-700" isLoading={loading}>
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