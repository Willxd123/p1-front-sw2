import { useState, useEffect } from "react";
import { sensorService } from "../../api/api.service";
import { X, TrendingUp, AlertTriangle, Activity, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTelemetry } from "../../hooks/useTelemetry";

interface PredictionModalProps {
  sensorId: string;
  sensorName: string;
  onClose: () => void;
}

export const PredictionModal = ({ sensorId, sensorName, onClose }: PredictionModalProps) => {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ultimaLectura } = useTelemetry();

  // Initial fetch and fallback safety polling
  useEffect(() => {
    fetchPrediction();
    // Fallback cada 5 segundos: Asegura que si el sensor deja de emitir (agua estancada),
    // el modal siga consultando para que el backend informe el estado de "calma"
    const fallbackInterval = setInterval(fetchPrediction, 5000);
    return () => clearInterval(fallbackInterval);
  }, [sensorId]);

  // React to new telemetry ONLY for this sensor (WebSockets instead of polling)
  useEffect(() => {
    if (ultimaLectura && ultimaLectura.sensorId === sensorId) {
      fetchPrediction();
    }
  }, [ultimaLectura?.timestamp]);

  const fetchPrediction = async () => {
    try {
      const resp = await sensorService.obtenerPrediccion(sensorId);
      setData(resp.data);
      if (cargando) setCargando(false);
    } catch (e) {
      setError("Error al conectar con el servidor analítico");
      if (cargando) setCargando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-3000 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* HEADER */}
          <div className={`p-6 text-white transition-colors duration-500 ${data?.critico ? 'bg-red-600 animate-pulse-slow' : 'bg-slate-900'}`}>
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                  Análisis de Tendencia
                </p>
                <h2 className="text-lg font-black leading-tight pr-6">
                  {sensorName}
                </h2>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-6">
            {cargando ? (
              <div className="py-12 flex justify-center items-center flex-col gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Calculando Modelo...</p>
              </div>
            ) : error ? (
              <div className="py-10 text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="font-bold text-slate-700">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* STATUS BAR */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${data.canPredict ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Modelo Analítico
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${data.canPredict ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                    {data.canPredict ? 'Activo' : 'Insuficiente'}
                  </span>
                </div>

                {/* ESTADO: SUBIENDO o CRÍTICO → Mostrar métricas completas */}
                {data.canPredict && data.estado === 'subiendo' || data.estado === 'critico' ? (
                  <>
                    {/* CRITICAL WARNING IF UNDER 2 MIN */}
                    {data.critico && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4 items-center animate-pulse">
                        <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                          <h4 className="text-red-700 font-black uppercase tracking-tight text-sm">Alerta Inminente</h4>
                          <p className="text-red-600 text-xs font-medium leading-snug">Se proyecta un desborde en menos de 2 minutos manteniendo la aceleración actual.</p>
                        </div>
                      </div>
                    )}

                    {/* METRICS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Nivel Actual
                        </p>
                        <p className="text-3xl font-black text-slate-800">
                          {data.nivelActualPct?.toFixed(1) ?? 'N/A'}<span className="text-base text-slate-400 font-medium ml-1">%</span>
                        </p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${data.tiempoEstimadoMin !== null && data.tiempoEstimadoMin < 5 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${data.tiempoEstimadoMin !== null && data.tiempoEstimadoMin < 5 ? 'text-amber-600/60' : 'text-slate-400'}`}>
                          Tiempo Estimado
                        </p>
                        <p className={`text-3xl font-black ${data.tiempoEstimadoMin !== null && data.tiempoEstimadoMin < 5 ? 'text-amber-600' : 'text-slate-800'}`}>
                          {data.tiempoEstimadoMin !== null ? data.tiempoEstimadoMin : '---'}<span className="text-base text-slate-400 font-medium ml-1">min</span>
                        </p>
                      </div>
                    </div>

                    {/* SPEED METRIC */}
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-50">
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                          Velocidad de Crecida
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">
                          +{data.velocidadPctMin?.toFixed(2) ?? '0.00'} % por min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                          (Variación Absoluta)
                        </p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          {data.velocidadCms?.toFixed(2) ?? '0.00'} cm/s
                        </p>
                      </div>
                    </div>

                    {/* CHART VISUALIZATION */}
                    {data.nivelActualPct != null && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-4">Proyección a desborde (100%)</p>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full absolute left-0 top-0 transition-all duration-1000 ${data.critico ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, data.nivelActualPct)}%` }}
                          />
                          <div 
                            className="h-full absolute top-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiCiAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8bGluZSB4MT0iMCIgeTE9IjEwIiB4Mj0iMTAiIHkyPSIwIiBzdHJva2U9InJnYmEoMCwgMCwgMCwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIyIiAvPgo8L3N2Zz4=')] opacity-50 transition-all duration-1000" 
                            style={{ 
                              left: `${Math.min(100, data.nivelActualPct)}%`, 
                              width: `${100 - Math.min(100, data.nivelActualPct)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-2">
                          <span>{data.nivelActualPct?.toFixed(0)}%</span>
                          <span className="text-red-500">100% en {data.tiempoEstimadoMin} min</span>
                        </div>
                      </div>
                    )}

                    {data.lecturasUsadas && (
                      <p className="text-[10px] text-slate-400 text-center mt-2">Basado en {data.lecturasUsadas} lecturas (promedio ponderado)</p>
                    )}
                  </>

                ) : data.estado === 'calma_riesgo' ? (
                  /* ESTADO: CALMA CON RIESGO (>60%) → Aviso ámbar */
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="text-amber-700 font-black uppercase tracking-tight text-sm">Canal en vigilancia</h4>
                        <p className="text-amber-600 text-xs font-medium leading-snug">
                          El nivel se mantiene estable al <strong>{data.nivelActualPct?.toFixed(0)}%</strong> de capacidad. No hay incremento activo, pero el canal permanece en zona de riesgo.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nivel Actual</p>
                        <p className="text-3xl font-black text-amber-600">
                          {data.nivelActualPct?.toFixed(1) ?? 'N/A'}<span className="text-base text-slate-400 font-medium ml-1">%</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Velocidad</p>
                        <p className="text-3xl font-black text-slate-800">
                          ≈0<span className="text-base text-slate-400 font-medium ml-1">%/min</span>
                        </p>
                      </div>
                    </div>
                  </div>

                ) : data.estado === 'descendiendo' ? (
                  /* ESTADO: DESCENDIENDO */
                  <div className="py-8 text-center bg-green-50 rounded-2xl border border-green-100 p-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <h3 className="font-bold text-green-700 mb-1">Nivel en descenso</h3>
                    <p className="text-xs text-green-600 mb-4">
                      El nivel del agua está disminuyendo. No hay riesgo de desborde inminente.
                    </p>
                    {data.nivelActualPct != null && (
                      <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-green-100">
                        <span className="text-xs font-bold text-slate-500">Nivel actual:</span>
                        <span className="text-sm font-black text-slate-800">{data.nivelActualPct?.toFixed(1)}%</span>
                        <span className="text-xs text-green-600 font-bold">↓ {Math.abs(data.velocidadPctMin ?? 0).toFixed(1)}%/min</span>
                      </div>
                    )}
                  </div>

                ) : (
                  /* ESTADO: ESTABLE o INSUFICIENTE */
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 p-6">
                    {data.estado === 'estable' ? (
                      <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    ) : (
                      <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    )}
                    <h3 className="font-bold text-slate-700 mb-1">{data.message || 'Sin proyecciones activas'}</h3>
                    <p className="text-xs text-slate-500">
                      {data.estado === 'estable' 
                        ? 'El canal se encuentra estable. No se detecta crecida ni descenso significativo.'
                        : 'El modelo requiere al menos 5 lecturas para trazar una proyección fiable.'}
                    </p>
                    {data.nivelActualPct != null && (
                      <p className="text-xs text-slate-400 mt-3">Nivel actual: <strong>{data.nivelActualPct?.toFixed(1)}%</strong></p>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
