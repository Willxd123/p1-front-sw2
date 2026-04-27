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
  
  const [sensorSeleccionadoId, setSensorSeleccionadoId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  const sensorSeleccionado = sensores.find(s => s.id === sensorSeleccionadoId);

  const copiarCoordenadas = () => {
    if (!sensorSeleccionado) return;
    const coords = `${Number(sensorSeleccionado.ubicacionLat)}, ${Number(sensorSeleccionado.ubicacionLon)}`;
    navigator.clipboard.writeText(coords);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Panel Lateral de Información */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm overflow-hidden">
        <div className="p-5 flex-1 overflow-y-auto">
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
                <div 
                  key={sensor.id} 
                  onClick={() => setSensorSeleccionadoId(sensor.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    sensorSeleccionadoId === sensor.id 
                    ? 'border-primario-500 bg-primario-50 shadow-md scale-[1.02]' 
                    : 'border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md'
                  }`}
                >
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
                            l?.estadoRiesgo === 'PELIGRO' 
                            ? 'bg-red-100 text-red-600' 
                            : l?.estadoRiesgo === 'ALERTA'
                            ? 'bg-amber-100 text-amber-600'
                            : l?.estadoRiesgo === 'NORMAL'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-slate-100 text-slate-400'
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
        </div>
      </aside>

      {/* Contenedor del Mapa */}
      <section className="flex-1 relative bg-slate-100">
        {/* Banner de Alerta Crítica */}
        {alertLevel === 'PELIGRO' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">RIESGO DE DESBORDE DETECTADO</span>
          </div>
        )}

        <SensorMap 
          sensors={sensores} 
          telemetry={ultimaLectura} 
          selectedSensorId={sensorSeleccionadoId}
          onSensorSelect={(s: any) => setSensorSeleccionadoId(s.id)}
          initialStatus={historialLecturas}
        />

        {/* Status de Conexión en el Mapa */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {conectado ? 'Telemetría en Vivo' : 'Sin conexión'}
        </div>

        {/* Tarjeta de Detalles del Sensor */}
        {sensorSeleccionado && (
          <div className="absolute bottom-6 right-6 z-[1000] max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
              <div className={`h-1 w-full ${sensorSeleccionado.estadoConexion === 'conectado' ? 'bg-primario-500' : 'bg-slate-300'}`}></div>
              <div className="px-4 py-4 flex flex-col gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">
                      {sensorSeleccionado.idUnico}
                    </span>
                    <button onClick={() => setSensorSeleccionadoId(null)} className="text-slate-400 hover:text-slate-600 transition-colors">×</button>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-primario-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <p className="text-sm text-slate-700 font-medium leading-snug">{sensorSeleccionado.nombreCanal}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 ml-6 font-mono">
                    {Number(sensorSeleccionado.ubicacionLat).toFixed(8)}, {Number(sensorSeleccionado.ubicacionLon).toFixed(8)}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                  <button onClick={copiarCoordenadas} className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${copiado ? 'bg-green-50 border-green-200 text-green-600' : 'border-slate-200 text-slate-600 hover:border-primario-300 hover:text-primario-600'}`}>
                    {copiado ? 'Copiado' : 'Coordenadas'}
                  </button>
                  <a 
                    href={`https://www.google.com/maps?q=${Number(sensorSeleccionado.ubicacionLat)},${Number(sensorSeleccionado.ubicacionLon)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-primario-600 text-white hover:bg-primario-700 transition-all shadow-sm"
                  >
                    Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicDashboard;
