import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAnon } from '../config/supabase.js';

const router = express.Router();

// User Registration (using Supabase Auth)
router.post('/insert', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).send('400::Please fill out all fields.');
        }

        if (password.length < 8) {
            return res.status(400).send('400::Password must be at least 8 characters long.');
        }

        // Check if username already exists in user_profiles
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingProfile) {
            return res.status(400).send('400::Username already exists.');
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm email
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                return res.status(400).send('400::Email already registered.');
            }
            console.error('Auth registration error:', authError);
            return res.status(500).send('500::Registration failed. Please try again.');
        }

        // Create user profile
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
                {
                    id: authData.user.id,
                    username: username
                }
            ]);

        if (profileError) {
            // If profile creation fails, delete the auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.error('Profile creation error:', profileError);
            return res.status(500).send('500::Registration failed. Please try again.');
        }

        res.status(200).send('200::Registration successful!');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('500::An error occurred during registration.');
    }
});

// User Login (using Supabase Auth)
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('400::Please enter both email and password.');
        }

        // Sign in with Supabase Auth (using anon client for sign-in)
        const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !authData.user) {
            return res.status(401).send('401::Invalid email or password.');
        }

        // Get user profile for username
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', authData.user.id)
            .single();

        // Generate JWT token with userId (Supabase Auth UUID) and email
        const token = jwt.sign(
            { 
                userId: authData.user.id, 
                email: authData.user.email, 
                username: profile?.username || email.split('@')[0]
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(200).send(`200::${token}`);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('500::An error occurred during login.');
    }
});

// Get username from token - fetch from backend database
router.post('/getusername', async (req, res) => {
    try {
        const { csrid: token } = req.body;

        if (!token) {
            return res.status(400).send('Token required');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;
            const email = decoded.email;
            
            if (!userId) {
                return res.status(403).send('Invalid token: missing user ID');
            }

            // Fetch username from user_profiles table (database)
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('username')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                // If profile doesn't exist, create it with default username
                const defaultUsername = email ? email.split('@')[0] : `user_${userId.substring(0, 8)}`;
                
                // Check if default username already exists
                let finalUsername = defaultUsername;
                let counter = 1;
                while (true) {
                    const { data: existing } = await supabase
                        .from('user_profiles')
                        .select('username')
                        .eq('username', finalUsername)
                        .single();
                    
                    if (!existing) {
                        break; // Username is available
                    }
                    finalUsername = `${defaultUsername}_${counter}`;
                    counter++;
                }

                // Create user profile with username
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert([{
                        id: userId,
                        username: finalUsername
                    }]);

                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                    // Fallback to username from token
                    return res.status(200).send(decoded.username || finalUsername);
                }
                
                return res.status(200).send(finalUsername);
            }

            // Return username from database
            res.status(200).send(profile.username);
        } catch (error) {
            console.error('JWT verification error:', error);
            res.status(403).send('Invalid or expired token');
        }
    } catch (error) {
        console.error('Get username error:', error);
        res.status(500).send('An error occurred');
    }
});

export default router;

