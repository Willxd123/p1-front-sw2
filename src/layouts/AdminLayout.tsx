import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Database, 
  LogOut, 
  Radio, 
  LayoutDashboard,
  Waves,
  Smartphone,
  Users,
  Menu,
  X
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { label: 'Gestión Usuarios', icon: Users, path: '/admin/usuarios' },
    { label: 'Bitácora Eventos', icon: Database, path: '/admin/logs' },

  ];

  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

  return (
    <div className="min-h-screen flex bg-slate-100/50 relative">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-101 w-64 bg-primario-900 text-white flex flex-col shrink-0 
        transition-transform duration-300 md:block md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between mb-4 border-b border-primario-800/50">
          <div className="flex items-center gap-2">
            <Waves className="text-blue-300 w-8 h-8" />
            <span className="font-extrabold text-xl tracking-tight">Admin<span className="text-blue-300">SIAT</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active 
                  ? 'bg-primario-600 text-white shadow-lg shadow-primario-600/30' 
                  : 'text-primario-200/60 hover:text-white hover:bg-primario-800/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primario-800/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primario-300/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">
              {menuItems.find(i => i.path === location.pathname)?.label || 'Panel de Control'}
            </h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900">{user.nombreCompleto || 'Admin Central'}</span>
              <span className="text-[10px] text-slate-400">{user.rol || 'Operador'} Autorizado</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase shrink-0">
              {user.nombreCompleto?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
