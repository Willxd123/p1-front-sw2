import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  ubicacionLat: number;
  ubicacionLon: number;
  ultimaLecturaTimestamp?: string;
  estadoConexion: string;
}

const SensorMap = ({ sensors, telemetry }: { sensors: Sensor[], telemetry: any }) => {
  const [sensorStatus, setSensorStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    if (telemetry) {
      setSensorStatus(prev => ({
        ...prev,
        [telemetry.sensorIdUnico]: telemetry
      }));
    }
  }, [telemetry]);

  const center: LatLngExpression = [-17.775, -63.190];
  const Map: any = MapContainer;
  const Tile: any = TileLayer;
  const Mkr: any = Marker;

  return (
    <Map 
      center={center} 
      zoom={14} 
      className="w-full h-full"
    >
      <Tile
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {sensors.map(sensor => {
        const live = sensorStatus[sensor.idUnico];
        const risk = live?.estadoRiesgo || 'NORMAL';
        const level = live?.capacidadPct?.toFixed(0) || '0';

        // Marcador personalizado
        const markerSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
            <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26S32 28 32 16C32 7.2 24.8 0 16 0z" 
                  fill="${COLORS[risk as keyof typeof COLORS]}" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="16" r="7" fill="white" fill-opacity=".85"/>
          </svg>`;
        
        const customIcon = L.divIcon({
          html: markerSvg,
          className: 'custom-marker',
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -40]
        });

        return (
          <Mkr 
            key={sensor.id} 
            position={[sensor.ubicacionLat, sensor.ubicacionLon] as LatLngExpression}
            icon={customIcon}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-slate-800">{sensor.nombreCanal}</h3>
                <p className="text-xs text-slate-500 mb-1">{sensor.idUnico}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[${COLORS[risk as keyof typeof COLORS]}]`}>
                    {risk}
                  </span>
                  <span className="text-sm font-bold">{level}%</span>
                </div>
              </div>
            </Popup>
          </Mkr>
        );
      })}
    </Map>
  );
};

export default SensorMap;
