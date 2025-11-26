import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Create Supabase client with anon key for client-side operations (if needed)
export const supabaseAnon = createClient(
    supabaseUrl, 
    process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    }
);

export default supabase;

