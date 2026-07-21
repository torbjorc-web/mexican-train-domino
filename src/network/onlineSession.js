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

function mapToParticipants(participantsMap) {
  return Array.from(participantsMap.values())
    .sort((left, right) => left.joinOrder - right.joinOrder)
    .map(({ clientId, name, role }) => ({ clientId, name, role }));
}

export function createOnlineSession(options) {
  const {
    host,
    room,
    playerName,
    isHost,
    maxPlayers = 6,
    onStatus,
    onSnapshot,
    onRemoteAction,
    onConnectionState,
    onSeats,
  } = options;

  const session = {
    socket: null,
    clientId: createClientId(),
    closed: false,
    snapshotTimer: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    connected: false,
    ready: false,
    suppressNextCloseReconnect: false,
    joinCounter: 0,
    participants: new Map(),
    seats: [],
  };

  const emitStatus = (message) => {
    if (typeof onStatus === 'function') {
      onStatus(message);
    }
  };

  const emitConnectionState = (state, details = {}) => {
    if (typeof onConnectionState === 'function') {
      onConnectionState({ state, ...details });
    }
  };

  const emitSeats = () => {
    if (typeof onSeats === 'function') {
      onSeats(session.seats);
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
      // Ignore socket close errors during reconnect cleanup.
    }
    session.socket = null;
  };

  const clearReconnectTimer = () => {
    if (session.reconnectTimer) {
      window.clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }
  };

  const clearSnapshotTimer = () => {
    if (session.snapshotTimer) {
      window.clearTimeout(session.snapshotTimer);
      session.snapshotTimer = null;
    }
  };

  const updateReady = () => {
    const mySeat = session.seats.find((entry) => entry.clientId === session.clientId);
    session.ready = Boolean(mySeat);
    if (session.ready) {
      emitConnectionState('ready');
    }
  };

  const setSeats = (seats) => {
    session.seats = Array.isArray(seats) ? seats : [];
    emitSeats();
    updateReady();
  };

  const registerParticipant = (clientId, name, role) => {
    const existing = session.participants.get(clientId);
    const joinOrder = existing?.joinOrder ?? session.joinCounter;
    if (!existing) {
      session.joinCounter += 1;
    }
    session.participants.set(clientId, {
      clientId,
      name: `${name || 'Player'}`.trim() || 'Player',
      role: role || 'guest',
      joinOrder,
    });
  };

  const buildSeatsFromParticipants = () => {
    const ordered = mapToParticipants(session.participants).slice(0, Math.max(2, maxPlayers));
    return ordered.map((participant, seatIndex) => ({
      seatIndex,
      clientId: participant.clientId,
      name: participant.name,
      role: participant.role,
    }));
  };

  const publishSeats = () => {
    if (!isHost) {
      return;
    }
    const seats = buildSeatsFromParticipants();
    setSeats(seats);
    send({
      type: 'seats',
      seats,
      maxPlayers,
      clientId: session.clientId,
    });
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
      session.participants.clear();
      session.joinCounter = 0;
      session.seats = [];

      registerParticipant(session.clientId, playerName, isHost ? 'host' : 'guest');
      if (isHost) {
        publishSeats();
      }

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
        registerParticipant(message.clientId, message.name, message.role || 'guest');
        if (isHost) {
          publishSeats();
          emitStatus(`${message.name || 'Remote player'} joined the room.`);
        }
        return;
      }

      if (message.type === 'seats' && !isHost) {
        const seats = Array.isArray(message.seats) ? message.seats : [];
        setSeats(seats);
        const selfSeat = seats.find((entry) => entry.clientId === session.clientId);
        if (selfSeat) {
          emitStatus(`Assigned to seat ${selfSeat.seatIndex + 1}.`);
        }
        return;
      }

      if (message.type === 'snapshot' && !isHost && typeof onSnapshot === 'function') {
        onSnapshot(message.snapshot);
        return;
      }

      if (message.type === 'action' && isHost && typeof onRemoteAction === 'function') {
        onRemoteAction(message.action, message.clientId || null);
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
    clearSnapshotTimer();
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
    clearSnapshotTimer();
    closeSocket();
  };

  const forceReconnect = () => {
    if (session.closed) {
      return;
    }
    emitStatus('Manual reconnect requested.');
    emitConnectionState('reconnecting', {
      attempt: session.reconnectAttempts + 1,
      delayMs: 0,
      reason: 'manual',
    });
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
    getClientId: () => session.clientId,
    getSeats: () => [...session.seats],
  };
}
