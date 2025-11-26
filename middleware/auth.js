import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader; // Frontend sends token directly, not as "Bearer token"

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        // Extract userId from token (Supabase Auth UUID)
        const userId = decoded.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token: missing user ID' });
        }
        
        // Verify user exists in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError || !authUser) {
            return res.status(401).json({ error: 'Invalid token: user not found' });
        }

        // Get user profile for username
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', userId)
            .single();
        
        req.user = { 
            userId: authUser.user.id, 
            email: authUser.user.email, 
            username: profile?.username || decoded.username || email.split('@')[0]
        };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export default authenticateToken;

