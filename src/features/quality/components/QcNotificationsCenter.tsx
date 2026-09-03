import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { QcNotification } from '../types/qcTypes';
import { qualityService } from '../qualityService';

interface QcNotificationsCenterProps {
  onSelectReport?: (reportId: string) => void;
}

export const QcNotificationsCenter: React.FC<QcNotificationsCenterProps> = ({
  onSelectReport,
}) => {
  const [notifications, setNotifications] = useState<QcNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    const list = qualityService.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to auto-close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    qualityService.markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleNotificationClick = (notif: QcNotification) => {
    qualityService.markNotificationAsRead(notif.id);
    loadNotifications();
    if (notif.reportId && onSelectReport) {
      onSelectReport(notif.reportId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs font-bold"
      >
        <div className="relative flex items-center justify-center">
          <Bell className="w-4 h-4 text-teal-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
          )}
        </div>
        <span className="hidden sm:inline">Notifikasi QC</span>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-md ring-2 ring-rose-300 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider block">
                  Notifikasi Mutu Real-Time
                </span>
                <span className="text-[10px] text-slate-400">Update sampling & otorisasi CPKB</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-600 text-white font-black shadow-xs ring-1 ring-rose-400">
                  {unreadCount} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Tandai semua sudah dibaca"
                  className="text-[11px] text-teal-300 hover:text-teal-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Baca Semua</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada notifikasi aktivitas mutu
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs space-y-1 ${
                    !notif.isRead ? 'bg-teal-50/40 font-medium' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'ALERT' ? (
                        <AlertOctagon className="w-4 h-4 text-red-600" />
                      ) : notif.type === 'WARNING' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : notif.type === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                      {notif.lotInternalNumber && (
                        <div className="pt-1 flex items-center gap-1 font-mono text-[10px] text-teal-800 font-bold">
                          <FileText className="w-3 h-3" />
                          Lot #{notif.lotInternalNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
