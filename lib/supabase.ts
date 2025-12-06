import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qunbglfspdhzlmkrdqxc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bmJnbGZzcGRoemxta3JkcXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTYxMjQsImV4cCI6MjA3MzY3MjEyNH0.tB7AmwC3H6d-6ET1-o3L8mnTNO8BFthO86UpzzAjqCg';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

