import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import prisma from '@/lib/prisma';

interface UpdateProfileBody {
  nama: string;
  nim?: string;
  email: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        jurusan: true,
        mahasiswa: {
          select: {
            nim: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profileData = {
      nama: user.nama,
      nim: user.mahasiswa?.nim || null,
      email: user.email,
      role: user.role,
      jurusan: user.jurusan,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json() as UpdateProfileBody;
    const { nama, nim, email } = body;

   
    if (!nama || !email) {
      return NextResponse.json({ error: 'Nama and email are required' }, { status: 400 });
    }

    const updateData: { nama: string; email: string; } = {
      nama,
      email,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        jurusan: true,
        mahasiswa: {
          select: {
            nim: true,
          },
        },
      },
    });

    // Update mahasiswa table if user has mahasiswa relation and nama has changed
    if (updatedUser.mahasiswa && nama) {
      await prisma.mahasiswa.update({
        where: { id_user: userId },
        data: { nama },
      });
    }

    if (nim !== undefined && updatedUser.mahasiswa) {
      await prisma.mahasiswa.update({
        where: { id_user: userId },
        data: { nim },
      });
    }

    const profileData = {
      nama: updatedUser.nama,
      nim: updatedUser.mahasiswa?.nim || null,
      email: updatedUser.email,
      role: updatedUser.role,
      jurusan: updatedUser.jurusan,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
