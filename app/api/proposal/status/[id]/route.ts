// api admin

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client'; 


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const proposalId = parseInt(resolvedParams.id, 10);

  if (isNaN(proposalId)) {
    return NextResponse.json({ message: 'ID Proposal tidak valid.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, catatan } = body;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
    }

    let newStatus: Status; 
    let catatanUpdate: string | null = null;

    if (action === 'APPROVE') {
     
      newStatus = Status.DIPROSES_KAPRODI; 
      
    } else { 
      
      newStatus = Status.DITOLAK_ADMIN; 
      catatanUpdate = catatan;
    }

 
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: newStatus,
        catatan: catatanUpdate, 
      },
    });

   
    return NextResponse.json({ 
      message: 'Status proposal berhasil diperbarui dan diteruskan ke Kaprodi.',
      status: updatedProposal.status,
      catatan: updatedProposal.catatan
    }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui status proposal.' }, { status: 500 });
  }
}