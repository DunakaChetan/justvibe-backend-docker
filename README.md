# JustVibe Backend

A Node.js/Express backend API for the JustVibe music streaming platform, powered by Supabase.

## Features

- 🔐 User Authentication (JWT-based)
- 🎵 Albums & Songs Management
- ❤️ Favorites System
- 👤 User Profiles
- 📊 Listening History (ready for implementation)
- 🎼 Playlists (ready for implementation)

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database and backend services
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Setup Instructions

### 1. Clone and Install

```bash
cd "JustVibe Backend"
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your:
   - Project URL
   - `anon` key (for client-side operations)
   - `service_role` key (for server-side operations)

### 3. Database Setup

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the SQL script from `database/schema.sql` to create all necessary tables

### 4. Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in `.env`:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_secure_random_string_here
   PORT=8080
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

   **Important:** Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### 5. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:8080` (or your configured PORT).

## API Endpoints

### Authentication

- `POST /users/insert` - Register a new user
- `POST /users/signin` - Login user
- `POST /users/getusername` - Get username from token

### Albums

- `GET /albums` - Get all albums
- `GET /albums/:id` - Get single album by ID

### Favorites (Requires Authentication)

- `GET /api/favorites/user` - Get user's favorites
- `POST /api/favorites/add` - Add song to favorites
- `DELETE /api/favorites/remove` - Remove song from favorites
- `POST /api/favorites/check` - Check if song is favorite
- `POST /api/favorites/toggle` - Toggle favorite status
- `GET /api/favorites/count` - Get favorites count

### Profile (Requires Authentication)

- `GET /users/profile/:username` - Get user profile
- `PUT /users/update/:username` - Update user profile
- `POST /users/profile-picture/:username` - Upload profile picture

## Authentication

The API uses JWT tokens for authentication. After login, include the token in the `Authorization` header:

```
Authorization: <your_jwt_token>
```

## Database Schema

The database includes the following main tables:

- `users` - User accounts and profiles
- `albums` - Music albums
- `songs` - Individual songs
- `favorites` - User favorite songs
- `playlists` - User playlists (for future use)
- `listening_history` - Play history (for future use)

See `database/schema.sql` for the complete schema.

## File Uploads

Profile pictures are stored in the `uploads/profile-pictures/` directory. In production, consider using Supabase Storage or another cloud storage service.

## Development

### Project Structure

```
JustVibe Backend/
├── config/
│   └── supabase.js       # Supabase client configuration
├── database/
│   └── schema.sql         # Database schema
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── albums.js         # Album routes
│   ├── favorites.js      # Favorites routes
│   └── profile.js        # Profile routes
├── uploads/              # File uploads directory
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js             # Main server file
```

## Troubleshooting

### Common Issues

1. **Connection to Supabase fails**
   - Verify your `SUPABASE_URL` and keys in `.env`
   - Check your Supabase project is active

2. **JWT errors**
   - Ensure `JWT_SECRET` is set in `.env`
   - Verify tokens haven't expired (default: 7 days)

3. **CORS errors**
   - Update `CORS_ORIGIN` in `.env` to match your frontend URL

4. **Database errors**
   - Ensure you've run the schema.sql script
   - Check table names match exactly (case-sensitive)

## Security Notes

- Never commit `.env` file to version control
- Use strong, random `JWT_SECRET` in production
- Consider enabling Supabase Row Level Security (RLS) policies
- Validate and sanitize all user inputs
- Use HTTPS in production

## License

ISC

