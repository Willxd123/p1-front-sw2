import { useState, useEffect } from 'react';
import { sensorService } from '../../api/api.service';
import { useTelemetry } from '../../hooks/useTelemetry';
import { 
  Zap, 
  Droplet, 
  Activity, 
  AlertCircle, 
  Power,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [sensores, setSensores] = useState<any[]>([]);
  const [bombaActiva, setBombaActiva] = useState(false);
  const { conectado, ultimaLectura } = useTelemetry();
  const [historialReciente, setHistorialReciente] = useState<Record<string, any>>({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resp = await sensorService.listarTodos();
      const listaSensores = Array.isArray(resp.data) ? resp.data : [];
      setSensores(listaSensores);
      
      // Precargar última lectura para cada sensor para evitar monitor vacío
      const ultimasLecturas: Record<string, any> = {};
      await Promise.all(listaSensores.map(async (s: any) => {
        try {
          const lResp = await sensorService.obtenerUltimaLectura(s.id);
          if (lResp.data) {
            ultimasLecturas[s.idUnico] = lResp.data;
          }
        } catch (err) {
          // No hay lecturas previas, ignorar
        }
      }));
      setHistorialReciente(ultimasLecturas);
    } catch (e) {
      console.error(e);
    }
  };
   
  // Combinar telemetría en tiempo real con historial (prioridad tiempo real)
  const lecturaMonitor = ultimaLectura || Object.values(historialReciente)[0];

  const handleControlBomba = async (accion: 'on' | 'off') => {
    try {
      await sensorService.controlBomba(accion);
      setBombaActiva(accion === 'on');
    } catch (e) {
      alert('Error al controlar la bomba');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Sensores Activos" 
          value={sensores.length.toString()} 
          icon={Activity} 
          color="blue" 
        />
        <StatsCard 
          label="Alertas Rojas" 
          value={sensores.filter(s => historialReciente[s.idUnico]?.estadoRiesgo?.toLowerCase() === 'peligro').length.toString()} 
          icon={AlertCircle} 
          color="red" 
        />
        <StatsCard 
          label="Estado Telemetría" 
          value={conectado ? 'En Línea' : 'Desconectado'} 
          icon={Zap} 
          color={conectado ? 'green' : 'slate'} 
        />
        <StatsCard 
          label="Bomba Maqueta" 
          value={bombaActiva ? 'Encendida' : 'Apagada'} 
          icon={Power} 
          color={bombaActiva ? 'orange' : 'slate'} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Actuadores */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Droplet className="text-blue-500 w-5 h-5" /> Control de Maqueta
          </h3>
          
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
              bombaActiva ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
            }`}>
              <Power className={`w-12 h-12 mb-4 transition-all ${
                bombaActiva ? 'text-blue-600 scale-110 drop-shadow-md' : 'text-slate-300'
              }`} />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Bomba de Agua</p>
              <p className={`font-black text-lg ${bombaActiva ? 'text-blue-700' : 'text-slate-400'}`}>
                {bombaActiva ? 'EJECUTANDO' : 'DETENIDA'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleControlBomba('on')}
                disabled={bombaActiva}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl disabled:opacity-30 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                ENCENDER
              </button>
              <button 
                onClick={() => handleControlBomba('off')}
                disabled={!bombaActiva}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl disabled:opacity-30 transition-all active:scale-95"
              >
                APAGAR
              </button>
            </div>
          </div>
        </div>

        {/* Telemetría Reciente */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Activity className="text-green-500 w-5 h-5" /> Monitor de Telemetría
            </h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <RefreshCw className={`w-3 h-3 ${conectado ? 'animate-spin' : ''}`} />
              Sincronizado
            </div>
          </div>

          <div className="space-y-3">
            {sensores.length > 0 ? (
              sensores.map((sensor) => {
                // Prioridad: Lectura en vivo si coincide el ID, sino lectura precargada
                const esMismoSensor = ultimaLectura?.sensorIdUnico === sensor.idUnico;
                const data = esMismoSensor ? ultimaLectura : historialReciente[sensor.idUnico];

                return (
                  <motion.div 
                    key={sensor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      esMismoSensor ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                    } flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-sm border ${
                        esMismoSensor ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-slate-400 border-slate-100'
                      }`}>
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-800">{sensor.nombreCanal}</p>
                          {esMismoSensor && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                          {sensor.idUnico}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {data ? (
                        <>
                          <p className={`text-sm font-black ${
                            data.estadoRiesgo?.toLowerCase() === 'peligro' ? 'text-red-600' : 
                            data.estadoRiesgo?.toLowerCase() === 'alerta' ? 'text-amber-600' : 
                            'text-blue-600'
                          }`}>
                            {Number(data.capacidadPct).toFixed(1)}%
                          </p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            data.estadoRiesgo?.toLowerCase() === 'peligro' ? 'bg-red-500 text-white' :
                            data.estadoRiesgo?.toLowerCase() === 'alerta' ? 'bg-amber-500 text-white' :
                            'bg-green-500 text-white'
                          }`}>
                            {data.estadoRiesgo}
                          </span>
                        </>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-300 italic">Sin datos</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Cargando sensores...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div className={`p-6 rounded-3xl border bg-white shadow-sm flex items-center gap-4`}>
       <div className={`p-4 rounded-2xl ${colors[color]} border shadow-inner`}>
         <Icon className="w-6 h-6" />
       </div>
       <div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
         <p className="text-2xl font-black text-slate-900">{value}</p>
       </div>
    </div>
  );
};

const Radio = ({ className }: any) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
  </svg>
);

export default AdminDashboard;
