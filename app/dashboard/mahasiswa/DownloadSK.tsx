"use client";
import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';

export default function DownloadSKButton({ submissionId, filename }: { submissionId: number; filename?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);
      const res = await fetch(`/api/sk/${submissionId}`);
      if (!res.ok) {
        // Try to parse JSON error message, otherwise throw status
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // sanitize filename to remove illegal filesystem characters
      const ensurePdfExt = (name: string) => /\.pdf$/i.test(name) ? name : `${name}.pdf`;
      const sanitize = (name: string) => name.replace(/[\\/:*?"<>|]/g, '_');
      let outName = filename ? String(filename) : `SK-${submissionId}`;
      outName = ensurePdfExt(outName);
      const safeName = sanitize(outName);
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Download SK error:', err);
      // Friendly user message
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      alert('Gagal mengunduh SK: ' + message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      <FiDownload className="h-4 w-4" />
      {loading ? 'Mengunduh...' : 'Unduh SK'}
    </button>
  );
}
