import express from 'express';
import cors from 'cors';
import databaseSetup from './config/database';
import { initRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

// CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

// Database
databaseSetup();

// Routes
initRoutes(app);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;