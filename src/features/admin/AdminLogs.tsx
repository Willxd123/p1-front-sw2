import { useState, useEffect } from 'react';
import { logService, sensorService } from '../../api/api.service';
import { 
  Database, 
  FileDown, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { io } from 'socket.io-client';

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [tipoView, setTipoView] = useState<'audit' | 'active_alerts' | 'history'>('history');
  const [cargando, setCargando] = useState(false);
  const [sensores, setSensores] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filtros
  const [filtros, setFiltros] = useState({
    startDate: '',
    endDate: '',
    sensorId: '',
    tipoEvento: '',
    estadoEnvio: '',
    searchText: ''
  });

  useEffect(() => {
    cargarSensores();
    const socket = io('http://localhost:3000/telemetria');
    
    socket.on('alerta-riesgo', (alert) => {
      if (tipoView === 'active_alerts') {
        setLogs(prev => [alert, ...prev]);
        setTotal(t => t + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tipoView]);

  useEffect(() => {
    cargarLogs();
  }, [pagina, tipoView, filtros.sensorId, filtros.tipoEvento, filtros.estadoEnvio]);

  const cargarSensores = async () => {
    try {
      const resp = await sensorService.listarTodos();
      setSensores(resp.data || []);
    } catch (e) {
      console.error('Error cargando sensores para filtro', e);
    }
  };

  const cargarLogs = async () => {
    setCargando(true);
    try {
      let resp: any;
      if (tipoView === 'audit') {
        resp = await logService.obtenerLogs(pagina);
      } else {
        const queryParams: any = { ...filtros };
        if (tipoView === 'active_alerts') {
          queryParams.estado = 'activo';
        }
        resp = await logService.obtenerAlertas(pagina, 50, queryParams);
      }
        
      setLogs(resp.data.data || []);
      setTotal(resp.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleExport = async () => {
    try {
      const resp = await logService.exportarAlertas(filtros);
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SIAT_incidentes_${format(new Date(), 'yyyy_MM_dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Error al exportar reporte');
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const getTipoClase = (tipo?: string) => {
    switch (tipo) {
      case 'alerta_amarilla': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'alerta_roja': return 'bg-red-100 text-red-800 border-red-200';
      case 'prediccion_critica': return 'bg-amber-900 text-amber-100 border-amber-800'; 
      case 'resolucion': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoEnvioIcon = (estado: string) => {
    switch (estado) {
      case 'enviada': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case 'fallida': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <RefreshCcw className="w-3 h-3 text-amber-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bitácora de Eventos</h2>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => { setTipoView('history'); setPagina(1); }}
              className={`text-sm font-bold pb-2 border-b-2 transition-all ${tipoView === 'history' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
            >
              Historial de Incidentes 
            </button>
            <button 
              onClick={() => { setTipoView('active_alerts'); setPagina(1); }}
              className={`text-sm font-bold pb-2 border-b-2 transition-all ${tipoView === 'active_alerts' ? 'text-red-600 border-red-600' : 'text-slate-400 border-transparent'}`}
            >
              Alertas Activas 
            </button>

          </div>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 py-3 px-6 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <FileDown className="w-4 h-4" /> EXPORTAR EXCEL
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Panel de Filtros Pro */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1 lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Canal / Texto</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={filtros.searchText}
                  onChange={(e) => setFiltros({...filtros, searchText: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && cargarLogs()}
                  placeholder="Nombre de canal..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal</label>
              <select 
                value={filtros.sensorId}
                onChange={(e) => setFiltros({...filtros, sensorId: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none"
              >
                <option value="">Todos</option>
                {sensores.map(s => <option key={s.id} value={s.id}>{s.nombreCanal || s.idUnico}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo Evento</label>
              <select 
                value={filtros.tipoEvento}
                onChange={(e) => setFiltros({...filtros, tipoEvento: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none"
              >
                <option value="">Cualquiera</option>
                <option value="alerta_amarilla">Amarilla</option>
                <option value="alerta_roja">Roja</option>
                <option value="prediccion_critica">Predicción</option>
                <option value="resolucion">Resolución</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notificación</label>
              <select 
                value={filtros.estadoEnvio}
                onChange={(e) => setFiltros({...filtros, estadoEnvio: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none"
              >
                <option value="">Ver Todas</option>
                <option value="enviada">Enviadas</option>
                <option value="fallida">Fallidas</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>

            <div className="flex gap-2">
               <button 
                onClick={() => { setFiltros({startDate:'', endDate:'', sensorId:'', tipoEvento:'', estadoEnvio:'', searchText:''}); setPagina(1); }}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-all"
               >
                 LIMPIAR
               </button>
               <button 
                onClick={() => { setPagina(1); cargarLogs(); }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
               >
                 FILTRAR
               </button>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Desde:</span>
                <input 
                  type="date" 
                  value={filtros.startDate}
                  onChange={(e) => setFiltros({...filtros, startDate: e.target.value})}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 outline-none"
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Hasta:</span>
                <input 
                  type="date" 
                  value={filtros.endDate}
                  onChange={(e) => setFiltros({...filtros, endDate: e.target.value})}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 outline-none"
                />
             </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="w-10 px-6 py-4"></th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp (UTC)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal / Sensor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nivel</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duración</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Notificados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cargando ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold animate-pulse">Cargando bitácora...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold">No hay eventos para mostrar en este criterio.</td></tr>
              ) : logs.map((log) => (
                <>
                  <tr key={log.id} className={`hover:bg-slate-50/30 transition-colors ${expandedRows.has(log.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleRow(log.id)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        {expandedRows.has(log.id) ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-xs font-bold text-slate-600">
                          {format(new Date(log.timestampInicio || log.timestampAccion), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <Database className="w-3.5 h-3.5 text-blue-400" />
                         <span className="text-xs font-black text-slate-700">
                           {log.sensor?.nombreCanal || log.usuarioAdmin || 'SISTEMA'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-tight ${getTipoClase(log.tipoEvento || log.tipoAccion)}`}>
                        {log.tipoEvento || log.tipoAccion}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-xs font-black text-slate-800">
                        {log.nivelAlcanzadoPct ? `${log.nivelAlcanzadoPct}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-xs font-bold text-slate-500">
                        {log.duracionMinutos !== undefined ? `${log.duracionMinutos} min` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-xs font-black ${log.notificacionesCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                          {log.notificacionesCount || 0}
                        </span>
                        <Bell className={`w-3.5 h-3.5 ${log.notificacionesCount > 0 ? 'text-blue-400' : 'text-slate-200'}`} />
                      </div>
                    </td>
                  </tr>
                  {/* Detalles Expandidos */}
                  {expandedRows.has(log.id) && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="px-12 py-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Detalles de Notificaciones
                          </h4>
                          {log.notificaciones && log.notificaciones.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {log.notificaciones.map((n: any) => (
                                <div key={n.id} className="border border-slate-100 rounded-xl p-3 flex justify-between items-center bg-slate-50/20">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-slate-400 truncate w-32">{n.dispositivoId}</p>
                                    <p className="text-xs font-bold text-slate-700">Distancia: {n.distanciaAlDesbordeM}m</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5">
                                      {getEstadoEnvioIcon(n.estadoEnvio)}
                                      <span className="text-[9px] font-black uppercase text-slate-500">{n.estadoEnvio}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic">
                                      {format(new Date(n.timestampEnvio), 'HH:mm:ss')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 italic text-center py-4">No se enviaron notificaciones para este evento.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Mostrando {logs.length} de {total} registros
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1 || cargando}
              className="p-2 border border-slate-200 rounded-xl hover:bg-white transition-all disabled:opacity-20 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-4 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl">
              PAG {pagina}
            </div>
            <button 
              onClick={() => setPagina(p => p + 1)}
              disabled={logs.length < 50 || cargando}
              className="p-2 border border-slate-200 rounded-xl hover:bg-white transition-all disabled:opacity-20 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
