"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Judul, Mahasiswa, User, Status } from '@prisma/client';
import { 
    FiClock, FiCheckCircle, FiXCircle, FiFileText, FiDownload, FiArrowRight, 
    FiUsers, FiCalendar, FiTag, FiActivity, FiSettings,
    FiUser, FiHash 
} from 'react-icons/fi';

type SubmissionWithStudent = Judul & {
  student: Mahasiswa & { user: User };
};

const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig = {
      TERKIRIM: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
      DIPERIKSA_ADMIN: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
      DITOLAK_ADMIN: { text: "Ditolak Admin", icon: FiXCircle, color: "bg-red-100 text-red-800" },
      DIPROSES_KAPRODI: { text: "Diproses Kaprodi", icon: FiClock, color: "bg-purple-100 text-purple-800" },
      DISETUJUI: { text: "Disetujui", icon: FiCheckCircle, color: "bg-green-100 text-green-800" },
    };
    const config = statusConfig[status] || { text: status, icon: FiFileText, color: "bg-gray-100 text-gray-800" };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
};

export default function SubmissionTable({ initialSubmissions }: { initialSubmissions: SubmissionWithStudent[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
 
  const [loadingId, setLoadingId] = useState<number | null>(null);
  
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const handleDownloadSK = async (submissionId: number, nim: string) => {
    setLoadingId(submissionId);
    try {

      const res = await fetch(`/api/sk/${submissionId}`);
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert('Gagal mengunduh PDF: ' + (json?.error || res.statusText));
        setLoadingId(null);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SK-${nim || submissionId}.pdf`; 
      document.body.appendChild(a);
      a.click();

      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('downloadPdf error', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server.';
      alert(`Gagal mengunduh PDF: ${errorMessage}`);
    } finally {
      setLoadingId(null); 
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full w-full bg-white border divide-y divide-gray-200 table-fixed">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]"><div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600"/> 
            <span>Mahasiswa</span></div></th>
            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiCalendar size={16} className="text-blue-600"/> 
            <span>Tanggal Pengajuan</span></div></th>
            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiTag size={16} className="text-blue-600"/>
            <span>Topik</span></div></th>
            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[25%]"><div className="flex items-center gap-2"><FiFileText size={16} className="text-blue-600"/> <span>Judul</span></div></th>
            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiActivity size={16} className="text-blue-600"/> <span>Status</span></div></th>
            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[10%]"><div className="flex items-center gap-2"><FiSettings size={16} className="text-blue-600"/> <span>Aksi</span></div></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {submissions.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Tidak ada pengajuan pada periode yang dipilih.</td></tr>
          ) : (
            submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50">
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <FiUser size={14} className="text-blue-600"/>
                        <span className="text-sm text-gray-700">
                            <span className="font-semibold">Nama: </span>
                            {sub.student.nama}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FiHash size={14} className="text-blue-600"/>
                        <span className="text-sm text-gray-700">
                            <span className="font-semibold">NIM: </span>
                            {sub.student.nim}
                        </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(sub.tanggal).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{sub.topik}</td>
                <td className="px-6 py-4"><p className="text-sm text-gray-800 whitespace-normal break-words" title={sub.judul}>{sub.judul}</p></td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={sub.status}/>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {sub.status === 'TERKIRIM' && (<Link href={`/dashboard/admin/verifikasi/detail/${sub.id}`} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-semibold">Verifikasi <FiArrowRight className="h-4 w-4"/></Link>)}

                  {sub.status === 'DISETUJUI' && (
                    <button
                      onClick={() => handleDownloadSK(sub.id, sub.student.nim)}
                      disabled={loadingId === sub.id} 
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                    >
                      {loadingId === sub.id ? (
                        <>
                          <FiClock className="animate-spin h-4 w-4"/> Mengunduh...
                        </>
                      ) : (
                        <>
                          <FiDownload/> Unduh SK
                        </>
                      )}
                    </button>
                  )}
                  
                  {sub.status !== 'TERKIRIM' && sub.status !== 'DISETUJUI' && (<span className="text-gray-400">Dalam Proses</span>)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}