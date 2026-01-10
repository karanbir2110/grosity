// config.js
const SUPABASE_URL = 'https://dtnnozzuixtaomabgfxf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bm5venp1aXh0YW9tYWJnZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NTgwNDIsImV4cCI6MjA4MjEzNDA0Mn0.7WCcbUz5x5VjW9EwM9p_CTw7Y_a3vrnoDdbVTGz-9Gs';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false } }
);

console.log('✅ Supabase configured');


// https://dtnnozzuixtaomabgfxf.supabase.co

