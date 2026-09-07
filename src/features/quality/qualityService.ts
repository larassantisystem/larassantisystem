import {
  QcInspectionReport,
  QcInspectionStatus,
  QcNotification,
  QcParameterResult,
} from './types/qcTypes';
import { GrnRecord } from '../warehouse/types/grnTypes';
import { warehouseService } from '../warehouse/warehouseService';
import { packagingService } from '../rnd/materials/packagingService';
import { materialService } from '../rnd/materials/materialService';
import { calculateSamplingPlan } from './utils/milStd105e';
import { generateLotInternalNumber, generateDigitalSignatureHash } from './utils/qcNumbering';
import { analyzeLabResults, analyzeQueuePriorities } from './utils/qcAiAssistant';
import { authService } from '../../core/auth/authService';
import { UserProfile } from '../../types';

const QC_REPORTS_STORAGE_KEY = 'lsm_qc_reports_v2';
const QC_NOTIFICATIONS_STORAGE_KEY = 'lsm_qc_notifications_v2';

export const qualityService = {
  /**
   * Get all QC inspection reports, synchronizing with latest warehouse GRN records and Master Data (Bagian B)
   */
  getReports: async (): Promise<QcInspectionReport[]> => {
    let storedReports: QcInspectionReport[] = [];
    const saved = localStorage.getItem(QC_REPORTS_STORAGE_KEY);
    if (saved) {
      try {
        storedReports = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse QC reports from storage:', e);
      }
    }

    // Fetch warehouse GRN records to sync incoming lots, along with Master Data (Bagian B)
    const [grnRecords, packagingMaterials, rawMaterials] = await Promise.all([
      warehouseService.getGrnRecords(),
      packagingService.getPackagingMaterials(),
      materialService.getMaterials(),
    ]);
    let isModified = false;

    // Prune orphan quarantine reports if the GRN was deleted in warehouse
    const validGrnIds = new Set(grnRecords.map(g => g.id));
    const validGrnNumbers = new Set(grnRecords.map(g => g.grnNumber));
    const initialReportCount = storedReports.length;
    storedReports = storedReports.filter(r => {
      if (r.status === 'QUARANTINE') {
        return validGrnIds.has(r.grnId) || validGrnNumbers.has(r.grnNumber);
      }
      return true;
    });
    if (storedReports.length !== initialReportCount) {
      isModified = true;
    }

    // Synchronize GRN records into QC Reports
    grnRecords.forEach((grn) => {
      const existingReport = storedReports.find((r) => r.grnId === grn.id || r.grnNumber === grn.grnNumber);

      // Resolve dynamic QC parameters registered in Master Data (Bagian B)
      let resolvedParams: Array<{ name: string; spec: string }> = [];
      if (grn.materialType === 'packaging') {
        const matchedPM = packagingMaterials.find(
          (pm) => pm.code === grn.materialCode || pm.name.toLowerCase() === grn.materialName.toLowerCase()
        );
        if (matchedPM?.qcParameters && matchedPM.qcParameters.length > 0) {
          resolvedParams = matchedPM.qcParameters
            .filter((p) => p.name && p.name.trim())
            .map((p) => ({ name: p.name, spec: p.specification || 'Sesuai Standar Spesifikasi Mutu' }));
        }
      } else {
        const matchedRM = rawMaterials.find(
          (rm) => rm.code === grn.materialCode || rm.name.toLowerCase() === grn.materialName.toLowerCase()
        );
        if (matchedRM?.qcParameters && matchedRM.qcParameters.length > 0) {
          resolvedParams = matchedRM.qcParameters
            .filter((p) => p.name && p.name.trim())
            .map((p) => ({ name: p.name, spec: p.specification || 'Sesuai Standar Spesifikasi Mutu' }));
        }
      }

      // Exact criteria from Master Bagian B (zero hardcoded defaults)
      const effectiveParamTemplates = resolvedParams;

      if (!existingReport) {
        // Calculate sampling plan
        const samplingInfo = calculateSamplingPlan(
          grn.materialType,
          grn.quantityReceived,
          grn.containerCount,
          grn.unit,
          grn.containerType
        );

        const parameters: QcParameterResult[] = effectiveParamTemplates.map((item, idx) => ({
          id: `param-${Date.now()}-${idx}`,
          parameterName: item.name,
          specification: item.spec,
          resultValue: '',
          isCompliant: true,
        }));

        const newReport: QcInspectionReport = {
          id: `qc-rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          grnId: grn.id,
          grnNumber: grn.grnNumber,
          materialType: grn.materialType,
          materialCode: grn.materialCode,
          materialName: grn.materialName,
          manufacturer: grn.manufacturer,
          distributor: grn.distributor,
          poNumber: grn.poNumber,
          deliveryNoteNumber: grn.deliveryNoteNumber,
          batchNumberVendor: grn.batchNumber || 'N/A',
          receivedDate: grn.receivedDate,
          expiryDate: grn.expiryDate,
          quantityReceived: grn.quantityReceived,
          unit: grn.unit,
          containerCount: grn.containerCount,
          containerType: grn.containerType,
          storageLocation: grn.storageLocation,
          storageConditions: grn.storageConditions,
          status: (grn.qcStatus as QcInspectionStatus) || 'QUARANTINE',
          samplingInfo,
          parameters,
          createdAt: grn.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        storedReports.push(newReport);
        isModified = true;
      } else {
        // Sync basic warehouse edits if reverted or updated
        let needsUpdate = false;
        
        if (existingReport.quantityReceived !== grn.quantityReceived || existingReport.containerCount !== grn.containerCount) {
          existingReport.quantityReceived = grn.quantityReceived;
          existingReport.containerCount = grn.containerCount;
          existingReport.samplingInfo = calculateSamplingPlan(
            grn.materialType,
            grn.quantityReceived,
            grn.containerCount,
            grn.unit,
            grn.containerType
          );
          needsUpdate = true;
        }

        // Live Synchronization with Master Bahan Kemas / Bahan Baku (Bagian B)
        // If the report is in QUARANTINE (untested), ensure all criteria from Master Data are fully synced
        if (existingReport.status === 'QUARANTINE') {
          const isParameterCountMismatch = existingReport.parameters.length !== effectiveParamTemplates.length;
          const isNameMismatch = effectiveParamTemplates.some(
            (ep, idx) => existingReport.parameters[idx]?.parameterName !== ep.name
          );

          if (isParameterCountMismatch || isNameMismatch) {
            existingReport.parameters = effectiveParamTemplates.map((item, idx) => ({
              id: `param-${Date.now()}-${idx}`,
              parameterName: item.name,
              specification: item.spec,
              resultValue: existingReport.parameters.find(p => p.parameterName === item.name)?.resultValue || '',
              isCompliant: existingReport.parameters.find(p => p.parameterName === item.name)?.isCompliant ?? true,
            }));
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          isModified = true;
        }
      }
    });

    if (isModified || !saved) {
      localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(storedReports));
    }

    return storedReports;
  },

  /**
   * Start QC inspection process (Transitions QUARANTINE -> QUALITY_CONTROL_PROCESS)
   */
  startInspectionProcess: async (reportId: string, user: UserProfile): Promise<QcInspectionReport> => {
    const reports = await qualityService.getReports();
    const report = reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Laporan QC tidak ditemukan');

    report.status = 'QUALITY_CONTROL_PROCESS';
    report.updatedAt = new Date().toISOString();

    localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(reports));

    // Update GRN status in warehouse
    await qualityService.syncGrnStatus(report.grnId, 'QUALITY_CONTROL_PROCESS');

    // Broadcast info notification
    await qualityService.createNotification({
      title: 'Sampling & Pengujian Dimulai',
      message: `Staf QC ${user.name} telah memulai proses sampling & pengujian untuk ${report.materialName} (${report.grnNumber}).`,
      type: 'INFO',
      targetDepartments: ['quality', 'warehouse'],
      targetRoles: ['manager', 'supervisor', 'staff'],
      reportId: report.id,
      grnNumber: report.grnNumber,
    });

    return report;
  },

  /**
   * Revert report back to warehouse with mandatory reason
   */
  revertToWarehouse: async (
    reportId: string,
    reason: string,
    user: UserProfile
  ): Promise<QcInspectionReport> => {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Alasan revert wajib diisi dengan jelas (minimal 5 karakter).');
    }

    const reports = await qualityService.getReports();
    const report = reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Laporan QC tidak ditemukan');

    report.status = 'REVERTED_TO_WAREHOUSE';
    report.revertReason = reason.trim();
    report.revertedBy = `${user.name} (${user.role.toUpperCase()})`;
    report.revertedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();

    localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(reports));

    // Sync to warehouse
    await qualityService.syncGrnStatus(report.grnId, 'REVERTED_TO_WAREHOUSE', reason);

    // Broadcast warning notification to Warehouse & Quality
    await qualityService.createNotification({
      title: 'Penerimaan Direvert oleh QC',
      message: `Bahan ${report.materialName} (${report.grnNumber}) dikembalikan ke Gudang oleh ${user.name}. Alasan: "${reason.trim()}". Gudang dapat melakukan koreksi data.`,
      type: 'WARNING',
      targetDepartments: ['warehouse', 'quality'],
      targetRoles: ['staff', 'supervisor', 'manager'],
      reportId: report.id,
      grnNumber: report.grnNumber,
    });

    return report;
  },

  /**
   * Submit Staff QC analysis, confirm with password, issue Internal Lot Number, and transition to AWAITING_QM_AUTHORIZATION
   */
  submitStaffAnalysis: async (
    reportId: string,
    parameters: QcParameterResult[],
    staffDecision: 'RELEASE' | 'REJECT',
    staffNotes: string,
    staffUser: UserProfile,
    passwordInput: string
  ): Promise<QcInspectionReport> => {
    // 1. Verify staff password
    const verifyRes = await authService.verifyPassword(staffUser.nik, passwordInput);
    if (!verifyRes.valid) {
      throw new Error(verifyRes.error || 'Kata sandi staf tidak valid. Otorisasi tanda tangan digital ditolak.');
    }

    const reports = await qualityService.getReports();
    const report = reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Laporan QC tidak ditemukan');

    // 2. Generate or preserve Internal Lot / Report Number (LBB... / LBK...)
    if (!report.lotInternalNumber) {
      report.lotInternalNumber = generateLotInternalNumber(report.materialType, reports, report.receivedDate);
      report.reportNumber = report.lotInternalNumber;
    }

    // 3. Perform AI Assessment
    const aiAssessment = analyzeLabResults(report.materialName, report.materialType, parameters);

    // 4. Record Staff Digital Signature
    const signatureHash = generateDigitalSignatureHash(
      staffUser.nik,
      staffUser.name,
      staffDecision,
      report.lotInternalNumber
    );

    report.parameters = parameters;
    report.staffDecision = staffDecision;
    report.staffNotes = staffNotes || '';
    report.staffSignature = {
      signerName: staffUser.name,
      signerNik: staffUser.nik,
      signerRole: `${staffUser.department.toUpperCase()} Analyst / Staff`,
      signedAt: new Date().toISOString(),
      signatureHash,
      notes: staffNotes,
    };

    report.aiAssessment = {
      priorityScore: 75,
      priorityRank: 'HIGH',
      priorityReason: 'Analisa lab selesai diinput oleh analis QC.',
      complianceScore: aiAssessment.complianceScore,
      deviationRisk: aiAssessment.deviationRisk,
      summary: aiAssessment.summary,
      suggestedAction: aiAssessment.suggestedAction,
    };

    report.status = 'AWAITING_QM_AUTHORIZATION';
    report.updatedAt = new Date().toISOString();

    localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(reports));

    // Sync to warehouse
    await qualityService.syncGrnStatus(report.grnId, 'AWAITING_QM_AUTHORIZATION');

    // Broadcast notification to Quality Manager & Supervisor
    await qualityService.createNotification({
      title: 'Menunggu Otorisasi Quality Manager',
      message: `Hasil analisa untuk Lot ${report.lotInternalNumber} (${report.materialName}) telah diselesaikan oleh ${staffUser.name} [Rekomendasi Staf: ${staffDecision === 'RELEASE' ? 'Memenuhi Syarat (Rilis)' : 'Tidak Memenuhi Syarat (Reject)'}]. Menunggu otorisasi Quality Manager.`,
      type: 'ALERT',
      targetDepartments: ['quality'],
      targetRoles: ['manager', 'supervisor', 'admin'],
      reportId: report.id,
      lotInternalNumber: report.lotInternalNumber,
      grnNumber: report.grnNumber,
    });

    return report;
  },

  /**
   * Final Authorization by Quality Manager with Password Verification
   */
  authorizeQualityManager: async (
    reportId: string,
    decision: 'RELEASE' | 'RELEASE_BY_DEVIATION' | 'REJECT',
    deviationNumber: string,
    qmNotes: string,
    qmUser: UserProfile,
    passwordInput: string
  ): Promise<QcInspectionReport> => {
    // 1. Verify Quality Manager password
    const verifyRes = await authService.verifyPassword(qmUser.nik, passwordInput);
    if (!verifyRes.valid) {
      throw new Error(verifyRes.error || 'Kata sandi Quality Manager tidak valid. Otorisasi keputusan mutu ditolak.');
    }

    if (decision === 'RELEASE_BY_DEVIATION' && (!deviationNumber || deviationNumber.trim().length < 3)) {
      throw new Error('Nomor Form Deviasi / Kajian Risiko wajib dicantumkan untuk pelepasan berdeviasi.');
    }

    const reports = await qualityService.getReports();
    const report = reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Laporan QC tidak ditemukan');

    // 2. Generate Manager Digital Signature
    const signatureHash = generateDigitalSignatureHash(
      qmUser.nik,
      qmUser.name,
      decision,
      report.lotInternalNumber || report.grnNumber
    );

    report.qmDecision = decision;
    report.qmDeviationNumber = deviationNumber || '';
    report.qmNotes = qmNotes || '';
    report.qmSignature = {
      signerName: qmUser.name,
      signerNik: qmUser.nik,
      signerRole: 'Quality Manager / Apoteker Penanggung Jawab Mutu',
      signedAt: new Date().toISOString(),
      signatureHash,
      notes: qmNotes,
    };

    let finalStatus: QcInspectionStatus = 'PASSED';
    let labelColor = 'HIJAU (DILULUSKAN)';

    if (decision === 'RELEASE') {
      finalStatus = 'PASSED';
      labelColor = 'HIJAU (DILULUSKAN / RELEASE)';
    } else if (decision === 'RELEASE_BY_DEVIATION') {
      finalStatus = 'PASSED_WITH_DEVIATION';
      labelColor = 'HIJAU (DILULUSKAN DENGAN DEVIASI)';
    } else {
      finalStatus = 'REJECTED';
      labelColor = 'MERAH (DITOLAK / REJECTED)';
    }

    report.status = finalStatus;
    report.updatedAt = new Date().toISOString();

    localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(reports));

    // Sync to warehouse
    await qualityService.syncGrnStatus(report.grnId, finalStatus);

    // Multi-Broadcast Notification (SPV, Staf QC, and Warehouse)
    const decisionText =
      decision === 'RELEASE'
        ? 'DILULUSKAN (RELEASE)'
        : decision === 'RELEASE_BY_DEVIATION'
        ? `DILULUSKAN DENGAN DEVIASI (No: ${deviationNumber})`
        : 'DITOLAK (REJECTED)';

    // Notification to Warehouse
    await qualityService.createNotification({
      title: `Disposisi Mutu Lot ${report.lotInternalNumber}: ${decisionText}`,
      message:
        decision === 'REJECT'
          ? `Bahan ${report.materialName} (No. Lot: ${report.lotInternalNumber}, GRN: ${report.grnNumber}) DITOLAK oleh Quality Manager (${qmUser.name}). Gudang segera tempel label MERAH dan pindahkan ke Ruang Karantina Tolak/Retur.`
          : `Bahan ${report.materialName} (No. Lot: ${report.lotInternalNumber}, GRN: ${report.grnNumber}) telah ${decisionText} oleh Quality Manager (${qmUser.name}). Gudang silakan pasang label HIJAU dan pindahkan ke rak stok aktif siap timbang.`,
      type: decision === 'REJECT' ? 'ALERT' : 'SUCCESS',
      targetDepartments: ['warehouse', 'quality', 'ppic'],
      targetRoles: ['staff', 'supervisor', 'manager'],
      reportId: report.id,
      lotInternalNumber: report.lotInternalNumber,
      grnNumber: report.grnNumber,
    });

    return report;
  },

  /**
   * Helper to sync status with warehouse GRN records in storage
   */
  syncGrnStatus: async (grnId: string, newStatus: string, notes?: string) => {
    try {
      const records = await warehouseService.getGrnRecords();
      const target = records.find((r) => r.id === grnId);
      if (target) {
        target.qcStatus = newStatus as any;
        if (notes) {
          target.notes = notes;
        }
        localStorage.setItem('lsm_warehouse_grn_v1', JSON.stringify(records));
      }
    } catch (e) {
      console.warn('Failed to sync GRN status:', e);
    }
  },

  /**
   * Notification Center Management
   */
  getNotifications: (): QcNotification[] => {
    const raw = localStorage.getItem(QC_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  createNotification: async (notif: Omit<QcNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const existing = qualityService.getNotifications();
    const newNotif: QcNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const updated = [newNotif, ...existing].slice(0, 50); // Keep latest 50
    localStorage.setItem(QC_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    return newNotif;
  },

  markNotificationAsRead: (id: string) => {
    const existing = qualityService.getNotifications();
    const updated = existing.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    localStorage.setItem(QC_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  },

  markAllNotificationsAsRead: () => {
    const existing = qualityService.getNotifications();
    const updated = existing.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(QC_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  },

  /**
   * Delete QC inspection report when corresponding GRN is deleted in warehouse
   */
  deleteReportByGrnId: async (grnId: string): Promise<void> => {
    const saved = localStorage.getItem(QC_REPORTS_STORAGE_KEY);
    if (!saved) return;
    try {
      const list: QcInspectionReport[] = JSON.parse(saved);
      const updated = list.filter((r) => r.grnId !== grnId);
      localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting QC report by grnId', e);
    }
  },

  /**
   * Manually synchronize quarantine reports with latest Master Data criteria
   */
  syncQuarantineWithMaster: async (reportId?: string): Promise<{ updatedCount: number; message: string }> => {
    const [reports, packagingMaterials, rawMaterials] = await Promise.all([
      qualityService.getReports(),
      packagingService.getPackagingMaterials(),
      materialService.getMaterials(),
    ]);

    let updatedCount = 0;
    const targetReports = reportId
      ? reports.filter((r) => r.id === reportId)
      : reports.filter((r) => r.status === 'QUARANTINE');

    targetReports.forEach((rep) => {
      let masterParams: Array<{ name: string; spec: string }> = [];
      if (rep.materialType === 'packaging') {
        const pm = packagingMaterials.find(
          (p) => p.code === rep.materialCode || p.name.toLowerCase() === rep.materialName.toLowerCase()
        );
        if (pm?.qcParameters && pm.qcParameters.length > 0) {
          masterParams = pm.qcParameters
            .filter((p) => p.name && p.name.trim())
            .map((p) => ({ name: p.name, spec: p.specification || 'Sesuai Standar Spesifikasi Mutu' }));
        }
      } else {
        const rm = rawMaterials.find(
          (r) => r.code === rep.materialCode || r.name.toLowerCase() === rep.materialName.toLowerCase()
        );
        if (rm?.qcParameters && rm.qcParameters.length > 0) {
          masterParams = rm.qcParameters
            .filter((p) => p.name && p.name.trim())
            .map((p) => ({ name: p.name, spec: p.specification || 'Sesuai Standar Spesifikasi Mutu' }));
        }
      }

      if (masterParams.length > 0) {
        rep.parameters = masterParams.map((item, idx) => ({
          id: `param-${Date.now()}-${idx}`,
          parameterName: item.name,
          specification: item.spec,
          resultValue: rep.parameters.find((p) => p.parameterName === item.name)?.resultValue || '',
          isCompliant: rep.parameters.find((p) => p.parameterName === item.name)?.isCompliant ?? true,
        }));
        updatedCount++;
      }
    });

    localStorage.setItem(QC_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return {
      updatedCount,
      message: `Berhasil menyinkronkan ${updatedCount} catatan inspeksi QC dengan kriteria Master Data terbaru.`,
    };
  },
};
