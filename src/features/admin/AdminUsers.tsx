import { useState, useEffect } from 'react';
import { adminUserService } from '../../api/api.service';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  XCircle,
  Search,
  Key,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminUsers = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);

  // Formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    rol: 'admin',
    estado: 'activo'
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const resp = await adminUserService.listarTodos();
      setUsuarios(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setUsuarioEditando(user);
      setFormData({
        email: user.email,
        password: '', // Password solo para crear o si se quiere cambiar
        nombreCompleto: user.nombreCompleto,
        rol: user.rol,
        estado: user.estado || 'activo'
      });
    } else {
      setUsuarioEditando(null);
      setFormData({
        email: '',
        password: '',
        nombreCompleto: '',
        rol: 'admin',
        estado: 'activo'
      });
    }
    setMostrarModal(true);
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    setUsuarioEditando(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (usuarioEditando) {
        // En update, password es opcional
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminUserService.actualizar(usuarioEditando.id, updateData);
      } else {
        await adminUserService.crear(formData);
      }
      cargarUsuarios();
      handleCloseModal();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEliminar = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este administrador? Esta acción no se puede deshacer.')) {
      try {
        await adminUserService.eliminar(id);
        cargarUsuarios();
      } catch (e) {
        alert('Error al eliminar usuario');
      }
    }
  };

  const filteredUsers = usuarios.filter(u => 
    u.email.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Administradores</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Control de acceso y roles del personal técnico</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> AGREGAR ADMINISTRADOR
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Buscador */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario / Email</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creado el</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cargando ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold animate-pulse">Cargando administradores...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">No se encontraron usuarios administradores.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-500 uppercase">
                        {user.nombreCompleto.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{user.nombreCompleto}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-300" />
                          <span className="text-xs text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-tight ${
                      user.rol === 'super_admin' 
                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {user.estado === 'activo' ? (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase tracking-tight">Activo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase tracking-tight">Inactivo</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-xs font-medium">
                        {format(new Date(user.fechaCreacion), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEliminar(user.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">
                {usuarioEditando ? 'Editar Administrador' : 'Nuevo Administrador'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  required
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Contraseña {usuarioEditando && '(Opcional)'}
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required={!usuarioEditando}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={usuarioEditando ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                  <select 
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none"
                  >
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                  <select 
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                >
                  {usuarioEditando ? 'ACTUALIZAR' : 'CREAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
