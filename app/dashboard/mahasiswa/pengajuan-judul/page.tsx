import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/auth';
import prisma from "@/lib/prisma";
import { Jurusan, Dosen } from "@prisma/client";
import PengajuanJudulForm from "./PengajuanJudulForm";

async function getDosenByJurusan(jurusan: Jurusan): Promise<Dosen[]> {
  if (!jurusan) return [];

  const dosen = await prisma.dosen.findMany({
    where: {
      jurusan: jurusan,
    },
    orderBy: {
      nama: 'asc', 
    },
  });
  return dosen;
}

export default async function PengajuanJudulPage() {
  const session = await getServerSession(authOptions);
  const userJurusan = session?.user?.jurusan as Jurusan | undefined;

  if (!userJurusan) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Gagal Memuat Data</h1>
        <p className="text-gray-700 mt-2">
          Informasi jurusan tidak ditemukan untuk akun Anda.
        </p>
      </main>
    );
  }

  const dosenList = await getDosenByJurusan(userJurusan);

  return (
    <PengajuanJudulForm dosenList={dosenList} />
  );
}

export const revalidate = 0; 