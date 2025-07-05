import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbkzzbrrvullqlcdpxhb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZia3p6YnJydnVsbHFsY2RweGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODg2MDIsImV4cCI6MjA2NjI2NDYwMn0.LV1Omb_hRcz0hYJ5K7gH6rEZjjnr3CZV8dbsE22K8TQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);