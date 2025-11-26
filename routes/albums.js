import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all albums
router.get('/', async (req, res) => {
    try {
        // Fetch albums from database
        const { data: albums, error } = await supabase
            .from('albums')
            .select(`
                *,
                songs (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching albums:', error);
            return res.status(500).json({ error: 'Failed to fetch albums' });
        }

        // Transform data to match frontend format
        const formattedAlbums = albums.map(album => {
            // Deduplicate songs by title and src to prevent showing same song multiple times
            const seenSongs = new Map();
            const uniqueSongs = (album.songs || []).filter(song => {
                const key = `${song.title}-${song.src}`;
                if (seenSongs.has(key)) {
                    return false;
                }
                seenSongs.set(key, true);
                return true;
            });

            return {
                id: album.id,
                title: album.title,
                artist: album.artist,
                img: album.img,
                category: album.category,
                genre: album.genre,
                description: album.description,
                songs: uniqueSongs.map(song => ({
                    title: song.title,
                    src: song.src,
                    img: song.img || album.img,
                    duration: song.duration
                }))
            };
        });

        res.json(formattedAlbums);
    } catch (error) {
        console.error('Error in albums route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single album by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: album, error } = await supabase
            .from('albums')
            .select(`
                *,
                songs (*)
            `)
            .eq('id', id)
            .single();

        if (error || !album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        // Deduplicate songs by title and src to prevent showing same song multiple times
        const seenSongs = new Map();
        const uniqueSongs = (album.songs || []).filter(song => {
            const key = `${song.title}-${song.src}`;
            if (seenSongs.has(key)) {
                return false;
            }
            seenSongs.set(key, true);
            return true;
        });

        const formattedAlbum = {
            id: album.id,
            title: album.title,
            artist: album.artist,
            img: album.img,
            category: album.category,
            genre: album.genre,
            description: album.description,
            songs: uniqueSongs.map(song => ({
                title: song.title,
                src: song.src,
                img: song.img || album.img,
                duration: song.duration
            }))
        };

        res.json(formattedAlbum);
    } catch (error) {
        console.error('Error fetching album:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

