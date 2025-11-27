import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import albumRoutes from './routes/albums.js';
import favoriteRoutes from './routes/favorites.js';
import playlistRoutes from './routes/playlists.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
// CORS configuration - allows both local development and production frontend
const allowedOrigins = [
    'http://localhost:5173',  // Local development
    'http://localhost:30082',  // Alternative local port
    'https://justvibe-eight.vercel.app',  // Production frontend
    process.env.CORS_ORIGIN  // Additional origin from environment variable
].filter(Boolean); // Remove any undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // In development, allow localhost origins
            if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', authRoutes);
app.use('/albums', albumRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/users', profileRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'JustVibe Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 JustVibe Backend server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

