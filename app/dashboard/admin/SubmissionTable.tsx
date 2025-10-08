"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { ThesisSubmission, StudentProfile, User, SubmissionStatus } from '@prisma/client';
import { FiClock, FiCheckCircle, FiXCircle, FiFileText, FiDownload, FiEdit } from 'react-icons/fi';

type SubmissionWithStudent = ThesisSubmission & {
  student: StudentProfile & { user: User };
};

// Komponen Badge Status
const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
    const statusConfig = {
      TERKIRIM: { text: "Terkirim", icon: FiClock, color: "bg-blue-100 text-blue-800" },
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahasiswa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {submissions.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Tidak ada pengajuan.</td></tr>
          ) : (
            submissions.map(sub => (
              <tr key={sub.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sub.student.fullName}</div>
                  <div className="text-sm text-gray-500">{sub.student.nim}</div>
                </td>
                <td className="px-6 py-4 max-w-md">
                    <div className="text-sm text-gray-800 truncate" title={sub.judul}>{sub.judul}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={sub.status}/>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {sub.status === 'TERKIRIM' && (
                    <Link href={`/dashboard/admin/verifikasi/${sub.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                      Verifikasi Berkas
                    </Link>
                  )}
                  {sub.status === 'DISETUJUI' && (
                    <Link href={`/dashboard/admin/SK/${sub.id}`} className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold">
                      <FiDownload/> Buat & Unduh SK
                    </Link>
                  )}
                  {sub.status !== 'TERKIRIM' && sub.status !== 'DISETUJUI' && (
                     <span className="text-gray-400">Dalam Proses</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}