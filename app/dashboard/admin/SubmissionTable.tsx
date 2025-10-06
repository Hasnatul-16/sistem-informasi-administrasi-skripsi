"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { ThesisSubmission, StudentProfile, User } from '@prisma/client';

type SubmissionWithStudent = ThesisSubmission & {
  student: StudentProfile & {
    user: User;
  };
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurusan</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {submissions.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Tidak ada pengajuan.</td></tr>
          ) : (
            submissions.map(sub => (
              <tr key={sub.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sub.student.fullName}</div>
                  <div className="text-sm text-gray-500">{sub.student.nim}</div>
                </td>
                <td className="px-6 py-4 max-w-sm"><div className="text-sm text-gray-900 truncate">{sub.judul}</div></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.student.jurusan === 'SISTEM_INFORMASI' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {sub.student.jurusan.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sub.status.replace('_', ' ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {sub.status === 'TERKIRIM' ? (
                    <Link href={`/dashboard/admin/verifikasi/${sub.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                      Lihat & Verifikasi
                    </Link>
                  ) : (
                    <span className="text-gray-400">Diproses</span>
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