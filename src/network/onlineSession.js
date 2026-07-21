function createClientId() {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

function safeJsonParse(payload) {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function createOnlineSession(options) {
  const {
    host,
    room,
    playerName,
    isHost,
    onStatus,
    onSnapshot,
    onRemoteAction,
    onConnectionState,
  } = options;

  const session = {
    socket: null,
    clientId: createClientId(),
    remoteClientId: null,
    ready: false,
    closed: false,
    snapshotTimer: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    connected: false,
    suppressNextCloseReconnect: false,
  };

  const emitStatus = (message) => {
    if (typeof onStatus === 'function') {
      onStatus(message);
    }
  };

  const send = (event) => {
    if (!session.socket || session.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    session.socket.send(JSON.stringify(event));
  };

  const closeSocket = () => {
    if (!session.socket) {
      return;
    }
    try {
      session.socket.close();
    } catch {
      // Ignore close errors during reconnect cleanup.
    }
    session.socket = null;
  };

  const emitConnectionState = (state, details = {}) => {
    if (typeof onConnectionState === 'function') {
      onConnectionState({ state, ...details });
    }
  };

  const clearReconnectTimer = () => {
    if (session.reconnectTimer) {
      window.clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }
  };

  const scheduleReconnect = (reason) => {
    if (session.closed) {
      return;
    }
    clearReconnectTimer();
    session.reconnectAttempts += 1;
    const delayMs = Math.min(8000, 800 + (session.reconnectAttempts * 600));
    emitStatus(`Connection lost (${reason}). Reconnecting in ${Math.ceil(delayMs / 1000)}s...`);
    emitConnectionState('reconnecting', { attempt: session.reconnectAttempts, delayMs, reason });
    session.reconnectTimer = window.setTimeout(() => {
      session.reconnectTimer = null;
      connect();
    }, delayMs);
  };

  const connect = () => {
    const encodedRoom = encodeURIComponent(room || 'default-room');
    const url = `wss://${host}/parties/main/${encodedRoom}`;
    emitConnectionState('connecting', { url });
    session.socket = new WebSocket(url);

    session.socket.addEventListener('open', () => {
      clearReconnectTimer();
      session.connected = true;
      session.ready = false;
      session.reconnectAttempts = 0;
      emitStatus(`Connected to room ${room}.`);
      emitConnectionState('connected');
      send({ type: 'hello', role: isHost ? 'host' : 'guest', name: playerName, clientId: session.clientId });
    });

    session.socket.addEventListener('message', (event) => {
      const message = safeJsonParse(event.data);
      if (!message || message.clientId === session.clientId) {
        return;
      }

      if (message.type === 'hello') {
        session.remoteClientId = message.clientId;
        session.ready = true;
        emitStatus(`${message.name || 'Remote player'} joined the room.`);
        emitConnectionState('ready');
        if (isHost) {
          send({ type: 'ready', clientId: session.clientId });
        }
        return;
      }

      if (message.type === 'ready') {
        session.ready = true;
        emitStatus('Both players are connected.');
        emitConnectionState('ready');
        return;
      }

      if (message.type === 'snapshot' && !isHost && typeof onSnapshot === 'function') {
        onSnapshot(message.snapshot);
        return;
      }

      if (message.type === 'action' && isHost && typeof onRemoteAction === 'function') {
        onRemoteAction(message.action);
      }
    });

    session.socket.addEventListener('close', () => {
      if (session.suppressNextCloseReconnect) {
        session.suppressNextCloseReconnect = false;
        return;
      }
      if (!session.closed) {
        session.connected = false;
        session.ready = false;
        emitConnectionState('disconnected');
        scheduleReconnect('socket closed');
      }
    });

    session.socket.addEventListener('error', () => {
      if (!session.closed) {
        session.connected = false;
        session.ready = false;
        emitConnectionState('disconnected', { reason: 'socket error' });
      }
    });
  };

  const queueSnapshot = (snapshot) => {
    if (!isHost) {
      return;
    }
    if (session.snapshotTimer) {
      window.clearTimeout(session.snapshotTimer);
    }
    session.snapshotTimer = window.setTimeout(() => {
      send({ type: 'snapshot', snapshot, clientId: session.clientId });
      session.snapshotTimer = null;
    }, 60);
  };

  const sendAction = (action) => {
    if (isHost) {
      return;
    }
    send({ type: 'action', action, clientId: session.clientId });
  };

  const destroy = () => {
    session.closed = true;
    clearReconnectTimer();
    if (session.snapshotTimer) {
      window.clearTimeout(session.snapshotTimer);
      session.snapshotTimer = null;
    }
    closeSocket();
  };

  const forceReconnect = () => {
    if (session.closed) {
      return;
    }
    emitStatus('Manual reconnect requested.');
    emitConnectionState('reconnecting', { attempt: session.reconnectAttempts + 1, delayMs: 0, reason: 'manual' });
    clearReconnectTimer();
    session.ready = false;
    session.connected = false;
    session.suppressNextCloseReconnect = true;
    closeSocket();
    connect();
  };

  return {
    connect,
    queueSnapshot,
    sendAction,
    destroy,
    forceReconnect,
    isReady: () => session.ready,
    isConnected: () => session.connected,
  };
}
