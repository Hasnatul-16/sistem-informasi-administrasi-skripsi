import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { FiAlertCircle, FiFileText, FiDownload} from 'react-icons/fi';
import Link from 'next/link';
import type { Proposal, Judul, Mahasiswa } from '@prisma/client';

import ProposalActionSempro from './ProposalActionSempro'; 

export const dynamic = 'force-dynamic';


type ProposalWithDetails = Proposal & {
  judul: Judul & {
    mahasiswa: Mahasiswa;
  };
};


async function getProposalDetail(proposalId: number): Promise<ProposalWithDetails | null> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      judul: { 
        include: {
          mahasiswa: true 
        }
      }
    },
  });
  
  return proposal as ProposalWithDetails; 
}


const DetailItem = (label: string, value: string | undefined | null) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-md text-gray-900">{value || '-'}</p>
  </div>
);


const FileItem = (label: string, url: string | null | undefined) => (
  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
    <div className="flex items-center gap-3">
      <FiFileText className="h-6 w-6 text-gray-500" />
      <span className="font-medium">{label}</span>
    </div>
    {url ? (
      <Link href={url} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
        <FiDownload /> Lihat File
      </Link>
    ) : (<span className="text-sm text-gray-400">Tidak ada file</span>)}
  </div>
);


export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== 'ADMIN') {
    return <div className="p-4 text-red-600 font-medium">Akses ditolak. Anda bukan Admin.</div>;
  }

  const { id } = await params;
  const proposalId = parseInt(id, 10);
  if (isNaN(proposalId)) {
    return <div className="p-4 text-red-600 font-medium">ID Proposal tidak valid.</div>;
  }

  const proposal = await getProposalDetail(proposalId);

  if (!proposal) {
    
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-red-300">
           <FiAlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Proposal Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Pengajuan seminar proposal dengan ID ini tidak ditemukan.</p>
          <Link href="/dashboard/admin" className="text-blue-600 hover:underline font-medium">
            Kembali ke Dashboard Admin
          </Link>
        </div>
      </main>
    );
  }

 
    const buktiSeminarUrl = (proposal as unknown as Record<string, unknown>)['lampiran_5xseminar'] as string | null ?? (proposal as unknown as Record<string, unknown>)['bukti_seminar_url'] as string | null;
  const transkripUrl = (proposal as unknown as Record<string, unknown>)['transkrip'] as string | null ?? (proposal as unknown as Record<string, unknown>)['transkrip_url'] as string | null;


  return (
    <main className="max-w-4xl mx-auto p-4 md:p-0">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Pengajuan Seminar Proposal</h1>
        <p className="text-gray-600 mt-1">Periksa kelengkapan data dan dokumen sebelum memverifikasi.</p>
      </div>

      <div className="space-y-6">
        
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">Informasi Mahasiswa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {DetailItem("Nama Lengkap", proposal.judul.mahasiswa.nama)}
            {DetailItem("NIM", proposal.judul.mahasiswa.nim)}
            {DetailItem("Jurusan", proposal.judul.mahasiswa.jurusan.replace('_', ' '))}
            {DetailItem("Tanggal Pengajuan ", new Date(proposal.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }))}
          </div>
        </div>
        
       
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">Detail Proposal</h2>
          <div className="space-y-4 pt-4">
            {DetailItem("Topik Judul", proposal.judul.topik)}
            {DetailItem("Judul Skripsi", proposal.judul.judul)}
            {DetailItem("Pembimbing 1", proposal.judul.pembimbing1)}
            {DetailItem("Pembimbing 2", proposal.judul.pembimbing2)}
         
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">Dokumen Persyaratan</h2>
          <div className="space-y-3 pt-4">
            {FileItem("Draft Proposal Skripsi", proposal.proposal)}
            {FileItem("Lembar Persetujuan Pembimbing", proposal.persetujuan)}
            {FileItem("Bukti Mengikuti Seminar (min. 5)", buktiSeminarUrl)}
            {FileItem("Transkrip Nilai Terbaru", transkripUrl)}
          </div>
        </div>
        
    
        <ProposalActionSempro proposal={proposal} />
        
      </div>
    </main>
  );
}