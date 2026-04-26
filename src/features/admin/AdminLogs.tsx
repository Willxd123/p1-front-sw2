import { useState, useEffect } from 'react';
import { logService } from '../../api/api.service';
import { 
  Database, 
  FileDown, 
  Search, 
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [tipoLog, setTipoLog] = useState<'audit' | 'alerts'>('audit');

  useEffect(() => {
    cargarLogs();
  }, [pagina, tipoLog]);

  const cargarLogs = async () => {
    try {
      const resp = tipoLog === 'audit' 
        ? await logService.obtenerLogs(pagina)
        : await logService.obtenerAlertas(pagina);
        
      setLogs(resp.data.data || []);
      setTotal(resp.data.total || 0);
    } catch (e) {
      console.error(e);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bitácora de Eventos</h2>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => { setTipoLog('audit'); setPagina(1); }}
              className={`text-sm font-bold pb-2 border-b-2 transition-all ${tipoLog === 'audit' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
            >
              Auditoría Admin (CU12)
            </button>
            <button 
              onClick={() => { setTipoLog('alerts'); setPagina(1); }}
              className={`text-sm font-bold pb-2 border-b-2 transition-all ${tipoLog === 'alerts' ? 'text-red-600 border-red-600' : 'text-slate-400 border-transparent'}`}
            >
              Alertas del Sistema (CU4)
            </button>
          </div>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 py-3 px-6 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
          <FileDown className="w-4 h-4" /> EXPORTAR (CU13)
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
              placeholder="Buscar por ID de sensor o acción..."
              className="w-full bg-slate-50 border-0 rounded-xl py-3 pl-11 pr-4 text-sm"
             />
          </div>
          <button className="px-4 py-3 bg-slate-50 rounded-xl text-slate-600 flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button className="px-4 py-3 bg-slate-50 rounded-xl text-slate-600 flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" /> Última semana
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Evento</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor / Sensor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">
                        {format(new Date(log.timestampAccion || log.timestampInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-tight ${getTipoClase(log.tipoAccion || log.tipoEvento)}`}>
                      {log.tipoAccion || log.tipoEvento}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-slate-800">
                      {tipoLog === 'audit' 
                        ? (log.detalles?.descripcion || log.tipoAccion)
                        : `Nivel alcanzado: ${log.nivelAlcanzadoPct}% - Estado: ${log.estado}`
                      }
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <Database className="w-3.5 h-3.5 text-slate-400" />
                       <span className="text-xs font-bold text-slate-500">
                         {log.usuarioAdmin || log.entidadAfectada || log.sensorId || 'SISTEMA'}
                       </span>
                    </div>
                  </td>
                </tr>
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
              disabled={pagina === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-white transition-all disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPagina(p => p + 1)}
              disabled={logs.length < 50}
              className="p-2 border border-slate-200 rounded-xl hover:bg-white transition-all disabled:opacity-20"
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
