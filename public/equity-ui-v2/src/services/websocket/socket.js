import { io } from 'socket.io-client';

const DEFAULT_URL =
  typeof window !== 'undefined'
    ? window.__GATEWAY_WS_URL__ || 'http://localhost:8080'
    : 'http://localhost:8080';

export function createSocket({ url = DEFAULT_URL, authToken, onEvent, logger = console } = {}) {
  const socket = io(url, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 10000,
    auth: authToken ? { token: authToken } : undefined,
  });

  socket.on('connect', () => logger.info?.('[WS] connected', { id: socket.id }));
  socket.on('disconnect', (reason) => logger.warn?.('[WS] disconnected', { reason }));
  socket.on('reconnect_attempt', (n) => logger.info?.('[WS] reconnect attempt', { n }));
  socket.on('reconnect', (n) => logger.info?.('[WS] reconnected', { n }));
  socket.on('connect_error', (err) =>
    logger.error?.('[WS] connect_error', { message: err?.message })
  );

  const channels = ['kpi', 'weekly_trends', 'under_served', 'equity_anomalies', 'risk_digest'];
  channels.forEach((ch) => {
    socket.on(ch, (payload) => onEvent?.(ch, payload));
  });

  return socket;
}
