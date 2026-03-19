import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const ownerId = import.meta.env.VITE_SUPABASE_OWNER_ID || '';

export const cloudConfig = {
  url,
  ownerId,
  enabled: Boolean(url && anonKey && ownerId)
};

export const supabase = cloudConfig.enabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: false
      }
    })
  : null;
