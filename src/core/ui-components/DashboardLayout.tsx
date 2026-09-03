import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canAccessModule } from '../auth/permissionGuard';
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
  ChevronDown,
  Bell,
  HardDrive,
  Info,
  CheckCircle,
  Home,
  User,
  Award,
  Layers,
  Sliders,
  FileSpreadsheet,
  PackageCheck,
  ClipboardList,
  History,
  FileText,
  Factory
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export interface SubMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DepartmentConfig {
  id: Department;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
  activeTab: Department | 'dashboard';
  onSelectTab: (tab: Department | 'dashboard') => void;
  activeSubTab?: string;
  onSelectSubTab?: (subTab: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  activeSubTab,
  onSelectSubTab,
}) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Track which accordion departments are expanded
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    rnd: true,
    ppic: false,
    quality: false,
    warehouse: false,
    procurement: false,
    sales: false,
    admin: false
  });

  const toggleAccordion = (deptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const departments: DepartmentConfig[] = [
    {
      id: 'rnd',
      name: 'RnD (Master Data)',
      shortName: 'RnD',
      description: 'Master Material, Produk & Formula',
      icon: <FlaskConical className="w-4 h-4 text-purple-700" />,
      subItems: [
        { id: 'products', label: 'Produk Jadi (PJ0001)', icon: <PackageCheck className="w-3.5 h-3.5" /> },
        { id: 'materials', label: 'Bahan Baku (B0001)', icon: <FlaskConical className="w-3.5 h-3.5" /> },
        { id: 'packaging', label: 'Bahan Kemas (K0001)', icon: <Layers className="w-3.5 h-3.5" /> },
        { id: 'formula', label: 'Master Formula & Instruksi', icon: <Sliders className="w-3.5 h-3.5" /> },
        { id: 'bom-calculator', label: 'Dynamic BOM Calculator', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'ppic',
      name: 'PPIC (Planning)',
      shortName: 'PPIC',
      description: 'Kalkulator Kebutuhan Material (MRP)',
      icon: <CalendarDays className="w-4 h-4 text-blue-700" />,
      subItems: [
        { id: 'mrp', label: 'Kalkulasi MRP & Batching', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
        { id: 'schedule', label: 'Jadwal Produksi CPKB', icon: <CalendarDays className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'quality',
      name: 'Quality (QA/QC)',
      shortName: 'QC Lab',
      description: 'Sampling, Lab, Karantina & CoA',
      icon: <CheckCircle2 className="w-4 h-4 text-amber-700" />,
      subItems: [
        { id: 'sampling', label: 'Sampling & Karantina', icon: <FlaskConical className="w-3.5 h-3.5" /> },
        { id: 'coa', label: 'Sertifikat Analisis (CoA)', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'release', label: 'Otorisasi Rilis CPKB', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'warehouse',
      name: 'Warehouse (Gudang)',
      shortName: 'Gudang',
      description: 'Penerimaan Material & FEFO',
      icon: <Package className="w-4 h-4 text-orange-700" />,
      subItems: [
        { id: 'inbound', label: 'Penerimaan Raw Material', icon: <Package className="w-3.5 h-3.5" /> },
        { id: 'weighing', label: 'Penimbangan FEFO Bersih', icon: <Sliders className="w-3.5 h-3.5" /> },
        { id: 'finished-goods', label: 'Stok Produk Jadi (PJ)', icon: <PackageCheck className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'production',
      name: 'Produksi (Operasional Pabrik)',
      shortName: 'Produksi',
      description: 'Peracikan, Mixing, Filling CPKB',
      icon: <Factory className="w-4 h-4 text-emerald-700" />,
      subItems: [
        { id: 'batch-mixing', label: 'Peracikan & Mixing Batch', icon: <Sliders className="w-3.5 h-3.5" /> },
        { id: 'filling-packing', label: 'Filling & Pengemasan CPKB', icon: <PackageCheck className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'procurement',
      name: 'Procurement (PO)',
      shortName: 'PO',
      description: 'PO Bahan & Lead Time Vendor',
      icon: <ShoppingCart className="w-4 h-4 text-purple-700" />,
      subItems: [
        { id: 'po-list', label: 'Purchase Orders (PO)', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
        { id: 'vendors', label: 'Vendor Bahan Terdaftar', icon: <Building2 className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'sales',
      name: 'Sales (Pesanan)',
      shortName: 'Sales',
      description: 'Input Sales Order Pelanggan',
      icon: <TrendingUp className="w-4 h-4 text-pink-700" />,
      subItems: [
        { id: 'orders', label: 'Daftar Sales Order (SO)', icon: <TrendingUp className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'admin',
      name: 'Admin & Otoritas',
      shortName: 'Admin',
      description: 'Manajemen Akun NIK & Audit',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-700" />,
      subItems: [
        { id: 'users', label: 'Manajemen Karyawan (NIK)', icon: <Users className="w-3.5 h-3.5" /> },
        { id: 'audit', label: 'Rekam Jejak Audit Trail', icon: <History className="w-3.5 h-3.5" /> },
      ]
    },
  ];

  // Filter menu berdasarkan hak akses Silo Departemen & Specific Access
  const visibleDepartments = departments.filter((dept) => canAccessModule(user, dept.id));

  // Redirect pengaman jika user berada di tab yang tidak diizinkan
  useEffect(() => {
    if (activeTab !== 'dashboard' && !canAccessModule(user, activeTab)) {
      onSelectTab('dashboard');
    }
  }, [activeTab, user, onSelectTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Crisp Light Top Navigation Bar */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          {/* Logo Component with Text in Light Theme */}
          <Logo size="sm" showText={true} />
          
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sistem Operasional
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold flex items-center gap-1">
              <Award className="w-3 h-3" />
              CPKB BPOM V5.0
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2.5">
          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-purple-50/80 border border-purple-200/90 hover:bg-purple-100/70 transition-all text-xs text-slate-800 font-semibold cursor-pointer shadow-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none">
                  {user?.name?.split(',')[0]}
                </div>
                <div className="text-[9px] text-purple-700 font-mono font-bold mt-0.5 uppercase">
                  {user?.department} • {user?.role} ({user?.nik})
                </div>
              </div>
            </button>

            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Kredensial Sesi Karyawan
                  </span>
                  <div className="mt-1">
                    <h4 className="text-xs font-bold text-slate-900">{user?.name}</h4>
                    <p className="text-[11px] font-mono text-purple-700 font-semibold mt-0.5">
                      NIK: {user?.nik}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 px-2 py-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Departemen:</span>
                    <span className="font-bold text-slate-800 uppercase">{user?.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Tingkat Jabatan:</span>
                    <span className="font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {user?.role}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Kondisi Khusus (Akses Lintas Modul):
                    </span>
                    {user?.role === 'admin' ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        Super User (Semua Modul Terbuka)
                      </span>
                    ) : user?.specificAccess && user.specificAccess.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.specificAccess.map((perm) => (
                          <span
                            key={perm.moduleId}
                            className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded"
                          >
                            +{perm.moduleId.toUpperCase()} ({perm.accessLevel})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        Terbatas pada modul {user?.department?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    CPKB Verified
                  </span>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Sesi</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Keluar dari sistem"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-all text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main App Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Department Sidebar Navigation (Accordion Format) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 shadow-xs scrollbar-none items-center md:items-stretch md:sticky md:top-0 md:h-screen">
          <div className="hidden md:block px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Menu Otoritas ({visibleDepartments.length} Modul)
          </div>

          {/* Home button */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-all text-left w-auto md:w-full cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className={`p-1.5 rounded-lg border ${
              activeTab === 'dashboard' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <Home className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="md:hidden text-[11px] font-bold">Beranda</div>
              <div className="hidden md:block truncate">Beranda Utama</div>
            </div>
            {activeTab === 'dashboard' && <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block ml-auto" />}
          </button>

          <div className="hidden md:block my-1 border-t border-slate-100"></div>

          {/* Accordion Department Menus */}
          {visibleDepartments.map((dept) => {
            const isDeptActive = activeTab === dept.id;
            const isExpanded = !!expandedDepts[dept.id];
            const hasSubItems = dept.subItems && dept.subItems.length > 0;

            return (
              <div key={dept.id} className="w-auto md:w-full shrink-0 flex flex-col">
                {/* Department Main Button / Accordion Header */}
                <div
                  onClick={() => {
                    onSelectTab(dept.id);
                    if (hasSubItems && !isExpanded) {
                      setExpandedDepts((prev) => ({ ...prev, [dept.id]: true }));
                    }
                  }}
                  className={`flex items-center justify-between gap-2 md:gap-2.5 px-3 py-2 md:py-2 rounded-xl text-xs font-bold transition-all text-left w-auto md:w-full cursor-pointer select-none ${
                    isDeptActive
                      ? 'bg-purple-50 text-purple-900 border border-purple-200/90 shadow-2xs'
                      : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg border shrink-0 ${
                      isDeptActive ? 'bg-white border-purple-200 text-purple-700 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {dept.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="md:hidden text-[11px] font-bold whitespace-nowrap">{dept.shortName}</div>
                      <div className="hidden md:block truncate font-bold text-xs">{dept.name}</div>
                    </div>
                  </div>

                  {/* Accordion Toggle Icon (Desktop) */}
                  {hasSubItems && (
                    <button
                      type="button"
                      onClick={(e) => toggleAccordion(dept.id, e)}
                      className="hidden md:flex p-1 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors ml-1 cursor-pointer"
                      title={isExpanded ? 'Tutup sub-menu' : 'Buka sub-menu'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-purple-700 font-bold" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sub-Items Accordion Drawer (Desktop Only) */}
                {hasSubItems && isExpanded && (
                  <div className="hidden md:flex flex-col gap-0.5 pl-6 pr-1 py-1 mt-0.5 border-l-2 border-purple-100 ml-4 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {dept.subItems!.map((sub) => {
                      const isSubActive = isDeptActive && activeSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSelectTab(dept.id);
                            if (onSelectSubTab) {
                              onSelectSubTab(sub.id);
                            }
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-left cursor-pointer w-full ${
                            isSubActive
                              ? 'bg-purple-700 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                          }`}
                        >
                          <span className={isSubActive ? 'text-white' : 'text-slate-400'}>
                            {sub.icon}
                          </span>
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

