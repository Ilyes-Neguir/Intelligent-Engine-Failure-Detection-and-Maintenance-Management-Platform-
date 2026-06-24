import { apiClient, BASE_URL, getStoredToken } from './client';
import type { Report } from '../types';

export const reportsApi = {
  generate: (bookingId: number) =>
    apiClient.post<Report>(`/reports/booking/${bookingId}`),

  getByBooking: (bookingId: number) =>
    apiClient.get<Report>(`/reports/booking/${bookingId}`),

  /** Returns a Blob for client-side download */
  download: (reportId: number) =>
    apiClient.getBlob(`/reports/download/${reportId}`),

  /** Returns the direct download URL (used with anchor tags) */
  downloadUrl: (reportId: number) => `${BASE_URL}/reports/download/${reportId}`,
};

/** Triggers a PDF download in the browser */
export async function triggerReportDownload(reportId: number, fileName: string) {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}/reports/download/${reportId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download report');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `report-${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
