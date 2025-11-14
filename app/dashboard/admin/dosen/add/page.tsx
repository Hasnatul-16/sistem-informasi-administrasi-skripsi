import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { Role } from '@prisma/client';
import DosenManagementClient from './DosenManagementClient';

export const dynamic = 'force-dynamic';

export default async function DosenManagementPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (userRole !== Role.ADMIN) {
    return (
      <main className="p-8"><h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1></main>
    );
  }

  return <DosenManagementClient />;
}
