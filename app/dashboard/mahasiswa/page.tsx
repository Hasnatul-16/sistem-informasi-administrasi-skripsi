import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiEdit, 
  FiArrowRight, 
  FiAlertCircle 
} from 'react-icons/fi';
import DownloadSKButton from './DownloadSK';
import { Status } from '@prisma/client';
import { getServerSession } from 'next-auth'; 
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import { redirect } from 'next/navigation';


export const dynamic = 'force-dynamic';


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
    return { studentProfile: null, latestSubmission: null };
  }

 
  const latestSubmission = await prisma.judul.findFirst({
    where: {
     id_mahasiswa: studentProfile.id,
    },
    orderBy: {
      tanggal: 'desc',
    },
  });

  return { studentProfile, latestSubmission };
}


const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig = {
 
    TERKIRIM: { text: "Diperiksa oleh Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
    DIPERIKSA_ADMIN: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
    DITOLAK_ADMIN: { text: "Ditolak Admin", icon: FiXCircle, color: "bg-red-100 text-red-800" },
    DIPROSES_KAPRODI: { text: "Diproses Kaprodi", icon: FiClock, color: "bg-purple-100 text-purple-800" },
    DISETUJUI: { text: "Disetujui", icon: FiCheckCircle, color: "bg-green-100 text-green-800" },
  };

  const config = statusConfig[status] || { text: status, icon: FiAlertCircle, color: "bg-gray-100 text-gray-800" };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
      <Icon className="h-4 w-4" />
      {config.text}
    </span>
  );
};


export default async function MahasiswaDashboardPage() {
  const { studentProfile, latestSubmission } = await getMahasiswaData();

  if (!studentProfile) {
   
    return (
      <div className="text-center p-10">
        <h1 className="text-2xl font-bold text-red-600">Profil Mahasiswa Tidak Ditemukan</h1>
        <p className="text-gray-500 mt-2">Terjadi kesalahan saat memuat data profil Anda.</p>
      </div>
    );
  }

  const steps = ['Pengajuan Judul', 'Seminar Proposal', 'Sidang Skripsi', 'Lulus'];
  let currentStepIndex = 0;
  if (latestSubmission) {
    if (latestSubmission.status === 'DISETUJUI') currentStepIndex = 1;
  }

  return (
    <div className="space-y-8">
     
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Selamat Datang, {studentProfile.nama}!</h1>
        <p className="mt-1 text-gray-600">Pantau progres skripsi Anda dan lihat status pengajuan terbaru di sini.</p>
      </div>

     
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-5">Progres Skripsi Anda</h2>
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center w-full">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                  index < currentStepIndex ? 'bg-green-500 text-white' : 
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

      {/* Kartu Status Pengajuan Terbaru */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Status Pengajuan Judul</h2>
          {latestSubmission && <StatusBadge status={latestSubmission.status} />}
        </div>
        
        {!latestSubmission ? (
          //  belum ada pengajuan sama sekali
          <div className="text-center py-10">
            <FiEdit className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Anda Belum Mengajukan Judul</h3>
            <p className="mt-1 text-sm text-gray-500">Mulai langkah pertama perjalanan skripsi Anda sekarang.</p>
            <Link href="/dashboard/mahasiswa/pengajuan-judul" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Ajukan Judul Sekarang <FiArrowRight />
            </Link>
          </div>
        ) : latestSubmission.status === 'DITOLAK_ADMIN' ? (
          //  pengajuan ditolak
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-md font-bold text-red-800">Pengajuan Anda Perlu Direvisi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p><strong>Catatan dari Admin:</strong> {latestSubmission.catatan}</p>
                </div>
                <Link href="/dashboard/mahasiswa/pengajuan-judul" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                  Ajukan Ulang Judul <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ) : latestSubmission.status === 'DISETUJUI' ? (
          //  pengajuan disetujui
          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
             <h3 className="text-md font-bold text-green-800">Selamat, Judul Anda Telah Disetujui!</h3>
             <div className="mt-4 text-sm text-green-900">
               <p className="font-semibold">Dosen Pembimbing Anda:</p>
               <ul className="list-disc list-inside mt-2 space-y-1">
                 <li><strong>Pembimbing 1:</strong> {latestSubmission.pembimbing1}</li>
                 <li><strong>Pembimbing 2:</strong> {latestSubmission.pembimbing2}</li>
               </ul>
               <p className="mt-4">Silakan hubungi dosen pembimbing untuk memulai proses bimbingan.</p>
               
              
               <div className="mt-4">
                
                 {
                   (() => {
                     const rawName = `${studentProfile.nama || 'mahasiswa'}`;
                     const rawNim = studentProfile.nim || latestSubmission.id;
                     const sanitized = rawName.replace(/[^a-zA-Z0-9\- _]/g, '_').replace(/\s+/g, '_');
                     const filename = `SK-${sanitized}-${rawNim}.pdf`;
                     return <DownloadSKButton submissionId={latestSubmission.id} filename={filename} />;
                   })()
                 }
               </div>
             </div>
          </div>
        ) : (
          //  diproses
          <div className="text-center py-10">
            <FiClock className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Pengajuan Anda Sedang Dalam Proses</h3>
            <p className="mt-1 text-sm text-gray-500">Harap tunggu informasi selanjutnya. Status akan diperbarui secara otomatis.</p>
          </div>
        )}
      </div>

    </div>
  );
}