import { PrismaClient } from '@prisma/client';
import SubmissionTable from './SubmissionTable';

const prisma = new PrismaClient();

// Fungsi untuk mengambil semua data pengajuan dari database
async function getSubmissions() {
  const submissions = await prisma.thesisSubmission.findMany({
    orderBy: {
      createdAt: 'desc', // Tampilkan yang terbaru di atas
    },
    include: {
      // Sertakan data relasi untuk menampilkan nama & jurusan mahasiswa
      student: {
        include: {
          user: true, // Jika perlu data dari tabel User
        },
      },
    },
  });
  return submissions;
}

// Ini adalah Server Component
export default async function AdminDashboardPage() {
  const submissions = await getSubmissions();

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dasbor Admin - Verifikasi Pengajuan</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Pengajuan Judul Terbaru</h2>
          {/* Melemparkan data yang diambil di server sebagai props ke client component */}
          <SubmissionTable initialSubmissions={submissions} />
        </div>
      </div>
    </main>
  );
}

// Untuk memastikan halaman ini selalu dinamis dan mengambil data terbaru setiap kali diakses
export const revalidate = 0;