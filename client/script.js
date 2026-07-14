const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sessionSelect = document.getElementById('session-select');
const newSessionBtn = document.getElementById('new-session-btn');

const STORAGE_KEY = 'chat_sessions_v1';
let sessions = [];
let currentSessionId = null;

const API_BASE = (location.protocol === 'file:') ? 'http://localhost:3000' : location.origin;

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    sessions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    sessions = [];
  }
  if (!sessions || !sessions.length) {
    createNewSession();
  }
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function createNewSession(name) {
  const id = Date.now().toString();
  const session = { id, name: name || `Session ${sessions.length + 1}`, createdAt: new Date().toISOString(), messages: [] };
  sessions.unshift(session);
  currentSessionId = id;
  saveSessions();
  renderSessions();
  renderMessages();
}

function renderSessions() {
  sessionSelect.innerHTML = '';
  sessions.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    sessionSelect.appendChild(opt);
  });
  if (currentSessionId) sessionSelect.value = currentSessionId;
}

function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId) || sessions[0];
}

function renderMessages() {
  chatBox.innerHTML = '';
  const session = getCurrentSession();
  if (!session) return;
  session.messages.forEach(m => appendMessageToDOM(m.role === 'assistant' ? 'bot' : 'user', m.text, false));
}

function appendMessageToDOM(sender, text, save = true) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (save) {
    const session = getCurrentSession();
    if (!session) return;
    session.messages.push({ role: sender === 'bot' ? 'assistant' : 'user', text });
    saveSessions();
  }
}

async function sendToServer(messages) {
  try {
    const prompt = messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', text: m.text }));
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    // server returns { output: text }
    const botText = data.output || data.output_text || '';
    return botText;
  } catch (err) {
    console.error('Error sending to server', err);
    return 'Maaf, terjadi kesalahan saat menghubungi server.';
  }
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;
  appendMessageToDOM('user', userMessage, true);
  input.value = '';

  // send full conversation context to server to maintain persistence
  const session = getCurrentSession();
  const botReplyPlaceholder = '...';
  appendMessageToDOM('bot', botReplyPlaceholder, true);
  // replace placeholder when server responds
  try {
    const botText = await sendToServer(session.messages);
    // replace last bot placeholder with real text
    // remove last message (placeholder)
    session.messages.pop();
    saveSessions();
    appendMessageToDOM('bot', botText, true);
  } catch (e) {
    session.messages.pop();
    appendMessageToDOM('bot', 'Maaf, terjadi kesalahan.', true);
  }
});

sessionSelect.addEventListener('change', () => {
  currentSessionId = sessionSelect.value;
  renderMessages();
});

newSessionBtn.addEventListener('click', () => createNewSession());

// initialize
loadSessions();
currentSessionId = sessions[0].id;
renderSessions();
renderMessages();
