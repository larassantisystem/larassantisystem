/**
 * Utility to generate public-accessible QR Code URLs for mobile camera scanning
 */
export const getQrTargetUrl = (lotOrGrn: string, status?: string, containerStr?: string): string => {
  if (typeof window === 'undefined') return '';
  let origin = window.location.origin;

  // If origin is localhost/127.0.0.1 (inside dev iframe), use public development Cloud Run URL
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    origin = 'https://ais-dev-du6kirk5xft6s7zdx7hxwh-897867244394.asia-southeast1.run.app';
  }

  const lotQuery = encodeURIComponent(lotOrGrn);
  const statusQuery = status ? `&st=${encodeURIComponent(status)}` : '';
  const containerQuery = containerStr ? `&w=${encodeURIComponent(containerStr)}` : '';

  return `${origin}/?coa=${lotQuery}${statusQuery}${containerQuery}`;
};
