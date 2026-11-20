import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import storesRouter from './routes/stores.js';
import ownerRouter from './routes/owner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to permit frontend requests from localhost:3000 / 127.0.0.1:3000
app.use(cors({
  origin: true, // reflect request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stores', storesRouter);
app.use('/api/owner', ownerRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Store Rating API Server is running.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Store Rating API Server is listening on port ${PORT} (http://127.0.0.1:${PORT})`);
});
