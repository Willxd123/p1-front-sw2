import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. SOLUCIÓN VITE: Exponer L globalmente antes de importar el plugin
(window as any).L = L;
import 'leaflet.heat';

// Corregir iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const COLORS = { 
  NORMAL: '#22c55e', 
  ALERTA: '#f59e0b', 
  PELIGRO: '#ef4444' 
};

interface Sensor {
  id: string;
  idUnico: string;
  nombreCanal: string;
  ubicacionLat: string | number;
  ubicacionLon: string | number;
  ultimaLecturaTimestamp?: string;
  estadoConexion: string;
}

// Silenciamos errores de tipos de react-leaflet v5
const Map: any = MapContainer;
const Tile: any = TileLayer;
const Mkr: any = Marker;
const Pop: any = Popup;

/** 2. LÓGICA DE PUNTOS: Basado en el nivel de riesgo con "boost" para PELIGRO */
function buildHeatPoints(sensors: Sensor[], sensorStatus: Record<string, any>) {
  const pts: [number, number, number][] = [];
  sensors.forEach(s => {
    const lat = Number(s.ubicacionLat);
    const lon = Number(s.ubicacionLon);
    if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) return;

    const live = sensorStatus[s.idUnico];

    // Usar la capacidad porcentual (0-100) mapeada a 0.0-1.0 para intensidad
    let intensity = live ? Number(live.capacidadPct) / 100 : 0;
    
    // Asegurar una intensidad mínima si el sensor está reportando algo,
    // para que no desaparezca totalmente si el nivel es muy bajo (ej. 5%)
    if (live && intensity < 0.15) intensity = 0.15;

    if (intensity > 0) {
      // Punto principal
      pts.push([lat, lon, intensity]);
      
      // Si está en PELIGRO o ALERTA, agregamos 3 micro-puntos alrededor (0.0001 deg ~10m) 
      // para "engrosar" el centro de la mancha sin hacerla ver difusa de lejos.
      // Boost extra para PELIGRO (intensidad > 0.8)
      if (intensity > 0.65) {
        const offset = 0.0001;
        const boost = intensity * 0.8;
        pts.push([lat + offset, lon, boost]);
        pts.push([lat - offset, lon, boost]);
        pts.push([lat, lon + offset, boost]);
      }
    }
  });
  return pts;
}

// 3. CONFIGURACIÓN: Gradientes más agresivos y sensibles al Zoom
const HeatLayer = ({ sensors, sensorStatus }: { sensors: Sensor[], sensorStatus: Record<string, any> }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  // Escuchar cambios de zoom para re-renderizar la capa con nuevo radio
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    const globalL = (window as any).L;
    if (!globalL || !globalL.heatLayer || !sensors.length) return;

    const points = buildHeatPoints(sensors, sensorStatus);
    if (!points.length) return;

    // Calcular radio: más pequeño al alejarse (zoom bajo), más grande al acercarse (zoom alto)
    // Esto evita que de lejos parezcan manchas gigantes que cubren ciudades enteras.
    const baseRadius = zoom <= 12 ? 25 : zoom <= 14 ? 45 : 70;
    const baseBlur = zoom <= 12 ? 15 : 35;

    const heat = globalL.heatLayer(points, {
      radius: baseRadius,  
      blur: baseBlur,      
      maxZoom: 17,
      minOpacity: 0.45,
      gradient: {
        0.1: '#d1fae5',    // Verde muy claro (inicio)
        0.3: '#22c55e',    // Verde esmeralda (normal)
        0.45: '#a3e635',   // Lima (transición)
        0.6: '#f59e0b',    // Ambar (alerta)
        0.75: '#f97316',   // Naranja (alerta alta)
        0.9: '#ef4444',    // Rojo (peligro)
        1.0: '#7f1d1d'     // Granate (crítico)
      }
    }).addTo(map);

    return () => {
      if (heat) map.removeLayer(heat);
    };
  }, [sensors, sensorStatus, map, zoom]);

  return null;
};

// Componente interno para manejar efectos de cámara del mapa
const MapController = ({ selectedSensor }: { selectedSensor: any }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedSensor) {
      const lat = Number(selectedSensor.ubicacionLat);
      const lon = Number(selectedSensor.ubicacionLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        map.flyTo([lat, lon], 16, { duration: 1.5 });
      }
    }
  }, [selectedSensor, map]);
  return null;
};

// Marker individual con auto-open popup cuando está seleccionado
const SensorMarker = ({
  sensor,
  isSelected,
  live,
  onSensorSelect,
}: {
  sensor: Sensor;
  isSelected: boolean;
  live: any;
  onSensorSelect?: (sensor: any) => void;
}) => {
  const markerRef = useRef<any>(null);

  // Normalizar a UPPERCASE (el socket puede enviar lowercase)
  const rawRisk = String(live?.estadoRiesgo ?? 'NORMAL').toUpperCase();
  const risk: keyof typeof COLORS = (rawRisk in COLORS ? rawRisk : 'NORMAL') as keyof typeof COLORS;
  const level = live ? Number(live.capacidadPct).toFixed(0) : '0';

  const lat = Number(sensor.ubicacionLat);
  const lon = Number(sensor.ubicacionLon);

  // Abrir popup automáticamente cuando se selecciona desde el sidebar
  useEffect(() => {
    if (isSelected && markerRef.current) {
      // Pequeño delay para que flyTo termine primero
      const timeout = setTimeout(() => {
        markerRef.current?.openPopup();
      }, 1600);
      return () => clearTimeout(timeout);
    }
  }, [isSelected]);

  const size = isSelected ? [36, 48] : [28, 38];
  const strokeWidth = isSelected ? 4 : 2;
  const strokeColor = isSelected ? '#0ea5e9' : 'rgba(255,255,255,0.7)';

  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${size[0]}" height="${size[1]}">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26S32 28 32 16C32 7.2 24.8 0 16 0z" 
            fill="${COLORS[risk]}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      <circle cx="16" cy="16" r="7" fill="white" fill-opacity=".85"/>
    </svg>`;

  const customIcon = L.divIcon({
    html: markerSvg,
    className: `custom-marker${isSelected ? ' marker-selected' : ''}`,
    iconSize: size as [number, number],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });

  return (
    <Mkr
      ref={markerRef}
      position={[lat, lon] as LatLngExpression}
      icon={customIcon}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{
        click: () => onSensorSelect?.(sensor),
      }}
    >
      <Pop>
        <div className="p-1 min-w-[140px]">
          <h3 className="font-bold text-slate-800 text-sm mb-1">{sensor.nombreCanal}</h3>
          <p className="text-[10px] text-slate-500 mb-2 font-mono">{sensor.idUnico}</p>
          <div className="flex items-center justify-between">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
              style={{ backgroundColor: COLORS[risk] }}
            >
              {risk}
            </span>
            <span className="text-sm font-black text-slate-700">{level}%</span>
          </div>
        </div>
      </Pop>
    </Mkr>
  );
};

const SensorMap = ({ 
  sensors, 
  telemetry, 
  selectedSensorId, 
  onSensorSelect,
  initialStatus,
}: { 
  sensors: Sensor[], 
  telemetry: any,
  selectedSensorId?: string | null,
  onSensorSelect?: (sensor: any) => void,
  initialStatus?: Record<string, any>,
}) => {
  const [sensorStatus, setSensorStatus] = useState<Record<string, any>>({});

  // Sembrar el estado inicial con el historial de lecturas (normalizando a UPPERCASE)
  useEffect(() => {
    if (initialStatus && Object.keys(initialStatus).length > 0) {
      const normalized: Record<string, any> = {};
      Object.entries(initialStatus).forEach(([key, val]) => {
        normalized[key] = {
          ...val,
          estadoRiesgo: String(val?.estadoRiesgo ?? 'NORMAL').toUpperCase(),
          capacidadPct: Number(val?.capacidadPct ?? 0),
        };
      });
      setSensorStatus(normalized);
    }
  }, [initialStatus]);

  // Actualizar con telemetría en tiempo real
  useEffect(() => {
    if (telemetry) {
      setSensorStatus(prev => ({
        ...prev,
        [telemetry.sensorIdUnico]: telemetry
      }));
    }
  }, [telemetry]);

  const center: LatLngExpression = [-17.775, -63.190];

  const selectedSensorItem = useMemo(() => 
    sensors.find(s => String(s.id) === String(selectedSensorId)),
  [sensors, selectedSensorId]);

  // Sensores con coordenadas válidas
  const validSensors = useMemo(() =>
    sensors.filter(s => {
      const lat = Number(s.ubicacionLat);
      const lon = Number(s.ubicacionLon);
      return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
    }),
  [sensors]);
  
  return (
    <div className="w-full h-full relative" style={{ background: '#0f172a' }}>
      <Map 
        center={center} 
        zoom={14} 
        style={{ width: '100%', height: '100%' }}
        preferCanvas={false}
      >
        <Tile
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
          className="map-tiles-custom"
          keepBuffer={12}
          updateWhenIdle={false}
          updateWhenZooming={true}
        />
        
        <style>{`
          .map-tiles-custom {
            filter: hue-rotate(185deg) saturate(110%) contrast(105%) !important;
          }
          .leaflet-container {
            background: #0f172a !important;
          }
          @keyframes marker-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.1); }
          }
          .marker-selected {
            animation: marker-bounce 1.2s ease-in-out infinite;
            z-index: 1000 !important;
            filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.8));
          }
        `}</style>
        
        <MapController selectedSensor={selectedSensorItem} />
        <HeatLayer sensors={validSensors} sensorStatus={sensorStatus} />

        {/* Mostrar TODOS los markers - seleccionado destacado */}
        {validSensors.map(sensor => (
          <SensorMarker
            key={sensor.id}
            sensor={sensor}
            isSelected={String(sensor.id) === String(selectedSensorId)}
            live={sensorStatus[sensor.idUnico]}
            onSensorSelect={onSensorSelect}
          />
        ))}
      </Map>
    </div>
  );
};

export default SensorMap;
