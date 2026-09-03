import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { DEMO_USERS } from './mockUsers';
import { authService } from './authService';
import {
  Lock,
  Mail,
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
  Layers,
  ArrowRight,
  X,
  Boxes,
  Award,
  RotateCcw
} from 'lucide-react';
import { Department, Role } from '../../types';
import { Logo } from '../../components/Logo';

export const LoginPage: React.FC = () => {
  const { login, switchUser, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

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
    if (!username.trim()) {
      setErrorMessage('Silakan masukkan Email, Username (admin), atau NIK (contoh: LMS2001 / LMS4001)');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Kata Sandi akun Anda');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Autentikasi gagal. NIK/Username atau Kata Sandi yang dimasukkan tidak sesuai.');
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
    if (!regNik.trim() || !regName.trim()) {
      setErrorMessage('Lengkapi NIK (dengan awalan LMS) dan Nama Karyawan.');
      return;
    }

    const res = await authService.registerEmployee({
      nik: regNik,
      name: regName,
      department: regDept,
      role: regRole,
      password: regPassword,
    });

    if (res.success) {
      const formattedNik = regNik.toLowerCase() === 'admin' ? 'admin' : (regNik.toUpperCase().startsWith('LMS') ? regNik.toUpperCase() : `LMS${regNik.toUpperCase()}`);
      setRegSuccessMsg(`Karyawan ${regName} (${formattedNik}) berhasil didaftarkan!`);
      setUsername(formattedNik);
      setPassword(regPassword);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccessMsg(null);
        setRegNik('');
        setRegName('');
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Gagal mendaftarkan karyawan ke sistem');
    }
  };

  const getDepartmentIcon = (dept: Department) => {
    switch (dept) {
      case 'rnd':
        return <FlaskConical className="w-4 h-4 text-purple-400" />;
      case 'ppic':
        return <CalendarDays className="w-4 h-4 text-blue-400" />;
      case 'quality':
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      case 'warehouse':
        return <Package className="w-4 h-4 text-orange-400" />;
      case 'procurement':
        return <ShoppingCart className="w-4 h-4 text-purple-400" />;
      case 'sales':
        return <TrendingUp className="w-4 h-4 text-pink-400" />;
      case 'admin':
      case 'management':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      default:
        return <Building2 className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d071e] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-hidden font-sans select-none">
      {/* Deep Dark Atmosphere Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-purple-900/30 blur-[140px]"></div>
        <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-950/40 blur-[150px]"></div>
        <div className="absolute -bottom-24 left-1/3 w-[550px] h-[550px] rounded-full bg-fuchsia-950/30 blur-[130px]"></div>
        
        {/* Subtle grid texture overlay for industrial precision feel */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(#c084fc 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>
      </div>

      {/* Main Grid Content (2 Columns) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center flex-1 py-4">
        
        {/* LEFT COLUMN: Brand Identity, Badge, Hero Headline & CPKB Features */}
        <div className="lg:col-span-7 space-y-7">
          {/* Brand Header */}
          <div>
            <Logo showText={true} size="md" variant="dark" />
          </div>

          {/* Badge: Sistem Gudang & Quality Control CPKB */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300 text-xs font-bold shadow-xs">
            <Award className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Sistem Gudang & Quality Control CPKB</span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Presisi Operasional,
            </h1>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-purple-400 tracking-tight leading-[1.12]">
              Integritas Mutu
            </h1>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Kosmetika.
            </h1>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-purple-100/70 leading-relaxed max-w-xl">
            Platform manajemen terpadu PT. Larassanti Makmur Sejahtera untuk pengelolaan Penerimaan Gudang, Pengujian Laboratorium QC, Batch Record CPKB BPOM, Manajemen BOM Formula RnD, hingga Pengiriman Produk Jadi.
          </p>

          {/* 2 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-xl">
            {/* Card 1 */}
            <div className="bg-white/[0.04] border border-purple-500/20 backdrop-blur-md rounded-2xl p-4 shadow-sm hover:border-purple-400/40 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Standar CPKB BPOM</h3>
                  <p className="text-[11px] text-purple-200/60 mt-1 leading-relaxed">
                    Karantina material, validasi sampling QC, dan rilis CoA otomatis.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white/[0.04] border border-purple-500/20 backdrop-blur-md rounded-2xl p-4 shadow-sm hover:border-purple-400/40 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300 shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Traceability Bets</h3>
                  <p className="text-[11px] text-purple-200/60 mt-1 leading-relaxed">
                    Rekam jejak elektronik batch hulu ke hilir secara real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Floating Card Portal Masuk */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-[#150a2a]/95 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-purple-950/80 relative">
            
            {/* Card Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Portal Masuk
              </h2>
              <p className="text-xs text-purple-200/70 mt-1">
                Silakan masuk dengan kredensial akun operasional Anda
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Email atau Username / NIK
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-purple-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan NIK atau admin (contoh: admin)"
                    className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/40 pl-10 pr-4 py-3 text-xs text-white placeholder-purple-300/40 focus:bg-purple-950/80 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-purple-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/40 pl-10 pr-10 py-3 text-xs text-white placeholder-purple-300/40 focus:bg-purple-950/80 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-purple-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memverifikasi Sesi...
                  </span>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo & Register Links */}
            <div className="mt-4 pt-3 border-t border-purple-900/50 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="text-purple-300 hover:text-white font-semibold cursor-pointer"
              >
                Login Demo Lain (RnD, QC, Gudang)
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="text-purple-400 hover:text-purple-200 font-semibold cursor-pointer"
              >
                Daftar Karyawan
              </button>
            </div>

            {/* Card Footer: SSL & Audit Trail */}
            <div className="mt-5 pt-3.5 border-t border-purple-900/50 flex items-center justify-between text-[10px] text-purple-300/60 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Enkripsi SSL 256-bit
              </span>
              <span className="text-purple-300 font-bold">
                Audit Trail CPKB
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-6 border-t border-purple-900/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-purple-300/50 gap-2">
        <span>© 2026 PT. Larassanti Makmur Sejahtera</span>
        <span className="font-mono text-[10px] font-bold text-purple-400/80 tracking-wider">
          CPKB ENTERPRISE V5.0
        </span>
      </div>

      {/* POPUP MODAL: Pop-up Kesalahan NIK atau Password (Prominent Alert) */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#180e30] border border-rose-500/40 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl text-white relative text-center">
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning Shield Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-lg shadow-rose-950/40">
              <AlertCircle className="w-7 h-7 text-rose-400" />
            </div>

            <h3 className="text-lg font-black text-white mb-1.5 tracking-tight">
              Kredensial Tidak Sesuai
            </h3>

            <p className="text-xs text-purple-200/80 leading-relaxed mb-6 px-3">
              {errorMessage}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setErrorMessage(null)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition-all shadow-md shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Coba Masukkan Kembali</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Quick Login Demo Users */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#180e30] border border-purple-500/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white relative">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/60 mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Pilih Akun Departemen (Demo Akun)</span>
              </h3>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-purple-300 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => {
                    handleQuickLogin(demo.nik);
                    setShowDemoModal(false);
                  }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-purple-950/60 border border-purple-800/50 hover:border-purple-400 hover:bg-purple-900/70 transition-all text-left cursor-pointer group"
                >
                  <div className="p-2 rounded-xl bg-purple-900/70 border border-purple-700 text-purple-300 shrink-0 group-hover:border-purple-400">
                    {getDepartmentIcon(demo.department)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-purple-300/70 uppercase block">
                      {demo.department} ({demo.role})
                    </span>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-200">
                      {demo.name}
                    </h4>
                    <span className="text-[10px] font-mono text-purple-400 font-semibold block mt-0.5">
                      NIK: {demo.nik}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Register New Employee */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#180e30] border border-purple-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white relative">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/60 mb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Pendaftaran Karyawan Baru</span>
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-purple-300 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-purple-950/80 border border-purple-700 text-purple-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterEmployee} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Nomor Induk Karyawan (NIK)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: LMS12345 (atau admin)"
                  value={regNik}
                  onChange={(e) => setRegNik(e.target.value)}
                  className="w-full rounded-xl bg-purple-950/60 border border-purple-700/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Michael, S.Farm"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl bg-purple-950/60 border border-purple-700/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Departemen</label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value as Department)}
                    className="w-full rounded-xl bg-purple-950/60 border border-purple-700/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
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
                  <label className="block text-xs font-semibold text-purple-200 mb-1">Tingkat Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full rounded-xl bg-purple-950/60 border border-purple-700/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
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
                <label className="block text-xs font-semibold text-purple-200 mb-1">Password</label>
                <input
                  type="text"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-xl bg-purple-950/60 border border-purple-700/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/60 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-colors cursor-pointer"
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
