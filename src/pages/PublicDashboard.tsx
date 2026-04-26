import { useState, useEffect } from 'react';
import SensorMap from '../features/map/SensorMap';
import { useTelemetry } from '../hooks/useTelemetry';
import { sensorService } from '../api/api.service';
import { AlertTriangle, Activity, Loader2 } from 'lucide-react';

const PublicDashboard = () => {
  const [sensores, setSensores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const { conectado, ultimaLectura } = useTelemetry();
  const [historialLecturas, setHistorialLecturas] = useState<Record<string, any>>({});

  useEffect(() => {
    cargarSensores();
  }, []);

  const cargarSensores = async () => {
    try {
      const resp = await sensorService.listarTodos();
      const lista = Array.isArray(resp.data) ? resp.data : [];
      setSensores(lista);

      const ultimas: Record<string, any> = {};
      await Promise.all(lista.map(async (s: any) => {
        try {
          const lResp = await sensorService.obtenerUltimaLectura(s.id);
          if (lResp.data) ultimas[s.idUnico] = lResp.data;
        } catch (e) {}
      }));
      setHistorialLecturas(ultimas);
    } catch (error) {
      console.error('Error al cargar sensores', error);
    } finally {
      setCargando(false);
    }
  };

  const alertLevel = sensores.some(s => s.estadoRiesgo === 'PELIGRO') ? 'PELIGRO' : 
                     sensores.some(s => s.estadoRiesgo === 'ALERTA') ? 'ALERTA' : 'NORMAL';

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Panel Lateral de Información */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 overflow-y-auto p-5 z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className={`w-5 h-5 ${conectado ? 'text-green-500 animate-pulse' : 'text-slate-300'}`} />
          <h2 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Estado del Sistema</h2>
        </div>

        {cargando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {sensores.map(sensor => (
              <div key={sensor.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-700 text-sm">{sensor.idUnico}</h3>
                  <span className={`w-2 h-2 rounded-full ${sensor.estadoConexion === 'conectado' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{sensor.nombreCanal}</p>
                
                <div className="flex items-end justify-between">
                  {(() => {
                    const l = (ultimaLectura?.sensorIdUnico === sensor.idUnico) ? ultimaLectura : historialLecturas[sensor.idUnico];
                    return (
                      <>
                        <div className="text-2xl font-black text-slate-900">
                          {l ? Number(l.capacidadPct).toFixed(0) : '0'}
                          <span className="text-xs font-normal text-slate-400 ml-1">%</span>
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          l?.estadoRiesgo?.toLowerCase() === 'peligro' 
                          ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {l ? l.estadoRiesgo : (sensor.estadoConexion === 'conectado' ? 'IDLE' : 'OFFLINE')}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-4">Avisos a la Comunidad</h3>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 italic text-sm text-blue-800 leading-relaxed">
            "Este mapa se actualiza en tiempo real cada vez que un sensor detecta cambios en el nivel del agua."
          </div>
        </div>
      </aside>

      {/* Contenedor del Mapa */}
      <section className="flex-1 relative bg-slate-100">
        {/* Banner de Alerta Crítica */}
        {alertLevel === 'PELIGRO' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 bg-red-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">RIESGO DE DESBORDE DETECTADO</span>
          </div>
        )}

        {/* Status de Conexión en el Mapa */}
        <div className="absolute bottom-6 left-6 z-1000 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {conectado ? 'Telemetría en Vivo' : 'Sin conexión'}
        </div>

        <SensorMap sensors={sensores} telemetry={ultimaLectura} />
      </section>
    </div>
  );
};

export default PublicDashboard;
