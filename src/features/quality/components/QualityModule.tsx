import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  ArrowLeftCircle,
  Search,
  KeyRound,
  FileText,
  Layers,
  Package,
  Boxes,
  Tag,
  ArrowUpDown,
  Minimize2,
  Maximize2,
  ClipboardList,
  Info,
  CalendarDays,
  Plus,
  Trash2,
  AlertTriangle,
  BookOpen,
  Printer,
  X,
  ExternalLink,
  Check,
  Sliders,
  Database,
} from 'lucide-react';
import { QcInspectionReport } from '../types/qcTypes';
import { qualityService } from '../qualityService';
import { analyzeQueuePriorities } from '../utils/qcAiAssistant';
import { QcInspectionModal } from './QcInspectionModal';
import { QcManagerAuthModal } from './QcManagerAuthModal';
import { QcRevertModal } from './QcRevertModal';
import { QcInspectionReportPdfModal } from './QcInspectionReportPdfModal';
import { QcStatusLabelModal } from './QcStatusLabelModal';
import { QcNotificationsCenter } from './QcNotificationsCenter';
import { QcDiagnosticAuditModal } from './QcDiagnosticAuditModal';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  IpcBulkTest,
  IpcReworkTest,
  RetainedSample,
  StabilityStudy,
  SopDocument,
  CapaRecord,
  QualityComplaint,
  initialIpcBulkTests,
  initialIpcReworkTests,
  initialRetainedSamples,
  initialStabilityStudies,
  initialSopDocuments,
  initialCapaRecords,
  initialQualityComplaints,
} from '../utils/qcExtData';

interface QualityModuleProps {
  subTab?: string;
}

export const QualityModule: React.FC<QualityModuleProps> = ({ subTab = 'queue' }) => {
  const { user } = useAuth();

  const [reports, setReports] = useState<QcInspectionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<
    'queue' | 'testing' | 'approval' | 'archive' | 
    'ipc-bulk' | 'ipc-rework' | 
    'retained' | 'stability' | 
    'sop' | 'capa' | 'complaints'
  >('queue');
  
  // Specific material type separation tab for active view (BB vs BK)
  const [activeMaterialType, setActiveMaterialType] = useState<'all' | 'raw' | 'packaging'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  // Extended Quality states
  const [ipcBulkTests, setIpcBulkTests] = useState<IpcBulkTest[]>(initialIpcBulkTests);
  const [ipcReworkTests, setIpcReworkTests] = useState<IpcReworkTest[]>(initialIpcReworkTests);
  const [retainedSamples, setRetainedSamples] = useState<RetainedSample[]>(initialRetainedSamples);
  const [stabilityStudies, setStabilityStudies] = useState<StabilityStudy[]>(initialStabilityStudies);
  const [sopDocuments, setSopDocuments] = useState<SopDocument[]>(initialSopDocuments);
  const [capaRecords, setCapaRecords] = useState<CapaRecord[]>(initialCapaRecords);
  const [qualityComplaints, setQualityComplaints] = useState<QualityComplaint[]>(initialQualityComplaints);

  // Interactive Form Dialog visibility
  const [showIpcForm, setShowIpcForm] = useState(false);
  const [newIpc, setNewIpc] = useState<Partial<IpcBulkTest>>({
    batchNo: '', productName: '', pH: 6.0, viscosity: 4000, appearance: 'Homogen, Sesuai Spek', gravity: 1.0, status: 'TESTING', analyst: user?.name || 'Staff QC'
  });

  const [showReworkForm, setShowReworkForm] = useState(false);
  const [newRework, setNewRework] = useState<Partial<IpcReworkTest>>({
    originalBatchNo: '', productName: '', reworkReason: '', pHTest: 6.0, viscosityTest: 4000, microbiology: 'PENDING', status: 'TESTING', authorizedBy: 'Diana Putri (QM)'
  });

  const [showRetainedForm, setShowRetainedForm] = useState(false);
  const [newRetained, setNewRetained] = useState<Partial<RetainedSample>>({
    batchNo: '', productName: '', type: 'Produk Jadi', expiryDate: '2029-09-03', rackNo: '', qty: '3 pcs', status: 'Simpan'
  });

  const [showStabilityForm, setShowStabilityForm] = useState(false);
  const [newStability, setNewStability] = useState<Partial<StabilityStudy>>({
    productName: '', batchNo: '', chamberTemp: '40°C ± 2°C / 75% RH ± 5% (Accelerated)', interval: 'Bulan ke-0 (Accelerated)', pullDate: '2026-09-03', status: 'BERJALAN'
  });

  const [showSopForm, setShowSopForm] = useState(false);
  const [newSop, setNewSop] = useState<Partial<SopDocument>>({
    docNumber: '', title: '', version: '01', effectiveDate: '2026-09-03', category: 'QC', status: 'AKTIF'
  });

  const [showCapaForm, setShowCapaForm] = useState(false);
  const [newCapa, setNewCapa] = useState<Partial<CapaRecord>>({
    devNumber: '', source: 'Deviasi Produksi', description: '', severity: 'MINOR', rootCause: '', correctiveAction: '', preventiveAction: '', status: 'OPEN', targetDate: '2026-09-15'
  });

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState<Partial<QualityComplaint>>({
    customer: '', productName: '', batchNo: '', complaintText: '', investigationText: 'Investigasi sampel pertinggal sedang dikerjakan.', retestResult: 'Menunggu hasil lab.', status: 'OPEN'
  });

  // Modal States
  const [inspectingReport, setInspectingReport] = useState<QcInspectionReport | null>(null);
  const [authorizingReport, setAuthorizingReport] = useState<QcInspectionReport | null>(null);
  const [revertingReport, setRevertingReport] = useState<QcInspectionReport | null>(null);
  const [pdfReport, setPdfReport] = useState<QcInspectionReport | null>(null);
  const [labelReport, setLabelReport] = useState<QcInspectionReport | null>(null);
  const [showDiagnosticAudit, setShowDiagnosticAudit] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await qualityService.getReports();
      setReports(data);
    } catch (e) {
      console.error('Error loading QC reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (subTab) {
      setCurrentTab(subTab as any);
    }
  }, [subTab]);

  // AI Queue Priorities
  const quarantineReports = reports.filter((r) => r.status === 'QUARANTINE');
  const queuePriorities = analyzeQueuePriorities(quarantineReports);

  // Filtered lists for each tab, sorted from oldest to newest (ascending)
  const filterBySearchAndType = (list: QcInspectionReport[], forcedType?: 'all' | 'raw' | 'packaging') => {
    const activeType = forcedType !== undefined ? forcedType : activeMaterialType;
    return list
      .filter((item) => {
        const matchType = activeType === 'all' || item.materialType === activeType;
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          item.grnNumber.toLowerCase().includes(q) ||
          (item.lotInternalNumber && item.lotInternalNumber.toLowerCase().includes(q)) ||
          item.materialCode.toLowerCase().includes(q) ||
          item.materialName.toLowerCase().includes(q) ||
          item.batchNumberVendor.toLowerCase().includes(q) ||
          item.manufacturer.toLowerCase().includes(q);
        return matchType && matchSearch;
      })
      .sort((a, b) => {
        // Sort oldest to newest (First In First Analyzed)
        const timeA = new Date(a.receivedDate || a.createdAt).getTime();
        const timeB = new Date(b.receivedDate || b.createdAt).getTime();
        return timeA - timeB;
      });
  };

  // 1. Antrean Karantina
  const queueList = filterBySearchAndType(quarantineReports, activeMaterialType);
  const queueRawList = filterBySearchAndType(quarantineReports, 'raw');
  const queuePackagingList = filterBySearchAndType(quarantineReports, 'packaging');

  // 2. Proses Uji Lab
  const testingReports = reports.filter((r) => r.status === 'QUALITY_CONTROL_PROCESS');
  const testingList = filterBySearchAndType(testingReports, activeMaterialType);
  const testingRawList = filterBySearchAndType(testingReports, 'raw');
  const testingPackagingList = filterBySearchAndType(testingReports, 'packaging');

  // 3. Menunggu Approval QM
  const approvalReports = reports.filter((r) => r.status === 'AWAITING_QM_AUTHORIZATION');
  const approvalList = filterBySearchAndType(approvalReports, activeMaterialType);
  const approvalRawList = filterBySearchAndType(approvalReports, 'raw');
  const approvalPackagingList = filterBySearchAndType(approvalReports, 'packaging');

  // 4. Arsip Laporan Resmi Selesai
  const archiveReports = reports.filter(
    (r) =>
      r.status === 'PASSED' ||
      r.status === 'PASSED_WITH_DEVIATION' ||
      r.status === 'REJECTED' ||
      r.status === 'REVERTED_TO_WAREHOUSE'
  );
  const archiveList = filterBySearchAndType(archiveReports, activeMaterialType);
  const archiveRawList = filterBySearchAndType(archiveReports, 'raw');
  const archivePackagingList = filterBySearchAndType(archiveReports, 'packaging');

  // Actions
  const handleStartInspection = async (report: QcInspectionReport) => {
    if (!user) return;
    const updated = await qualityService.startInspectionProcess(report.id, user);
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setInspectingReport(updated);
  };

  const handleSubmitStaffAnalysis = async (
    reportId: string,
    parameters: any[],
    staffDecision: 'RELEASE' | 'REJECT',
    staffNotes: string,
    passwordInput: string
  ) => {
    if (!user) return;
    const updated = await qualityService.submitStaffAnalysis(
      reportId,
      parameters,
      staffDecision,
      staffNotes,
      user,
      passwordInput
    );
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setCurrentTab('approval');
  };

  const handleAuthorizeManager = async (
    reportId: string,
    decision: 'RELEASE' | 'RELEASE_BY_DEVIATION' | 'REJECT',
    deviationNumber: string,
    qmNotes: string,
    passwordInput: string
  ) => {
    if (!user) return;
    const updated = await qualityService.authorizeQualityManager(
      reportId,
      decision,
      deviationNumber,
      qmNotes,
      user,
      passwordInput
    );
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setPdfReport(updated);
  };

  const handleConfirmRevert = async (reportId: string, reason: string) => {
    if (!user) return;
    const updated = await qualityService.revertToWarehouse(reportId, reason, user);
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const stats = {
    totalQuarantine: quarantineReports.length,
    quarantineRaw: quarantineReports.filter((r) => r.materialType === 'raw').length,
    quarantinePkg: quarantineReports.filter((r) => r.materialType === 'packaging').length,
    
    inTesting: testingReports.length,
    testingRaw: testingReports.filter((r) => r.materialType === 'raw').length,
    testingPkg: testingReports.filter((r) => r.materialType === 'packaging').length,

    awaitingApproval: approvalReports.length,
    approvalRaw: approvalReports.filter((r) => r.materialType === 'raw').length,
    approvalPkg: approvalReports.filter((r) => r.materialType === 'packaging').length,

    archiveTotal: archiveReports.length,
    archiveRaw: archiveReports.filter((r) => r.materialType === 'raw').length,
    archivePkg: archiveReports.filter((r) => r.materialType === 'packaging').length,
    passed: reports.filter((r) => r.status === 'PASSED' || r.status === 'PASSED_WITH_DEVIATION').length,
    rejected: reports.filter((r) => r.status === 'REJECTED').length,
  };

  // Reusable Material Toggle Bar for Each Workflow Stage
  const renderMaterialFilterTabs = (rawCount: number, pkgCount: number, totalCount: number) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveMaterialType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMaterialType === 'all'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Semua ({totalCount})
        </button>
        <button
          onClick={() => setActiveMaterialType('raw')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMaterialType === 'raw'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-teal-800 hover:bg-teal-50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Bahan Baku (BB) ({rawCount})
        </button>
        <button
          onClick={() => setActiveMaterialType('packaging')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMaterialType === 'packaging'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-800 hover:bg-purple-50'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          Bahan Kemas (BK) ({pkgCount})
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        <span>Urutan: Terlama ke Terbaru (First-In First-Tested)</span>
      </div>
    </div>
  );

  // Table 1: Antrean Karantina Table
  const renderQueueTable = (items: QcInspectionReport[], emptyText: string) => (
    <table className={`w-full text-left border-collapse ${isCompactMode ? 'text-[11px]' : 'text-xs'}`}>
      <thead>
        <tr className={`border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 ${isCompactMode ? 'text-[10px]' : 'text-[11px]'}`}>
          <th className={`${isCompactMode ? 'p-1.5 w-8' : 'p-3 w-10'} text-center`}>No</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>No. GRN & Tgl Masuk</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Material & Produsen</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Pemasok</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Kuantitas & Koli</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Rencana Sampling</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>Status</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>Aksi QC</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr>
            <td colSpan={8} className={`${isCompactMode ? 'p-4' : 'p-8'} text-center text-slate-400`}>
              {emptyText}
            </td>
          </tr>
        ) : (
          items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center font-mono text-slate-400`}>{idx + 1}</td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-mono font-bold text-slate-900">{item.grnNumber}</div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>{item.receivedDate}</div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold rounded-md ${
                      isCompactMode ? 'px-1.5 py-0.2 text-[9.5px]' : 'px-2 py-0.5 text-[11px]'
                    } ${
                      item.materialType === 'raw'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.materialCode}
                  </span>
                  <span className="font-bold text-slate-800">{item.materialName}</span>
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500`}>
                  Produsen: {item.manufacturer} • Batch: {item.batchNumberVendor}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <span className="text-slate-700 font-medium">{item.distributor || '-'}</span>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-bold text-slate-800 font-mono">
                  {item.quantityReceived.toLocaleString('id-ID', { minimumFractionDigits: 3 })} {item.unit}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500`}>
                  {item.containerCount} {item.containerType}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-semibold text-teal-900">
                  {item.samplingInfo.sampleSizeQuantity} {item.samplingInfo.sampleUnit}
                  {item.samplingInfo.sampleSizeCodeLetter && (
                    <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-teal-100 rounded text-teal-800 font-mono">
                      Code {item.samplingInfo.sampleSizeCodeLetter}
                    </span>
                  )}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>
                  {item.samplingInfo.samplingStandard}
                </div>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>
                <span className={`rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 ${isCompactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}>
                  KARANTINA
                </span>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setRevertingReport(item)}
                    title="Revert ke Gudang (Koreksi Data)"
                    className={`${isCompactMode ? 'p-1' : 'p-1.5'} text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer`}
                  >
                    <ArrowLeftCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartInspection(item)}
                    className={`inline-flex items-center gap-1 ${isCompactMode ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5'} bg-teal-700 hover:bg-teal-800 active:scale-98 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Mulai Proses QC
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  // Table 2: Proses Uji Lab Table
  const renderTestingTable = (items: QcInspectionReport[], emptyText: string) => (
    <table className={`w-full text-left border-collapse ${isCompactMode ? 'text-[11px]' : 'text-xs'}`}>
      <thead>
        <tr className={`border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 ${isCompactMode ? 'text-[10px]' : 'text-[11px]'}`}>
          <th className={`${isCompactMode ? 'p-1.5 w-8' : 'p-3 w-10'} text-center`}>No</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>No. GRN</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Material & Batch</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Sampel yang Diuji</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Parameter Uji</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>Status</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>Tindakan</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr>
            <td colSpan={7} className={`${isCompactMode ? 'p-4' : 'p-8'} text-center text-slate-400`}>
              {emptyText}
            </td>
          </tr>
        ) : (
          items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center font-mono text-slate-400`}>{idx + 1}</td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-mono font-bold text-slate-900">{item.grnNumber}</div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>Tgl: {item.receivedDate}</div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold rounded-md ${
                      isCompactMode ? 'px-1.5 py-0.2 text-[9.5px]' : 'px-2 py-0.5 text-[11px]'
                    } ${
                      item.materialType === 'raw' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.materialCode}
                  </span>
                  <span className="font-bold text-slate-900">{item.materialName}</span>
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500`}>
                  Batch: {item.batchNumberVendor} • {item.quantityReceived.toLocaleString('id-ID', { minimumFractionDigits: 3 })} {item.unit}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-bold text-teal-800">
                  {item.samplingInfo.sampleSizeQuantity} {item.samplingInfo.sampleUnit}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>
                  {item.samplingInfo.sampleSizeCodeLetter ? `MIL-STD Code: ${item.samplingInfo.sampleSizeCodeLetter}` : 'Formula CPKB √N+1'}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-semibold text-slate-700">
                  {item.parameters.length} Parameter Uji
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>
                  {item.parameters.filter((p) => p.resultValue).length}/{item.parameters.length} terisi
                </div>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>
                <span className={`rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-300 animate-pulse ${isCompactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}>
                  PROSES UJI LAB
                </span>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setRevertingReport(item)}
                    title="Revert ke Gudang"
                    className={`${isCompactMode ? 'p-1' : 'p-1.5'} text-slate-400 hover:text-amber-600 rounded-lg cursor-pointer`}
                  >
                    <ArrowLeftCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setInspectingReport(item)}
                    className={`inline-flex items-center gap-1 ${isCompactMode ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5'} bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow-xs cursor-pointer`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Input & Selesaikan Analisa
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  // Table 3: Menunggu Otorisasi Manager Table
  const renderApprovalTable = (items: QcInspectionReport[], emptyText: string) => (
    <table className={`w-full text-left border-collapse ${isCompactMode ? 'text-[11px]' : 'text-xs'}`}>
      <thead>
        <tr className={`border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 ${isCompactMode ? 'text-[10px]' : 'text-[11px]'}`}>
          <th className={`${isCompactMode ? 'p-1.5 w-8' : 'p-3 w-10'} text-center`}>No</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>No. Lot Internal</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Material & GRN Asal</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Rekomendasi Staf</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>AI Kepatuhan</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>Status</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>Otorisasi QM</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr>
            <td colSpan={7} className={`${isCompactMode ? 'p-4' : 'p-8'} text-center text-slate-400`}>
              {emptyText}
            </td>
          </tr>
        ) : (
          items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center font-mono text-slate-400`}>{idx + 1}</td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className={`font-mono font-bold text-indigo-900 ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
                  {item.lotInternalNumber || 'Laporan Terbit'}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>
                  Oleh: {item.staffSignature?.signerName}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold rounded-md ${
                      isCompactMode ? 'px-1.5 py-0.2 text-[9.5px]' : 'px-2 py-0.5 text-[11px]'
                    } ${
                      item.materialType === 'raw' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.materialCode}
                  </span>
                  <span className="font-bold text-slate-900">{item.materialName}</span>
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500`}>
                  GRN: {item.grnNumber} • Batch: {item.batchNumberVendor}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <span
                  className={`rounded-full font-bold ${isCompactMode ? 'px-2 py-0.2 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'} ${
                    item.staffDecision === 'RELEASE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.staffDecision === 'RELEASE'
                    ? 'MEMENUHI SYARAT (RILIS)'
                    : 'TIDAK MEMENUHI SYARAT (REJECT)'}
                </span>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500 mt-0.5 truncate max-w-xs`}>
                  {item.staffNotes || 'Selesai diuji analis.'}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                {item.aiAssessment && (
                  <div className="flex items-center gap-1 font-semibold text-purple-900">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{item.aiAssessment.complianceScore}% Sesuai</span>
                  </div>
                )}
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>
                <span className={`rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 ${isCompactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}>
                  AWAITING QM
                </span>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>
                <button
                  onClick={() => setAuthorizingReport(item)}
                  className={`inline-flex items-center gap-1.5 ${isCompactMode ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5'} bg-indigo-700 hover:bg-indigo-800 active:scale-98 text-white rounded-lg font-bold shadow-md transition-all cursor-pointer`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Otorisasi Manager
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  // Table 4: Arsip Laporan & Lot Terbit Table
  const renderArchiveTable = (items: QcInspectionReport[], emptyText: string) => (
    <table className={`w-full text-left border-collapse ${isCompactMode ? 'text-[11px]' : 'text-xs'}`}>
      <thead>
        <tr className={`border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 ${isCompactMode ? 'text-[10px]' : 'text-[11px]'}`}>
          <th className={`${isCompactMode ? 'p-1.5 w-8' : 'p-3 w-10'} text-center`}>No</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>No. Lot / Laporan</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Material & Pemasok</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Kuantitas Masuk</th>
          <th className={isCompactMode ? 'p-1.5' : 'p-3'}>Disposisi Quality Manager</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>Status Akhir</th>
          <th className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>Dokumen & Label</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <tr>
            <td colSpan={7} className={`${isCompactMode ? 'p-4' : 'p-8'} text-center text-slate-400`}>
              {emptyText}
            </td>
          </tr>
        ) : (
          items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center font-mono text-slate-400`}>{idx + 1}</td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className={`font-mono font-bold text-slate-900 ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
                  {item.lotInternalNumber || item.grnNumber}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400`}>GRN: {item.grnNumber}</div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold rounded-md ${
                      isCompactMode ? 'px-1.5 py-0.2 text-[9.5px]' : 'px-2 py-0.5 text-[11px]'
                    } ${
                      item.materialType === 'raw' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.materialCode}
                  </span>
                  <span className="font-bold text-slate-900">{item.materialName}</span>
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500`}>
                  Batch: {item.batchNumberVendor} • {item.distributor || item.manufacturer}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-bold text-slate-800">
                  {item.quantityReceived.toLocaleString('id-ID', { minimumFractionDigits: 3 })} {item.unit}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500`}>
                  {item.containerCount} {item.containerType}
                </div>
              </td>
              <td className={isCompactMode ? 'p-1.5' : 'p-3'}>
                <div className="font-semibold text-slate-800">
                  {item.qmSignature?.signerName || '-'}
                </div>
                <div className={`${isCompactMode ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500 font-mono`}>
                  {item.qmSignature?.signedAt ? new Date(item.qmSignature.signedAt).toLocaleDateString('id-ID') : '-'}
                </div>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-center`}>
                <span
                  className={`rounded-full font-bold border ${isCompactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} ${
                    item.status === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : item.status === 'PASSED_WITH_DEVIATION'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : item.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {item.status === 'PASSED'
                    ? 'LOLOS QC (RELEASE)'
                    : item.status === 'PASSED_WITH_DEVIATION'
                    ? 'RELEASE BY DEVIATION'
                    : item.status === 'REJECTED'
                    ? 'REJECTED (DITOLAK)'
                    : 'REVERTED'}
                </span>
              </td>
              <td className={`${isCompactMode ? 'p-1.5' : 'p-3'} text-right`}>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setLabelReport(item)}
                    title="Cetak Label Status QC"
                    className={`inline-flex items-center gap-1 ${isCompactMode ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'} bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Label
                  </button>
                  <button
                    onClick={() => setPdfReport(item)}
                    className={`inline-flex items-center gap-1.5 ${isCompactMode ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5'} bg-teal-700 hover:bg-teal-800 active:scale-98 text-white rounded-lg font-bold shadow-xs cursor-pointer`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Laporan PDF
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30">
              <FlaskConical className="w-6 h-6 text-teal-300" />
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Quality Assurance & Laboratorium Pengawasan Mutu (QC)
            </h2>
          </div>
          <p className="text-xs text-teal-100/80 font-normal">
            PT. LARASSANTI MAKMUR SEJAHTERA • Standar CPKB (Bahan Baku $\sqrt{'{N}'}+1$) & MIL-STD-105E Level II (Bahan Kemas)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDiagnosticAudit(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-700/80 hover:bg-teal-600 text-white text-xs font-bold border border-teal-400/40 flex items-center gap-1.5 transition-all shadow-sm"
            title="Audit Komparasi Kriteria Master Kemasan (15) vs Checklist Lab (5)"
          >
            <Database className="w-4 h-4 text-teal-200" />
            <span className="hidden sm:inline">Audit Diagnostik Master vs Lab</span>
            <span className="sm:hidden">Audit DB</span>
          </button>
          <QcNotificationsCenter
            onSelectReport={(reportId) => {
              const rep = reports.find((r) => r.id === reportId);
              if (rep) {
                if (rep.status === 'AWAITING_QM_AUTHORIZATION') {
                  setCurrentTab('approval');
                  setAuthorizingReport(rep);
                } else if (rep.status === 'QUALITY_CONTROL_PROCESS') {
                  setCurrentTab('testing');
                  setInspectingReport(rep);
                } else if (rep.status === 'PASSED' || rep.status === 'REJECTED') {
                  setCurrentTab('archive');
                  setPdfReport(rep);
                }
              }
            }}
          />
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setCurrentTab('queue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'queue'
              ? 'bg-amber-500/10 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Antrean Karantina</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.totalQuarantine}</div>
          <div className="text-[11px] text-slate-500 flex gap-2 font-medium">
            <span>BB: {stats.quarantineRaw}</span>
            <span>•</span>
            <span>BK: {stats.quarantinePkg}</span>
          </div>
        </div>

        <div
          onClick={() => setCurrentTab('testing')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'testing'
              ? 'bg-teal-500/10 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Proses Uji Lab</span>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 mt-1">{stats.inTesting}</div>
          <div className="text-[11px] text-slate-500 flex gap-2 font-medium">
            <span>BB: {stats.testingRaw}</span>
            <span>•</span>
            <span>BK: {stats.testingPkg}</span>
          </div>
        </div>

        <div
          onClick={() => setCurrentTab('approval')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'approval'
              ? 'bg-indigo-500/10 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu Approval QM</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.awaitingApproval}</div>
          <div className="text-[11px] text-slate-500 flex gap-2 font-medium">
            <span>BB: {stats.approvalRaw}</span>
            <span>•</span>
            <span>BK: {stats.approvalPkg}</span>
          </div>
        </div>

        <div
          onClick={() => setCurrentTab('archive')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'archive'
              ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Laporan Resmi Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {stats.passed}{' '}
            <span className="text-xs font-normal text-red-500 font-sans">
              ({stats.rejected} Reject)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex gap-2 font-medium">
            <span>BB: {stats.archiveRaw}</span>
            <span>•</span>
            <span>BK: {stats.archivePkg}</span>
          </div>
        </div>
      </div>

      {/* AI Smart Queue Optimizer Panel (Shown on Queue tab) */}
      {currentTab === 'queue' && queuePriorities.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <h3 className="font-bold text-sm tracking-tight text-purple-100">
                AI Smart Queue Optimizer (Rekomendasi Prioritas Sampling & Uji)
              </h3>
            </div>
            <span className="text-[11px] text-purple-300 bg-purple-800/60 px-2.5 py-0.5 rounded-full border border-purple-600/40">
              Analisis Otomatis Risiko & Lead Time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {queuePriorities.slice(0, 3).map((item, idx) => (
              <div
                key={item.reportId}
                className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 text-xs space-y-1.5 hover:bg-white/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-200">
                    #{idx + 1} {item.materialCode}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                      item.priorityRank === 'URGENT'
                        ? 'bg-red-500 text-white'
                        : item.priorityRank === 'HIGH'
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-teal-400 text-teal-950'
                    }`}
                  >
                    {item.priorityRank} ({item.priorityScore} Pts)
                  </span>
                </div>
                <div className="font-semibold text-white truncate">{item.materialName}</div>
                <div className="text-[11px] text-purple-200/90 leading-snug">{item.reason}</div>
                <div className="text-[10px] text-purple-300 font-semibold pt-1 border-t border-white/10">
                  ⚡ {item.samplingUrgency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-Only Tab Selector (Shown only on small screens) */}
      <div className="md:hidden mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 block">Pilih Sub-Modul QC:</label>
        <select
          value={currentTab}
          onChange={(e) => setCurrentTab(e.target.value as any)}
          className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <optgroup label="1. Incoming (Bahan Masuk)">
            <option value="queue">1.1 Antrean Karantina</option>
            <option value="testing">1.2 Pengujian Lab</option>
            <option value="approval">1.3 Otorisasi Manager</option>
            <option value="archive">1.4 Arsip Laporan & Lot</option>
          </optgroup>
          <optgroup label="2. In-Process Control (IPC)">
            <option value="ipc-bulk">2.1 Sediaan Ruahan (Bulk)</option>
            <option value="ipc-rework">2.2 Uji Rework</option>
          </optgroup>
          <optgroup label="3. Retained & Stability">
            <option value="retained">3.1 Retained Sample</option>
            <option value="stability">3.2 Stability Study</option>
          </optgroup>
          <optgroup label="4. Document Control & Keluhan">
            <option value="sop">4.1 Daftar SOP Aktif</option>
            <option value="capa">4.2 Riwayat Deviasi & CAPA</option>
            <option value="complaints">4.3 Complaint Handling</option>
          </optgroup>
        </select>
      </div>

      {/* Main Filter & Content Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Dynamic Descriptive Quality Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              {currentTab === 'queue' && <><Clock className="w-3.5 h-3.5 text-amber-500" /> 1.1 Antrean Karantina</>}
              {currentTab === 'testing' && <><FlaskConical className="w-3.5 h-3.5 text-teal-600" /> 1.2 Pengujian Lab</>}
              {currentTab === 'approval' && <><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> 1.3 Otorisasi Manager</>}
              {currentTab === 'archive' && <><FileText className="w-3.5 h-3.5 text-emerald-600" /> 1.4 Arsip Laporan & Lot</>}
              {currentTab === 'ipc-bulk' && <><Sliders className="w-3.5 h-3.5 text-blue-600" /> 2.1 Sediaan Ruahan (Bulk)</>}
              {currentTab === 'ipc-rework' && <><FlaskConical className="w-3.5 h-3.5 text-orange-500" /> 2.2 Uji Rework</>}
              {currentTab === 'retained' && <><Package className="w-3.5 h-3.5 text-teal-700" /> 3.1 Retained Sample</>}
              {currentTab === 'stability' && <><CalendarDays className="w-3.5 h-3.5 text-purple-700" /> 3.2 Stability Study</>}
              {currentTab === 'sop' && <><FileText className="w-3.5 h-3.5 text-slate-700" /> 4.1 Daftar SOP Aktif</>}
              {currentTab === 'capa' && <><ClipboardList className="w-3.5 h-3.5 text-rose-600" /> 4.2 Riwayat Deviasi & CAPA</>}
              {currentTab === 'complaints' && <><Info className="w-3.5 h-3.5 text-blue-600" /> 4.3 Complaint Handling</>}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {currentTab === 'queue' && 'Sampling bahan masuk menggunakan rumus CPKB n = 1 + sqrt(N) wadah.'}
              {currentTab === 'testing' && 'Pengujian laboratorium fisik, kimia, dan mikrobiologi standar CPKB.'}
              {currentTab === 'approval' && 'Pelepasan otorisasi atau penolakan bahan baku dan bahan kemas oleh Quality Manager.'}
              {currentTab === 'archive' && 'Penyimpanan digital lembar Laporan Hasil Analisis (LHA) resmi rilis.'}
              {currentTab === 'ipc-bulk' && 'Pemeriksaan kualitas sediaan setengah jadi adonan cream, gel, pasta, liquid sebelum pengemasan.'}
              {currentTab === 'ipc-rework' && 'Pengendalian pengerjaan ulang sediaan bets yang tidak sesuai parameter.'}
              {currentTab === 'retained' && 'Penyimpanan contoh pertinggal bahan baku, bahan kemas, produk jadi untuk jaminan mutu CPKB.'}
              {currentTab === 'stability' && 'Monitoring stabilitas organoleptik, pH, viskositas produk jadi di climate chamber.'}
              {currentTab === 'sop' && 'Daftar dokumen standar prosedur operasional pengujian aktif laboratorium QC.'}
              {currentTab === 'capa' && 'Sistem pelaporan penyimpangan, ketidaksesuaian kritis/minor, dan tindakan korektif preventif.'}
              {currentTab === 'complaints' && 'Registrasi laporan keluhan konsumen dan pengujian retained sample investigasi.'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Contextual Search */}
            {['queue', 'testing', 'approval', 'archive', 'retained', 'sop', 'capa', 'complaints'].includes(currentTab) && (
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Cari data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-[11px] text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 w-full sm:w-44"
                />
              </div>
            )}

            {/* Compact Mode Toggle */}
            {['queue', 'testing', 'approval', 'archive', 'ipc-bulk', 'ipc-rework', 'retained'].includes(currentTab) && (
              <button
                type="button"
                onClick={() => setIsCompactMode(!isCompactMode)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
                  isCompactMode
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Kurangi padding dan ukuran font"
              >
                {isCompactMode ? <Minimize2 className="w-3.5 h-3.5 text-teal-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>Ringkas</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Antrean Karantina */}
        {currentTab === 'queue' && (
          <div className="p-4 space-y-4">
            {renderMaterialFilterTabs(stats.quarantineRaw, stats.quarantinePkg, stats.totalQuarantine)}

            {activeMaterialType === 'all' ? (
              <div className="space-y-6">
                {/* 1. Bahan Baku Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Antrean Bahan Baku (BB)
                      </h4>
                      <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Formula CPKB: $n = 1 + \sqrt{'{N}'}$ wadah
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {queueRawList.length} Bahan Menunggu
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderQueueTable(queueRawList, 'Tidak ada antrean Bahan Baku di karantina.')}
                  </div>
                </div>

                {/* 2. Bahan Kemas Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Antrean Bahan Kemas (BK)
                      </h4>
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        MIL-STD-105E Level II (Single Sampling Normal)
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {queuePackagingList.length} Bahan Menunggu
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderQueueTable(queuePackagingList, 'Tidak ada antrean Bahan Kemas di karantina.')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {renderQueueTable(
                  queueList,
                  `Tidak ada antrean ${activeMaterialType === 'raw' ? 'Bahan Baku (BB)' : 'Bahan Kemas (BK)'} di karantina.`
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Proses Uji Lab */}
        {currentTab === 'testing' && (
          <div className="p-4 space-y-4">
            {renderMaterialFilterTabs(stats.testingRaw, stats.testingPkg, stats.inTesting)}

            {activeMaterialType === 'all' ? (
              <div className="space-y-6">
                {/* 1. Bahan Baku Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Uji Lab Bahan Baku (BB)
                      </h4>
                      <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Pemeriksaan Kimia, Fisika & Organoleptik
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {testingRawList.length} Bahan Sedang Diuji
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderTestingTable(testingRawList, 'Tidak ada pengujian laboratorium Bahan Baku yang sedang berjalan.')}
                  </div>
                </div>

                {/* 2. Bahan Kemas Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Uji Lab Bahan Kemas (BK)
                      </h4>
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Dimensi, Kebocoran, Teks & Kesesuaian Fisik
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {testingPackagingList.length} Bahan Sedang Diuji
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderTestingTable(testingPackagingList, 'Tidak ada pengujian laboratorium Bahan Kemas yang sedang berjalan.')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {renderTestingTable(
                  testingList,
                  `Tidak ada pengujian laboratorium ${activeMaterialType === 'raw' ? 'Bahan Baku (BB)' : 'Bahan Kemas (BK)'} yang sedang berjalan.`
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Menunggu Otorisasi Manager */}
        {currentTab === 'approval' && (
          <div className="p-4 space-y-4">
            {renderMaterialFilterTabs(stats.approvalRaw, stats.approvalPkg, stats.awaitingApproval)}

            {activeMaterialType === 'all' ? (
              <div className="space-y-6">
                {/* 1. Bahan Baku Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Otorisasi QM: Bahan Baku (BB)
                      </h4>
                      <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Penerbitan No. Lot LBB
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {approvalRawList.length} Lot Menunggu
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderApprovalTable(approvalRawList, 'Tidak ada lot Bahan Baku yang sedang menunggu otorisasi Quality Manager.')}
                  </div>
                </div>

                {/* 2. Bahan Kemas Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Otorisasi QM: Bahan Kemas (BK)
                      </h4>
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Penerbitan No. Lot LBK
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {approvalPackagingList.length} Lot Menunggu
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderApprovalTable(approvalPackagingList, 'Tidak ada lot Bahan Kemas yang sedang menunggu otorisasi Quality Manager.')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {renderApprovalTable(
                  approvalList,
                  `Tidak ada lot ${activeMaterialType === 'raw' ? 'Bahan Baku (BB)' : 'Bahan Kemas (BK)'} yang sedang menunggu otorisasi Quality Manager.`
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Arsip Laporan Pemeriksaan & Lot Terbit */}
        {currentTab === 'archive' && (
          <div className="p-4 space-y-4">
            {renderMaterialFilterTabs(stats.archiveRaw, stats.archivePkg, stats.archiveTotal)}

            {activeMaterialType === 'all' ? (
              <div className="space-y-6">
                {/* 1. Bahan Baku Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Laporan Resmi Bahan Baku (LBB)
                      </h4>
                      <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Format LBBYYMMxxx
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {archiveRawList.length} Laporan Selesai
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderArchiveTable(archiveRawList, 'Belum ada arsip laporan pemeriksaan Bahan Baku yang selesai.')}
                  </div>
                </div>

                {/* 2. Bahan Kemas Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Laporan Resmi Bahan Kemas (LBK)
                      </h4>
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Format LBKYYMMxxx
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {archivePackagingList.length} Laporan Selesai
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {renderArchiveTable(archivePackagingList, 'Belum ada arsip laporan pemeriksaan Bahan Kemas yang selesai.')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {renderArchiveTable(
                  archiveList,
                  `Belum ada arsip laporan pemeriksaan ${activeMaterialType === 'raw' ? 'Bahan Baku (BB)' : 'Bahan Kemas (BK)'} yang selesai.`
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.1: IPC - Sediaan Ruahan (Bulk) */}
        {currentTab === 'ipc-bulk' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Monitoring Mutu Adonan Ruahan</h4>
                <p className="text-[10px] text-slate-500">Kesesuaian pH, Viskositas, Bobot Jenis sebelum di-filling ke kemasan primer.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIpcForm(!showIpcForm)}
                className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Hasil Uji Bulk</span>
              </button>
            </div>

            {/* Form Input Hasil Uji Bulk */}
            {showIpcForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const isPassed = Number(newIpc.pH) >= 5.0 && Number(newIpc.pH) <= 7.5 && Number(newIpc.viscosity) >= 1500 && Number(newIpc.viscosity) <= 18000;
                  const added: IpcBulkTest = {
                    id: `IPC-B-${Date.now().toString().slice(-5)}`,
                    batchNo: newIpc.batchNo || 'B260904X',
                    productName: newIpc.productName || 'Base Lotion Moisturizer',
                    mixingDate: new Date().toISOString().split('T')[0],
                    pH: Number(newIpc.pH),
                    viscosity: Number(newIpc.viscosity),
                    appearance: newIpc.appearance || 'Homogen',
                    gravity: Number(newIpc.gravity),
                    status: isPassed ? 'PASSED' : 'REJECTED',
                    analyst: newIpc.analyst || user?.name || 'Staff QC',
                  };
                  setIpcBulkTests([added, ...ipcBulkTests]);
                  setShowIpcForm(false);
                  setNewIpc({ batchNo: '', productName: '', pH: 6.0, viscosity: 4000, appearance: 'Homogen, Sesuai Spek', gravity: 1.0, status: 'TESTING', analyst: user?.name || 'Staff QC' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nomor Bets (Batch No)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B260904A"
                    value={newIpc.batchNo}
                    onChange={(e) => setNewIpc({ ...newIpc, batchNo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nama Produk Jadi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Aloe Vera Soothing Gel"
                    value={newIpc.productName}
                    onChange={(e) => setNewIpc({ ...newIpc, productName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">pH (Spek: 5.0 - 7.5)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newIpc.pH}
                    onChange={(e) => setNewIpc({ ...newIpc, pH: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Viskositas (Spek: 1500-18000 cPs)</label>
                  <input
                    type="number"
                    required
                    value={newIpc.viscosity}
                    onChange={(e) => setNewIpc({ ...newIpc, viscosity: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Bobot Jenis (g/ml)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newIpc.gravity}
                    onChange={(e) => setNewIpc({ ...newIpc, gravity: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Pemeriksaan Fisik (Pemerian)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Homogen, Putih Lembut"
                    value={newIpc.appearance}
                    onChange={(e) => setNewIpc({ ...newIpc, appearance: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIpcForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Simpan Laporan
                  </button>
                </div>
              </form>
            )}

            {/* Table Hasil Uji Bulk */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-3">ID Laporan</th>
                    <th className="p-3">No. Bets</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3">Tanggal Mixing</th>
                    <th className="p-3 text-center">pH</th>
                    <th className="p-3 text-center">Viskositas</th>
                    <th className="p-3">Pemerian (Appearance)</th>
                    <th className="p-3 text-center">Bobot Jenis</th>
                    <th className="p-3">Analis</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {ipcBulkTests.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{t.id}</td>
                      <td className="p-3"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold">{t.batchNo}</span></td>
                      <td className="p-3 font-semibold">{t.productName}</td>
                      <td className="p-3 text-slate-500">{t.mixingDate}</td>
                      <td className={`p-3 text-center font-bold ${t.pH >= 5.0 && t.pH <= 7.5 ? 'text-slate-800' : 'text-rose-600'}`}>{t.pH}</td>
                      <td className="p-3 text-center font-semibold">{t.viscosity.toLocaleString()} cPs</td>
                      <td className="p-3 text-slate-500 italic">{t.appearance}</td>
                      <td className="p-3 text-center">{t.gravity} g/ml</td>
                      <td className="p-3 text-slate-600 font-semibold">{t.analyst}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            t.status === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'TESTING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2.2: IPC - Uji Rework */}
        {currentTab === 'ipc-rework' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Log & Otorisasi Pengolahan Ulang (Rework)</h4>
                <p className="text-[10px] text-slate-500">Pengerjaan kembali sediaan setengah jadi bermutu sub-standard yang diijinkan CPKB.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReworkForm(!showReworkForm)}
                className="bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftar Rework Baru</span>
              </button>
            </div>

            {/* Form Rework */}
            {showReworkForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const added: IpcReworkTest = {
                    id: `REW-${Date.now().toString().slice(-5)}`,
                    originalBatchNo: newRework.originalBatchNo || 'B260899X',
                    reworkBatchNo: `${newRework.originalBatchNo || 'B260899X'}-R1`,
                    productName: newRework.productName || 'Product Base Cream',
                    reworkReason: newRework.reworkReason || 'Koreksi viskositas sediaan',
                    reworkDate: new Date().toISOString().split('T')[0],
                    pHTest: Number(newRework.pHTest),
                    viscosityTest: Number(newRework.viscosityTest),
                    microbiology: newRework.microbiology as any,
                    status: newRework.microbiology === 'NEGATIVE' ? 'PASSED' : 'TESTING',
                    authorizedBy: 'Diana Putri (QM)',
                  };
                  setIpcReworkTests([added, ...ipcReworkTests]);
                  setShowReworkForm(false);
                  setNewRework({ originalBatchNo: '', productName: '', reworkReason: '', pHTest: 6.0, viscosityTest: 4000, microbiology: 'PENDING', status: 'TESTING', authorizedBy: 'Diana Putri (QM)' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">No Bets Asal (Original Batch)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B260815X"
                    value={newRework.originalBatchNo}
                    onChange={(e) => setNewRework({ ...newRework, originalBatchNo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nama Produk Jadi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Glow Body Lotion"
                    value={newRework.productName}
                    onChange={(e) => setNewRework({ ...newRework, productName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Alasan Rework & Analisa Masalah</label>
                  <textarea
                    required
                    placeholder="Tuliskan deviasi pengolahan dan instruksi koreksi dari R&D / QC Manager"
                    value={newRework.reworkReason}
                    onChange={(e) => setNewRework({ ...newRework, reworkReason: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500 h-16 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Hasil pH Re-Test</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newRework.pHTest}
                    onChange={(e) => setNewRework({ ...newRework, pHTest: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Hasil Viskositas Re-Test (cPs)</label>
                  <input
                    type="number"
                    required
                    value={newRework.viscosityTest}
                    onChange={(e) => setNewRework({ ...newRework, viscosityTest: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Uji Mikrobiologi Rework (Cemaran)</label>
                  <select
                    value={newRework.microbiology}
                    onChange={(e) => setNewRework({ ...newRework, microbiology: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="PENDING">PENDING (Inkubasi 48 jam)</option>
                    <option value="NEGATIVE">NEGATIVE (Lolos - Bebas Coliform & Jamur)</option>
                    <option value="POSITIVE">POSITIVE (Gagal - Terkontaminasi)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReworkForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Otorisasi & Rilis Rework
                  </button>
                </div>
              </form>
            )}

            {/* List Reworks */}
            <div className="space-y-3">
              {ipcReworkTests.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-orange-50 text-orange-800 text-[10px] font-black border border-orange-200 px-2 py-0.5 rounded-md">{r.id}</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Asal: {r.originalBatchNo}</span>
                      <span className="bg-teal-50 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Rework Bets: {r.reworkBatchNo}</span>
                      <span className="font-bold text-slate-800 text-xs">{r.productName}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100"><strong className="text-amber-800">Alasan:</strong> {r.reworkReason}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold pt-1">
                      <span>Tanggal: {r.reworkDate}</span>
                      <span>pH Re-test: <strong>{r.pHTest}</strong></span>
                      <span>Viskositas: <strong>{r.viscosityTest.toLocaleString()} cPs</strong></span>
                      <span className="flex items-center gap-1">Mikroba: <strong className={r.microbiology === 'NEGATIVE' ? 'text-emerald-700' : 'text-amber-600'}>{r.microbiology}</strong></span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold italic">Authorized: {r.authorizedBy}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                        r.status === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {r.status === 'PASSED' ? 'RILIS - PASSED' : 'KARANTINA - RE-TESTING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3.1: Retained Sample */}
        {currentTab === 'retained' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Gudang Contoh Pertinggal (Retained Sample)</h4>
                <p className="text-[10px] text-slate-500">Penyimpanan contoh pertinggal bets rilis selama masa kadaluwarsa + 1 tahun sesuai CPKB.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRetainedForm(!showRetainedForm)}
                className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Sampel Baru</span>
              </button>
            </div>

            {/* Form Retained */}
            {showRetainedForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const added: RetainedSample = {
                    id: `RET-${Date.now().toString().slice(-5)}`,
                    batchNo: newRetained.batchNo || 'B260905D',
                    productName: newRetained.productName || 'New Lotion Sample',
                    type: newRetained.type as any,
                    expiryDate: newRetained.expiryDate || '2029-09-03',
                    rackNo: newRetained.rackNo || 'RAK-PJ-10',
                    qty: newRetained.qty || '3 pcs',
                    status: 'Simpan',
                    receivedDate: new Date().toISOString().split('T')[0],
                  };
                  setRetainedSamples([added, ...retainedSamples]);
                  setShowRetainedForm(false);
                  setNewRetained({ batchNo: '', productName: '', type: 'Produk Jadi', expiryDate: '2029-09-03', rackNo: '', qty: '3 pcs', status: 'Simpan' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">No Bets / Lot</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: LOT-N-2609A"
                    value={newRetained.batchNo}
                    onChange={(e) => setNewRetained({ ...newRetained, batchNo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nama Produk / Material</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Vitamin C Active"
                    value={newRetained.productName}
                    onChange={(e) => setNewRetained({ ...newRetained, productName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Kategori Sampel</label>
                  <select
                    value={newRetained.type}
                    onChange={(e) => setNewRetained({ ...newRetained, type: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Bahan Baku">Bahan Baku (BB)</option>
                    <option value="Bahan Kemas">Bahan Kemas (BK)</option>
                    <option value="Produk Jadi">Produk Jadi (PJ)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Lokasi Rak Penyimpanan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RAK-BB-09B"
                    value={newRetained.rackNo}
                    onChange={(e) => setNewRetained({ ...newRetained, rackNo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Jumlah Simpan (Qty)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 100 g atau 3 pcs"
                    value={newRetained.qty}
                    onChange={(e) => setNewRetained({ ...newRetained, qty: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Tanggal Expired (ED)</label>
                  <input
                    type="date"
                    required
                    value={newRetained.expiryDate}
                    onChange={(e) => setNewRetained({ ...newRetained, expiryDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRetainedForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Arsipkan Sampel
                  </button>
                </div>
              </form>
            )}

            {/* List Retained Samples */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-3">ID Arsip</th>
                    <th className="p-3">No. Bets / Lot</th>
                    <th className="p-3">Nama Item</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Lokasi Rak</th>
                    <th className="p-3">Jumlah Arsip</th>
                    <th className="p-3 text-center">Tgl Masuk</th>
                    <th className="p-3 text-center">Exp Date</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {retainedSamples
                    .filter(s => searchQuery === '' || s.productName.toLowerCase().includes(searchQuery.toLowerCase()) || s.batchNo.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{s.id}</td>
                        <td className="p-3"><span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-bold">{s.batchNo}</span></td>
                        <td className="p-3 font-semibold text-slate-800">{s.productName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                              s.type === 'Bahan Baku'
                                ? 'bg-amber-100 text-amber-800'
                                : s.type === 'Bahan Kemas'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {s.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700"><span className="border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50">{s.rackNo}</span></td>
                        <td className="p-3 font-medium text-slate-600">{s.qty}</td>
                        <td className="p-3 text-center text-slate-500">{s.receivedDate}</td>
                        <td className="p-3 text-center text-rose-600 font-semibold">{s.expiryDate}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                              s.status === 'Simpan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'Diambil untuk Re-test'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                : 'bg-slate-100 text-slate-500 line-through'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {s.status === 'Simpan' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRetainedSamples(prev => prev.map(item => item.id === s.id ? { ...item, status: 'Diambil untuk Re-test' } : item));
                                }}
                                className="bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
                              >
                                Re-Test
                              </button>
                            )}
                            {s.status !== 'Dimusnahkan' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRetainedSamples(prev => prev.map(item => item.id === s.id ? { ...item, status: 'Dimusnahkan' } : item));
                                }}
                                className="bg-slate-50 hover:bg-rose-500 hover:text-white text-rose-600 text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
                              >
                                Musnahkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3.2: Stability Study */}
        {currentTab === 'stability' && (
          <div className="p-4 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Visual pH & Viscosity Stability Chart (Climate Chamber)</h4>
                  <p className="text-[10px] text-slate-500">Representasi tren kestabilan emulsi dan formulasi sediaan pada suhu ekstrim dipercepat (40°C / 75% RH).</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600"><span className="w-3 h-3 bg-teal-500 rounded-full"></span> pH Target (5.5 - 6.5)</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Viskositas (x1000 cPs)</span>
                </div>
              </div>

              {/* Breathtaking SVG Custom Graph */}
              <div className="w-full bg-white border border-slate-200 rounded-xl p-4 overflow-hidden relative shadow-3xs">
                <svg viewBox="0 0 500 160" className="w-full h-40">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="50" x2="480" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="110" x2="480" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="2" />

                  {/* Horizontal Labels */}
                  <text x="40" y="152" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">Bulan 0</text>
                  <text x="150" y="152" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">Bulan 1</text>
                  <text x="260" y="152" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">Bulan 2</text>
                  <text x="370" y="152" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">Bulan 3</text>
                  <text x="470" y="152" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">Bulan 6 (Target)</text>

                  {/* Left Axis Labels (pH Scale) */}
                  <text x="32" y="24" fill="#0d9488" fontSize="7" fontWeight="bold" textAnchor="end">7.0 pH</text>
                  <text x="32" y="64" fill="#0d9488" fontSize="7" fontWeight="bold" textAnchor="end">6.0 pH</text>
                  <text x="32" y="104" fill="#0d9488" fontSize="7" fontWeight="bold" textAnchor="end">5.0 pH</text>

                  {/* Right Axis Labels (Viscosity Scale) */}
                  <text x="488" y="24" fill="#7c3aed" fontSize="7" fontWeight="bold" textAnchor="start">5000 cPs</text>
                  <text x="488" y="64" fill="#7c3aed" fontSize="7" fontWeight="bold" textAnchor="start">4000 cPs</text>
                  <text x="488" y="104" fill="#7c3aed" fontSize="7" fontWeight="bold" textAnchor="start">3000 cPs</text>

                  {/* pH Trend Line (Teal) */}
                  {/* points: B0 (6.2) -> B1 (6.18) -> B2 (6.15) -> B3 (6.1) */}
                  {/* coordinates X: B0=40, B1=150, B2=260, B3=370 */}
                  {/* coordinates Y: B0=56, B1=56.8, B2=58, B3=60 */}
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    points="40,56 150,56.8 260,58 370,60"
                  />
                  {/* Dots for pH */}
                  <circle cx="40" cy="56" r="4.5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="150" cy="56.8" r="4.5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="260" cy="58" r="4.5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="370" cy="60" r="4.5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" />

                  {/* Viscosity Trend Line (Purple) */}
                  {/* points: B0 (4200) -> B1 (4150) -> B2 (4100) -> B3 (4050) */}
                  {/* coordinates Y: B0=52, B1=54, B2=56, B3=58 */}
                  <polyline
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="1"
                    points="40,52 150,54 260,56 370,58"
                  />
                  {/* Dots for Viscosity */}
                  <rect x="36" y="48" width="8" height="8" fill="#7c3aed" stroke="#fff" strokeWidth="1.5" rx="1.5" />
                  <rect x="146" y="50" width="8" height="8" fill="#7c3aed" stroke="#fff" strokeWidth="1.5" rx="1.5" />
                  <rect x="256" y="52" width="8" height="8" fill="#7c3aed" stroke="#fff" strokeWidth="1.5" rx="1.5" />
                  <rect x="366" y="54" width="8" height="8" fill="#7c3aed" stroke="#fff" strokeWidth="1.5" rx="1.5" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Chamber Stability Schedule</h4>
                <p className="text-[10px] text-slate-500">Status penarikan (pull date) dan parameter kontrol fisis produk.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStabilityForm(!showStabilityForm)}
                className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mulai Studi Stabilitas Baru</span>
              </button>
            </div>

            {/* Form Stability */}
            {showStabilityForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const added: StabilityStudy = {
                    id: `STB-${Date.now().toString().slice(-5)}`,
                    productName: newStability.productName || 'Hydrating Facial Cleanser',
                    batchNo: newStability.batchNo || 'B260902X',
                    chamberTemp: newStability.chamberTemp || '40°C / 75% RH',
                    interval: 'Bulan ke-0 (Accelerated)',
                    pullDate: newStability.pullDate || '2026-09-03',
                    status: 'BERJALAN',
                    pHHistory: [
                      { month: '0', pH: 6.0, viscosity: 4500, appearance: 'Homogen' }
                    ]
                  };
                  setStabilityStudies([added, ...stabilityStudies]);
                  setShowStabilityForm(false);
                  setNewStability({ productName: '', batchNo: '', chamberTemp: '40°C ± 2°C / 75% RH ± 5% (Accelerated)', interval: 'Bulan ke-0 (Accelerated)', pullDate: '2026-09-03', status: 'BERJALAN' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nama Produk Jadi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Glowing Bright Serum"
                    value={newStability.productName}
                    onChange={(e) => setNewStability({ ...newStability, productName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nomor Bets (Batch No)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B260902B"
                    value={newStability.batchNo}
                    onChange={(e) => setNewStability({ ...newStability, batchNo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Kondisi Suhu/RH Chamber</label>
                  <select
                    value={newStability.chamberTemp}
                    onChange={(e) => setNewStability({ ...newStability, chamberTemp: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="40°C ± 2°C / 75% RH ± 5% (Accelerated)">40°C / 75% RH (Accelerated)</option>
                    <option value="30°C ± 2°C / 65% RH ± 5% (Real Time)">30°C / 65% RH (Real Time)</option>
                    <option value="45°C ± 2°C / Suhu Ekstrim (Stress Test)">45°C / Suhu Ekstrim (Stress Test)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Target Tanggal Penarikan (Pull Date)</label>
                  <input
                    type="date"
                    required
                    value={newStability.pullDate}
                    onChange={(e) => setNewStability({ ...newStability, pullDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStabilityForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Simpan Laporan Studi
                  </button>
                </div>
              </form>
            )}

            {/* List Stability Study */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stabilityStudies.map((st) => (
                <div key={st.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md">{st.id}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">{st.status}</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{st.productName}</h5>
                    <div className="text-[10px] text-slate-500 font-semibold mt-1">Bets: <span className="text-slate-800 font-bold">{st.batchNo}</span> | Chamber: {st.chamberTemp}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Riwayat pH Uji Terakhir:</div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {st.pHHistory.map((h, index) => (
                        <div key={index} className="bg-white p-1 rounded-md border border-slate-200">
                          <div className="text-[8px] text-slate-400 font-bold uppercase">Bulan {h.month}</div>
                          <div className="text-[11px] font-bold text-slate-800">{h.pH}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
                    <span>Pull Date: <strong className="text-slate-800">{st.pullDate}</strong></span>
                    <span>Interval: <strong className="text-purple-700">{st.interval}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4.1: Daftar SOP Aktif */}
        {currentTab === 'sop' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Pustaka Dokumen Kepatuhan SOP</h4>
                <p className="text-[10px] text-slate-500">Penyusunan dokumen SOP laboratorium, kalibrasi alat, dan instruksi kerja LIMS.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSopForm(!showSopForm)}
                className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload SOP Baru</span>
              </button>
            </div>

            {/* Form SOP */}
            {showSopForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const added: SopDocument = {
                    id: `SOP-QC-${Date.now().toString().slice(-3)}`,
                    docNumber: newSop.docNumber || 'SOP/QC-LAB/999/REV.01',
                    title: newSop.title || 'New Standard Operating Procedure',
                    version: newSop.version || '01',
                    effectiveDate: newSop.effectiveDate || '2026-09-03',
                    category: newSop.category as any,
                    status: 'AKTIF'
                  };
                  setSopDocuments([added, ...sopDocuments]);
                  setShowSopForm(false);
                  setNewSop({ docNumber: '', title: '', version: '01', effectiveDate: '2026-09-03', category: 'QC', status: 'AKTIF' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nomor Registrasi Dokumen</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SOP/QC-LAB/025/REV.01"
                    value={newSop.docNumber}
                    onChange={(e) => setNewSop({ ...newSop, docNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Judul Prosedur Operasional</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penanganan Bahan Kimia Berbahaya"
                    value={newSop.title}
                    onChange={(e) => setNewSop({ ...newSop, title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Kategori Dokumen</label>
                  <select
                    value={newSop.category}
                    onChange={(e) => setNewSop({ ...newSop, category: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="QC">Quality Control (QC)</option>
                    <option value="QA">Quality Assurance (QA)</option>
                    <option value="SOP-PROD">Produksi CPKB</option>
                    <option value="WH">Warehouse Gudang</option>
                  </select>
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSopForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Rilis Dokumen SOP
                  </button>
                </div>
              </form>
            )}

            {/* List SOP Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sopDocuments
                .filter(doc => searchQuery === '' || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((doc) => (
                  <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-3xs flex justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">{doc.category}</span>
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-100">{doc.status}</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs leading-snug">{doc.title}</h5>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono">{doc.docNumber}</p>
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold">Tgl Berlaku: {doc.effectiveDate} | Versi: {doc.version}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => alert(`Simulasi Mengunduh File pdf Dokumen SOP: ${doc.title}`)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Unduh PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4.2: Riwayat Deviasi & CAPA */}
        {currentTab === 'capa' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Register Deviasi Pabrik & CAPA</h4>
                <p className="text-[10px] text-slate-500">Tindakan perbaikan segera (Correction) dan tindakan pencegahan berulang (Preventive Action) untuk pemenuhan sertifikasi GMP.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCapaForm(!showCapaForm)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Laporkan Deviasi</span>
              </button>
            </div>

            {/* Form CAPA */}
            {showCapaForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const added: CapaRecord = {
                    id: `CAPA-2026-${Date.now().toString().slice(-3)}`,
                    devNumber: newCapa.devNumber || 'DEV/PROD/2609-01',
                    source: newCapa.source || 'Deviasi Produksi',
                    description: newCapa.description || '',
                    severity: newCapa.severity as any,
                    rootCause: newCapa.rootCause || 'Sedang diinvestigasi',
                    correctiveAction: newCapa.correctiveAction || 'Koreksi langsung area terimbas',
                    preventiveAction: newCapa.preventiveAction || 'Penyusunan ulang SOP / Training staf terkait',
                    status: 'OPEN',
                    targetDate: newCapa.targetDate || '2026-09-15',
                  };
                  setCapaRecords([added, ...capaRecords]);
                  setShowCapaForm(false);
                  setNewCapa({ devNumber: '', source: 'Deviasi Produksi', description: '', severity: 'MINOR', rootCause: '', correctiveAction: '', preventiveAction: '', status: 'OPEN', targetDate: '2026-09-15' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">No. Register Deviasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DEV/PROD/2609-02"
                    value={newCapa.devNumber}
                    onChange={(e) => setNewCapa({ ...newCapa, devNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Tingkat Keparahan (Severity)</label>
                  <select
                    value={newCapa.severity}
                    onChange={(e) => setNewCapa({ ...newCapa, severity: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="MINOR">MINOR (Berdampak rendah pada sistem mutu)</option>
                    <option value="MAJOR">MAJOR (Berdampak sedang pada parameter proses)</option>
                    <option value="CRITICAL">CRITICAL (Mempengaruhi keamanan & mutu produk akhir)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Deskripsi Kerusakan / Temuan Deviasi</label>
                  <textarea
                    required
                    placeholder="Contoh: Terjadi kebocoran pipa suplai purified water..."
                    value={newCapa.description}
                    onChange={(e) => setNewCapa({ ...newCapa, description: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 h-16 resize-none"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Root Cause Analysis (RCA / 5 Whys)</label>
                  <textarea
                    required
                    placeholder="Mengapa pipa bocor? Karena tekanan AC overload akibat katup tersumbat..."
                    value={newCapa.rootCause}
                    onChange={(e) => setNewCapa({ ...newCapa, rootCause: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 h-16 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Tindakan Koreksi (Corrective Action)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Menghentikan pipa sementara, mengelas pipa rusak"
                    value={newCapa.correctiveAction}
                    onChange={(e) => setNewCapa({ ...newCapa, correctiveAction: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Tindakan Pencegahan (Preventive Action)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Menambahkan pressure sensor otomatis pada pipa"
                    value={newCapa.preventiveAction}
                    onChange={(e) => setNewCapa({ ...newCapa, preventiveAction: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCapaForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Simpan Laporan CAPA
                  </button>
                </div>
              </form>
            )}

            {/* List CAPA Records */}
            <div className="space-y-4">
              {capaRecords
                .filter(c => searchQuery === '' || c.devNumber.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((c) => (
                  <div
                    key={c.id}
                    className={`bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3 relative overflow-hidden ${
                      c.severity === 'CRITICAL'
                        ? 'border-l-4 border-l-rose-500'
                        : c.severity === 'MAJOR'
                        ? 'border-l-4 border-l-amber-500'
                        : 'border-l-4 border-l-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{c.id}</span>
                        <span className="font-mono text-[10px] text-slate-500 font-bold">{c.devNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[8px] font-extrabold ${
                            c.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : c.severity === 'MAJOR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold">Tutup: {c.targetDate}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCapaRecords(prev => prev.map(item => item.id === c.id ? { ...item, status: item.status === 'OPEN' ? 'CLOSED' : 'OPEN' } : item));
                          }}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black cursor-pointer transition-all ${
                            c.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {c.status === 'CLOSED' ? 'CLOSED (Selesai)' : 'OPEN (Berjalan)'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-800 font-bold leading-snug">{c.description}</p>
                      <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Akar Masalah (RCA):</span>
                          <p className="text-slate-600 font-medium leading-relaxed italic">{c.rootCause}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Tindakan CAPA:</span>
                          <p className="text-slate-700 font-semibold leading-relaxed">
                            <span className="text-rose-600">Koreksi:</span> {c.correctiveAction} <br />
                            <span className="text-emerald-700">Pencegahan:</span> {c.preventiveAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4.3: Complaint Handling */}
        {currentTab === 'complaints' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Registrasi Penanganan Keluhan Konsumen</h4>
                <p className="text-[10px] text-slate-500">Investigasi klaim mutu pelanggan, pengujian retained sample penelusuran balik.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintForm(!showComplaintForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrasi Keluhan Baru</span>
              </button>
            </div>

            {/* Form Complaint */}
            {showComplaintForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const added: QualityComplaint = {
                    id: `COM-${Date.now().toString().slice(-3)}`,
                    comNumber: newComplaint.comNumber || `COMP/2609-0${qualityComplaints.length + 1}`,
                    customer: newComplaint.customer || 'Customer Retail',
                    productName: newComplaint.productName || 'Matte Lip Cream',
                    batchNo: newComplaint.batchNo || 'B260901A',
                    complaintText: newComplaint.complaintText || '',
                    investigationText: 'Pengujian ulang sampel pertinggal sedang dikerjakan.',
                    retestResult: 'Menunggu re-test laboratorium.',
                    status: 'OPEN',
                    date: new Date().toISOString().split('T')[0],
                  };
                  setQualityComplaints([added, ...qualityComplaints]);
                  setShowComplaintForm(false);
                  setNewComplaint({ customer: '', productName: '', batchNo: '', complaintText: '', investigationText: 'Investigasi sampel pertinggal sedang dikerjakan.', retestResult: 'Menunggu hasil lab.', status: 'OPEN' });
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nama Distributor / Konsumen</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Cantik Jelita Retail"
                    value={newComplaint.customer}
                    onChange={(e) => setNewComplaint({ ...newComplaint, customer: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nama Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Brightening Cream SPF30"
                    value={newComplaint.productName}
                    onChange={(e) => setNewComplaint({ ...newComplaint, productName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Nomor Bets Terimbas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B260710C"
                    value={newComplaint.batchNo}
                    onChange={(e) => setNewComplaint({ ...newComplaint, batchNo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">Rincian Keluhan Konsumen</label>
                  <textarea
                    required
                    placeholder="Deskripsikan komplain atau cacat fisik produk..."
                    value={newComplaint.complaintText}
                    onChange={(e) => setNewComplaint({ ...newComplaint, complaintText: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 h-16 resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComplaintForm(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    Daftarkan Keluhan
                  </button>
                </div>
              </form>
            )}

            {/* List Complaints */}
            <div className="space-y-4">
              {qualityComplaints
                .filter(cp => searchQuery === '' || cp.comNumber.toLowerCase().includes(searchQuery.toLowerCase()) || cp.productName.toLowerCase().includes(searchQuery.toLowerCase()) || cp.customer.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((cp) => (
                  <div key={cp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">{cp.comNumber}</span>
                        <span className="bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 px-1.5 py-0.5 rounded-md">Bets: {cp.batchNo}</span>
                        <span className="font-bold text-slate-800 text-xs">{cp.productName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{cp.date}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider block">Klaim Konsumen ({cp.customer}):</div>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50">{cp.complaintText}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/80 space-y-2">
                      <div className="text-[9px] font-extrabold text-teal-800 uppercase tracking-wider block">Hasil Analisis & Investigasi Sampel Pertinggal:</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium"><strong>Investigasi:</strong> {cp.investigationText}</p>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-bold bg-white p-2 rounded-md border border-slate-200 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-teal-500"></span>
                        <span>Hasil Re-Test: {cp.retestResult}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                          cp.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cp.status === 'UNDER_INVESTIGATION'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cp.status === 'CLOSED' ? 'INVESTIGASI SELESAI (CLOSED)' : 'SEDANG DI-RETEST (QC PROCESS)'}
                      </span>
                      {cp.status !== 'CLOSED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setQualityComplaints(prev => prev.map(item => item.id === cp.id ? { ...item, status: 'CLOSED', retestResult: 'Selesai diinvestigasi. Laporan analisis disimpan di arsip.', investigationText: 'Retained sample dinyatakan lulus pengujian organoleptik ulang. Klaim komplain tidak valid/tidak disebabkan proses produksi.' } : item));
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black px-2.5 py-1 rounded-md transition-all cursor-pointer"
                        >
                          Selesaikan Investigasi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <QcInspectionModal
        isOpen={!!inspectingReport}
        onClose={() => setInspectingReport(null)}
        report={inspectingReport}
        onSubmitStaffAnalysis={handleSubmitStaffAnalysis}
      />

      <QcManagerAuthModal
        isOpen={!!authorizingReport}
        onClose={() => setAuthorizingReport(null)}
        report={authorizingReport}
        onAuthorize={handleAuthorizeManager}
      />

      <QcRevertModal
        isOpen={!!revertingReport}
        onClose={() => setRevertingReport(null)}
        report={revertingReport}
        onConfirmRevert={handleConfirmRevert}
      />

      <QcInspectionReportPdfModal
        isOpen={!!pdfReport}
        onClose={() => setPdfReport(null)}
        report={pdfReport}
      />

      <QcStatusLabelModal
        isOpen={!!labelReport}
        onClose={() => setLabelReport(null)}
        report={labelReport}
      />

      <QcDiagnosticAuditModal
        isOpen={showDiagnosticAudit}
        onClose={() => setShowDiagnosticAudit(false)}
        onSynced={loadData}
      />
    </div>
  );
};
