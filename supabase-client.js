import { createClient } from "@supabase/supabase-js";

// Valori del tuo progetto Supabase (già inseriti e verificati).
export const SUPABASE_URL = "https://sitenmuxsrkrrlpmlfvy.supabase.co/rest/v1/";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdGVubXV4c3JrcnJscG1sZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDAyMDksImV4cCI6MjEwMjY3NjIwOX0.bd2mB5iIF4yGFO8_n1vVvsRbcwvG29rillW-M3NLOEQ";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
