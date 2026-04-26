import { useState, useEffect } from 'react';
import { sensorService } from '../../api/api.service';
import { 
  Plus, 
  Trash2, 
  X,
  Loader2,
  Radio,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSensores = () => {
  const [sensores, setSensores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoSensor, setNuevoSensor] = useState({
    id_unico: '',
    nombre_canal: '',
    ubicacion_lat: -17.81,
    ubicacion_lon: -63.19,
    umbral_normal_pct: 60,
    umbral_alerta_pct: 80
  });

  useEffect(() => {
    cargarSensores();
  }, []);

  const cargarSensores = async () => {
    try {
      const resp = await sensorService.listarTodos();
      // El backend devuelve el array directamente
      setSensores(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await sensorService.crear(nuevoSensor);
      alert('Sensor registrado. Token: ' + resp.data.data.token_autenticacion);
      setModalAbierto(false);
      cargarSensores();
    } catch (e) {
      alert('Error al crear sensor');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este sensor?')) return;
    try {
      await sensorService.eliminar(id);
      cargarSensores();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Sensores</h2>
          <p className="text-slate-500 text-sm">Administre los dispositivos IoT desplegados en la ciudad.</p>
        </div>
        <button 
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nuevo Sensor
        </button>
      </div>

      {cargando ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sensores.map(sensor => (
            <motion.div 
              layout
              key={sensor.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                  <Settings2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEliminar(sensor.id)}
                  className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                    <Radio className={`w-6 h-6 ${sensor.estadoConexion === 'conectado' ? 'text-blue-400' : 'text-slate-600'}`} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    sensor.estadoConexion === 'conectado' 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                      : 'bg-slate-800 text-slate-500 border-slate-500/20'
                  }`}>
                    {sensor.estadoConexion}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-blue-400 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                    {sensor.nombreCanal}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-tight">
                    <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                    {sensor.idUnico}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Normal</p>
                    <p className="text-white font-black">{sensor.umbralNormalPct}%</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Alerta</p>
                    <p className="text-white font-black">{sensor.umbralAlertaPct}%</p>
                  </div>
                </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Creación */}
      <AnimatePresence>
        {modalAbierto && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCrear}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setModalAbierto(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-xl font-black text-slate-800 mb-1">Registrar Sensor</h2>
              <p className="text-xs text-slate-500 mb-8 uppercase font-bold tracking-widest">Caso de Uso CU10</p>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ID Único (ESP32)</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={nuevoSensor.id_unico}
                      onChange={e => setNuevoSensor({...nuevoSensor, id_unico: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Canal</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={nuevoSensor.nombre_canal}
                      onChange={e => setNuevoSensor({...nuevoSensor, nombre_canal: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Umbral Normal (%)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1"
                      value={nuevoSensor.umbral_normal_pct}
                      onChange={e => setNuevoSensor({...nuevoSensor, umbral_normal_pct: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Umbral Alerta (%)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1"
                      value={nuevoSensor.umbral_alerta_pct}
                      onChange={e => setNuevoSensor({...nuevoSensor, umbral_alerta_pct: +e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] mt-4"
                >
                  GENERAR TOKEN Y REGISTRAR
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSensores;
