import { Outlet, Link } from 'react-router-dom';
import { Droplets, Info } from 'lucide-react';

const PublicLayout = () => {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className="bg-slate-900 text-white h-16 flex items-center px-6 shadow-lg z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-400">
          <Droplets className="w-6 h-6" />
          <span>SIAT-CD</span>
        </div>
        <nav className="ml-auto flex gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-blue-400 transition-colors">Mapa en Vivo</Link>
          <Link to="/admin" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <Info className="w-4 h-4" /> Administrador
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
