import { useState, useEffect } from 'react';
import { notificationService } from '../../api/api.service';
import { 
  Users, 
  Send, 
  CheckCircle, 
  Clock, 
  Smartphone, 
  Download,
  ArrowRight,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { sensorService } from '../../api/api.service';

const AdminNotifications = () => {
  const [resumen, setResumen] = useState<any>(null);
  const [actividad, setActividad] = useState<any[]>([]);
  const [cobertura, setCobertura] = useState<any[]>([]);
  const [suscriptores, setSuscriptores] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [filtroSensor, setFiltroSensor] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resResp, actResp, cobResp, senResp, susResp] = await Promise.all([
        notificationService.obtenerResumen(),
        notificationService.obtenerActividad(),
        notificationService.obtenerCobertura(1, 10, filtroSensor),
        sensorService.listarTodos(),
        notificationService.obtenerListadoSuscriptores()
      ]);
      setResumen(resResp.data);
      setActividad(actResp.data);
      setCobertura(cobResp.data.data);
      setSensores(senResp.data);
      setSuscriptores(susResp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      refrescarCobertura();
    }
  }, [filtroSensor]);

  const refrescarCobertura = async () => {
    try {
      const resp = await notificationService.obtenerCobertura(1, 10, filtroSensor);
      setCobertura(resp.data.data);
    } catch (e) {
      console.error(e);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Smartphone className="w-12 h-12 mb-4 animate-bounce opacity-20" />
        <p className="font-bold text-sm tracking-widest uppercase">Sincronizando Suscriptores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Export */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Suscriptores</h2>
          <p className="text-slate-500 font-medium mt-1">Monitoreo de cobertura y salud de la red de dispositivos.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI 
          label="Total Suscritos" 
          value={resumen?.totalDispositivos || 0} 
          icon={Users} 
          trend="+4.2%" 
          color="blue" 
        />
        <KPI 
          label="Suscripciones Activas" 
          value={resumen?.dispositivosActivos || 0} 
          icon={CheckCircle} 
          subText={`${((resumen?.dispositivosActivos / resumen?.totalDispositivos) * 100 || 0).toFixed(1)}% del total`} 
          color="green" 
        />
        <KPI 
          label="Alertas (24h)" 
          value={resumen?.alertasEnviadas24h || 0} 
          icon={Send} 
          color="orange" 
        />
        <KPI 
          label="Tasa de Entrega" 
          value={`${resumen?.tasaEntrega || 100}%`} 
          icon={Smartphone} 
          subText="FCM Firebase"
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfica de Actividad */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-500 w-5 h-5" /> Actividad (24h)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Updates GPS</span>
          </div>

          <div className="flex items-end justify-between h-48 gap-1 px-2">
            {actividad.length > 0 ? actividad.map((item, idx) => {
              const maxVal = Math.max(...actividad.map(a => a.usuarios));
              const height = (item.usuarios / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-help">
                  <div 
                    className="w-full bg-blue-500/10 rounded-t-sm group-hover:bg-blue-500/30 transition-all relative overflow-hidden" 
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ delay: idx * 0.05 }}
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm"
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 mt-2 rotate-[-45deg]">{item.hora.split(':')[0]}h</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-10 whitespace-nowrap font-bold">
                    {item.usuarios} usuarios
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center text-slate-300 text-[10px] italic">No hay datos de actividad</div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-8 text-center uppercase tracking-widest border-t pt-4 border-slate-50">Hora del día</p>
        </div>

        {/* Auditoría de Cobertura */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Filter className="text-purple-500 w-5 h-5" /> Auditoría de Cobertura
            </h3>
            <div className="flex gap-4">
               <select 
                value={filtroSensor}
                onChange={(e) => setFiltroSensor(e.target.value)}
                className="text-xs font-bold bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
               >
                 <option value="">TODOS LOS SENSORES</option>
                 {sensores.map(s => (
                   <option key={s.id} value={s.id}>{s.nombreCanal.toUpperCase()}</option>
                 ))}
               </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alerta / Sensor</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispositivo</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Distancia</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cobertura.length > 0 ? cobertura.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.eventoAlerta?.sensor?.nombreCanal || 'Desconocido'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.eventoAlerta?.tipoEvento || 'Alerta'}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">ID: {item.dispositivoId.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-black text-slate-500">{item.distanciaAlDesbordeM}m</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.estadoEnvio === 'enviada' ? 'bg-green-100 text-green-700' : 
                        item.estadoEnvio === 'fallida' ? 'bg-red-100 text-red-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.estadoEnvio}
                      </span>
                    </td>
                  </tr>
                )) : (
                   <tr>
                     <td colSpan={4} className="py-12 text-center text-slate-300 text-sm italic">No hay registros de envío recientes</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditoría completa en histórico</p>
            <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Ver Más <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Suscriptores en Vivo */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-8">
        <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6">
          <Smartphone className="text-green-500 w-5 h-5" /> Suscriptores en Vivo (Última Ubicación)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Dispositivo</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Conexión</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordenadas</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {suscriptores.length > 0 ? suscriptores.map((s) => (
                <tr key={s.id} className="group hover:bg-slate-50 transition-all">
                  <td className="py-4">
                    <span className="text-xs font-bold text-slate-700 font-mono">...{s.id.slice(-12)}</span>
                  </td>
                  <td className="py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      s.gps?.timestampGps ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {s.gps?.timestampGps ? 'CONECTADO' : 'SIN GPS'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-medium text-slate-500">
                      {s.gps?.timestampGps ? new Date(s.gps.timestampGps).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-bold text-slate-600">
                      {s.gps ? `${s.gps.ubicacionLat}, ${s.gps.ubicacionLon}` : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {s.gps && (
                      <a 
                        href={`https://www.google.com/maps?q=${s.gps.ubicacionLat},${s.gps.ubicacionLon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-all inline-block"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-300 text-sm italic">No hay suscriptores activos para mostrar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ label, value, icon: Icon, trend, subText, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="p-8 rounded-3xl border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} border`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-[10px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        {subText && (
          <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight italic">{subText}</p>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
