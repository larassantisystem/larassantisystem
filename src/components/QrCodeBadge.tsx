import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeBadgeProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeBadge: React.FC<QrCodeBadgeProps> = ({
  value,
  size = 64,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      width: Math.max(size * 3, 180), // Ultra-sharp resolution for printing & camera scanning
      margin: 1,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`bg-slate-100 rounded-lg border border-slate-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code: ${value}`}
      width={size}
      height={size}
      className={`shrink-0 rounded-md object-contain bg-white border border-slate-200 shadow-2xs ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
