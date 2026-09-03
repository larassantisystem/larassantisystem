import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile } from '../../types';
import { DEMO_USERS } from './mockUsers';

const AUTH_STORAGE_KEY = 'cosmo_ddmp_auth_user';

export const authService = {
  isConfigured: isSupabaseConfigured,

  login: async (nik: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> => {
    const cleanNik = nik.trim();
    const constructEmail = (rawNik: string) => {
      const clean = rawNik.trim();
      if (clean.toLowerCase() === 'admin' || clean.toLowerCase() === 'admin@larassanti.co.id') {
        return 'admin@larassanti.co.id';
      }
      if (clean.includes('@')) return clean.toLowerCase();
      const formattedNik = clean.toUpperCase().startsWith('LMS') ? clean.toUpperCase() : `LMS${clean.toUpperCase()}`;
      return `${formattedNik}@larassanti.co.id`;
    };
    const dummyEmail = constructEmail(cleanNik);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: password,
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          // Fetch profile from public.profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profileData) {
            const fallbackUser: UserProfile = {
              id: data.user.id,
              nik: cleanNik,
              name: data.user.user_metadata?.name || `Karyawan ${cleanNik}`,
              department: data.user.user_metadata?.department || 'rnd',
              role: data.user.user_metadata?.role || 'staff',
              email: dummyEmail,
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
            return { user: fallbackUser, error: null };
          }

          const userProfile: UserProfile = {
            id: profileData.id,
            nik: profileData.nik || cleanNik,
            name: profileData.name || profileData.full_name || `Karyawan ${cleanNik}`,
            department: profileData.department || 'rnd',
            role: profileData.role || 'staff',
            email: dummyEmail,
          };

          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
          return { user: userProfile, error: null };
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Gagal terhubung ke Supabase Auth';
        return { user: null, error: errMsg };
      }
    }

    // Local / Simulation Auth Fallback
    const foundDemoUser = DEMO_USERS.find(
      (u) => u.nik === cleanNik && (password === u.defaultPassword || password === 'password123' || password === '123456')
    );

    if (foundDemoUser) {
      const userProfile: UserProfile = {
        id: foundDemoUser.id,
        nik: foundDemoUser.nik,
        name: foundDemoUser.name,
        department: foundDemoUser.department,
        role: foundDemoUser.role,
        email: foundDemoUser.email,
        lastLogin: new Date().toISOString(),
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      return { user: userProfile, error: null };
    }

    // Check custom registered users in local storage
    const customUsersRaw = localStorage.getItem('cosmo_ddmp_registered_users');
    if (customUsersRaw) {
      try {
        const customUsers = JSON.parse(customUsersRaw);
        const match = customUsers.find((u: { nik: string; password?: string }) => u.nik === cleanNik);
        if (match && (!match.password || match.password === password)) {
          const userProfile: UserProfile = {
            id: match.id,
            nik: match.nik,
            name: match.name,
            department: match.department,
            role: match.role,
            email: constructEmail(match.nik),
            lastLogin: new Date().toISOString(),
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
          return { user: userProfile, error: null };
        }
      } catch (e) {
        console.error('Error parsing custom users', e);
      }
    }

    return {
      user: null,
      error: `NIK "${cleanNik}" atau password salah. Cek daftar NIK demo di bawah atau gunakan password default "password123".`,
    };
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error', err);
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  getCurrentUser: (): UserProfile | null => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  registerEmployee: async (employee: {
    nik: string;
    name: string;
    department: UserProfile['department'];
    role: UserProfile['role'];
    password?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const rawNik = employee.nik.trim();
    const cleanNik = rawNik.toLowerCase() === 'admin' ? 'admin' : (rawNik.toUpperCase().startsWith('LMS') ? rawNik.toUpperCase() : `LMS${rawNik.toUpperCase()}`);
    const password = employee.password || 'password123';
    const email = cleanNik === 'admin' ? 'admin@larassanti.co.id' : `${cleanNik}@larassanti.co.id`;

    // 1. Try to register in Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nik: cleanNik,
              full_name: employee.name,
              department: employee.department,
              role: employee.role,
            },
          },
        });
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.error('Supabase registration error', err);
        return { success: false, error: err.message };
      }
    }

    // Fallback: Save to local custom users storage for immediate testing
    const customUsersRaw = localStorage.getItem('cosmo_ddmp_registered_users');
    const customUsers = customUsersRaw ? JSON.parse(customUsersRaw) : [];
    
    // Check if NIK already exists
    if (
      DEMO_USERS.some((u) => u.nik === cleanNik) ||
      customUsers.some((u: { nik: string }) => u.nik === cleanNik)
    ) {
      return { success: false, error: `NIK ${cleanNik} sudah terdaftar di sistem!` };
    }

    const newUser = {
      id: `usr-custom-${Date.now()}`,
      nik: cleanNik,
      name: employee.name,
      department: employee.department,
      role: employee.role,
      password: password,
      createdAt: new Date().toISOString(),
    };

    customUsers.push(newUser);
    localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(customUsers));
    return { success: true };
  },
};
