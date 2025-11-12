import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiArrowRight,
  FiAlertCircle,
  FiBookOpen,
  FiBook, 
} from 'react-icons/fi';
import DownloadSKButton from './DownloadSK';
import { Status } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type ExtendedProposal = {
  id: number;
  tanggal: Date;
  status: Status;
  penguji: string | null;
  jadwal_sidang: Date | null;
  sk_penguji: string | null;
  catatan: string | null;
  status_sidang: string | null;
}

type ExtendedSeminarHasil = {
  id: number;
  tanggal: Date;
  status: Status;
  catatan: string | null;
}

async function getMahasiswaData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }

  const studentProfile = await prisma.mahasiswa.findUnique({
    where: { id_user: session.user.id },
    include: {
      user: true,
    },
  });

  if (!studentProfile) {
    return {
      studentProfile: null,
      latestJudulSubmission: null,
      latestProposalSubmission: null as ExtendedProposal | null,
      latestSeminarHasilSubmission: null as ExtendedSeminarHasil | null
    };
  }

  const latestJudulSubmission = await prisma.judul.findFirst({
    where: { id_mahasiswa: studentProfile.id },
    orderBy: { tanggal: 'desc' },
  });

  const latestProposalSubmission = await prisma.proposal.findFirst({
    where: { judul: { id_mahasiswa: studentProfile.id } },
    orderBy: { tanggal: 'desc' },
    select: {
      id: true,
      tanggal: true,
      status: true,
      penguji: true,
      jadwal_sidang: true,
      sk_penguji: true,
      catatan: true,

    }
  }) as ExtendedProposal | null;

  const latestSeminarHasilSubmission = await prisma.seminarHasil.findFirst({
    where: { judul: { id_mahasiswa: studentProfile.id } },
    orderBy: { tanggal: 'desc' },
    select: {
      id: true,
      tanggal: true,
      status: true,
      catatan: true,
    }
  }) as ExtendedSeminarHasil | null;


  return { studentProfile, latestJudulSubmission, latestProposalSubmission, latestSeminarHasilSubmission };
}


const StatusBadge = ({ status }: { status: Status | 'DIJADWALKAN' | 'MENUNGGU_PENETAPAN' | 'LULUS_SKRIPSI' }) => {
  const statusConfig = {
     TERKIRIM: { text: 'Diperiksa oleh Admin', icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
    DIPERIKSA_ADMIN: { text: 'Diperiksa Admin', icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
    DITOLAK_ADMIN: { text: 'Ditolak Admin', icon: FiXCircle, color: "bg-red-100 text-red-800" },
    DIPROSES_KAPRODI: { text: 'Diproses Kaprodi', icon: FiClock, color: "bg-purple-100 text-purple-800" },
    DISETUJUI: { text: 'Disetujui', icon: FiCheckCircle, color: "bg-green-500 text-white" },
  } as const;


  const config = statusConfig[status as keyof typeof statusConfig] || { text: status, icon: FiAlertCircle, color: "bg-gray-100 text-gray-800" };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
      <Icon className="h-4 w-4" />
      {config.text}
    </span>
  );
};

export default async function MahasiswaDashboardPage() {
  const { studentProfile, latestJudulSubmission, latestProposalSubmission, latestSeminarHasilSubmission } = await getMahasiswaData();

if (!studentProfile) {
    return (
      <div className="text-center p-10">
        <h1 className="text-2xl font-bold text-red-600">Profil Mahasiswa Tidak Ditemukan</h1>
        <p className="mt-2 text-gray-500">Terjadi kesalahan saat memuat data profil Anda.</p>
      </div>
    );
  }

  const isProposalApproved = latestProposalSubmission?.status === 'DISETUJUI';
  const isSidangScheduled = isProposalApproved && latestProposalSubmission?.jadwal_sidang && latestProposalSubmission.penguji;

  const penguji = latestProposalSubmission?.penguji || 'Belum Ditetapkan';
  const skPengujiUrl = latestProposalSubmission?.sk_penguji;

  const tanggalSidang = latestProposalSubmission?.jadwal_sidang
    ? new Date(latestProposalSubmission.jadwal_sidang).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Menunggu Penetapan';

  const isSeminarHasilSubmitted = !!latestSeminarHasilSubmission;
  const isSeminarHasilApproved = latestSeminarHasilSubmission?.status === 'DISETUJUI';


  const steps = ['Pengajuan Judul', 'Seminar Proposal', 'Sidang Skripsi', 'Selesai Skripsi'];
  let currentStepIndex = 0;

  if (latestJudulSubmission?.status === 'DISETUJUI') {
    currentStepIndex = 1;
  }

  if (isProposalApproved) {
    currentStepIndex = 2; 
  }

  if (isSeminarHasilApproved) {
    currentStepIndex = 3; 
  }

  const pendingStatuses: Status[] = ['TERKIRIM', 'DIPERIKSA_ADMIN', 'DIPROSES_KAPRODI'];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Selamat Datang, {studentProfile.nama}!</h1>
        <p className="mt-1 text-gray-600">Pantau progres skripsi Anda dan lihat status pengajuan terbaru di sini.</p>
      </div>

      ---

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-5">Progres Skripsi Anda</h2>
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center w-full">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${index < currentStepIndex ? 'bg-green-500 text-white' :
                  index === currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  {index < currentStepIndex ? <FiCheckCircle /> : index + 1}
                </div>
                <p className={`mt-2 text-xs font-medium text-center ${index === currentStepIndex ? 'text-blue-600' : 'text-gray-500'}`}>{step}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      ---
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Status Pengajuan Judul Terakhir</h2>
          {latestJudulSubmission && <StatusBadge status={latestJudulSubmission.status} />}
        </div>
  
        {!latestJudulSubmission ? (
          <div className="text-center py-10">
            <FiEdit className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Anda Belum Mengajukan Judul</h3>
            <p className="mt-1 text-sm text-gray-500">Mulai langkah pertama perjalanan skripsi Anda sekarang.</p>
            <Link href="/dashboard/mahasiswa/pengajuan-judul" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Ajukan Judul Sekarang <FiArrowRight />
            </Link>
          </div>
        ) : latestJudulSubmission.status === 'DITOLAK_ADMIN' ? (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-md font-bold text-red-800">Pengajuan Judul Anda Perlu Direvisi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p><strong>Judul:</strong> {latestJudulSubmission.judul}</p>
                  <p><strong>Catatan dari Admin:</strong> {latestJudulSubmission.catatan}</p>
                </div>
                <Link href="/dashboard/mahasiswa/pengajuan-judul" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                  Ajukan Ulang Judul <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ) : latestJudulSubmission.status === 'DISETUJUI' ? (
          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
            <h3 className="text-md font-bold text-green-800">Selamat, Judul Anda Telah Disetujui!</h3>

            <div className="mt-4 text-sm text-green-900">
              <p className="font-semibold">Judul: {latestJudulSubmission.judul}</p>
              <p className="font-semibold mt-2">Dosen Pembimbing:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Pembimbing 1:</strong> {latestJudulSubmission.pembimbing1}</li>
                <li><strong>Pembimbing 2:</strong> {latestJudulSubmission.pembimbing2}</li>
              </ul><br />

              <p> Silahkan Hubungi Dosen Pembimbing untuk Memulai Proses Bimbingan  </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {
                  (() => {
                    const rawName = `${studentProfile.nama || 'mahasiswa'}`;
                    const rawNim = studentProfile.nim || latestJudulSubmission.id;
                    const sanitized = rawName.replace(/[^a-zA-Z0-9\- _]/g, '_').replace(/\s+/g, '_');
                    const filename = `SK-JUDUL-${sanitized}-${rawNim}.pdf`;
                    return <DownloadSKButton submissionId={latestJudulSubmission.id} filename={filename} />;
                  })()
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <FiClock className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Pengajuan Judul Anda Sedang Diproses</h3>
            <p className="mt-1 text-sm text-gray-500">Lihat detail status di bagian &quot;Pengajuan Sedang Diproses&quot; di atas.</p>
          </div>
        )}
      </div>

      ---

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Status Pengajuan Seminar Proposal Terakhir</h2>
          {latestProposalSubmission && <StatusBadge status={latestProposalSubmission.status} />}
        </div>

        {
          latestProposalSubmission?.status === 'DITOLAK_ADMIN' ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <h3 className="text-md font-bold text-red-800">Pengajuan Proposal Perlu Direvisi</h3>

              <div className="mt-2 text-sm text-red-700">
                <p><strong>Catatan dari Admin:</strong> {latestProposalSubmission.catatan || 'Tidak ada catatan.'}</p>
              </div>

              <Link href="/dashboard/mahasiswa/proposal" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                Ajukan Ulang Proposal <FiArrowRight />
              </Link>
            </div>
          ) : isProposalApproved ? (
            <div className="p-4 bg-green-100 border-l-4 border-green-500 rounded-r-lg">
              <h3 className="text-md font-bold text-green-900"> Proposal Disetujui!</h3>
              <p className="mt-1 text-sm text-green-800">melakukan seminar proposal seusai dengan jadwal yang telah ditetapkan</p>

              {isSidangScheduled && (
                <div className="mt-4 text-sm text-green-900 space-y-3">
                  <p className="font-semibold text-base text-gray-800 border-b pb-1">Detail Seminar Proposal</p>
                  <p><strong>Jadwal Seminar: </strong>{tanggalSidang}.</p>
                  <p className='border-b pb-1'><strong>Dosen Penguji: </strong> {penguji}</p>

                  <p className="mt-1 text-sm text-green-800 ">Silahkan Hubungi Dosen Penguji </p>
                </div>
              )}

              {isSidangScheduled && skPengujiUrl && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  {
                    (() => {
                      const rawName = `${studentProfile.nama || 'mahasiswa'}`;
                    const rawNim = studentProfile.nim || latestProposalSubmission.id;

                      const sanitized = rawName.replace(/[^a-zA-Z0-9\- _]/g, '_').replace(/\s+/g, '_');
                      const filename = `SK-PENGUJI-SEMPRO-${sanitized}-${rawNim}.pdf`;

                      return (
                        <DownloadSKButton
                          submissionId={latestProposalSubmission.id}
                          filename={filename}
                        />
                      );
                    })()
                  }
                </div>
              )}

              <Link href="/dashboard/mahasiswa/seminar-hasil" className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                Lanjut Pengajuan Sidang Skripsi <FiArrowRight />
              </Link>
            </div>
          ) : (latestJudulSubmission?.status === 'DISETUJUI' && !latestProposalSubmission) ? (

            <div className="text-center py-10">
              <FiBookOpen className="mx-auto h-12 w-12 text-blue-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Judul Disetujui, Siap Ajukan Proposal</h3>
              <p className="mt-1 text-sm text-gray-500">Lengkapi dokumen dan segera ajukan pendaftaran Anda.</p>
              <Link href="/dashboard/mahasiswa/proposal" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                Ajukan Proposal Sekarang <FiArrowRight />
              </Link>
            </div>
          ) : latestJudulSubmission?.status === 'DISETUJUI' && pendingStatuses.includes(latestProposalSubmission?.status as Status) ? (

            <div className="text-center py-10">
              <FiClock className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Pengajuan Proposal Sedang Diproses</h3>
              <p className="mt-1 text-sm text-gray-500">Silakan tunggu verifikasi dokumen Anda.</p>
            </div>
          ) : (
            
            <div className="text-center py-10 text-gray-500">
              <FiBookOpen className="mx-auto h-12 w-12 text-gray-400" />
             <p className="mt-2">Seminar Proposal <strong>&quot;Disetujui&quot;</strong> terlebih dahulu untuk mengajukan Sidang Skripsi.</p>
            </div>
          )
        }
      </div>

      ---

  
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Status Pengajuan Sidang Skripsi Terakhir</h2>
          {latestSeminarHasilSubmission && <StatusBadge status={latestSeminarHasilSubmission.status} />}
        </div>

        {
  
          !isProposalApproved ? (
         
            <div className="text-center py-10 text-gray-500">
              <FiBook className="mx-auto h-12 w-12 text-gray-400" />
               <p className="mt-2">Seminar Proposal <strong>&quot;Disetujui&quot;</strong> terlebih dahulu untuk mengajukan Sidang Skripsi.</p>
            </div>
          ) : isSeminarHasilApproved ? (
  
            <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
              <h3 className="text-md font-bold text-indigo-800"> Sidang Skripsi Anda Telah Disetujui!</h3>
              <p className="mt-1 text-sm text-indigo-700">Langkah terakhir: **Pengajuan Sidang Skripsi**.</p>
       
              <Link href="/dashboard/mahasiswa/sidang-skripsi" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
                Lanjut Pengajuan Sidang Skripsi <FiArrowRight />
              </Link>
            </div>
          ) : isSeminarHasilSubmitted && pendingStatuses.includes(latestSeminarHasilSubmission.status as Status) ? (
      
            <div className="text-center py-10">
              <FiClock className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Pengajuan Sidang Skripsi Sedang Diproses</h3>
              <p className="mt-1 text-sm text-gray-500">Silakan tunggu verifikasi dokumen Anda.</p>
            </div>
          ) : isSeminarHasilSubmitted && latestSeminarHasilSubmission.status === 'DITOLAK_ADMIN' ? (
         
            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <h3 className="text-md font-bold text-red-800">Pengajuan Sidang Skripsi Perlu Direvisi</h3>

              <div className="mt-2 text-sm text-red-700">
                <p><strong>Catatan dari Admin:</strong> {latestSeminarHasilSubmission.catatan || 'Tidak ada catatan.'}</p>
              </div>

              <Link href="/dashboard/mahasiswa/seminar-hasil" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                Ajukan Ulang Sidang Skripsi <FiArrowRight />
              </Link>
            </div>
          ) : (
        
            <div className="text-center py-10">
              <FiBook className="mx-auto h-12 w-12 text-blue-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Siap Ajukan Sidang Skripsi</h3>
              <p className="mt-1 text-sm text-gray-500">Proposal telah disetujui. Ajukan Sidang Skripsi Anda.</p>
              <Link href="/dashboard/mahasiswa/seminar-hasil" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                Ajukan Sidang Skripsi Sekarang <FiArrowRight />
              </Link>
            </div>
          )}
      </div>

    </div>
  );
}