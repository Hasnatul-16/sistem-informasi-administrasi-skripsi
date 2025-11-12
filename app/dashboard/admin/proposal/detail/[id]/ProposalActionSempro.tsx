
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal, Judul, Mahasiswa } from '@prisma/client';
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiClock } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);


type ProposalWithDetails = Proposal & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};


export default function ProposalActionSempro({ proposal }: { proposal: ProposalWithDetails }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        let catatanAdmin = '';

        if (action === 'REJECT') {
            
            const { value: rejectCatatan } = await MySwal.fire({
                title: "Tolak Pengajuan Proposal",
                input: "textarea",
                inputLabel: "Alasan Penolakan",
                inputPlaceholder: "Masukkan alasan penolakan proposal ini...",
                inputAttributes: { "aria-label": "Masukkan alasan penolakan" },
                showCancelButton: true,
                confirmButtonText: 'Tolak & Kembalikan',
                confirmButtonColor: '#d33',
                cancelButtonText: 'Batal',
                inputValidator: (value) => {
                    if (!value) {
                        return "Alasan penolakan tidak boleh kosong!";
                    }
                }
            });
            if (!rejectCatatan) return; 
            catatanAdmin = rejectCatatan;
            
        } else { 
            const result = await MySwal.fire({
                title: "Setujui Pengajuan Proposal?",
                text: "Anda yakin data dan dokumen proposal ini sudah lengkap?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: 'Ya, Setujui & Teruskan!',
                confirmButtonColor: '#28a745',
                cancelButtonText: 'Batal'
            });
            if (!result.isConfirmed) return;
        }

       
        setIsLoading(true);
        try {
            const response = await fetch(`/api/proposal/status/${proposal.id}`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    catatan: catatanAdmin || undefined, 
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Gagal memproses aksi.');
            }

            MySwal.fire({
                icon: 'success',
                title: `Proposal ${action === 'APPROVE' ? 'Disetujui' : 'Ditolak'}!`,
                timer: 2000,
                showConfirmButton: false
            });

            
            setTimeout(() => {
                router.push(`/dashboard/admin/proposal/${proposal.judul.jurusan}`);
                router.refresh(); 
            }, 1500);


        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
            MySwal.fire('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
  
    if (proposal.status !== 'TERKIRIM') {
        return (
            <div className="mt-6 border-t pt-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <p className="text-sm font-semibold text-blue-800">
                        Pengajuan ini sudah diproses dengan status: <strong>{proposal.status.replace('_', ' ')}</strong>
                    </p>
                    {proposal.catatan && (
                        <p className="text-sm text-red-700 mt-1">
                            <strong>Catatan:</strong> {proposal.catatan}
                        </p>
                    )}
                </div>
                
                <button
                    onClick={() => router.push(`/dashboard/admin/proposal/${proposal.judul.jurusan}`)}
                    className="inline-flex items-center gap-2 mt-4 py-2 px-5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                    <FiArrowLeft /> Kembali ke Daftar
                </button>
            </div>
        );
    }


 
    return (
        <div className="flex justify-between items-center gap-4 pt-6 mt-6 border-t">
            
            <button
                onClick={() => router.back()} 
                className="inline-flex items-center gap-2 py-2 px-5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
            >
                <FiArrowLeft /> Kembali
            </button>

           
            <div className="flex items-center gap-4">
                <button
                    onClick={() => handleAction('REJECT')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 py-2 px-5 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? <FiClock className='animate-spin'/> : <FiXCircle />} Tolak & Kembalikan
                </button>
                <button
                    onClick={() => handleAction('APPROVE')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 py-2 px-5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? <FiClock className='animate-spin'/> : <><FiCheckCircle /> Lengkap & Teruskan</>}
                </button>
            </div>
        </div>
    );
}