/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { LoginPage } from './core/auth/LoginPage';
import { DashboardLayout } from './core/ui-components/DashboardLayout';
import { RndModule } from './components/RndModule';
import { Department } from './types';
import {
  FlaskConical,
  CalendarDays,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Cpu,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Department | 'dashboard'>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 tracking-wide">Memuat Sesi Karyawan...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <div className="max-w-6xl mx-auto space-y-6 font-sans">
          {/* Welcome Banner */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-100 blur-3xl"></div>
              <div className="absolute top-1/2 left-12 w-32 h-32 rounded-full bg-indigo-50 blur-2xl"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Sistem Perencanaan & Mutu Terintegrasi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
                  Selamat Datang di Portal Utama
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Halo, <strong className="text-purple-900">{user?.name}</strong>. Anda masuk sebagai <strong className="text-slate-700 font-bold">{user?.role.toUpperCase()}</strong> di Departemen <strong className="text-slate-700 font-bold">{user?.department.toUpperCase()}</strong>. Gunakan sidebar sebelah kiri untuk menavigasi modul CPKB / GMP.
                </p>
              </div>

              <div className="shrink-0 flex md:flex-col items-end gap-1.5 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sertifikasi</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  GMP/CPKB KOSMETIK
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats / Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formula Aktif</div>
              <div className="text-2xl font-black text-slate-800 mt-1">12 Formula</div>
              <p className="text-[11px] text-slate-500 mt-1">Sertifikasi BPOM & Halal</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Produksi Bulan Ini</div>
              <div className="text-2xl font-black text-slate-800 mt-1">8 Batch</div>
              <p className="text-[11px] text-slate-500 mt-1">Target On-Time Delivery 100%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penyimpangan IPC / Deviasi</div>
              <div className="text-2xl font-black text-slate-800 mt-1">0 Kasus</div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Semua Proses Terkontrol Hebat</p>
            </div>
          </div>

          {/* Alur Manufaktur Guide for user friendly onboarding */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Petunjuk Alur Sistem & Modul Terintegrasi
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">1</span>
                  Fase RnD (Master Formula & BOM)
                </h4>
                <p className="leading-relaxed text-[11px] text-slate-500">
                  Semua bermula di RnD. Mengatur master bahan baku (Raw Material & Packaging Material), menyusun formula bulk, mendefinisikan spesifikasi uji lab, dan membuat varian kemasan yang fleksibel.
                </p>
                <button
                  onClick={() => setActiveTab('rnd')}
                  className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 hover:text-purple-800 transition-colors"
                >
                  Buka Modul RnD <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">2</span>
                  Fase PPIC & Produksi Planner
                </h4>
                <p className="leading-relaxed text-[11px] text-slate-500">
                  PPIC menarik Sales Order dari Sales, menghitung kebutuhan material (MRP) otomatis berdasarkan sisa stok di Gudang, dan menjadwalkan mixing & filling berdasarkan efisiensi mesin.
                </p>
                <span className="text-[10px] text-slate-400 italic block mt-1">Langkah berikutnya setelah RnD disetujui</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
              <strong>Catatan Sistem:</strong> Sistem ini menggunakan NIK karyawan internal untuk pembatasan otorisasi hak akses (Role-Based Access Control). Untuk keperluan demo/pengujian, Anda dapat berpindah akun kapan saja menggunakan menu profil di pojok kanan atas.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rnd' && (
        <div className="max-w-6xl mx-auto">
          <RndModule />
        </div>
      )}

      {activeTab !== 'rnd' && activeTab !== 'dashboard' && (
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-md">
            {activeTab === 'ppic' && <CalendarDays className="w-9 h-9 text-purple-600" />}
            {activeTab === 'quality' && <CheckCircle2 className="w-9 h-9 text-purple-600" />}
            {activeTab === 'warehouse' && <Package className="w-9 h-9 text-purple-600" />}
            {activeTab === 'procurement' && <ShoppingCart className="w-9 h-9 text-purple-600" />}
            {activeTab === 'sales' && <TrendingUp className="w-9 h-9 text-purple-600" />}
            {activeTab === 'admin' && <ShieldCheck className="w-9 h-9 text-purple-600" />}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
              Modul {activeTab === 'ppic' ? 'PPIC (Planning)' : activeTab === 'quality' ? 'Quality (QA/QC)' : activeTab === 'warehouse' ? 'Warehouse (Gudang)' : activeTab === 'procurement' ? 'Procurement' : activeTab === 'sales' ? 'Sales' : 'Admin & Role'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Modul ini akan mengonsumsi data master dari RnD (BOM, Spesifikasi teknis, dan Resep bulk). Kita mengedepankan pembentukan modul RnD terlebih dahulu sebagai pondasi data.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={() => setActiveTab('rnd')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-100 transition-all cursor-pointer border border-purple-500"
            >
              <span>Buka Modul RnD</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
