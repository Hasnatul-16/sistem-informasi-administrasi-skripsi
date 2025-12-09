"use client";

import { useState } from 'react';
import { FiUpload, FiSend, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useRouter } from 'next/navigation';

const MySwal = withReactContent(Swal);

interface JudulData {
    id: number;
    topik: string;
    judul: string;
    pembimbing1: string | null;
    pembimbing2: string | null;
}

interface SeminarHasilFormProps {
    judulId: number;
    judulData: JudulData;
}

type FilesState = {
    transkrip: File | null;
    bukti_lulus_proposal: File | null; 
    draf_skripsi: File | null;
    bukti_konsultasi: File | null;
    sertifikat_toefl: File | null;
    bukti_hafalan: File | null;
};

const FileUploadBox = ({ id, name, label, file, onChange }: {
    id: string;
    name: keyof FilesState;
    label: string;
    file: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
    <div>
        <label
            htmlFor={id}
            className="flex flex-col items-center justify-center w-full h-40 px-4 text-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
            <div className="flex flex-col items-center justify-center">
                {file ? (
                    <>
                        <FiFileText className="w-10 h-10 mb-2 text-green-500" />
                        <p className="text-sm font-medium text-gray-800 break-all">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Klik untuk mengganti file</p>
                    </>
                ) : (
                    <>
                        <FiUpload className="w-10 h-10 mb-2 text-gray-400" />
                        <p className="font-semibold text-gray-700">{label} <span className="text-red-500">*</span></p>
                        <p className="text-xs text-gray-500">Klik untuk upload (PDF)</p>
                    </>
                )}
            </div>
            <input id={id} name={name} type="file" className="hidden" onChange={onChange} accept=".pdf" />
        </label>
    </div>
);

export default function SeminarHasilForm({ judulId, judulData }: SeminarHasilFormProps) {
    const initialFilesState: FilesState = {
        transkrip: null,
        bukti_lulus_proposal: null,
        draf_skripsi: null,
        bukti_konsultasi: null,
        sertifikat_toefl: null,
        bukti_hafalan: null,
    };

    const [files, setFiles] = useState<FilesState>(initialFilesState);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [judulForm, setJudulForm] = useState({
        topik: judulData.topik,
        judul: judulData.judul,
    });
    // const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'in_process'>('idle');

    const handleJudulChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setJudulForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: inputFiles } = e.target as HTMLInputElement & { name: keyof FilesState };
        if (inputFiles && inputFiles.length > 0) {
            setFiles(prev => ({ ...prev, [name]: inputFiles[0] }));
        } else {
            setFiles(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const requiredFiles: Array<keyof FilesState> = [
            'transkrip',
            'bukti_lulus_proposal',
            'draf_skripsi',
            'bukti_konsultasi',
            'sertifikat_toefl',
            'bukti_hafalan'
        ];

        const missingFile = requiredFiles.find(key => !files[key]);
        if (missingFile) {
            MySwal.fire({ icon: 'warning', title: 'Form Belum Lengkap', text: 'Harap lengkapi semua dokumen persyaratan.' });
            return;
        }

        setIsLoading(true);
        const formData = new FormData();

        formData.append('id_judul', judulId.toString());
        formData.append('topik_baru', judulForm.topik);
        formData.append('judul_baru', judulForm.judul);
        formData.append('transkrip', files.transkrip!);
        formData.append('bukti_sempro', files.bukti_lulus_proposal!); 
        formData.append('draf_skripsi', files.draf_skripsi!);
        formData.append('bukti_konsultasi', files.bukti_konsultasi!);
        formData.append('sertifikat_toefl', files.sertifikat_toefl!);
        formData.append('bukti_hafalan', files.bukti_hafalan!);


        try {
            // Panggil API baru untuk Seminar Hasil
            const response = await fetch('/api/seminar-hasil', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    MySwal.fire({
                        icon: 'warning',
                        title: 'Pengajuan Dalam Proses',
                        text: 'Pengajuan Anda sedang dalam proses verifikasi.',
                        timer: 3000,
                        showConfirmButton: false
                    });
                    router.push('/dashboard/mahasiswa');
                    return;
                }
                throw new Error(result.message || `Gagal mengirim: Status ${response.status}`);
            }

            await MySwal.fire({
                icon: 'success',
                title: 'Pendaftaran Terkirim!',
                text: 'Data Anda telah berhasil dikirim untuk diverifikasi.',
                timer: 2000,
                showConfirmButton: false
            });
            router.push('/dashboard/mahasiswa');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      MySwal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: message
      });
    } finally {
            setIsLoading(false);
        }
    };


    return (
        <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Sidang Skripsi</h1>
                    <p className="text-gray-600 mt-1">Upload dokumen persyaratan untuk mendaftar Sidang Skripsi.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-5">
                            Informasi Judul Skripsi
                        </h2>
                        <div className="space-y-6">

                            <div>
                                <label htmlFor="topik" className="block text-sm font-medium text-gray-700 mb-1">Topik <span className="text-red-500">*</span></label>
                                <input
                                    id="topik"
                                    name="topik"
                                    type="text"
                                    value={judulForm.topik}
                                    onChange={handleJudulChange}
                                    placeholder="Masukkan topik skripsi"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-700 focus:border-green-800 text-gray-800 font-medium"
                                />

                            </div>


                            <div>
                                <label htmlFor="judul" className="block text-sm font-medium text-gray-700 mb-1">Judul Skripsi <span className="text-red-500">*</span></label>
                                <textarea
                                    id="judul"
                                    name="judul"
                                    rows={4}
                                    value={judulForm.judul}
                                    onChange={handleJudulChange}
                                    placeholder="Masukkan judul skripsi"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-700 focus:border-green-700 min-h-[100px] text-gray-800"
                                />
                            </div>
                            <div className="block text-sm font-small text-gray-500 mb-5 ">Note: Jika ada Perubahan judul setelah anda melakukan bimbingan, mohon untuk menginputkan ulang judul atau topik pada kolom di atas</div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-300">
                                <div>
                                    <label className="block text-sm font-medium text-[#325827] mb-1">
                                        Pembimbing 1
                                    </label>
                                    <div className="w-full px-3 py-2 border border-[#325827] rounded-md shadow-sm bg-green-50 text-[#325827] font-semibold">
                                        {judulData.pembimbing1 || "Belum Ditetapkan"}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#325827] mb-1">
                                        Pembimbing 2
                                    </label>
                                    <div className="w-full px-3 py-2 border border-[#325827] rounded-md shadow-sm bg-green-50 text-[#325827] font-semibold">
                                        {judulData.pembimbing2 || "Belum Ditetapkan"}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Dokumen Persyaratan Sidang Skripsi</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                            <FileUploadBox
                                id="transkrip" name="transkrip" label="1. Transkrip Nilai Terbaru"
                                file={files.transkrip} onChange={handleFileChange}
                            />
                            <FileUploadBox
                                id="bukti_lulus_proposal" name="bukti_lulus_proposal" label="2. Bukti Lulus Seminar Proposal"
                                file={files.bukti_lulus_proposal} onChange={handleFileChange}
                            />
                            <FileUploadBox
                                id="draf_skripsi" name="draf_skripsi" label="3. Draf Skripsi (Acc Pembimbing)"
                                file={files.draf_skripsi} onChange={handleFileChange}
                            />
                            <FileUploadBox
                                id="bukti_konsultasi" name="bukti_konsultasi" label="4. Bukti Konsultasi/Kartu Bimbingan"
                                file={files.bukti_konsultasi} onChange={handleFileChange}
                            />
                            <FileUploadBox
                                id="sertifikat_toefl" name="sertifikat_toefl" label="5. Sertifikat TOEFL Min. 450"
                                file={files.sertifikat_toefl} onChange={handleFileChange}
                            />
                            <FileUploadBox
                                id="bukti_hafalan" name="bukti_hafalan" label="6. Bukti Hafalan Juz 30"
                                file={files.bukti_hafalan} onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#325827] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Mengirim...' : <><FiSend /> Kirim Pendaftaran Sidang Skripsi</>}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}