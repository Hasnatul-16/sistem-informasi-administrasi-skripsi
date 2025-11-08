import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DosenStatsClient from './tabelPenguji';
import { Jurusan, Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DosenStatsPage({ 
  searchParams, 
}: { 
  searchParams: { tahun?: string, semester?: string, jurusan?: string } 
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

  let targetJurusan: Jurusan;
  
  if (isKaprodi) {
      if (!kaprodiJurusan) {
          return (
            <main className="p-8"><h1 className="text-2xl font-bold text-red-600">Akses Ditolak: Kaprodi tanpa Jurusan.</h1></main>
          );
      }
      targetJurusan = kaprodiJurusan as Jurusan;
  } else {
      const queryJurusan = searchParams.jurusan as Jurusan;
      targetJurusan = (queryJurusan in Jurusan) ? queryJurusan : Jurusan.SISTEM_INFORMASI;
  }


  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultSemester = (currentMonth >= 8 || currentMonth <= 1) ? 'GANJIL' : 'GENAP'; 
  
  const initialTahun = parseInt(searchParams.tahun || String(currentYear), 10);
  const initialSemester = (searchParams.semester === 'GENAP' ? 'GENAP' : 'GANJIL');

  return (
    <DosenStatsClient 
      isKaprodi={isKaprodi}
      initialTahun={initialTahun} 
      initialSemester={initialSemester} 
      initialJurusan={targetJurusan}
    />
  );
}