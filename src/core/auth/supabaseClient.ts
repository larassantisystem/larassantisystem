import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const fromStorage = window.localStorage.getItem(key) || window.localStorage.getItem(`VITE_${key}`);
    if (fromStorage) return fromStorage;
  }
  return '';
};

const DEFAULT_SUPABASE_URL = 'https://qtzhrcgewajulanpslpo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0emhyY2dld2FqdWxhbnBzbHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTM2MzUsImV4cCI6MjEwMzkyOTYzNX0.VL56u-ylYucHVVZxWQRDP2C2hzLaRWvUaKvpUQpl-F0';

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (url, options = {}) => {
          const maxRetries = 2;
          let lastErr: any;
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              const res = await fetch(url, options);
              if (!res.ok) {
                const clone = res.clone();
                try {
                  const bodyText = await clone.text();
                  if (
                    bodyText.includes('exceed_egress_quota') ||
                    bodyText.includes('restricted due to') ||
                    bodyText.includes('spend caps') ||
                    bodyText.includes('egress_quota')
                  ) {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('supabase-restriction', {
                          detail: 'Service for this project is restricted due to exceeding the egress quota. The project owner must upgrade their plan or remove spend caps to restore service.'
                        })
                      );
                    }
                  }
                } catch (cloneErr) {
                  // ignore
                }
              }
              return res;
            } catch (err: any) {
              lastErr = err;
              if (attempt < maxRetries) {
                await new Promise((res) => setTimeout(res, 250 * (attempt + 1)));
                continue;
              }
            }
          }
          throw lastErr;
        },
      },
    })
  : null;
