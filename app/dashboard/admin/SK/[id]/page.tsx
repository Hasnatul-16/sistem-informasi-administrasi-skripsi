import prisma from '@/lib/prisma';
import SKDocument from './SKDocument'; // Komponen yang akan kita buat

// Fungsi untuk mengambil data spesifik untuk SK
async function getSubmissionForSK(id: string) {
  const submissionId = Number(id);
  if (isNaN(submissionId)) {
    throw new Error('ID pengajuan tidak valid.');
  }
  const submission = await prisma.thesisSubmission.findUnique({
    where: { id: submissionId, status: 'DISETUJUI' }, // Pastikan hanya yang disetujui
    include: {
      student: true, // Ambil data mahasiswa
    },
  });
  if (!submission) {
    throw new Error('Pengajuan yang telah disetujui tidak ditemukan.');
  }
  return submission;
}

export default async function GenerateSKPage({ params }: { params: { id: string } }) {
  const submission = await getSubmissionForSK(params.id);

  // Data ini bisa Anda simpan di file konfigurasi atau database
  const dekanData = {
    nama: "Yulia, M.Kom.",
    nip: "198105052009012008"
  };

  return (
    <div className="bg-gray-100 p-8">
      {/* Komponen SKDocument akan menerima semua data yang dibutuhkan */}
      <SKDocument 
        submission={submission} 
        dekan={dekanData} 
      />
    </div>
  );
}