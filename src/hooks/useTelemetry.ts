import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000/telemetria';

export interface LecturaTiempoReal {
  /** idUnico del sensor (e.g. "ESP32_ANILLO3_CALLE5") — normalizado en el hook */
  sensorIdUnico: string;
  /** UUID interno del sensor tal como viene del backend */
  sensorId: string;
  nivelCm: number;
  capacidadPct: number;
  /** Siempre en MAYÚSCULAS: "NORMAL" | "ALERTA" | "PELIGRO" */
  estadoRiesgo: 'NORMAL' | 'ALERTA' | 'PELIGRO';
  timestamp: string;
}

/** Normaliza un payload raw del gateway al tipo LecturaTiempoReal */
function normalizePayload(raw: any): LecturaTiempoReal {
  return {
    // El gateway puede enviar sensorIdUnico (legacy) o no tenerlo todavía
    sensorIdUnico: raw.sensorIdUnico ?? raw.sensorId ?? '',
    sensorId:      raw.sensorId ?? '',
    nivelCm:       Number(raw.nivelCm ?? 0),
    capacidadPct:  Number(raw.capacidadPct ?? 0),
    // Normalizar a MAYÚSCULAS para que coincida con COLORS keys
    estadoRiesgo:  (String(raw.estadoRiesgo ?? 'NORMAL').toUpperCase()) as LecturaTiempoReal['estadoRiesgo'],
    timestamp:     raw.timestampLectura ?? raw.timestamp ?? new Date().toISOString(),
  };
}

export const useTelemetry = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ultimaLectura, setUltimaLectura] = useState<LecturaTiempoReal | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    newSocket.on('connect', () => {
      setConectado(true);
      console.log('📡 Telemetría conectada');
    });

    newSocket.on('disconnect', () => {
      setConectado(false);
      console.log('📡 Telemetría desconectada');
    });

    newSocket.on('nueva-lectura', (data: any) => {
      setUltimaLectura(normalizePayload(data));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, conectado, ultimaLectura };
};
