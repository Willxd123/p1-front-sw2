import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Database, 
  LogOut, 
  Radio, 
  LayoutDashboard,
  Waves,
  Smartphone
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_user');
    navigate('/admin');
  };

  const menuItems = [
    { label: 'Resumen Global', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Gestión Sensores', icon: Radio, path: '/admin/sensores' },
    { label: 'Suscriptores', icon: Smartphone, path: '/admin/notificaciones' },
    { label: 'Bitácora Eventos', icon: Database, path: '/admin/logs' },
    { label: 'Configuración', icon: Settings, path: '/admin/config' },
  ];

  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-2 mb-4 border-b border-white/5">
          <Waves className="text-blue-400 w-8 h-8" />
          <span className="font-extrabold text-xl tracking-tight">Admin<span className="text-blue-400">SIAT</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-40">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
            {menuItems.find(i => i.path === location.pathname)?.label || 'Panel de Control'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900">{user.nombreCompleto || 'Admin Central'}</span>
              <span className="text-[10px] text-slate-400">{user.rol || 'Operador'} Autorizado</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
              {user.nombreCompleto?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
