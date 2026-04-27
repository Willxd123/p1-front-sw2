import { useState, useEffect } from "react";
import { sensorService } from "../../api/api.service";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Radio,
  Settings2,
  Save,
  MapPin,
  Calendar,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminSensores = () => {
  const [sensores, setSensores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [esperandoApi, setEsperandoApi] = useState(false);

  const [nuevoSensor, setNuevoSensor] = useState({
    id_unico: "",
    nombre_canal: "",
    ubicacion_lat: -17.81,
    ubicacion_lon: -63.19,
    umbral_normal_pct: 60,
    umbral_alerta_pct: 80,
  });

  const [sensorEnEdicion, setSensorEnEdicion] = useState<any>(null);
  const [sensorSeleccionado, setSensorSeleccionado] = useState<any>(null);

  useEffect(() => {
    cargarSensores();
  }, []);

  const cargarSensores = async () => {
    try {
      const resp = await sensorService.listarTodos();
      setSensores(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setEsperandoApi(true);
    try {
      const resp = await sensorService.crear(nuevoSensor);
      alert("Sensor registrado. Token: " + resp.data.data.token_autenticacion);
      setModalAbierto(false);
      setNuevoSensor({
        id_unico: "",
        nombre_canal: "",
        ubicacion_lat: -17.81,
        ubicacion_lon: -63.19,
        umbral_normal_pct: 60,
        umbral_alerta_pct: 80,
      });
      cargarSensores();
    } catch (e) {
      alert("Error al crear sensor");
    } finally {
      setEsperandoApi(false);
    }
  };

  const handleAbrirEdicion = (e: React.MouseEvent, sensor: any) => {
    e.stopPropagation(); // Evitar abrir el detalle
    setSensorEnEdicion({
      id: sensor.id,
      id_unico: sensor.idUnico,
      nombre_canal: sensor.nombreCanal,
      ubicacion_lat: parseFloat(sensor.ubicacionLat),
      ubicacion_lon: parseFloat(sensor.ubicacionLon),
      umbral_normal_pct: sensor.umbralNormalPct,
      umbral_alerta_pct: sensor.umbralAlertaPct,
    });
    setModalEdicionAbierto(true);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    setEsperandoApi(true);
    try {
      await sensorService.actualizar(sensorEnEdicion.id, sensorEnEdicion);
      setModalEdicionAbierto(false);
      cargarSensores();
    } catch (e) {
      alert("Error al actualizar sensor");
    } finally {
      setEsperandoApi(false);
    }
  };

  const handleEliminar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evitar abrir el detalle
    if (!confirm("¿Seguro que desea eliminar este sensor?")) return;
    try {
      await sensorService.eliminar(id);
      cargarSensores();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const handleVerDetalle = (sensor: any) => {
    setSensorSeleccionado(sensor);
    setModalDetalleAbierto(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Gestión de Sensores
          </h2>
          <p className="text-slate-500 text-sm">
            Administre los dispositivos IoT desplegados en la ciudad.
          </p>
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
          {sensores.map((sensor) => (
            <motion.div
              layout
              key={sensor.id}
              onClick={() => handleVerDetalle(sensor)}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group active:scale-[0.98]"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => handleAbrirEdicion(e, sensor)}
                  className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleEliminar(e, sensor.id)}
                  className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-blue-500/50 transition-colors">
                  <Radio
                    className={`w-6 h-6 ${sensor.estadoConexion === "conectado" ? "text-blue-500" : "text-slate-400"}`}
                  />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    sensor.estadoConexion === "conectado"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}
                >
                  {sensor.estadoConexion}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-blue-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  {sensor.nombreCanal}
                </h3>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-tight">
                  <MapPin className="w-3 h-3" />
                  {parseFloat(sensor.ubicacionLat).toFixed(4)},{" "}
                  {parseFloat(sensor.ubicacionLon).toFixed(4)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Normal
                  </p>
                  <p className="text-slate-900 font-black">
                    {sensor.umbralNormalPct}%
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Alerta
                  </p>
                  <p className="text-slate-900 font-black">
                    {sensor.umbralAlertaPct}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DETALLES */}
      <AnimatePresence>
        {modalDetalleAbierto && sensorSeleccionado && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="bg-slate-900 p-8 text-white">
                <button
                  onClick={() => setModalDetalleAbierto(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500 rounded-2xl">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      Detalles del Dispositivo
                    </p>
                    <h2 className="text-xl font-black">
                      {sensorSeleccionado.nombreCanal}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase">
                      <Radio className="w-3 h-3" /> ID Único (ESP32)
                    </div>
                    <p className="font-mono text-sm bg-slate-50 p-2 rounded-lg border border-slate-100 text-blue-600 font-bold">
                      {sensorSeleccionado.idUnico}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase">
                      <Calendar className="w-3 h-3" /> Fecha Registro
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(
                        sensorSeleccionado.fechaRegistro,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase">
                    <MapPin className="w-3 h-3" /> Coordenadas GPS
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Lat: {sensorSeleccionado.ubicacionLat} <br />
                    Lon: {sensorSeleccionado.ubicacionLon}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Estado Conexión
                      </p>
                      <p className="text-sm font-black text-slate-800 uppercase">
                        {sensorSeleccionado.estadoConexion}
                      </p>
                    </div>
                  </div>
                  {sensorSeleccionado.ultimaLecturaTimestamp && (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Último Reporte
                      </p>
                      <p className="text-[10px] font-bold text-slate-600">
                        {new Date(
                          sensorSeleccionado.ultimaLecturaTimestamp,
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setModalDetalleAbierto(false)}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-colors uppercase text-xs tracking-widest"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREACIÓN / EDICIÓN */}
      <AnimatePresence>
        {(modalAbierto || modalEdicionAbierto) && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 20 }}
              onSubmit={
                modalEdicionAbierto ? handleGuardarEdicion : handleCrear
              }
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => {
                  setModalAbierto(false);
                  setModalEdicionAbierto(false);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={esperandoApi}
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-black text-slate-800 mb-1">
                {modalEdicionAbierto ? "Editar Sensor" : "Registrar Sensor"}
              </h2>
              <p className="text-xs text-slate-400 mb-8 uppercase font-bold tracking-widest">
                {modalEdicionAbierto
                  ? "Actualizar Información"
                  : "Nuevo Dispositivo IoT"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Nombre del Canal
                  </label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    value={
                      modalEdicionAbierto
                        ? sensorEnEdicion.nombre_canal
                        : nuevoSensor.nombre_canal
                    }
                    onChange={(e) =>
                      modalEdicionAbierto
                        ? setSensorEnEdicion({
                            ...sensorEnEdicion,
                            nombre_canal: e.target.value,
                          })
                        : setNuevoSensor({
                            ...nuevoSensor,
                            nombre_canal: e.target.value,
                          })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                      Latitud
                    </label>
                    <input
                      required
                      type="number"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={
                        modalEdicionAbierto
                          ? sensorEnEdicion.ubicacion_lat
                          : nuevoSensor.ubicacion_lat
                      }
                      onChange={(e) =>
                        modalEdicionAbierto
                          ? setSensorEnEdicion({
                              ...sensorEnEdicion,
                              ubicacion_lat: parseFloat(e.target.value),
                            })
                          : setNuevoSensor({
                              ...nuevoSensor,
                              ubicacion_lat: parseFloat(e.target.value),
                            })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                      Longitud
                    </label>
                    <input
                      required
                      type="number"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={
                        modalEdicionAbierto
                          ? sensorEnEdicion.ubicacion_lon
                          : nuevoSensor.ubicacion_lon
                      }
                      onChange={(e) =>
                        modalEdicionAbierto
                          ? setSensorEnEdicion({
                              ...sensorEnEdicion,
                              ubicacion_lon: parseFloat(e.target.value),
                            })
                          : setNuevoSensor({
                              ...nuevoSensor,
                              ubicacion_lon: parseFloat(e.target.value),
                            })
                      }
                    />
                  </div>
                </div>

                {!modalEdicionAbierto && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                      ID Único (Broker Topic)
                    </label>
                    <input
                      required
                      placeholder="Ej: ESP32_ANILLO4"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={nuevoSensor.id_unico}
                      onChange={(e) =>
                        setNuevoSensor({
                          ...nuevoSensor,
                          id_unico: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                      Umbral Normal (%)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={
                        modalEdicionAbierto
                          ? sensorEnEdicion.umbral_normal_pct
                          : nuevoSensor.umbral_normal_pct
                      }
                      onChange={(e) =>
                        modalEdicionAbierto
                          ? setSensorEnEdicion({
                              ...sensorEnEdicion,
                              umbral_normal_pct: parseInt(e.target.value),
                            })
                          : setNuevoSensor({
                              ...nuevoSensor,
                              umbral_normal_pct: parseInt(e.target.value),
                            })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                      Umbral Alerta (%)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm mt-1 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={
                        modalEdicionAbierto
                          ? sensorEnEdicion.umbral_alerta_pct
                          : nuevoSensor.umbral_alerta_pct
                      }
                      onChange={(e) =>
                        modalEdicionAbierto
                          ? setSensorEnEdicion({
                              ...sensorEnEdicion,
                              umbral_alerta_pct: parseInt(e.target.value),
                            })
                          : setNuevoSensor({
                              ...nuevoSensor,
                              umbral_alerta_pct: parseInt(e.target.value),
                            })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={esperandoApi}
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {esperandoApi ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {modalEdicionAbierto ? (
                          <Save className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                        {modalEdicionAbierto
                          ? "GUARDAR CAMBIOS"
                          : "REGISTRAR DISPOSITIVO"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSensores;
