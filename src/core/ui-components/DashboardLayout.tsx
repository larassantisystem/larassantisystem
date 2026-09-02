import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Department } from '../../types';
import {
  FlaskConical,
  CalendarDays,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  Building2,
  LogOut,
  Sparkles,
  Users,
  ChevronRight,
  Bell,
  HardDrive,
  Info,
  CheckCircle,
  Home
} from 'lucide-react';
import { Logo } from '../../components/Logo';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  activeTab: Department | 'dashboard';
  onSelectTab: (tab: Department | 'dashboard') => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
}) => {
  const { user, logout, switchUser } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const departments: { id: Department; name: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'rnd',
      name: 'RnD (Master Data)',
      description: 'Master Material RM/PM, Formulasi Bulk, BOM, & Spek Teknis',
      icon: <FlaskConical className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'ppic',
      name: 'PPIC (Planning)',
      description: 'Kalkulator Kebutuhan Material (MRP), SO-Driven, & AI Scheduler',
      icon: <CalendarDays className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'quality',
      name: 'Quality (QA/QC)',
      description: 'Sampling, Uji Lab, CoA, Deviasi Proses, & Release Protocol',
      icon: <CheckCircle2 className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'warehouse',
      name: 'Warehouse (Gudang)',
      description: 'Goods Receipt, Karantina, FEFO Timbang, & Mutasi Stok',
      icon: <Package className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'procurement',
      name: 'Procurement (PO)',
      description: 'Purchase Order, Lead Time Supplier, & Tracking Kedatangan',
      icon: <ShoppingCart className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'sales',
      name: 'Sales (Pesanan)',
      description: 'Input Sales Order (SO), Target Deadline, & Tracking Status',
      icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'admin',
      name: 'Admin & Role',
      description: 'Manajemen Akun Karyawan, Hak Akses NIK, & Audit Log',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Luxurious Royal Purple Top Navigation Bar */}
      <header className="h-16 border-b border-purple-950/40 bg-gradient-to-r from-[#1c062e] via-[#2b0c48] to-[#180427] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-3">
          {/* Logo Component inside Header */}
          <Logo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm sm:text-base tracking-wider uppercase drop-shadow-xs">
                PT. LARASSANTI MAKMUR SEJAHTERA
              </span>
              <span className="text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 shadow-xs">
                CPKB
              </span>
            </div>
            <p className="text-[10px] text-purple-200/80 hidden sm:block font-medium">
              Demand-Driven Manufacturing & Material Planner
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick User Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-400/30 hover:bg-purple-900/80 transition-all text-xs text-white font-semibold cursor-pointer shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-purple-100">{user?.name?.split(',')[0]}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/80 border border-purple-400/30 text-amber-300 uppercase font-mono font-bold">
                {user?.department}
              </span>
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Ganti Akun Karyawan (Demo):
                </div>
                <div className="space-y-1 mt-1">
                  <button
                    onClick={() => { switchUser('2001'); setShowSwitchMenu(false); onSelectTab('rnd'); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-xs text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">Dr. apt. Maya Sari (RnD)</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold">2001</span>
                  </button>
                  <button
                    onClick={() => { switchUser('3001'); setShowSwitchMenu(false); onSelectTab('ppic'); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-xs text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">Budi Santoso (PPIC)</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold">3001</span>
                  </button>
                  <button
                    onClick={() => { switchUser('4001'); setShowSwitchMenu(false); onSelectTab('quality'); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-xs text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">apt. Rina (Quality/QC)</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold">4001</span>
                  </button>
                  <button
                    onClick={() => { switchUser('5001'); setShowSwitchMenu(false); onSelectTab('warehouse'); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-xs text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">Agus Setiawan (Warehouse)</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold">5001</span>
                  </button>
                  <button
                    onClick={() => { switchUser('1001'); setShowSwitchMenu(false); onSelectTab('admin'); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-xs text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">Ir. Hendra (Admin IT)</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold">1001</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            title="Keluar dari sistem"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-purple-900/60 border border-purple-500/30 hover:bg-rose-900/60 hover:border-rose-500/40 transition-all text-purple-200 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main App Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Department Sidebar Nav */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 shadow-xs">
          <div className="hidden md:block px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Alur Manufaktur Kosmetik
          </div>

          {/* Standard Dashboard Home button */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left w-full cursor-pointer shrink-0 md:shrink ${
              activeTab === 'dashboard'
                ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg border ${
              activeTab === 'dashboard' ? 'bg-white border-purple-200 text-purple-600' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <Home className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate">Beranda Utama</div>
            </div>
            {activeTab === 'dashboard' && <ChevronRight className="w-4 h-4 text-purple-600 hidden md:block ml-auto" />}
          </button>

          <div className="hidden md:block my-1 border-t border-slate-100"></div>

          {departments.map((dept) => {
            const isActive = activeTab === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => onSelectTab(dept.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left w-full cursor-pointer shrink-0 md:shrink ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg border ${
                  isActive ? 'bg-white border-purple-200 text-purple-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {dept.icon}
                </div>
                <div className="flex-1 min-w-0 hidden sm:block md:block">
                  <div className="truncate">{dept.name}</div>
                  <div className="text-[9px] text-slate-400 truncate hidden md:block font-normal mt-0.5">{dept.description}</div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-purple-600 hidden md:block ml-auto" />}
              </button>
            );
          })}

          <div className="hidden md:block mt-auto pt-4 border-t border-slate-100 px-1">
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                <span>Identitas Sesi CPKB</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Karyawan: <span className="font-bold text-slate-800">{user?.name?.split(',')[0]}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                NIK: <span className="font-mono text-purple-700 font-bold">{user?.nik}</span> ({user?.role})
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ISO 22716 SECURE</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

