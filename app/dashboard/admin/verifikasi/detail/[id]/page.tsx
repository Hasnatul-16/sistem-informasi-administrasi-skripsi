import prisma from '@/lib/prisma';
import Link from 'next/link';
import { FiFileText, FiDownload } from 'react-icons/fi';
import VerificationActions from './VerificationActions';
import type { Judul, Mahasiswa, User } from '@prisma/client';

type SubmissionWithStudent = Judul & {
  student: Mahasiswa & { user: User };
};

async function getSubmission(id: string): Promise<SubmissionWithStudent> {
  const submissionId = Number(id);
  if (isNaN(submissionId)) {
    throw new Error('ID pengajuan tidak valid.');
  }
  const submission = await prisma.judul.findUnique({
    where: { id: submissionId },
    include: { mahasiswa: { include: { user: true } } },
  });
  if (!submission) throw new Error('Pengajuan tidak ditemukan');
  return { ...submission, student: submission.mahasiswa } as unknown as SubmissionWithStudent;
}

export default async function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await getSubmission(id);
  const submissionWithStudent = submission;

  const detailItem = (label: string, value: string | undefined | null) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-md text-gray-900">{value || '-'}</p>
    </div>
  );

  const fileItem = (label: string, url: string | null) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <FiFileText className="h-6 w-6 text-gray-500" />
        <span className="font-medium">{label}</span>
      </div>
      {url ? (
        <Link href={url} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline">
          <FiDownload /> Lihat File
        </Link>
      ) : (<span className="text-sm text-gray-400">Tidak ada file</span>)}
    </div>
  );

  return (
    <main className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Pengajuan Judul</h1>
        <p className="text-gray-600 mt-1">Periksa kelengkapan data dan dokumen sebelum melanjutkan.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">Informasi Mahasiswa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {detailItem("Nama Lengkap", submissionWithStudent.student.nama)}
            {detailItem("NIM", submissionWithStudent.student.nim)}
            {detailItem("Email", submissionWithStudent.student.user.email)}
            {detailItem("Jurusan", submissionWithStudent.student.jurusan.replace('_', ' '))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">Detail Pengajuan</h2>
          <div className="space-y-4 pt-4">
            {detailItem("Topik", submissionWithStudent.topik)}
            {detailItem("Judul Skripsi", submissionWithStudent.judul)}
            {detailItem("Usulan Pembimbing 1", submissionWithStudent.usulan_pembimbing1)}
            {detailItem("Usulan Pembimbing 2", submissionWithStudent.usulan_pembimbing2)}
            {detailItem("Usulan Pembimbing 3", submissionWithStudent.usulan_pembimbing3)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">Dokumen Persyaratan</h2>
          <div className="space-y-3 pt-4">
            {fileItem("Transkrip Nilai", submissionWithStudent.transkrip)}
            {fileItem("Bukti UKT", submissionWithStudent.ukt)}
            {fileItem("Lembar Konsultasi", submissionWithStudent.konsultasi)}
          </div>
        </div>
        
        <VerificationActions submission={submissionWithStudent} />
      </div>
    </main>
  );
}
