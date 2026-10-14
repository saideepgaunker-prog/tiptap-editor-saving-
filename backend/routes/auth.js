import { Router } from 'express';
import {
  ensureUserIndexes,
  findUserById,
  loginUser,
  registerUser,
  requireAuth,
} from '../auth.js';

const router = Router();

let indexesReady = false;
async function ready() {
  if (!indexesReady) {
    await ensureUserIndexes();
    indexesReady = true;
  }
}

router.post('/register', async (req, res) => {
  try {
    await ready();
    const result = await registerUser({
      email: req.body?.email,
      password: req.body?.password,
      name: req.body?.name,
    });
    return res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.code || 'register_failed',
      message: err.message || 'Registration failed',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    await ready();
    const result = await loginUser({
      email: req.body?.email,
      password: req.body?.password,
    });
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.code || 'login_failed',
      message: err.message || 'Login failed',
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized', message: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

export default router;
