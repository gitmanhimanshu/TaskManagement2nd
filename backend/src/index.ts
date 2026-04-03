import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import employeeRoutes from './routes/employee.routes';

const app = express();

app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/employees', employeeRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

const startServer = async () => {
  await connectDatabase();
  
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
  });
};

startServer();
