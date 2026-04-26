import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000/telemetria';

export interface LecturaTiempoReal {
  sensorIdUnico: string;
  nivelCm: number;
  capacidadPct: number;
  estadoRiesgo: string;
  timestamp: string;
}

export const useTelemetry = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ultimaLectura, setUltimaLectura] = useState<LecturaTiempoReal | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setConectado(true);
      console.log('📡 Telemetría conectada');
    });

    newSocket.on('disconnect', () => {
      setConectado(false);
      console.log('📡 Telemetría desconectada');
    });

    newSocket.on('nueva-lectura', (data: LecturaTiempoReal) => {
      setUltimaLectura(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { conectado, ultimaLectura };
};
