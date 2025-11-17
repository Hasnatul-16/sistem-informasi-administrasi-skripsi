"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SeminarHasil, Judul, Mahasiswa } from '@prisma/client';
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiClock } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

type SeminarHasilWithDetails = SeminarHasil & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};

export default function SeminarHasilActionAdmin({ submission }: { submission: SeminarHasilWithDetails }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);


    const showSkUjianInput = async () => {
        const { value: skUjianPrefix } = await MySwal.fire({
            title: "Masukkan angka awal pada nomor sk  (misalnya : B.XXX/Un.13/FST/PP.00.9/08/2025 )",
            input: "text",
            inputPlaceholder: "Masukkan angka unik (misal: 793)",
            inputAttributes: { "aria-label": "Nomor urut Surat Ujian" },
            showCancelButton: true,
            confirmButtonText: 'Verifikasi & Teruskan ke Kaprodi',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value || !/^\d+$/.test(value)) { 
                    return "Nomor urut Surat Ujian harus berupa angka dan tidak boleh kosong!";
                }
            }
        });
        if (skUjianPrefix) {
            processSubmission('VERIFY', undefined, skUjianPrefix);
        }
    };

    const processSubmission = async (
        action: 'VERIFY' | 'REJECT',
        catatan: string | undefined = undefined,
        skUjianPrefix: string | undefined = undefined 
    ) => {
       
        if (action === 'VERIFY' && !skUjianPrefix) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/seminar-hasil/status/${submission.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    catatan: catatan,
                    skPengujiPrefix: skUjianPrefix,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Gagal memproses aksi.');
            }

            MySwal.fire({
                icon: 'success',
                title: `Seminar Hasil ${action === 'VERIFY' ? 'Diverifikasi' : 'Ditolak'}!`,
                text: `Seminar Hasil berhasil di-${action === 'VERIFY' ? 'teruskan ke Kaprodi' : 'kembalikan ke mahasiswa'}.`,
                timer: 2000,
                showConfirmButton: false
            });

            setTimeout(() => {
                router.push(`/dashboard/admin/seminar-hasil/${submission.judul.jurusan}`);
                router.refresh();
            }, 1500);


        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
            MySwal.fire('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };


    const handleAction = async (action: 'VERIFY' | 'REJECT') => {

        if (action === 'REJECT') {
            const { value: rejectCatatan } = await MySwal.fire({
                title: "Tolak Pengajuan Seminar Hasil",
                input: "textarea",
                inputLabel: "Alasan Penolakan",
                inputPlaceholder: "Masukkan alasan penolakan Seminar Hasil ini...",
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
            processSubmission(action, rejectCatatan);

        } else { 
           
            showSkUjianInput();
        }
    };

    if (submission.status !== 'TERKIRIM') {
        return (
            <div className="mt-6 border-t pt-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <p className="text-sm font-semibold text-blue-800">
                        Pengajuan ini sudah diproses dengan status: <strong>{submission.status.replace('_', ' ')}</strong>
                    </p>
                    {submission.catatan && (
                        <p className="text-sm text-red-700 mt-1">
                            <strong>Catatan:</strong> {submission.catatan}
                        </p>
                    )}
                </div>
             
                <button
                    onClick={() => router.push(`/dashboard/admin/seminar-hasil/${submission.judul.jurusan}`)}
                    className="inline-flex items-center gap-2 mt-4 py-2 px-5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                    <FiArrowLeft /> Kembali ke Daftar
                </button>
            </div>
        );
    }


    return (
        <div className="flex-col sm:flex-row  justify-between items-center gap-4 pt-6 mt-6 border-t">
          
            <button
                onClick={() => router.back()} 
               className="inline-flex items-center justify-center gap-2 py-2 px-5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors w-full sm:w-auto"
            >
                <FiArrowLeft /> Kembali
            </button>

           
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button
                    onClick={() => handleAction('REJECT')}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 py-2 px-5 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-wait w-full sm:w-auto"
                >
                    {isLoading ? <FiClock className='animate-spin' /> : <FiXCircle />} Tolak & Kembalikan
                </button>
                <button
                    onClick={() => handleAction('VERIFY')} 
                    disabled={isLoading}
                     className="inline-flex items-center justify-center gap-2 py-2 px-5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait w-full sm:w-auto"
                >
                    {isLoading ? <FiClock className='animate-spin' /> : <><FiCheckCircle /> Lengkap & Teruskan</>}
                </button>
            </div>
        </div>
    );
}