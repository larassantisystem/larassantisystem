import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile } from '../../types';
import { DEMO_USERS, INITIAL_SYSTEM_USERS } from './mockUsers';

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

          const accessMapRaw = localStorage.getItem('cosmo_ddmp_specific_access_map');
          const accessMap = accessMapRaw ? JSON.parse(accessMapRaw) : {};

          const userProfile: UserProfile = {
            id: profileData.id,
            nik: resolvedNik,
            name: profileData.name || profileData.full_name || (isAdminUser ? 'ADMIN' : `Karyawan ${cleanNik}`),
            department: isAdminUser ? 'admin' : (profileData.department || 'rnd'),
            role: isAdminUser ? 'admin' : (profileData.role || 'staff'),
            email: dummyEmail,
            specificAccess: accessMap[resolvedNik.toLowerCase()] || [],
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

  getAllEmployees: async (): Promise<UserProfile[]> => {
    const accessMapRaw = localStorage.getItem('cosmo_ddmp_specific_access_map');
    const accessMap: Record<string, any[]> = accessMapRaw ? JSON.parse(accessMapRaw) : {};

    const deactivatedRaw = localStorage.getItem('cosmo_ddmp_deactivated_niks');
    const deactivatedNiks: string[] = deactivatedRaw ? JSON.parse(deactivatedRaw) : [];

    const customUsersRaw = localStorage.getItem('cosmo_ddmp_registered_users');
    const customUsers: UserProfile[] = customUsersRaw ? JSON.parse(customUsersRaw) : [];

    let resultList: UserProfile[] = [];

    // 1. Fetch from Supabase profiles if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && profiles && profiles.length > 0) {
          resultList = profiles.map((p: any) => {
            const isAdmin = p.nik === 'LMS00000' || p.nik?.toLowerCase() === 'admin' || p.role === 'admin';
            const cleanNik = isAdmin ? 'admin' : (p.nik || 'N/A');
            return {
              id: p.id,
              nik: cleanNik,
              name: p.full_name || p.name || (isAdmin ? 'ADMIN' : `Karyawan ${cleanNik}`),
              department: (isAdmin ? 'admin' : (p.department || 'rnd')) as UserProfile['department'],
              role: (isAdmin ? 'admin' : (p.role || 'staff')) as UserProfile['role'],
              email: p.email || (cleanNik === 'admin' ? 'lms00000@larassanti.co.id' : `${cleanNik.toLowerCase()}@larassanti.co.id`),
              specificAccess: accessMap[cleanNik.toLowerCase()] || [],
            };
          });
        }
      } catch (err) {
        console.warn('Could not fetch profiles from Supabase, using fallback list', err);
      }
    }

    // 2. Ensure all INITIAL_SYSTEM_USERS exist in resultList
    if (resultList.length === 0) {
      resultList = INITIAL_SYSTEM_USERS.map((u) => ({
        id: u.id,
        nik: u.nik,
        name: u.name,
        department: u.department,
        role: u.role,
        email: u.email,
        specificAccess: accessMap[u.nik.toLowerCase()] || u.specificAccess || [],
      }));
    } else {
      for (const sysUser of INITIAL_SYSTEM_USERS) {
        const exists = resultList.some((r) => r.nik.toLowerCase() === sysUser.nik.toLowerCase());
        if (!exists) {
          resultList.push({
            id: sysUser.id,
            nik: sysUser.nik,
            name: sysUser.name,
            department: sysUser.department,
            role: sysUser.role,
            email: sysUser.email,
            specificAccess: accessMap[sysUser.nik.toLowerCase()] || sysUser.specificAccess || [],
          });
        }
      }
    }

    // 3. Merge custom local users
    for (const cust of customUsers) {
      const idx = resultList.findIndex((r) => r.nik.toLowerCase() === cust.nik.toLowerCase());
      if (idx !== -1) {
        resultList[idx] = {
          ...resultList[idx],
          ...cust,
          specificAccess: accessMap[cust.nik.toLowerCase()] || cust.specificAccess || resultList[idx].specificAccess || [],
        };
      } else {
        resultList.push({
          ...cust,
          specificAccess: accessMap[cust.nik.toLowerCase()] || cust.specificAccess || [],
        });
      }
    }

    // Filter out deactivated accounts
    return resultList.filter((u) => !deactivatedNiks.includes(u.nik.toLowerCase()));
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

    // Ensure specific access map is updated
    if (employee.specificAccess && employee.specificAccess.length > 0) {
      const accessMapRaw = localStorage.getItem('cosmo_ddmp_specific_access_map');
      const accessMap = accessMapRaw ? JSON.parse(accessMapRaw) : {};
      accessMap[cleanNik.toLowerCase()] = employee.specificAccess;
      localStorage.setItem('cosmo_ddmp_specific_access_map', JSON.stringify(accessMap));
    }

    // Ensure removed from deactivated list if re-registering
    const deactivatedRaw = localStorage.getItem('cosmo_ddmp_deactivated_niks');
    if (deactivatedRaw) {
      const deactivatedNiks: string[] = JSON.parse(deactivatedRaw);
      const filtered = deactivatedNiks.filter((n) => n.toLowerCase() !== cleanNik.toLowerCase());
      localStorage.setItem('cosmo_ddmp_deactivated_niks', JSON.stringify(filtered));
    }

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
        if (error) {
          console.warn('Supabase signUp warning:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase registration exception', err);
      }
    }

    // Save to local custom users storage for instantaneous overlay and login
    const customUsersRaw = localStorage.getItem('cosmo_ddmp_registered_users');
    const customUsers = customUsersRaw ? JSON.parse(customUsersRaw) : [];
    
    const existingIdx = customUsers.findIndex((u: any) => u.nik.toLowerCase() === cleanNik.toLowerCase());
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

    if (existingIdx >= 0) {
      customUsers[existingIdx] = newUser;
    } else {
      customUsers.push(newUser);
    }

    localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(customUsers));
    return { success: true };
  },

  updateEmployee: (nik: string, updatedData: Partial<UserProfile & { password?: string }>) => {
    const cleanNik = nik.trim().toLowerCase();

    // 1. Update specific access map
    if (updatedData.specificAccess !== undefined) {
      const accessMapRaw = localStorage.getItem('cosmo_ddmp_specific_access_map');
      const accessMap = accessMapRaw ? JSON.parse(accessMapRaw) : {};
      accessMap[cleanNik] = updatedData.specificAccess;
      localStorage.setItem('cosmo_ddmp_specific_access_map', JSON.stringify(accessMap));
    }

    // 2. Update custom users list
    const raw = localStorage.getItem('cosmo_ddmp_registered_users');
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((u: any) => u.nik.toLowerCase() === cleanNik);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedData };
    } else {
      list.push({
        id: `usr-${cleanNik}`,
        nik: updatedData.nik || nik,
        name: updatedData.name || `Karyawan ${nik}`,
        department: updatedData.department || 'rnd',
        role: updatedData.role || 'staff',
        email: updatedData.email || `${cleanNik}@larassanti.co.id`,
        specificAccess: updatedData.specificAccess || [],
        ...updatedData,
      });
    }
    localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(list));

    // 3. If currently logged in user is updated, sync local storage session
    const currentSession = authService.getCurrentUser();
    if (currentSession && currentSession.nik.toLowerCase() === cleanNik) {
      const updatedSession = { ...currentSession, ...updatedData };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));
    }

    return true;
  },

  deleteEmployee: (nik: string) => {
    const cleanNik = nik.trim().toLowerCase();
    const raw = localStorage.getItem('cosmo_ddmp_registered_users');
    if (raw) {
      try {
        const list = JSON.parse(raw);
        const filtered = list.filter((u: any) => u.nik.toLowerCase() !== cleanNik);
        localStorage.setItem('cosmo_ddmp_registered_users', JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }
    }

    const deactivatedRaw = localStorage.getItem('cosmo_ddmp_deactivated_niks');
    const deactivatedNiks: string[] = deactivatedRaw ? JSON.parse(deactivatedRaw) : [];
    if (!deactivatedNiks.includes(cleanNik)) {
      deactivatedNiks.push(cleanNik);
      localStorage.setItem('cosmo_ddmp_deactivated_niks', JSON.stringify(deactivatedNiks));
    }

    return true;
  },
};
