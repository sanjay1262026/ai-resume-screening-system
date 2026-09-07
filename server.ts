import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Persistent Server-Side Data Storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USER_DATA_FILE = path.join(DATA_DIR, 'user_screening_data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  passwordHash?: string;
  createdAt: string;
}

interface UserScreeningPayload {
  username: string;
  jdTitle: string;
  jdText: string;
  weights: any;
  candidates: any[];
  sessions: any[];
  updatedAt: string;
}

function loadUsers(): Record<string, UserRecord> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return {
    admin: {
      id: '1',
      username: 'admin',
      fullName: 'Lead Recruiter',
      createdAt: new Date().toISOString(),
    },
  };
}

function saveUsers(users: Record<string, UserRecord>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

function loadUserDataStore(): Record<string, UserScreeningPayload> {
  try {
    if (fs.existsSync(USER_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading user data store:', err);
  }
  return {};
}

function saveUserDataStore(store: Record<string, UserScreeningPayload>) {
  try {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving user data store:', err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Authentication: Login or Auto-login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUser = (username || '').toLowerCase().trim();

  if (!cleanUser) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const users = loadUsers();
  let user = users[cleanUser];

  if (!user) {
    // Auto-create user account so user can easily sign in from any new device!
    user = {
      id: String(Date.now()),
      username: cleanUser,
      fullName: cleanUser === 'admin' ? 'Lead Recruiter' : cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      createdAt: new Date().toISOString(),
    };
    users[cleanUser] = user;
    saveUsers(users);
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.fullName,
    },
  });
});

// 3. User Data Fetch (Cross-Device automatic sync)
app.get('/api/user-data/:username', (req, res) => {
  const cleanUser = (req.params.username || '').toLowerCase().trim();
  const store = loadUserDataStore();
  const data = store[cleanUser];

  if (!data) {
    return res.json({
      exists: false,
      data: null,
    });
  }

  return res.json({
    exists: true,
    data,
  });
});

// 4. User Data Auto-Save (Automatically persists data across devices)
app.post('/api/user-data/:username', (req, res) => {
  const cleanUser = (req.params.username || '').toLowerCase().trim();
  if (!cleanUser) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const { jdTitle, jdText, weights, candidates, sessions } = req.body;
  const store = loadUserDataStore();

  store[cleanUser] = {
    username: cleanUser,
    jdTitle: jdTitle || '',
    jdText: jdText || '',
    weights: weights || null,
    candidates: Array.isArray(candidates) ? candidates : [],
    sessions: Array.isArray(sessions) ? sessions : [],
    updatedAt: new Date().toISOString(),
  };

  saveUserDataStore(store);
  return res.json({ success: true, savedAt: store[cleanUser].updatedAt });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
