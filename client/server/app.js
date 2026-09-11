import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (avatars) as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Single Central API Router Mounting
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    project: 'Salon Management System API',
    status: 'online',
    routes: '/api/v1/health'
  });
});

export default app;
