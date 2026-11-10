// JobTrack Standalone Frontend API Helper
const API_BASE = window.location.origin.includes(':3000') ? '/api' : 'http://localhost:8000';
const WS_BASE = window.location.origin.includes(':3000') 
  ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws'
  : 'ws://localhost:8000/ws';

const tokenKey = 'jobtrack_jwt_token';

const Auth = {
  getToken: () => localStorage.getItem(tokenKey),
  setToken: (token) => localStorage.setItem(tokenKey, token),
  clear: () => localStorage.removeItem(tokenKey),
  isAuthenticated: () => !!localStorage.getItem(tokenKey),
};

async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let msg = '';
    try {
      const errorData = await response.json();
      msg = errorData.detail || errorData.error || errorData.message || '';
    } catch {
      // ignore
    }

    if (!msg || /request failed|network request failed|failed to fetch/i.test(msg)) {
      if (response.status === 400) {
        msg = 'Please verify that your details are filled out correctly.';
      } else if (response.status === 401) {
        msg = 'Invalid credentials. Please verify your email and password.';
      } else {
        msg = 'Unable to complete request right now. Please try again.';
      }
    }
    throw new Error(msg);
  }

  return response.json();
}

// Global WebSocket setup
let socket = null;
const wsListeners = [];

function connectWebSocket() {
  try {
    socket = new WebSocket(WS_BASE);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        wsListeners.forEach(listener => listener(data));
      } catch (e) {}
    };
    socket.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };
  } catch (err) {}
}

function onRealtimeEvent(callback) {
  wsListeners.push(callback);
}

connectWebSocket();
