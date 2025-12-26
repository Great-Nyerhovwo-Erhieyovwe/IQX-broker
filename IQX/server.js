import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './backend/routes/auth.js';
import usersRoutes from './backend/routes/users.js';

dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));

app.use(express.json());

// Use users routes
app.use('/api/users', usersRoutes);

// Use auth routes
app.use('/api', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, 'localhost', () => console.log(`Server running on port ${PORT}`));