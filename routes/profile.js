import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/profile-pictures/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.params.username + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Get user profile
router.get('/profile/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user email from auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);

        // Get user stats
        const [favoritesCount, playlistsCount] = await Promise.all([
            supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id),
            supabase
                .from('playlists')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
        ]);

        res.json({
            id: profile.id,
            username: profile.username,
            email: authUser?.user?.email || '',
            bio: profile.bio,
            location: profile.location,
            profilePicture: profile.profile_picture,
            socialLinks: profile.social_links,
            preferences: profile.preferences,
            stats: {
                playlists: playlistsCount.count || 0,
                favorites: favoritesCount.count || 0,
                hoursPlayed: 0,
                minutesPlayed: 0,
                followers: 0,
                following: 0,
                totalPlays: 0
            },
            topArtists: [],
            topGenres: [],
            recentlyPlayed: []
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/update/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        const userId = req.user.userId;
        const updates = req.body;

        // Verify user owns this profile and get current profile data
        const { data: profile, error: profileFetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (profileFetchError || !profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        if (profile.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Handle password update (using Supabase Auth)
        if (updates.newPassword) {
            if (!updates.currentPassword) {
                return res.status(400).json({ error: 'Current password is required' });
            }

            // Get auth user to verify current password
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            if (!authUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update password using Supabase Auth
            const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
                password: updates.newPassword
            });

            if (passwordError) {
                return res.status(400).json({ error: 'Failed to update password' });
            }

            delete updates.newPassword;
            delete updates.currentPassword;
        }

        // Prepare update object for user_profiles
        const updateData = {};
        if (updates.username) updateData.username = updates.username;
        if (updates.bio) updateData.bio = updates.bio;
        if (updates.location) updateData.location = updates.location;
        if (updates.socialLinks) updateData.social_links = updates.socialLinks;
        if (updates.preferences) updateData.preferences = updates.preferences;

        // Update email in auth.users if provided
        if (updates.email) {
            const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
                email: updates.email
            });
            if (emailError) {
                return res.status(400).json({ error: 'Failed to update email' });
            }
        }

        // Update user profile (only if there are fields to update)
        let updatedProfile = profile; // Default to current profile
        if (Object.keys(updateData).length > 0) {
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (profileError) {
                console.error('Error updating profile:', profileError);
                return res.status(500).json({ error: 'Failed to update profile' });
            }

            if (profileData) {
                updatedProfile = profileData;
            }
        }

        // Get updated email from auth (with error handling)
        let email = updates.email || '';
        try {
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
            if (!authError && authUser?.user?.email) {
                email = authUser.user.email;
            }
        } catch (authErr) {
            console.error('Error fetching auth user for email:', authErr);
            // Continue with email from updates if available
        }

        // Return updated profile data
        // Handle social_links and preferences which might be JSON strings
        let socialLinks = {};
        if (updatedProfile.social_links) {
            if (typeof updatedProfile.social_links === 'string') {
                try {
                    socialLinks = JSON.parse(updatedProfile.social_links);
                } catch (e) {
                    socialLinks = {};
                }
            } else {
                socialLinks = updatedProfile.social_links;
            }
        }

        let preferences = {};
        if (updatedProfile.preferences) {
            if (typeof updatedProfile.preferences === 'string') {
                try {
                    preferences = JSON.parse(updatedProfile.preferences);
                } catch (e) {
                    preferences = {};
                }
            } else {
                preferences = updatedProfile.preferences;
            }
        }

        res.json({
            id: updatedProfile.id,
            username: updatedProfile.username,
            email: email,
            bio: updatedProfile.bio || null,
            location: updatedProfile.location || null,
            profilePicture: updatedProfile.profile_picture || null,
            socialLinks: socialLinks,
            preferences: preferences
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload profile picture
router.post('/profile-picture/:username', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        const { username } = req.params;
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Verify user owns this profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (!profile || profile.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // In production, you would upload to Supabase Storage or another cloud service
        // For now, we'll store the relative path
        const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;

        // Update user profile picture
        const { data: updatedProfile, error } = await supabase
            .from('user_profiles')
            .update({ profile_picture: profilePicturePath })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile picture:', error);
            return res.status(500).json({ error: 'Failed to update profile picture' });
        }

        res.json({ profilePicture: updatedProfile.profile_picture });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

