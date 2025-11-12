import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import PembimbingStatsClient from './tabelPembimbing'; 
import { Jurusan, Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DosenPembimbingPage({ 
  searchParams, 
}: { 
  searchParams: Promise<{ tahun?: string, semester?: string, jurusan?: string }>
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const kaprodiJurusan = session?.user?.jurusan; 
  
  const isKaprodi = userRole === Role.KAPRODI;
  const isAuthorized = isKaprodi || userRole === Role.ADMIN;
  
  if (!isAuthorized) {
    return (
      <main className="p-8"><h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1></main>
    );
  }
  const params = await searchParams;
  let targetJurusan: Jurusan;
  
  if (isKaprodi) {
      if (!kaprodiJurusan) {
          return (
            <main className="p-8"><h1 className="text-2xl font-bold text-red-600">Akses Ditolak: Kaprodi tanpa Jurusan.</h1></main>
          );
      }
      targetJurusan = kaprodiJurusan as Jurusan;
  } else {
      const queryJurusan = params.jurusan as Jurusan;
      targetJurusan = (queryJurusan in Jurusan) ? queryJurusan : Jurusan.SISTEM_INFORMASI;
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
   const defaultSemester = (currentMonth >= 7 || currentMonth === 0) ? 'GANJIL' : 'GENAP';

  const initialTahun = parseInt(params.tahun || String(currentYear), 10);
  const initialSemester = (params.semester === 'GANJIL' || params.semester === 'GENAP') ? params.semester : defaultSemester;

  return (

    <PembimbingStatsClient 
      isKaprodi={isKaprodi}
      initialTahun={initialTahun} 
      initialSemester={initialSemester} 
      initialJurusan={targetJurusan}
    />
  );
}