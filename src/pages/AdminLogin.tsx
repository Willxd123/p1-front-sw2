import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/api.service';
import { Lock, User, Droplets, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    
    try {
      const resp = await authService.login({ email, password });
      
      if (resp.data.access_token) {
        localStorage.setItem('token', resp.data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(resp.data.user));
        navigate('/admin/dashboard');
      } else {
        setError('Error inesperado de autenticación');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas. Por favor intente de nuevo.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
              <Droplets className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">SIAT-CD ADMIN</h1>
            <p className="text-slate-500 text-sm mt-1">Gestión Centralizada de Riesgos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Correo Electrónico</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border-0 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border-0 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs font-medium text-center"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Acceder al Panel <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
            Gobierno Autónomo Municipal de Santa Cruz
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
