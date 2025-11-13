import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/auth'; 
import ArsipClient from './ArsipClient'; 
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client'; 

async function getInitialData() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect('/login'); 
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { 
            role: true, 
            jurusan: true 
        },
    });

    if (!user || user.role === 'MAHASISWA') {
       
        redirect('/'); 
    }

    return {
        initialJurusan: user.jurusan, 
        userRole: user.role, 
    };
}

export default async function ArsipPage() {
   
    const { initialJurusan, userRole } = await getInitialData();
    const isKaprodi = userRole === Role.KAPRODI;

    return (
        <div className="container mx-auto py-8">
            
            <ArsipClient 
                initialJurusan={initialJurusan} 
                isKaprodi={isKaprodi} 
            />
        </div>
    );
}

export const metadata = {
    title: 'Arsip Data Mahasiswa',
    description: 'Arsip lengkap pengajuan judul, seminar proposal, dan sidang skripsi.',
};