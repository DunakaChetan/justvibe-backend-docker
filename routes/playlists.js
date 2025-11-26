import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// All playlist routes require authentication
router.use(authenticateToken);

// Get all playlists for the current user
router.get('/user', async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data: playlists, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching playlists:', error);
            return res.status(500).json({ error: 'Failed to fetch playlists' });
        }

        // Get songs for each playlist
        const playlistsWithSongs = await Promise.all(
            playlists.map(async (playlist) => {
                const { data: songs } = await supabase
                    .from('playlist_songs')
                    .select('*')
                    .eq('playlist_id', playlist.id)
                    .order('position', { ascending: true })
                    .order('added_at', { ascending: false });

                return {
                    id: playlist.id,
                    name: playlist.name,
                    description: playlist.description,
                    coverImage: playlist.cover_image,
                    createdAt: playlist.created_at,
                    updatedAt: playlist.updated_at,
                    songs: (songs || []).map(song => ({
                        title: song.song_title,
                        src: song.song_src,
                        img: song.song_img,
                        albumId: song.album_id,
                        albumCover: song.song_img,
                        artist: song.artist,
                        position: song.position,
                        addedAt: song.added_at
                    }))
                };
            })
        );

        res.json({ playlists: playlistsWithSongs });
    } catch (error) {
        console.error('Error in get playlists:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new playlist
router.post('/create', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description, coverImage } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Playlist name is required' });
        }

        const playlistName = name.trim();

        // Check if a playlist with the same name already exists for this user
        const { data: existingPlaylist } = await supabase
            .from('playlists')
            .select('id, name')
            .eq('user_id', userId)
            .ilike('name', playlistName)
            .single();

        if (existingPlaylist) {
            return res.status(400).json({ error: `A playlist with the name "${playlistName}" already exists` });
        }

        const { data: playlist, error } = await supabase
            .from('playlists')
            .insert([
                {
                    user_id: userId,
                    name: playlistName,
                    description: description || null,
                    cover_image: coverImage || null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating playlist:', error);
            // Check if error is due to unique constraint violation
            if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                return res.status(400).json({ error: `A playlist with the name "${playlistName}" already exists` });
            }
            return res.status(500).json({ error: 'Failed to create playlist' });
        }

        res.json({
            message: 'Playlist created successfully',
            playlist: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                coverImage: playlist.cover_image,
                createdAt: playlist.created_at,
                updatedAt: playlist.updated_at,
                songs: []
            }
        });
    } catch (error) {
        console.error('Error in create playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a playlist
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, description, coverImage } = req.body;

        // Verify playlist belongs to user
        const { data: existingPlaylist } = await supabase
            .from('playlists')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existingPlaylist || existingPlaylist.user_id !== userId) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (coverImage !== undefined) updateData.cover_image = coverImage;
        updateData.updated_at = new Date().toISOString();

        const { data: playlist, error } = await supabase
            .from('playlists')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating playlist:', error);
            return res.status(500).json({ error: 'Failed to update playlist' });
        }

        res.json({
            message: 'Playlist updated successfully',
            playlist: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                coverImage: playlist.cover_image,
                createdAt: playlist.created_at,
                updatedAt: playlist.updated_at
            }
        });
    } catch (error) {
        console.error('Error in update playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a playlist
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Verify playlist belongs to user
        const { data: existingPlaylist } = await supabase
            .from('playlists')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existingPlaylist || existingPlaylist.user_id !== userId) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Delete playlist (cascade will delete playlist_songs)
        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting playlist:', error);
            return res.status(500).json({ error: 'Failed to delete playlist' });
        }

        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Error in delete playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get songs in a playlist
router.get('/:id/songs', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Verify playlist belongs to user
        const { data: playlist } = await supabase
            .from('playlists')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!playlist || playlist.user_id !== userId) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const { data: songs, error } = await supabase
            .from('playlist_songs')
            .select('*')
            .eq('playlist_id', id)
            .order('position', { ascending: true })
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Error fetching playlist songs:', error);
            return res.status(500).json({ error: 'Failed to fetch playlist songs' });
        }

        const formattedSongs = (songs || []).map(song => ({
            title: song.song_title,
            src: song.song_src,
            img: song.song_img,
            albumId: song.album_id,
            albumCover: song.song_img,
            artist: song.artist,
            position: song.position,
            addedAt: song.added_at
        }));

        res.json({ songs: formattedSongs });
    } catch (error) {
        console.error('Error in get playlist songs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add song(s) to a playlist
router.post('/:id/songs/add', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { songs } = req.body; // Array of songs

        if (!songs || !Array.isArray(songs) || songs.length === 0) {
            return res.status(400).json({ error: 'Songs array is required' });
        }

        // Verify playlist belongs to user
        const { data: playlist } = await supabase
            .from('playlists')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!playlist || playlist.user_id !== userId) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Get current max position
        const { data: existingSongs } = await supabase
            .from('playlist_songs')
            .select('position')
            .eq('playlist_id', id)
            .order('position', { ascending: false })
            .limit(1);

        let nextPosition = 1;
        if (existingSongs && existingSongs.length > 0 && existingSongs[0].position) {
            nextPosition = existingSongs[0].position + 1;
        }

        // Check which songs already exist
        const songTitles = songs.map(s => s.songTitle || s.title);
        const { data: existingPlaylistSongs } = await supabase
            .from('playlist_songs')
            .select('song_title')
            .eq('playlist_id', id)
            .in('song_title', songTitles);

        const existingTitles = new Set((existingPlaylistSongs || []).map(s => s.song_title));

        // Filter out duplicates and prepare insert data
        const songsToAdd = songs
            .filter(song => {
                const title = song.songTitle || song.title;
                return !existingTitles.has(title);
            })
            .map((song, index) => ({
                playlist_id: id,
                song_title: song.songTitle || song.title,
                song_src: song.songSrc || song.src,
                song_img: song.songImg || song.img,
                album_id: song.albumId || song.album_id,
                artist: song.artist,
                position: nextPosition + index
            }));

        if (songsToAdd.length === 0) {
            return res.status(400).json({ error: 'All songs are already in the playlist' });
        }

        const { data: insertedSongs, error } = await supabase
            .from('playlist_songs')
            .insert(songsToAdd)
            .select();

        if (error) {
            console.error('Error adding songs to playlist:', error);
            return res.status(500).json({ error: 'Failed to add songs to playlist' });
        }

        res.json({
            message: `Successfully added ${insertedSongs.length} song(s) to playlist`,
            songs: insertedSongs.map(song => ({
                title: song.song_title,
                src: song.song_src,
                img: song.song_img,
                albumId: song.album_id,
                albumCover: song.song_img,
                artist: song.artist,
                position: song.position,
                addedAt: song.added_at
            }))
        });
    } catch (error) {
        console.error('Error in add songs to playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove song from playlist
router.delete('/:id/songs/remove', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { songTitle } = req.body;

        if (!songTitle) {
            return res.status(400).json({ error: 'Song title is required' });
        }

        // Verify playlist belongs to user
        const { data: playlist } = await supabase
            .from('playlists')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!playlist || playlist.user_id !== userId) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const { error } = await supabase
            .from('playlist_songs')
            .delete()
            .eq('playlist_id', id)
            .eq('song_title', songTitle);

        if (error) {
            console.error('Error removing song from playlist:', error);
            return res.status(500).json({ error: 'Failed to remove song from playlist' });
        }

        res.json({ message: 'Song removed from playlist successfully' });
    } catch (error) {
        console.error('Error in remove song from playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove multiple songs from playlist
router.delete('/:id/songs/remove-multiple', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { songTitles } = req.body; // Array of song titles

        if (!songTitles || !Array.isArray(songTitles) || songTitles.length === 0) {
            return res.status(400).json({ error: 'Song titles array is required' });
        }

        // Verify playlist belongs to user
        const { data: playlist } = await supabase
            .from('playlists')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!playlist || playlist.user_id !== userId) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const { error } = await supabase
            .from('playlist_songs')
            .delete()
            .eq('playlist_id', id)
            .in('song_title', songTitles);

        if (error) {
            console.error('Error removing songs from playlist:', error);
            return res.status(500).json({ error: 'Failed to remove songs from playlist' });
        }

        res.json({ message: `Successfully removed ${songTitles.length} song(s) from playlist` });
    } catch (error) {
        console.error('Error in remove multiple songs from playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

