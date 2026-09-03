import { Department } from '../../types';
import { qualityService } from '../../features/quality/qualityService';
import { warehouseService } from '../../features/warehouse/warehouseService';
import { stockService } from '../../features/warehouse/stockService';

export interface DepartmentNotificationItem {
  id: string;
  department: Department;
  subTab?: string;
  title: string;
  message: string;
  urgency: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
}

export interface DepartmentNotificationCounts {
  all: number;
  warehouse: number;
  quality: number;
  ppic: number;
  production: number;
  procurement: number;
  sales: number;
  rnd: number;
  admin: number;
}

const READ_NOTIFICATIONS_STORAGE_KEY = 'lsm_read_notifications_v1';

export const departmentNotificationService = {
  /**
   * Fetch all active notifications based on current system state
   */
  getNotifications: async (): Promise<DepartmentNotificationItem[]> => {
    let readIds: string[] = [];
    const savedRead = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    if (savedRead) {
      try {
        readIds = JSON.parse(savedRead);
      } catch (e) {
        console.error('Failed to parse read notification IDs:', e);
      }
    }

    const items: DepartmentNotificationItem[] = [];

    try {
      // 1. Quality & Warehouse Reports Sync
      const [qcReports, grnRecords, stockLots] = await Promise.all([
        qualityService.getReports(),
        warehouseService.getGrnRecords(),
        stockService.getStockLots(),
      ]);

      // --- QC Notifications ---
      const queueItems = qcReports.filter((r) => r.status === 'QUARANTINE');
      const testingItems = qcReports.filter((r) => r.status === 'QUALITY_CONTROL_PROCESS');
      const approvalItems = qcReports.filter((r) => r.status === 'AWAITING_QM_AUTHORIZATION');

      if (queueItems.length > 0) {
        items.push({
          id: `qc-queue-${queueItems.length}`,
          department: 'quality',
          subTab: 'queue',
          title: `${queueItems.length} Material Menunggu Sampling QC`,
          message: `Ada ${queueItems.length} lot kedatangan GRN baru di area karantina yang memerlukan pengambilan sampel lab.`,
          urgency: 'warning',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`qc-queue-${queueItems.length}`),
          actionLabel: 'Buka Antrean Sampling',
        });
      }

      if (testingItems.length > 0) {
        items.push({
          id: `qc-test-${testingItems.length}`,
          department: 'quality',
          subTab: 'testing',
          title: `${testingItems.length} Pengujian Lab Sedang Berjalan`,
          message: `Parameter uji sedang dianalisis oleh analis QC. Segera selesaikan input hasil CoA.`,
          urgency: 'info',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`qc-test-${testingItems.length}`),
          actionLabel: 'Input Hasil Uji Lab',
        });
      }

      if (approvalItems.length > 0) {
        items.push({
          id: `qc-appr-${approvalItems.length}`,
          department: 'quality',
          subTab: 'approval',
          title: `PERHATIAN QM: ${approvalItems.length} Laporan Menunggu Otorisasi`,
          message: `Laporan analisa QC telah selesai diuji dan membutuhkan tanda tangan digital Quality Manager.`,
          urgency: 'critical',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`qc-appr-${approvalItems.length}`),
          actionLabel: 'Otorisasi Sekarang',
        });
      }

      // --- Warehouse Notifications ---
      // Ready for Shelving (Passed QC needing relocation)
      const passedLots = stockLots.filter(
        (l) => (l.qcStatus === 'RELEASED' || (l.qcStatus as any) === 'PASSED') && l.storageLocation.includes('Karantina')
      );
      if (passedLots.length > 0) {
        items.push({
          id: `wh-shelve-${passedLots.length}`,
          department: 'warehouse',
          subTab: 'relocation',
          title: `${passedLots.length} Lot Lolos QC Perlu Pemindahan Rak`,
          message: `Material telah diotorisasi Rilis oleh Quality Manager. Silakan atur posisi rak rilis fisik melalui fitur Pemindahan Lokasi.`,
          urgency: 'success',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`wh-shelve-${passedLots.length}`),
          actionLabel: 'Buka Pemindahan Lokasi',
        });
      }

      // Inbound GRN waiting for initial processing
      const newGrns = grnRecords.filter((g) => g.qcStatus === 'QUARANTINE');
      if (newGrns.length > 0) {
        items.push({
          id: `wh-grn-${newGrns.length}`,
          department: 'warehouse',
          subTab: 'inbound',
          title: `${newGrns.length} Penerimaan GRN Terdaftar`,
          message: `Penerimaan barang telah diverifikasi koli dan terpasang label Karantina Kuning CPKB.`,
          urgency: 'info',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`wh-grn-${newGrns.length}`),
          actionLabel: 'Lihat Daftar GRN',
        });
      }

      // Rejected Lots need Return / Quarantine B
      const rejectLots = stockLots.filter((l) => l.qcStatus === 'REJECTED');
      if (rejectLots.length > 0) {
        items.push({
          id: `wh-reject-${rejectLots.length}`,
          department: 'warehouse',
          subTab: 'stock-raw',
          title: `PERINGATAN: ${rejectLots.length} Lot Ditolak QC (Reject)`,
          message: `Material tidak memenuhi syarat CPKB. Segera amankan di Ruang Karantina B & koordinasikan retur dengan Purchasing.`,
          urgency: 'critical',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`wh-reject-${rejectLots.length}`),
          actionLabel: 'Buka Lokasi Reject',
        });
      }

      // --- Procurement Notifications ---
      if (rejectLots.length > 0) {
        items.push({
          id: `proc-return-${rejectLots.length}`,
          department: 'procurement',
          subTab: 'po-list',
          title: `${rejectLots.length} Lot Bahan Butuh Penggantian Vendor`,
          message: `Ada material reject dari QC yang memerlukan penerbitan klaim retur atau re-order ke supplier.`,
          urgency: 'warning',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`proc-return-${rejectLots.length}`),
          actionLabel: 'Buka Purchase Orders',
        });
      }

      // --- ROP (Reorder Point) Inventory Alerts for Procurement & Warehouse ---
      try {
        const ropAlerts = await stockService.checkReorderPoints();
        if (ropAlerts.length > 0) {
          const criticalRop = ropAlerts.filter((a) => a.urgency === 'critical');
          const warningRop = ropAlerts.filter((a) => a.urgency === 'warning');

          items.push({
            id: `proc-rop-alert-${ropAlerts.length}`,
            department: 'procurement',
            title: `PERINGATAN ROP: ${ropAlerts.length} Material Di Bawah Ambang Batas Aman`,
            message: `Terdapat ${ropAlerts.length} material (${criticalRop.length} habis, ${warningRop.length} di bawah ROP) yang memerlukan pembuatan PO pembelian segera ke supplier.`,
            urgency: criticalRop.length > 0 ? 'critical' : 'warning',
            timestamp: new Date().toISOString(),
            isRead: readIds.includes(`proc-rop-alert-${ropAlerts.length}`),
            actionLabel: 'Buat Purchase Order',
          });

          items.push({
            id: `wh-rop-alert-${ropAlerts.length}`,
            department: 'warehouse',
            title: `MONITORING STOK: ${ropAlerts.length} Material Menipis (Di Bawah ROP)`,
            message: `Stok fisik released untuk bahan baku/kemas telah mencapai titik ROP. Harap siapkan area penerimaan dan koordinasi re-stock.`,
            urgency: 'warning',
            timestamp: new Date().toISOString(),
            isRead: readIds.includes(`wh-rop-alert-${ropAlerts.length}`),
            actionLabel: 'Lihat Stok Gudang',
          });
        }
      } catch (e) {
        console.error('Error checking ROP alerts:', e);
      }

      // --- PPIC Notifications ---
      items.push({
        id: 'ppic-mrp-01',
        department: 'ppic',
        subTab: 'mrp',
        title: 'Jadwal Kalkulasi MRP & Alokasi Bets',
        message: 'Kalkulasi kebutuhan stok bahan baku dan kemas untuk rencana produksi minggu ini.',
        urgency: 'info',
        timestamp: new Date().toISOString(),
        isRead: readIds.includes('ppic-mrp-01'),
        actionLabel: 'Buka Kalkulator MRP',
      });

      // --- Production Notifications ---
      const availableReleased = stockLots.filter((l) => l.qcStatus === 'RELEASED' || (l.qcStatus as any) === 'PASSED');
      if (availableReleased.length > 0) {
        items.push({
          id: `prod-weigh-${availableReleased.length}`,
          department: 'production',
          subTab: 'batch-mixing',
          title: `${availableReleased.length} Lot Bahan Baku Siap Ditimbang`,
          message: 'Material berstatus RILIS siap diambil untuk peracikan formula batch mixing di ruang bersih.',
          urgency: 'info',
          timestamp: new Date().toISOString(),
          isRead: readIds.includes(`prod-weigh-${availableReleased.length}`),
          actionLabel: 'Buka Ruang Mixing',
        });
      }

      // --- RnD Notifications ---
      items.push({
        id: 'rnd-master-01',
        department: 'rnd',
        subTab: 'materials',
        title: 'Master Data & Spesifikasi Parameter CPKB',
        message: 'Seluruh bahan baku (B0001+) dan kemasan (K0001+) tersinkronisasi otomatis dengan checklist QC.',
        urgency: 'info',
        timestamp: new Date().toISOString(),
        isRead: readIds.includes('rnd-master-01'),
        actionLabel: 'Buka Master Material',
      });

      // --- Admin Notifications ---
      items.push({
        id: 'admin-audit-01',
        department: 'admin',
        subTab: 'audit',
        title: 'Integritas Audit Trail & CPKB Compliance',
        message: 'Rekam jejak tanda tangan digital Quality Manager & mutasi stok tersimpan aman.',
        urgency: 'info',
        timestamp: new Date().toISOString(),
        isRead: readIds.includes('admin-audit-01'),
        actionLabel: 'Buka Log Audit',
      });
    } catch (err) {
      console.error('Error computing departmental notifications:', err);
    }

    return items;
  },

  /**
   * Compute badge count for each department
   */
  getCounts: async (): Promise<DepartmentNotificationCounts> => {
    const notifications = await departmentNotificationService.getNotifications();
    const unread = notifications.filter((n) => !n.isRead);

    const counts: DepartmentNotificationCounts = {
      all: unread.length,
      warehouse: unread.filter((n) => n.department === 'warehouse').length,
      quality: unread.filter((n) => n.department === 'quality').length,
      ppic: unread.filter((n) => n.department === 'ppic').length,
      production: unread.filter((n) => n.department === 'production').length,
      procurement: unread.filter((n) => n.department === 'procurement').length,
      sales: unread.filter((n) => n.department === 'sales').length,
      rnd: unread.filter((n) => n.department === 'rnd').length,
      admin: unread.filter((n) => n.department === 'admin').length,
    };

    return counts;
  },

  /**
   * Mark all or specific notification as read
   */
  markAsRead: (id?: string) => {
    let readIds: string[] = [];
    const saved = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      try {
        readIds = JSON.parse(saved);
      } catch (e) {}
    }

    if (id) {
      if (!readIds.includes(id)) readIds.push(id);
    } else {
      // Mark all current
      departmentNotificationService.getNotifications().then((all) => {
        readIds = all.map((n) => n.id);
        localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(readIds));
      });
      return;
    }

    localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(readIds));
  },
};
