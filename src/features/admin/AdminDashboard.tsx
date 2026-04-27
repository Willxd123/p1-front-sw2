import { useState, useEffect } from 'react';
import { sensorService } from '../../api/api.service';
import { useTelemetry } from '../../hooks/useTelemetry';
import SensorMap from '../map/SensorMap';
import { 
  Zap, 
  Droplet, 
  Activity, 
  AlertCircle, 
  Power,
  RefreshCw,
  Map as MapIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [sensores, setSensores] = useState<any[]>([]);
  const [bombaActiva, setBombaActiva] = useState(false);
  const { conectado, ultimaLectura } = useTelemetry();
  const [historialReciente, setHistorialReciente] = useState<Record<string, any>>({});
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

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

  const handleSensorSelect = (sensor: any) => {
    setSelectedSensorId(String(sensor.id));
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          label="Sensores Activos" 
          value={sensores.length.toString()} 
          icon={Activity} 
          color="blue" 
        />
        <StatsCard 
          label="Alertas Rojas" 
          value={sensores.filter(s => {
            const r = String(historialReciente[s.idUnico]?.estadoRiesgo ?? '').toUpperCase();
            return r === 'PELIGRO';
          }).length.toString()} 
          icon={AlertCircle} 
          color="red" 
        />
        <StatsCard 
          label="Estado Telemetría" 
          value={conectado ? 'En Línea' : 'Desconectado'} 
          icon={Zap} 
          color={conectado ? 'green' : 'slate'} 
        />
      </div>

      {/* Monitor Integrado con Mapa */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Activity className="text-blue-500 w-6 h-6" /> Centro de Monitoreo en Vivo
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <RefreshCw className={`w-3.5 h-3.5 ${conectado ? 'animate-spin' : ''}`} />
              Actualización Automática
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Mapa de Riesgo */}
          <div className="lg:col-span-8 h-[500px] rounded-3xl overflow-hidden border border-slate-100 shadow-inner relative">
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
              <MapIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Mapa de Riesgo Calorimétrico</span>
            </div>
            <SensorMap 
              sensors={sensores}
              telemetry={ultimaLectura}
              initialStatus={historialReciente}
              selectedSensorId={selectedSensorId}
              onSensorSelect={handleSensorSelect}
            />
          </div>

          {/* Listado de Telemetría */}
          <div className="lg:col-span-4 h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {sensores.length > 0 ? (
              sensores.map((sensor) => {
                const esMismoSensor = ultimaLectura?.sensorIdUnico === sensor.idUnico;
                const isSelected = String(sensor.id) === String(selectedSensorId);
                const data = esMismoSensor ? ultimaLectura : historialReciente[sensor.idUnico];

                return (
                  <motion.div 
                    key={sensor.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleSensorSelect(sensor)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected 
                      ? 'bg-primario-900 border-primario-800 shadow-xl shadow-primario-900/20 translate-x-1' 
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    } flex items-center justify-between group`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-sm border transition-colors ${
                        isSelected ? 'bg-white/10 text-white border-white/10' : 
                        esMismoSensor ? 'bg-blue-600 text-white border-blue-400' : 
                        'bg-white text-slate-400 border-slate-100'
                      }`}>
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {sensor.nombreCanal}
                          </p>
                          {(esMismoSensor || isSelected) && (
                            <span className={`flex h-2 w-2 rounded-full animate-pulse ${isSelected ? 'bg-blue-300' : 'bg-blue-500'}`} />
                          )}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${isSelected ? 'text-primario-300' : 'text-slate-500'}`}>
                          {sensor.idUnico}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {data ? (
                        <>
                          <p className={`text-sm font-black transition-colors ${
                            isSelected ? 'text-white' :
                            String(data.estadoRiesgo ?? '').toUpperCase() === 'PELIGRO' ? 'text-red-600' : 
                            String(data.estadoRiesgo ?? '').toUpperCase() === 'ALERTA'  ? 'text-amber-500' : 
                            'text-green-600'
                          }`}>
                            {Number(data.capacidadPct).toFixed(1)}%
                          </p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm ${
                            String(data.estadoRiesgo ?? '').toUpperCase() === 'PELIGRO' ? 'bg-red-500 text-white' :
                            String(data.estadoRiesgo ?? '').toUpperCase() === 'ALERTA'  ? 'bg-amber-500 text-white' :
                            isSelected ? 'bg-white/20 text-white' : 'bg-green-500 text-white'
                          }`}>
                            {String(data.estadoRiesgo ?? '').toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <p className={`text-[10px] font-bold italic ${isSelected ? 'text-primario-400' : 'text-slate-300'}`}>Sin datos</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Cargando Telemetría...</p>
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
