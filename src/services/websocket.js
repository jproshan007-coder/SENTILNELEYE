class AlertWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectTimer = null;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In dev Vite proxy or direct backend port 8000
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/alerts`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to CCTV AI WebSocket real-time alert stream');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(message));
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        console.warn('WebSocket connection closed. Reconnecting in 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.ws.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 3000);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const alertWebSocket = new AlertWebSocketService();
