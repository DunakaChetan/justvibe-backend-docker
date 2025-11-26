import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);

// Get all favorites for the current user
router.get('/user', async (req, res) => {
    try {
        const userId = req.user.userId; // Using Supabase UUID

        const { data: favorites, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Error fetching favorites:', error);
            return res.status(500).json({ error: 'Failed to fetch favorites' });
        }

        // Return favorites in consistent format
        const formattedFavorites = favorites.map(fav => ({
            id: fav.id,
            songTitle: fav.song_title,
            songSrc: fav.song_src,
            songImg: fav.song_img,
            albumId: fav.album_id,
            albumCover: fav.album_cover,
            artist: fav.artist,
            addedAt: fav.added_at
        }));
        res.json({ favorites: formattedFavorites });
    } catch (error) {
        console.error('Error in get favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a song to favorites
router.post('/add', async (req, res) => {
    try {
        const userId = req.user.userId; // Using Supabase UUID
        const { songTitle, songSrc, songImg, albumId, albumCover, artist } = req.body;

        if (!songTitle) {
            return res.status(400).json({ error: 'Song title is required' });
        }

        // Check if already in favorites
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('song_title', songTitle)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Song already in favorites' });
        }

        // Add to favorites
        const { data: favorite, error } = await supabase
            .from('favorites')
            .insert([
                {
                    user_id: userId,
                    song_title: songTitle,
                    song_src: songSrc,
                    song_img: songImg,
                    album_id: albumId,
                    album_cover: albumCover,
                    artist: artist
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding favorite:', error);
            return res.status(500).json({ error: 'Failed to add to favorites' });
        }

        res.json({ message: 'Song added to favorites successfully', favorite });
    } catch (error) {
        console.error('Error in add favorite:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove a song from favorites
router.delete('/remove', async (req, res) => {
    try {
        const userId = req.user.userId; // Using Supabase UUID
        const { songTitle } = req.body;

        if (!songTitle) {
            return res.status(400).json({ error: 'Song title is required' });
        }

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('song_title', songTitle);

        if (error) {
            console.error('Error removing favorite:', error);
            return res.status(500).json({ error: 'Failed to remove from favorites' });
        }

        res.json({ message: 'Song removed from favorites successfully' });
    } catch (error) {
        console.error('Error in remove favorite:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check if a song is in favorites
router.post('/check', async (req, res) => {
    try {
        const userId = req.user.userId; // Using Supabase UUID
        const { songTitle } = req.body;

        if (!songTitle) {
            return res.json({ isFavorite: false });
        }

        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('song_title', songTitle)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking favorite:', error);
            return res.json({ isFavorite: false });
        }

        res.json({ isFavorite: !!data });
    } catch (error) {
        console.error('Error in check favorite:', error);
        res.json({ isFavorite: false });
    }
});

// Toggle favorite (add if not exists, remove if exists)
router.post('/toggle', async (req, res) => {
    try {
        const userId = req.user.userId; // Using Supabase UUID
        const { songTitle, songSrc, songImg, albumId, albumCover, artist } = req.body;

        if (!songTitle) {
            return res.status(400).json({ error: 'Song title is required' });
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('song_title', songTitle)
            .single();

        if (existing) {
            // Remove
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('song_title', songTitle);

            if (error) {
                return res.status(500).json({ error: 'Failed to remove from favorites' });
            }

            return res.json({ action: 'removed', message: 'Song removed from favorites', isFavorite: false });
        } else {
            // Add
            const { data: favorite, error } = await supabase
                .from('favorites')
                .insert([
                    {
                        user_id: userId,
                        song_title: songTitle,
                        song_src: songSrc,
                        song_img: songImg,
                        album_id: albumId,
                        album_cover: albumCover,
                        artist: artist
                    }
                ])
                .select()
                .single();

            if (error) {
                return res.status(500).json({ error: 'Failed to add to favorites' });
            }

            return res.json({ action: 'added', message: 'Song added to favorites', favorite, isFavorite: true });
        }
    } catch (error) {
        console.error('Error in toggle favorite:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get favorites count
router.get('/count', async (req, res) => {
    try {
        const userId = req.user.userId; // Using Supabase UUID

        const { count, error } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.error('Error getting favorites count:', error);
            return res.status(500).json({ error: 'Failed to get favorites count' });
        }

        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Error in favorites count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

