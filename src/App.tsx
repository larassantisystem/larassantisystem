/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { LoginPage } from './core/auth/LoginPage';
import { DashboardLayout } from './core/ui-components/DashboardLayout';
import { RndModule } from './components/RndModule';
import { EmployeeManagementModule } from './features/admin/EmployeeManagementModule';
import { WarehouseModule } from './features/warehouse/components/WarehouseModule';
import { QualityModule } from './features/quality/components/QualityModule';
import { Department } from './types';
import {
  FlaskConical,
  CalendarDays,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Layers,
  CheckCircle,
  Boxes,
  Beaker,
  Sliders,
  ChevronRight
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Department | 'dashboard'>('dashboard');
  const [activeRndSubTab, setActiveRndSubTab] = useState<'materials' | 'packaging' | 'products' | 'formula' | 'bom-calculator'>('products');
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'audit'>('users');
  const [activeWarehouseSubTab, setActiveWarehouseSubTab] = useState<'inbound' | 'stock-raw' | 'stock-packaging' | 'weighing' | 'finished-goods'>('inbound');
  const [activeQualitySubTab, setActiveQualitySubTab] = useState<'queue' | 'testing' | 'approval' | 'archive'>('queue');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-600 tracking-wide">Memuat Sesi Operasional...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSelectSubTab = (subTabId: string) => {
    if (['materials', 'packaging', 'products', 'formula', 'bom-calculator'].includes(subTabId)) {
      setActiveRndSubTab(subTabId as any);
      setActiveTab('rnd');
    } else if (['users', 'audit'].includes(subTabId)) {
      setActiveAdminSubTab(subTabId as any);
      setActiveTab('admin');
    } else if (['inbound', 'stock-raw', 'stock-packaging', 'weighing', 'finished-goods'].includes(subTabId)) {
      setActiveWarehouseSubTab(subTabId as any);
      setActiveTab('warehouse');
    } else if (['queue', 'testing', 'approval', 'archive'].includes(subTabId)) {
      setActiveQualitySubTab(subTabId as any);
      setActiveTab('quality');
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      activeSubTab={
        activeTab === 'rnd'
          ? activeRndSubTab
          : activeTab === 'admin'
          ? activeAdminSubTab
          : activeTab === 'warehouse'
          ? activeWarehouseSubTab
          : activeTab === 'quality'
          ? activeQualitySubTab
          : undefined
      }
      onSelectSubTab={handleSelectSubTab}
    >
      {activeTab === 'dashboard' && (
        <div className="max-w-6xl mx-auto space-y-6 font-sans">
          
          {/* Welcome & Brand Banner - High Contrast Slate & Charcoal (Extremely Eye Catching) */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
            {/* Ambient Deep Industrial Lighting */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-slate-800/60 blur-[100px]"></div>
              <div className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-slate-800/40 blur-[120px]"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sistem Gudang & Quality Control CPKB BPOM</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
                  Presisi Operasional & Integritas Mutu Kosmetika
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Selamat datang kembali, <strong className="text-white font-black">{user?.name}</strong>. Anda aktif dengan NIK <strong className="text-slate-200 font-mono font-bold">{user?.nik}</strong> di Departemen <strong className="text-white font-black">{user?.department.toUpperCase()}</strong> ({user?.role.toUpperCase()}).
                </p>
              </div>

              <div className="shrink-0 flex md:flex-col items-start md:items-end gap-1.5 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akreditasi Mutu</span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  CPKB / GMP RESMI
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Bahan Baku (B)</div>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200">
                  B
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">B0001+</div>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">Master Raw Material Terdaftar</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Bahan Kemas (K)</div>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200">
                  K
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">K0001+</div>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">Primary, Secondary, Box</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Produk Jadi (PJ)</div>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200">
                  PJ
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">PJ0001+</div>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">Multi-Variant Kemasan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Kepatuhan CPKB</div>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-2">100% Valid</div>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">Traceability Bets & CoA</p>
            </div>
          </div>

          {/* Core Feature Hub in Light Theme */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-900" />
                  Pusat Operasional Manufaktur CPKB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akses langsung ke sub-modul master data, kalkulasi formula, dan alur rantai pasok.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('rnd')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all cursor-pointer"
              >
                <span>Buka Modul RnD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Master Bahan Baku & Kemas */}
              <div 
                onClick={() => setActiveTab('rnd')}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3 group-hover:text-slate-900 group-hover:border-slate-400 group-hover:scale-105 transition-all">
                  <Beaker className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-black transition-colors">
                  Master Bahan Baku (B) & Kemas (K)
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Pengkodean standar pabrik: B0001 dst untuk Raw Material, K0001 dst untuk Packaging Material dengan COA dan status karantina.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
                  <span>Kelola Material</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Card 2: Produk & Multi-Varian */}
              <div 
                onClick={() => setActiveTab('rnd')}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3 group-hover:text-slate-900 group-hover:border-slate-400 group-hover:scale-105 transition-all">
                  <Boxes className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-black transition-colors">
                  Produk Jadi (PJ) & Multi-Variant
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Satu kode produk (PJ0001) dapat memiliki beragam varian ukuran (PJ0001-V1, PJ0001-V2) dengan kombinasi bahan kemas fleksibel.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
                  <span>Kelola Produk</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Card 3: Formulasi & BOM Calculator */}
              <div 
                onClick={() => setActiveTab('rnd')}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3 group-hover:text-slate-900 group-hover:border-slate-400 group-hover:scale-105 transition-all">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-black transition-colors">
                  Formulasi Bulk & Kalkulator BOM
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Perhitungan otomatis kebutuhan gramatur bahan baku per batch size (kg), estimasi biaya COGS, serta konsumsi bahan kemas per pcs.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
                  <span>Buka Formulasi</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
              <span>Sistem Terintegrasi: RnD → PPIC → QC → Warehouse → Procurement → Sales</span>
              <span className="font-mono font-bold text-slate-700">PT. LARASSANTI MAKMUR SEJAHTERA</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rnd' && (
        <div className="max-w-6xl mx-auto">
          <RndModule
            activeSubTab={activeRndSubTab}
            onSelectSubTab={setActiveRndSubTab}
          />
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="max-w-6xl mx-auto">
          <EmployeeManagementModule
            activeSubTab={activeAdminSubTab}
            onSelectSubTab={setActiveAdminSubTab}
          />
        </div>
      )}

      {activeTab === 'warehouse' && (
        <div className="max-w-6xl mx-auto">
          <WarehouseModule
            activeSubTab={activeWarehouseSubTab}
            onSelectSubTab={(sub) => setActiveWarehouseSubTab(sub as any)}
          />
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="max-w-6xl mx-auto">
          <QualityModule
            subTab={activeQualitySubTab}
          />
        </div>
      )}

      {activeTab !== 'rnd' && activeTab !== 'admin' && activeTab !== 'warehouse' && activeTab !== 'quality' && activeTab !== 'dashboard' && (
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-xs text-slate-700">
            {activeTab === 'ppic' && <CalendarDays className="w-9 h-9 text-blue-700" />}
            {activeTab === 'quality' && <CheckCircle2 className="w-9 h-9 text-amber-700" />}
            {activeTab === 'warehouse' && <Package className="w-9 h-9 text-orange-700" />}
            {activeTab === 'procurement' && <ShoppingCart className="w-9 h-9 text-purple-700" />}
            {activeTab === 'sales' && <TrendingUp className="w-9 h-9 text-pink-700" />}
            {activeTab === 'admin' && <ShieldCheck className="w-9 h-9 text-indigo-700" />}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">
              Modul {activeTab === 'ppic' ? 'PPIC (Planning)' : activeTab === 'quality' ? 'Quality (QA/QC)' : activeTab === 'warehouse' ? 'Warehouse (Gudang)' : activeTab === 'procurement' ? 'Procurement' : activeTab === 'sales' ? 'Sales' : 'Admin & Role'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Modul ini terhubung secara demand-driven dengan data master dari RnD (BOM, Spesifikasi teknis, dan Resep bulk B0001, K0001, PJ0001).
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={() => setActiveTab('rnd')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all cursor-pointer"
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
