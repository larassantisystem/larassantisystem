import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, CheckCircle2, ChevronDown, ChevronUp, X, AlertCircle, RefreshCw } from 'lucide-react';
import { RawMaterial, PackagingMaterial } from '../../../types';
import { GrnMaterialType } from '../types/grnTypes';

export interface MaterialOption {
  id: string;
  code: string;
  name: string;
  chemicalName?: string;
  manufacturer: string;
  category: string;
  unit: string;
  storageConditions: string;
  qcParametersCount: number;
}

interface MaterialSearchDropdownProps {
  type: GrnMaterialType;
  rawMaterials: RawMaterial[];
  packagingMaterials: PackagingMaterial[];
  selectedCode?: string;
  onSelect: (item: MaterialOption) => void;
  onClear?: () => void;
}

export const MaterialSearchDropdown: React.FC<MaterialSearchDropdownProps> = ({
  type,
  rawMaterials,
  packagingMaterials,
  selectedCode,
  onSelect,
  onClear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize material data into standardized options
  const options: MaterialOption[] = useMemo(() => {
    if (type === 'raw') {
      return rawMaterials.map((rm) => ({
        id: rm.id,
        code: rm.code,
        name: rm.name,
        chemicalName: rm.chemicalName,
        manufacturer: rm.manufacturer || rm.supplier || '-',
        category: rm.categories && rm.categories.length > 0 ? rm.categories[0] : (rm.category || 'Bahan Baku'),
        unit: 'kg',
        storageConditions: rm.storageConditions || '-',
        qcParametersCount: rm.qcParameters?.length || 0,
      }));
    } else {
      return packagingMaterials.map((pm) => ({
        id: pm.id,
        code: pm.code,
        name: pm.name,
        chemicalName: '',
        manufacturer: pm.supplier || pm.manufacturer || '-',
        category: pm.type === 'primary' ? 'Primer' : pm.type === 'secondary' ? 'Sekunder' : 'Tersier',
        unit: pm.unit || 'pcs',
        storageConditions: pm.storageConditions || '-',
        qcParametersCount: pm.qcParameters?.length || 0,
      }));
    }
  }, [type, rawMaterials, packagingMaterials]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q) ||
        opt.manufacturer.toLowerCase().includes(q) ||
        (opt.chemicalName && opt.chemicalName.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const selectedItem = useMemo(() => {
    return options.find((opt) => opt.code === selectedCode);
  }, [options, selectedCode]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // When type changes, clear query and close dropdown
  useEffect(() => {
    setSearchQuery('');
    setIsOpen(false);
  }, [type]);

  const handleSelectItem = (item: MaterialOption) => {
    onSelect(item);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleOpenDropdown = () => {
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Selected Item Summary Card (when not searching or dropdown closed) */}
      {selectedItem && !isOpen ? (
        <div
          onClick={handleOpenDropdown}
          className={`group flex items-center justify-between gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all shadow-2xs hover:shadow-xs ${
            type === 'raw'
              ? 'border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/20'
              : 'border-blue-200/90 hover:border-blue-400 bg-blue-50/20'
          }`}
          title="Klik untuk mengganti bahan"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                type === 'raw'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>

            <span
              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md shrink-0 border ${
                type === 'raw'
                  ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                  : 'bg-blue-100/80 text-blue-800 border-blue-200'
              }`}
            >
              {selectedItem.code}
            </span>

            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                <span>{selectedItem.name}</span>
                {selectedItem.chemicalName && (
                  <span className="text-[11px] text-slate-400 font-normal truncate hidden sm:inline">
                    ({selectedItem.chemicalName})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                <span className="font-medium text-slate-600">Produsen:</span> {selectedItem.manufacturer} •{' '}
                <span className="font-medium text-slate-600">Satuan:</span> {selectedItem.unit}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 hidden sm:inline">
              {selectedItem.qcParametersCount} PARAMETER
            </span>
            {onClear && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Hapus / Pilih Ulang"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="p-1 text-slate-400 group-hover:text-slate-600">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (
        /* Trigger Search Input Box */
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={
              selectedItem
                ? `Sedang dipilih: ${selectedItem.code} - ${selectedItem.name} (Ketik untuk cari lain...)`
                : type === 'raw'
                ? 'Cari bahan baku (ketik nama, kode, atau produsen)...'
                : 'Cari bahan kemas (ketik nama, kode, atau produsen)...'
            }
            className={`w-full pl-10 pr-20 py-2.5 bg-white border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-2xs ${
              type === 'raw'
                ? 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                title="Hapus kata kunci"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              title={isOpen ? 'Tutup daftar' : 'Buka daftar'}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Dropdown List Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header toolbar */}
          <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium">
              Menampilkan {filteredOptions.length} dari {options.length}{' '}
              {type === 'raw' ? 'bahan baku' : 'bahan kemas'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 hidden sm:inline">Tekan Esc untuk tutup</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-200/60"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const isSelected = selectedCode === item.code;
                return (
                  <div
                    key={item.id || item.code}
                    onClick={() => handleSelectItem(item)}
                    className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? type === 'raw'
                          ? 'bg-emerald-50/80'
                          : 'bg-blue-50/80'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Radio / Selection Indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? type === 'raw'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>

                      {/* Material Code Badge */}
                      <span
                        className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-md shrink-0 ${
                          type === 'raw'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.code}
                      </span>

                      {/* Material Name & Details */}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.chemicalName && (
                            <span className="text-[10px] text-slate-400 font-normal truncate hidden sm:inline">
                              ({item.chemicalName})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          <span className="font-medium text-slate-600">Produsen:</span> {item.manufacturer} •{' '}
                          <span className="font-medium text-slate-600">Kategori:</span> {item.category} •{' '}
                          <span className="font-medium text-slate-600">Satuan:</span> {item.unit}
                        </p>
                      </div>
                    </div>

                    {/* Right side QC Parameter Badge */}
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md border border-slate-200/70">
                        {item.qcParametersCount} PARAMETER UJI
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Tidak ada data {type === 'raw' ? 'bahan baku' : 'bahan kemas'} yang cocok
                </p>
                <p className="text-[11px] text-slate-500">
                  Pastikan master data telah didaftarkan di modul RnD atau gunakan kata kunci lain.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
