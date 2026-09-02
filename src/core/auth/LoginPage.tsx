import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { DEMO_USERS } from './mockUsers';
import { authService } from './authService';
import {
  Sparkles,
  Lock,
  UserCheck,
  Building2,
  ShieldCheck,
  FlaskConical,
  CalendarDays,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Department, Role } from '../../types';
import { Logo } from '../../components/Logo';

export const LoginPage: React.FC = () => {
  const { login, switchUser, isLoading } = useAuth();
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form for registering new employee
  const [regNik, setRegNik] = useState('');
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState<Department>('rnd');
  const [regRole, setRegRole] = useState<Role>('staff');
  const [regPassword, setRegPassword] = useState('password123');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!nik.trim()) {
      setErrorMessage('Silakan masukkan Nomor Induk Karyawan (NIK)');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(nik, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'NIK atau Password tidak valid');
    }
  };

  const handleQuickLogin = async (demoNik: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    await switchUser(demoNik);
    setIsSubmitting(false);
  };

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNik.trim() || !regName.trim()) return;

    const res = await authService.registerEmployee({
      nik: regNik,
      name: regName,
      department: regDept,
      role: regRole,
      password: regPassword,
    });

    if (res.success) {
      setRegSuccessMsg(`Karyawan ${regName} (NIK: ${regNik}) berhasil didaftarkan!`);
      setNik(regNik);
      setPassword(regPassword);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccessMsg(null);
        setRegNik('');
        setRegName('');
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Gagal mendaftarkan karyawan');
    }
  };

  const getDepartmentIcon = (dept: Department) => {
    switch (dept) {
      case 'rnd':
        return <FlaskConical className="w-4 h-4 text-emerald-600" />;
      case 'ppic':
        return <CalendarDays className="w-4 h-4 text-blue-600" />;
      case 'quality':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case 'warehouse':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'procurement':
        return <ShoppingCart className="w-4 h-4 text-purple-600" />;
      case 'sales':
        return <TrendingUp className="w-4 h-4 text-pink-600" />;
      case 'admin':
      case 'management':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      default:
        return <Building2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDepartmentBadgeColor = (dept: Department) => {
    switch (dept) {
      case 'rnd':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ppic':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'quality':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'warehouse':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'procurement':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'sales':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'admin':
      case 'management':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b072c] via-[#2a0b45] to-[#12041e] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Luxurious ambient royal purple and gold glows */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full bg-purple-600/25 blur-[120px]"></div>
        <div className="absolute top-1/3 -left-32 w-[450px] h-[450px] rounded-full bg-indigo-600/20 blur-[100px]"></div>
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[140px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Brand header with Professional Luxury Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white uppercase sm:text-3xl px-2 drop-shadow-sm">
            PT. LARASSANTI MAKMUR SEJAHTERA
          </h1>
          <p className="mt-1.5 text-xs font-bold tracking-widest text-purple-200/90 uppercase">
            Demand-Driven Manufacturing & Material Planner
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-purple-950/70 border border-purple-400/30 text-amber-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] tracking-wide">Sistem Terakreditasi CPKB / GMP Kosmetik</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-purple-950/40 rounded-3xl border border-white/20 sm:px-10">
          {/* Header Login Form */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Autentikasi Karyawan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Silakan masuk menggunakan NIK Anda</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 font-bold">
                {authService.isConfigured ? 'Supabase Database' : 'Internal Secure'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800 text-xs">Gagal Masuk</p>
                <p className="text-xs mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
                Nomor Induk Karyawan (NIK)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Contoh: 1001 (Admin) atau 2001 (RnD)"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 transition-all font-mono"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Sistem otorisasi otomatis memetakan hak akses departemen Anda.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                  Kata Sandi
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Demo: <span className="font-mono bg-purple-50 px-1 py-0.5 rounded border border-purple-100 text-purple-700 font-bold">password123</span>
                </span>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-purple-700/25 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50 transition-all cursor-pointer border border-purple-600"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memverifikasi...
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1 text-white/80" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Login for Demo & Testing */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Masuk Cepat Departemen (Demo):
              </span>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="text-xs text-purple-700 hover:text-purple-800 flex items-center gap-1 font-bold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Daftar Baru
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => handleQuickLogin(demo.nik)}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1 w-full mb-1">
                    {getDepartmentIcon(demo.department)}
                    <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-purple-700 transition-colors truncate">
                      {demo.department}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 truncate w-full group-hover:text-purple-950 transition-colors">
                    {demo.name.split(',')[0]}
                  </span>
                  <div className="mt-1 flex items-center justify-between w-full text-[9px]">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-purple-700 font-bold">
                      NIK {demo.nik}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info & Address in high-contrast light text */}
        <div className="mt-6 text-center space-y-1.5">
          <p className="text-xs font-bold text-purple-100 tracking-wide uppercase drop-shadow-xs">
            PT. LARASSANTI MAKMUR SEJAHTERA
          </p>
          <p className="text-[10px] text-purple-200/70 leading-relaxed max-w-sm mx-auto">
            Jl. Pembangunan 3 No.38 A, RT.005/RW.004, Batusari, Kec. Batuceper, Kota Tangerang, Banten 15121
          </p>
          <p className="text-[10px] text-purple-300/50 pt-1.5 border-t border-purple-800/40 max-w-xs mx-auto">
            CPKB / GMP Quality Assurance & Production Planner
          </p>
        </div>
      </div>

      {/* Modal: Daftarkan Karyawan Baru (Admin Simulation) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-800 relative">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Pendaftaran Karyawan Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Admin mendaftarkan NIK & Departemen tanpa membutuhkan email pribadi karyawan.
            </p>

            {regSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Induk Karyawan (NIK)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 9001"
                  value={regNik}
                  onChange={(e) => setRegNik(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Aisyah, S.Farm"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen</label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value as Department)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                  >
                    <option value="rnd">RnD (Research & Dev)</option>
                    <option value="ppic">PPIC (Planning)</option>
                    <option value="quality">Quality (QA/QC)</option>
                    <option value="warehouse">Warehouse (Gudang)</option>
                    <option value="procurement">Procurement (Purchasing)</option>
                    <option value="sales">Sales (Penjualan)</option>
                    <option value="management">Management</option>
                    <option value="admin">IT / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                  >
                    <option value="staff">Staff</option>
                    <option value="operator">Operator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Sementara</label>
                <input
                  type="text"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-colors border border-purple-500 cursor-pointer"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

