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
      if (clean.includes('@')) return clean.toLowerCase();
      if (clean.toLowerCase() === 'admin' || clean.toLowerCase() === 'lms00000' || clean === '00000') {
        return 'lms00000@larassanti.co.id';
      }
      const formattedNik = clean.toUpperCase().startsWith('LMS') ? clean.toUpperCase() : `LMS${clean.toUpperCase()}`;
      return `${formattedNik.toLowerCase()}@larassanti.co.id`;
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
            const isAdminUser = cleanNik.toLowerCase() === 'admin' || data.user.user_metadata?.role === 'admin';
            const fallbackUser: UserProfile = {
              id: data.user.id,
              nik: isAdminUser ? 'admin' : cleanNik,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || (isAdminUser ? 'ADMIN' : `Karyawan ${cleanNik}`),
              department: data.user.user_metadata?.department || (isAdminUser ? 'admin' : 'rnd'),
              role: data.user.user_metadata?.role || (isAdminUser ? 'admin' : 'staff'),
              email: dummyEmail,
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
            return { user: fallbackUser, error: null };
          }

          const isAdminUser = profileData.role === 'admin' || cleanNik.toLowerCase() === 'admin' || profileData.nik === 'LMS00000' || data.user.user_metadata?.role === 'admin';
          const resolvedNik = isAdminUser ? 'admin' : ((data.user.user_metadata?.nik as string) || profileData.nik || cleanNik);

          const userProfile: UserProfile = {
            id: profileData.id,
            nik: resolvedNik,
            name: profileData.name || profileData.full_name || (isAdminUser ? 'ADMIN' : `Karyawan ${cleanNik}`),
            department: isAdminUser ? 'admin' : (profileData.department || 'rnd'),
            role: isAdminUser ? 'admin' : (profileData.role || 'staff'),
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

    // Local / Simulation Auth Fallback with Root Admin
    const foundDemoUser = DEMO_USERS.find(
      (u) => u.nik.toLowerCase() === cleanNik.toLowerCase() && (password === u.defaultPassword || password === 'admin' || password === 'password123')
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
        specificAccess: foundDemoUser.specificAccess || [],
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      return { user: userProfile, error: null };
    }

    // Check custom registered users in local storage
    const customUsersRaw = localStorage.getItem('cosmo_ddmp_registered_users');
    if (customUsersRaw) {
      try {
        const customUsers = JSON.parse(customUsersRaw);
        const match = customUsers.find(
          (u: { nik: string; password?: string }) => u.nik.toLowerCase() === cleanNik.toLowerCase()
        );
        if (match && (!match.password || match.password === password)) {
          const userProfile: UserProfile = {
            id: match.id,
            nik: match.nik,
            name: match.name,
            department: match.department,
            role: match.role,
            email: constructEmail(match.nik),
            lastLogin: new Date().toISOString(),
            specificAccess: match.specificAccess || [],
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
      error: `NIK "${cleanNik}" atau Kata Sandi yang dimasukkan tidak sesuai. Silakan periksa kembali atau gunakan tombol pendaftaran akun baru.`,
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
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'admin' || parsed.nik?.toLowerCase() === 'lms00000')) {
        parsed.nik = 'admin';
      }
      return parsed;
    } catch {
      return null;
    }
  },

  getRegisteredEmployees: (): any[] => {
    const raw = localStorage.getItem('cosmo_ddmp_registered_users');
    return raw ? JSON.parse(raw) : [];
  },

  registerEmployee: async (employee: {
    nik: string;
    name: string;
    department: UserProfile['department'];
    role: UserProfile['role'];
    password?: string;
    specificAccess?: UserProfile['specificAccess'];
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
      DEMO_USERS.some((u) => u.nik.toLowerCase() === cleanNik.toLowerCase()) ||
      customUsers.some((u: { nik: string }) => u.nik.toLowerCase() === cleanNik.toLowerCase())
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
      specificAccess: employee.specificAccess || [],
      createdAt: new Date().toISOString(),
    };

    customUsers.push(newUser);
    localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(customUsers));
    return { success: true };
  },

  updateEmployee: (nik: string, updatedData: Partial<UserProfile & { password?: string }>) => {
    const raw = localStorage.getItem('cosmo_ddmp_registered_users');
    if (!raw) return false;
    try {
      const list = JSON.parse(raw);
      const idx = list.findIndex((u: any) => u.nik.toLowerCase() === nik.toLowerCase());
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatedData };
        localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(list));
        return true;
      }
    } catch {
      return false;
    }
    return false;
  },

  deleteEmployee: (nik: string) => {
    const raw = localStorage.getItem('cosmo_ddmp_registered_users');
    if (!raw) return false;
    try {
      const list = JSON.parse(raw);
      const filtered = list.filter((u: any) => u.nik.toLowerCase() !== nik.toLowerCase());
      localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },
};
