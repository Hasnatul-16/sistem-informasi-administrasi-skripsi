"use client";

import { useRef } from 'react';
import type { Judul, Mahasiswa } from '@prisma/client';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';
import { FiPrinter } from 'react-icons/fi';

// Tipe data untuk props komponen
type SKProps = {
  submission: Judul & { student: Mahasiswa };
  dekan: { nama: string; nip: string; };
};

export default function SKDocument({ submission, dekan }: SKProps) {
  // 1. Buat ref untuk menunjuk ke komponen yang akan dicetak
  const componentRef = useRef<HTMLDivElement>(null);

  // 2. Gunakan hook react-to-print
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `SK Pembimbing - ${submission.student.nama}`,
    onAfterPrint: () => alert('Dokumen SK siap dicetak/disimpan!'),
  } as any);

  // Fungsi untuk memformat tanggal
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Tombol Cetak yang terlihat di UI */}
      <div className="max-w-4xl mx-auto mb-8 text-right">
        <button 
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          <FiPrinter/> Unduh / Cetak SK
        </button>
      </div>

      {/* Konten SK yang akan dicetak (disembunyikan dari UI biasa) */}
      <div className="hidden">
        <div ref={componentRef} className="p-16 font-serif text-sm text-black bg-white">
          {/* Halaman 1: SK Utama */}
          <div className="min-h-[29.7cm]">
             <header className="flex items-start justify-center mb-8">
              <Image src="/Logo_UIN_Imam_Bonjol.png" alt="Logo UIN" width={80} height={80} className="mr-4"/>
              <div className="text-center">
                <p className="text-lg font-bold">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
                <p className="text-xl font-bold">UNIVERSITAS ISLAM NEGERI (UIN) IMAM BONJOL PADANG</p>
                <p className="text-2xl font-bold">FAKULTAS SAINS DAN TEKNOLOGI</p>
                <p className="text-xs">Alamat: Sungai Bangek Kelurahan Balai Gadang Kecamatan Koto Tangah Kota Padang</p>
              </div>
            </header>
            <hr className="border-t-4 border-black mb-1" />
            <hr className="border-t-1 border-black mb-8" />
            
            <div className="text-center mb-8 space-y-1">
              <p className="text-md font-bold underline">KEPUTUSAN DEKAN FAKULTAS SAINS DAN TEKNOLOGI</p>
              <p>Nomor: B. ... /Un.13/FST/PP.00.9/{String(currentMonth).padStart(2, '0')}/{currentYear}</p>
            </div>
            {/* Sisa konten SK sesuai PDF */}
          </div>
          
          {/* Halaman 2: Lampiran */}
          <div className="min-h-[29.7cm] pt-16" style={{ pageBreakBefore: 'always' }}>
            <p>LAMPIRAN:</p>
            {/* Sisa konten Lampiran sesuai PDF */}
          </div>
        </div>
      </div>

      {/* Tampilan Preview di Halaman Web */}
      <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg border">
        <h2 className="text-xl font-bold text-center">Preview SK Pembimbing</h2>
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
            <p className="mb-2"><strong>Mahasiswa:</strong> {submission.student.nama}</p>
            <p><strong>Judul:</strong> {submission.judul}</p>
        </div>
      </div>
    </>
  );
}