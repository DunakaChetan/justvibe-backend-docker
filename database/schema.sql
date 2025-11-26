DROP TABLE IF EXISTS listening_history CASCADE;
DROP TABLE IF EXISTS playlist_songs CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    location VARCHAR(100),
    profile_picture TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "notifications": true,
        "privacy": "public",
        "language": "en"
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE albums (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    img TEXT,
    category VARCHAR(50),
    genre VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id VARCHAR(100) REFERENCES albums(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    src TEXT NOT NULL,
    img TEXT,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_title VARCHAR(200) NOT NULL,
    song_src TEXT,
    song_img TEXT,
    album_id VARCHAR(100),
    album_cover TEXT,
    artist VARCHAR(100),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, song_title)
);

CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE playlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_title VARCHAR(200) NOT NULL,
    song_src TEXT,
    song_img TEXT,
    album_id VARCHAR(100),
    artist VARCHAR(100),
    position INTEGER,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE listening_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_title VARCHAR(200) NOT NULL,
    song_src TEXT,
    song_img TEXT,
    album_id VARCHAR(100),
    album_cover TEXT,
    artist VARCHAR(100),
    duration INTEGER,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_song_title ON favorites(song_title);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_history_user_id ON listening_history(user_id);
CREATE INDEX idx_history_played_at ON listening_history(played_at);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user_profiles" ON user_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage albums" ON albums
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view albums" ON albums
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage songs" ON songs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view songs" ON songs
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage favorites" ON favorites
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage playlists" ON playlists
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own playlists" ON playlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playlists" ON playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" ON playlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" ON playlists
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage playlist_songs" ON playlist_songs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage listening_history" ON listening_history
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own history" ON listening_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON listening_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON listening_history
    FOR DELETE USING (auth.uid() = user_id);
