import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { Jurusan } from '@prisma/client';

const getSkDateInfo = (date: Date) => {

  const skDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const skMonth = String(date.getMonth() + 1).padStart(2, '0');
  const skYear = date.getFullYear();
  return { skDate, skMonth, skYear };
};

const formatJurusanToProdi = (jurusanEnum: Jurusan): string => {
  return jurusanEnum.toString().split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};


export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const proposalId = Number(id);
  if (isNaN(proposalId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal || (!['DIPROSES_KAPRODI', 'DISETUJUI'].includes(proposal.status)) || !proposal.id_judul) {
    return NextResponse.json({ error: 'Proposal tidak ditemukan atau belum disetujui.' }, { status: 404 });
  }

  const submission = await prisma.judul.findUnique({
    where: { id: proposal.id_judul },
    include: {
      mahasiswa: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: 'Judul terkait tidak ditemukan.' }, { status: 404 });
  }

  const student = submission.mahasiswa;
  const studentJurusan = formatJurusanToProdi(student.jurusan);

  let logoDataUri = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'Logo_UIN_Imam_Bonjol.png');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      const base64 = buffer.toString('base64');
      logoDataUri = `data:image/png;base64,${base64}`;
    }
  } catch (err) {
    console.error('Failed to load logo for PDF generation:', err);
  }
 
  const pengajuanProposal = proposal.tanggal ;
  const tanggalProposal = new Date(pengajuanProposal);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',   
    month: 'long',   
    year: 'numeric'   
  };
  const tanggalPengajuan = tanggalProposal.toLocaleDateString('id-ID', options);

  const today = new Date();

  let skDateObj = today;
  if (proposal.tanggal) {
    try {
      const tempDate = new Date(proposal.tanggal);
      if (!isNaN(tempDate.getTime())) {
        skDateObj = tempDate;
      }
    } catch (e) {
      console.error('Error parsing Proposal tanggal:', e);
    }
  }

  const { skDate, skMonth, skYear } = getSkDateInfo(skDateObj);

  const baseNumberSk = '775';
  const defaultSkPengujiNomor = `B.${baseNumberSk}/Un.13/FST/PP.00.9/${skMonth}/${skYear}`;
  const skPengujiNomor = proposal.sk_penguji || defaultSkPengujiNomor;

  let suratUndanganNomor: string;

  try {
    const skNomorParts = skPengujiNomor.split('/');
    const basePart = skNomorParts[0];
    const match = basePart.match(/^([A-Za-z]+\.?)([\d]+)$/);

    if (match) {
      const prefix = match[1];
      const numberStr = match[2];
      const parsedInt = parseInt(numberStr);

      if (!isNaN(parsedInt)) {
        const nextInt = parsedInt + 1;
        const remainingParts = skNomorParts.slice(1).join('/');
        suratUndanganNomor = `${prefix}${nextInt}/${remainingParts}`;
      } else {
        suratUndanganNomor = `B.${parseInt(baseNumberSk) + 1}/${skNomorParts.slice(1).join('/')}`;
      }
    } else {
      suratUndanganNomor = `B.${parseInt(baseNumberSk) + 1}/Un.13/FST/PP.00.9/${skMonth}/${skYear}`;
    }
  } catch (error) {
    suratUndanganNomor = `B.${parseInt(baseNumberSk) + 1}/Un.13/FST/PP.00.9/${skMonth}/${skYear}`;
    console.error("Error parsing SK number for increment, using default fallback:", error);
  }

  const suratDate = skDate;

  if (!proposal.sk_penguji || !proposal.undangan_penguji) {
    try {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          sk_penguji: skPengujiNomor,
          undangan_penguji: suratUndanganNomor,
        },
      });
    } catch (dbError) {
      console.error('Gagal menyimpan nomor SK Penguji/Surat Undangan ke database:', dbError);
    }
  }

  const penguji1Name = proposal.penguji || 'Nama Penguji 1 (Ketua)';
  const penguji2Name = submission.pembimbing1 || 'Nama Penguji 2';  
  const penguji3Name = submission.pembimbing2 || 'Nama Penguji 3'; 

  const penguji1Dosen = await prisma.dosen.findFirst({ where: { nama: penguji1Name } });
  const penguji2Dosen = await prisma.dosen.findFirst({ where: { nama: penguji2Name } });
  const penguji3Dosen = await prisma.dosen.findFirst({ where: { nama: penguji3Name } });

  const penguji1NIP = penguji1Dosen?.nip || '';
  const penguji2NIP = penguji2Dosen?.nip || '';
  const penguji3NIP = penguji3Dosen?.nip || '';

  const seminarJadwal = proposal.jadwal_sidang;
  let seminarHariTgl = 'Hari / Tanggal Seminar';
  let seminarWaktu = 'Waktu Seminar WIB';
  let seminarTempat = 'Tempat Seminar';

  if (seminarJadwal) {
    const day = seminarJadwal.toLocaleDateString('id-ID', { weekday: 'long' });
    const date = seminarJadwal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    seminarHariTgl = `${day} / ${date}`;

    const startTime = seminarJadwal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const startHour = parseInt(startTime.substring(0, 2));
    const endHour = (startHour % 24) + 1;
    const endTime = String(endHour).padStart(2, '0') + '.00';

    seminarWaktu = `${startTime} s.d ${endTime} WIB`;
  }

  if (proposal.catatan) {
    seminarTempat = proposal.catatan;
  }

  const templateData = {
    logoDataUri,
    skPengujiNomor,
    studentName: student.nama,
    studentNIM: student.nim,
    judul: submission.judul,

  };

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        @page { size: A4; }

        @font-face {
          font-family: 'Arial MT';
          src: local('Arial MT'), local('Arial');
        }
        
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Arial MT', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.2; 
          color: #000;
        }
        
        .page-container {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
        }

        .page-break {
          page-break-before: always;
        }

        /* Utilities */
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }
        .font-bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }
        p { margin: 0 0 5px 0; }
        
        .sk-header {
          position: relative;
          height: 90px; 
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }
        .sk-logo {
          width: 85px; 
          height: 85px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          margin-top: 1px;
        }

        .sk-title-block {
          text-align: center;
          line-height: 1.15;
        }

        .sk-title-block p {
          margin-bottom: 2px;
        }

        .section-row {
          display: flex;
          margin-bottom: 5px;
          line-height: 1.3;
        }
        .section-label {
          width: 110px; 
          vertical-align: top;
          flex-shrink: 0;
        }
        .section-list {
          flex: 1;
        }
        .list-item {
          display: flex;
          text-align: justify;
          margin-bottom: 3px;
        }
        .list-label {
          width: 25px; 
          vertical-align: top;
          flex-shrink: 0;
        }
        .list-text {
          flex: 1;
        }
        
        .memutuskan {
          text-align: center;
          font-weight: bold;
          letter-spacing: 1px;
          margin: 15px 0;
          font-size: 12pt; 
        }

        .menetapkan-content {
          text-align: justify;
          text-transform: uppercase;
          margin: 5px 0 15px 0;
        }
        
        .signature-block {
          width: 40%;
          margin-left: 60%; 
          margin-top: 20px;
        }
        .sig-row {
          display: flex;
        }
        .sig-label { width: 100px; }
        .sig-colon { width: 10px; }
        .sig-value { flex: 1; }
        
        .sig-title { margin-top: 5px; margin-bottom: 0; }
        .sig-space { height: 60px;  }
        .sig-name { margin-bottom: 0; font-weight: bold; }
        .sig-nip { margin-top: 0; }

        .tembusan {
          margin-top: 20px;
        }
        .tembusan p { margin-bottom: 3px; }
        .tembusan ol { margin: 0; padding-left: 20px; }
        .tembusan li { margin-bottom: 2px; }

        .lampiran-header p {
          margin: 0;
          line-height: 1.15;
        }
        
        table.lampiran-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 11pt; 
        }
        table.lampiran-table, 
        table.lampiran-table th, 
        table.lampiran-table td {
          border: 1px solid black;
        }
       table.lampiran th {
          text-align: center;
          font-weight: bold;
          background-color: rgba(0, 0, 0, 0.1); 
          padding: 8px 6px; 
          vertical-align: middle; 
        }


        table.lampira td {
          padding: 6px;
          vertical-align: middle; 
          line-height: 1.2;
        }
        table.lampiran-table th {
          text-align: center;
        }
        table.lampiran-table td.no {
           width: 30px;
           text-align: center;
        }
          table.lampiran td.nip {
          width: 150px; 
          text-align: center;
        }
         table.lampiran-table td.jabatan {
          width: 150px; 
          text-align: center;
        }

        .judul-penelitian-block {
          margin-top: 20px;
        }
        .judul-penelitian-block .judul-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .judul-penelitian-block .judul-text {
          padding-left: 15px; 
          text-align: justify;
          text-transform: uppercase;
        }

        .kop-header {
          position: relative;
          min-height: 90px;
          border-bottom: 1px solid #000;
        }
        .kop-logo-left {
          position: absolute;
          top: 0;
          left: 0;
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .kop-text-center {
          text-align: center;
          margin-left: 90px;
          line-height: 1.2;
        }
        .kop-title {
          font-size: 14pt;
          font-weight: 700;
          margin: 0;
         
          letter-spacing: 0.5px;
        }
        .kop-fakultas {
          font-size: 16pt;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
        }
        .kop-address {
          font-size: 9pt;
          margin-top: 5px;
          margin-bottom: 0;
          line-height: 1.2;
        }
        
        hr.divider { border: none; margin: 0; }
        hr.divider.thick { border-top: 2px solid #000; margin-bottom: 1px; }
       

        table.no-border {
          width: 100%;
          border-collapse: collapse;
          border: none;
        }
        table.no-border td {
          border: none;
          padding: 1px 0;
          vertical-align: top;
        }

        .surat-info-wrapper {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin: 1px 0 5px 0; 
      }

      .surat-info-wrapper .surat-date {
        width: 30%; 
        text-align: right;
        flex-shrink: 0;
        margin-top: 3px; 
      }
        .surat-info-wrapper .surat-detail-table {
          width: 65%; 
        }

          .surat-yth {
            margin-top: 5px;
          }
          .surat-yth p { margin-bottom: 2px; }
          .surat-yth ol { 
              margin: 0 0 5px 0; 
              padding-left: 20px; 
              list-style-type: none; 
          }
          .surat-yth ol li { 
              display: flex;
              margin-bottom: 3px;
              line-height: 1.2;
          }
          .surat-yth ol li span:first-child {
           width: 50%; 
        }
       
        .surat-body {
            margin-top: 10px;
        }
        .surat-body p {
            text-align: justify;
            margin-bottom: 10px;
        }
        .surat-body p.salam {
            font-style: italic;
        }
        
        .signature-block-surat {
          width: 45%;
          margin-left: 55%;
          margin-top: 5px;
        }
        .signature-block-surat p {
          margin: 0;
        }

      </style>
    </head>
    <body>

    <div class="page-container">
        
        <div class="sk-header">
          ${logoDataUri ? `<img class="sk-logo" src="${logoDataUri}" alt="logo" />` : ''}
        </div>

        <div class="sk-title-block">
          <p >KEPUTUSAN DEKAN FAKULTAS SAINS DAN TEKNOLOGI UIN IMAM BONJOL PADANG</p>
          <p >Nomor: ${skPengujiNomor}</p>
          <br/>
          <p class="font-bold uppercase">TENTANG</p>
      
          <p >PENETAPAN TIM PENGUJI SEMINAR PROPOSAL SKRIPSI MAHASISWA</p>
          <p >PROGRAM STUDI SISTEM INFORMASI</p>
          <p class="font-bold uppercase">a.n. ${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</p>
          <br/>
          <p >DEKAN FAKULTAS SAINS DAN TEKNOLOGI UIN IMAM BONJOL PADANG</p>
        </div>

        <div class="content">
        
          <div class="section-row" style="margin-top: 15px;">
            <span class="section-label ">Menimbang :</span>
            <div class="section-list">
              <div class="list-item">
                <span class="list-label">a.</span>
                <span class="list-text">bahwa dalam rangka meningkatkan mutu penelitian Skripsi Mahasiswa Fakultas Sains dan Teknologi Universitas Islam Negeri Imam Bonjol Padang dipandang perlu ditetapkan Tim Penguji Seminar Proposal Skripsi Mahasiswa
                tersebut;</span>
              </div>
              <div class="list-item">
                <span class="list-label">b.</span>
                <span class="list-text">bahwamerekayang namanya tercantum dalam Surat Keputusan ini dipandang
                cakap dan memenuhi syarat untuk diangkat sebagai Tim Penguji Seminar Proposal Skripsi Mahasiswa Program Studi Sistem Informasi.</span>
              </div>
            </div>
          </div>
          
          <div class="section-row">
            <span class="section-label ">Mengingat :</span>
            <div class="section-list">
              <div class="list-item">
                <span class="list-label">1.</span>
                <span class="list-text">Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen (Lembaran Negara Indonesia Tahun 2005 Nomor 157, Tambahan Lembaran Negara Republik Indonesia Nomor 4586);</span>
              </div>
              <div class="list-item">
                <span class="list-label">2.</span>
                <span class="list-text">Undang-Undang Nomor 12 Tahun 2012 tentang Pendidikan Tinggi (Lembaran Negara Indonesia Tahun 2012 Nomor 158, Tambahan Lembaran Negara Republik Indonesia Nomor 5336);</span>
              </div>
              <div class="list-item">
                <span class="list-label">3.</span>
                <span class="list-text">Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara (Lembaran Negara Republik Indonesia Tahun 2014 Nomor 6, Tambahan Lembaran Negara Republik Indonesia Nomor 5494);</span>
              </div>
              <div class="list-item">
                <span class="list-label">4.</span>
                <span class="list-text">Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan (Lembaran Negara Indonesia Tahun 2005 Nomor 41, Tambahan Lembaran Negara Republik Indonesia Nomor 4496); sebagaimana telah beberapa kali diubah terakhir dengan Peraturan Pemerintah Nomor 13 Tahun 2015 tentang Perubahan Kedua atas Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan (Lembaran Negara Indonesia Tahun 2015 Nomor 45, Tambahan Lembaran Negara Republik Indonesia Nomor 5670);</span>
              </div>
              <div class="list-item">
                <span class="list-label">5.</span>
                <span class="list-text">Peraturan Pemerintah Nomor 20 Tahun 2005 tentang Alih Teknologi Kekayaan Intelektual serta Penelitian dan Pengembangan oleh Perguruan Tinggi dan Lembaga Penelitian dan Pengembangan (Lembaran Negara Republik Indonesia Tahun 2005 Nomor 43);</span>
              </div>
              <div class="list-item">
                <span class="list-label">6.</span>
                <span class="list-text">Peraturan Pemerintah Nomor 4 Tahun 2014 tentang Penyelenggaraan Pendidikan Tinggi dan Pengelolaan Perguruan Tinggi (Lembaran Negara Republik Indonesia Tahun 2014 Nomor 16, Tambahan Lembaran Negara Republik Indonesia Nomor 5500);</span>
              </div>
              <div class="list-item">
                <span class="list-label">7.</span>
                <span class="list-text">Peraturan Pemerintah Nomor 37 Tahun 2009 tentang Dosen (Lembaran Negara Republik Indonesia Tahun 2009 Nomor 76, Tambahan Lembaran Negara Republik Indonesia Nomor 5007);</span>
              </div>
              <div class="list-item">
                <span class="list-label">8.</span>
                <span class="list-text">Peraturan Presiden Nomor 35 Tahun 2017 tentang Universitas Islam Negeri Imam Bonjol Padang (Lembaran Negara Republik Indonesia Tahun 2017 Nomor 68);</span>
              </div>
              <div class="list-item">
                <span class="list-label">9.</span>
                <span class="list-text">Peraturan Menteri Agama RI Nomor 19 Tahun 2017 tentang Organisasi Tata Kerja Universitas Islam Negeri Imam Bonjol Padang (Berita Negara Republik Indonesia Tahun 2017 Nomor 1005);</span>
              </div>
              <div class="list-item">
                <span class="list-label">10.</span>
                <span class="list-text">Peraturan Menteri Agama RI Nomor 28 Tahun 2017 tentang Statuta Universitas Islam Negeri Imam Bonjol Padang;</span>
              </div>
              <div class="list-item">
                <span class="list-label">11.</span>
                <span class="list-text">Peraturan Menteri Keuangan RI Nomor 83/PMK.02/2022 tentang Standar Biaya Masukan Tahun Anggaran 2023;</span>
              </div>
              <div class="list-item">
                <span class="list-label">12.</span>
                <span class="list-text">Peraturan Menteri Pendidikan dan Kebudayaan Republik Indonesia Nomor 3 Tahun 2020 tentang Standar Nasional Pendidikan Tinggi;</span>
              </div>
              <div class="list-item">
                <span class="list-label">13.</span>
                <span class="list-text">Keputusan Menteri Agama RI Nomor 20 Tahun 2014 tentang Penunjukkan Kuasa Pengguna Anggaran dan Pelaksana Tugas Kuasa Pengguna Anggaran di Lingkungan Kementerian Agama;</span>
              </div>
              <div class="list-item">
                <span class="list-label">14.</span>
                <span class="list-text">DIPA UIN Imam Bonjol Padang Tahun 2022 Nomor 025.04.2.424050/2024 Tanggal 30 November 2024.</span>
              </div>
            </div>
          </div>
          
          <div class="section-row">
            <span class="section-label ">Memperhatikan :</span>
            <div class="section-list">
              <div class="list-item">
                <span class="list-label"></span>
                <span class="list-text">Surat Permohonan Sdr. <strong>${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</strong> tertanggal ${tanggalPengajuan} perihal Pelaksanaan Menguji Seminar Proposal Skripsi</span>
              </div>
            </div>
          </div>

          <p class="memutuskan">MEMUTUSKAN</p>

          <div class="section-row">
            <span class="section-label ">Menetapkan :</span>
            <div class="section-list">
              <p class="menetapkan-content">
               TIM PENGUJI SEMINAR PROPOSAL SKRIPSI MAHASISWA PROGRAM STUDI SISTEM INFORMASI FAKULTAS SAINS DAN TEKNOLOGI  a.n.<strong>${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</strong>.
              </p>
            </div>
          </div>
          
          <div class="section-row">
            <span class="section-label ">Pertama :</span>
            <div class="section-list">
              <span class="list-text text-justify">Mengangkat mereka yang namanya tercantum dalam lampiran Surat Keputusan ini sebagai Tim Penguji Seminar Proposal Skripsi;</span>
            </div>
          </div>
          <div class="section-row">
            <span class="section-label ">Kedua :</span>
            <div class="section-list">
              <span class="list-text text-justify">Kepada Tim Penguji Seminar Proposal dimaksud diberikan honorarium sesuai dengan peraturan yang berlaku;</span>
            </div>
          </div>
          <div class="section-row">
            <span class="section-label ">Ketiga :</span>
            <div class="section-list">
              <span class="list-text text-justify">Keputusan ini mulai berlaku sejak tanggal ditetapkan dengan ketentuan bahwa segala sesuatu akan diperbaiki kembali sebagaimana mestinya, apabila ternyata terdapat kekeliruan dalam penetapan ini.</span>
            </div>
          </div>

          <div class="signature-block">
            <div class="sig-row">
              <span class="sig-label">Ditetapkan di</span>
              <span class="sig-colon">:</span>
              <span class="sig-value">Padang</span>
            </div>
            <div class="sig-row">
              <span class="sig-label">Pada Tanggal</span>
              <span class="sig-colon">:</span>
              <span class="sig-value">${skDate}</span>
            </div>
            <p class="sig-title">Dekan,</p>
            <div class="sig-space">
              </div> 
            <p class="sig-name">Yulia</p>
            <p class="sig-nip">NIP. 198105052009012008</p>
          </div>

          <div class="tembusan">
            <p>Keputusan ini disampaikan kepada Yth;</p>
            <ol>
              <li>Rektor UIN Imam Bonjol Padang;</li>
              <li>Masing-masing Pembimbing;</li>
              <li>Mahasiswa yang bersangkutan.</li>
            </ol>
          </div>

        </div>
      </div>

      <div class="page-container page-break">
        <div class="lampiran-header">
          <p class="text-left uppercase font-bold">LAMPIRAN:</p>
          <p class="text-left ">KEPUTUSAN DEKAN FAKULTAS SAINS DAN TEKNOLOGI</p>
          <p class="text-left ">UNIVERSITAS ISLAM NEGERI IMAM BONJOL PADANG</p>
          <p class="text-left ">NOMOR : ${skPengujiNomor}</p>
          <p class="text-left ">TANGGAL: ${skDate}</p>
        </div>

        <div style="margin-top: 20px;">
          <p class="text-center ">TIM PENGUJI SEMINAR PROPOSAL SKRIPSI MAHASISWA</p>
          <p class="text-center ">PROGRAM STUDI SISTEM INFORMASI</p>
          <p class="text-center font-bold uppercase">a.n. ${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</p>
        </div>
        
        <table class="lampiran-table">
          <thead>
           <tr>
              <th style="background-color: rgba(0, 0, 0, 0.1);">No.</th>
              <th style = "background-color: rgba(0, 0, 0, 0.1);">Nama </th>
              <th style="background-color: rgba(0, 0, 0, 0.1);">NIP</th>
              <th style="background-color: rgba(0, 0, 0, 0.1);">Jabatan Dalam Tim</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="no">1.</td>
              <td>${penguji1Name}</td>
              <td>${penguji1NIP}</td>
              <td class="jabatan">Ketua/Penguji 1</td>
            </tr>
            <tr>
              <td class="no">2.</td>
              <td>${penguji2Name}</td>
              <td>${penguji2NIP}</td>
              <td class="jabatan">Penguji 2</td>
            </tr>
            <tr>
              <td class="no">3.</td>
              <td>${penguji3Name}</td>
              <td>${penguji3NIP}</td>
              <td class="jabatan">Penguji 3</td>
            </tr>
          </tbody>
        </table>

        <div class="judul-penelitian-block">
          <p class="judul-label">JUDUL PENELITIAN:</p>
          <p class="judul-text">"${submission.judul}"</p>
        </div>
        
        <div class="signature-block" style="margin-top: 30px;">
          <div class="sig-row">
            <span class="sig-label">Ditetapkan di</span>
            <span class="sig-colon">:</span>
            <span class="sig-value">Padang</span>
          </div>
          <div class="sig-row">
            <span class="sig-label">Pada Tanggal</span>
            <span class="sig-colon">:</span>
            <span class="sig-value">${skDate}</span>
          </div>
          <p class="sig-title">Dekan,</p>
          <div class="sig-space">
            </div> 
          <p class="sig-name">Yulia</p>
          <p class="sig-nip">NIP. 198105052009012008</p>
        </div>

      </div>

    <div class="page-container page-break">
       <div class="kop-header">
          ${logoDataUri ? `<img class="kop-logo-left" src="${logoDataUri}" alt="logo" />` : ''}
          <div class="kop-text-center">
            <p class="kop-title">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
            <p class="kop-title">UNIVERSITAS ISLAM NEGERI (UIN) IMAM BONJOL PADANG</p>
            <p class="kop-fakultas">FAKULTAS SAINS DAN TEKNOLOGI</p>
            <p class="kop-address">
              Alamat: Sungai Bangek Kelurahan Balai Gadang Kecamatan Koto Tangah Kota Padang
              <br/>
              Website: https://saintek.uinib.ac.id - e-mail: admin-fst@uinib.ac.id
            </p>
          </div>
        </div>
        <hr class="divider thick" />

         <div class="surat-info-wrapper">
          <table class="no-border surat-detail-table">
            <tbody>
              <tr>
                <td style="width: 80px;">Nomor</td>
                <td style="width: 10px;">:</td>
                <td>${suratUndanganNomor}</td>  </tr>
              <tr>
                <td>Lamp</td>
                <td>:</td>
                <td>1 (satu) berkas</td>
              </tr>
              <tr>
                <td>Hal</td>
                <td>:</td>
                <td class="font-bold">Undangan Menguji Seminar Proposal</td> 
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td class="font-bold">a.n. ${student?.nama?.toUpperCase() || ''}</td> 
              </tr>

            </tbody>
          </table>
            
          <p class="surat-date">Padang, ${suratDate}</p>

      </div>

        <div class="surat-yth">
            <p>Kepada Yth.</p>
            <p>Bapak/Ibu/Sdr/i</p>
            <ol>
                <li>
                    <span>1. ${penguji1Name}  </span>
                    <span>(Penguji 1/Ketua)</span>
                </li>
                <li>
                    <span>2. ${penguji2Name}</span>
                    <span>(Penguji 2)</span>
                </li>
                <li>
                    <span>3. ${penguji3Name}</span>
                    <span >(Penguji 3)</span>
                </li>
            </ol>
          <p>Di-</p>
          <p style="padding-left: 20px;">tempat</p>
        </div>

        <div class="surat-body">
            <p class="salam"><em>Assalamu'alaikum Wr.Wb.</em></p>
            <p>
                Bersama ini dengan hormat disampaikan, kepada Bapak/Ibu/Saudara bahwa seminar proposal mahasiswa :
            </p>

            <table class="no-border" style="width: 100%; margin-left: 20px; margin-top: 3px;">
                <tbody>
                    <tr>
                        <td style="width: 130px;">Nama</td>
                        <td style="width: 10px;">:</td>
                        <td class="font-bold uppercase">${templateData.studentName}</td>
                    </tr>
                    <tr>
                        <td>NIM</td>
                        <td>:</td>
                        <td class="font">${templateData.studentNIM}</td>
                    </tr>
                    <tr>
                        <td>Program Studi</td>
                        <td>:</td>
                        <td class="font">${studentJurusan}</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top;">Judul Penelitian</td>
                        <td style="vertical-align: top;">:</td>
                        <td class="text-justify">"${templateData.judul}"</td>
                    </tr>
                  </body>
            </table><br/>

                <p class= "margin-top:3px">Insyaallah akan diadakan pada :</p>
            <table class="no-border" style="width: 100%; margin-left: 20px; margin-top: 3px;">
                  <tbody>
                    <tr>
                        <td>Hari/Tanggal</td>
                        <td>:</td>
                        <td class="font">${seminarHariTgl}</td>
                    </tr>
                    <tr>
                        <td>Waktu</td>
                        <td>:</td>
                        <td class="font">${seminarWaktu}</td>
                    </tr>
                    <tr>
                        <td>Tempat</td>
                        <td>:</td>
                        <td class="font">${seminarTempat}</td>
                    </tr>
                </tbody>
            </table>

            <p style="margin-top: 3 px;">Sehubungan dengan itu kami harapkan kesedian Bapak/Ibu/Saudara yang nama-namanya tercantumdi bawah ini sebagai Tim Seminar Proposal sesuai jadwal di atas.</p>

           <table class="lampiran-table">
          <thead>
            <tr>
              <th style="background-color: rgba(0, 0, 0, 0.1);">No.</th>
              <th style = "background-color: rgba(0, 0, 0, 0.1);">Nama </th>
              <th style="background-color: rgba(0, 0, 0, 0.1);">NIP</th>
              <th style="background-color: rgba(0, 0, 0, 0.1);">Jabatan Dalam Tim</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="no">1.</td>
              <td>${penguji1Name}</td>
              <td>${penguji1NIP}</td>
              <td class="jabatan">Ketua/Penguji 1</td>
            </tr>
            <tr>
              <td class="no">2.</td>
              <td>${penguji2Name}</td>
              <td>${penguji2NIP}</td>
              <td class="jabatan">Penguji 2</td>
            </tr>
            <tr>
              <td class="no">3.</td>
              <td>${penguji3Name}</td>
              <td>${penguji3NIP}</td>
              <td class="jabatan">Penguji 3</td>
            </tr>
          </tbody>
        </table>
            
         <p style="margin-top: 10px;">Demikianlah disampaikan, atas kesediaan dan kerjasamanya kami ucapkan terima kasih.</p>
          <p class="salam"><em>Wassalamu’alaikum Wr.Wb.</em></p>
        </div>

        <div class="signature-block-surat">
          <p>An. Dekan</p>
          <p>Wakil Dekan Bidang</p>
          <p>Akademik dan Kemahasiswaan</p>
          <div class="sig-space">
            </div> 
          <p class="sig-name">Subhan Ajrin Sudirman</p>
          <p class="sig-nip">NIP. 198109282011011006</p>
        </div>

        <div class="tembusan" style="margin-top: 15px;">
            <p ">Tembusan Yth;</p>
            <p>Dekan Fakultas Sains dan Teknologi UIN Imam Bonjol Padang</p>
        </div>
    </div>

    </body>
    </html>`;

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SK_Penguji_Proposal_${student.nim}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (browser) await browser.close();
    return NextResponse.json({
      error: 'Failed to generate PDF.',
      details: (error as Error).message
    }, { status: 500 });
  }
}