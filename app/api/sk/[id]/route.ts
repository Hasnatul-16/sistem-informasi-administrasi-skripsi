import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const submissionId = Number(id);
  if (isNaN(submissionId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const submission = await prisma.judul.findUnique({
    where: { id: submissionId },
    include: { mahasiswa: true },
  })
  if (!submission || submission.status !== 'DISETUJUI') {
    return NextResponse.json({ error: 'SK untuk pengajuan ini tidak ditemukan atau belum disetujui.' }, { status: 404 });
  }

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

  const student = submission.mahasiswa;
  const pembimbing1 =  submission.pembimbing1 || '';
  const pembimbing2 =  submission.pembimbing2 || '';
  const today = new Date();

  const skDateObj = today;

  const skDate = skDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const skMonth = String(skDateObj.getMonth() + 1).padStart(2, '0');
  const skYear = skDateObj.getFullYear();
  const defaultSkNomor = `B.811/Un.13/FST/PP.00.9/${skMonth}/${skYear}`;
  const skNomor = submission.  sk_pembimbing   || defaultSkNomor;

  console.log('SK Date:', {

    parsed: skDateObj,
    formatted: skDate
  });
  console.log('SK Number:', {
    raw: submission.  sk_pembimbing  ,
    fallback: defaultSkNomor,
    final: skNomor
  });


  let suratNomor: string;

  try {
    const skNomorParts = skNomor.split('/');
    const basePart = skNomorParts[0]; 
    const match = basePart.match(/^([A-Za-z]+\.?)([\d]+)$/);

    if (match) {
      const prefix = match[1]; 
      const numberStr = match[2];
      const parsedInt = parseInt(numberStr);

      if (!isNaN(parsedInt)) {
        const nextInt = parsedInt + 1; // 812
        const remainingParts = skNomorParts.slice(1).join('/');
        suratNomor = `${prefix}${nextInt}/${remainingParts}`; 
      } else {
        suratNomor = `B.${811 + 1}/${skNomorParts.slice(1).join('/')}`;
      }
    } else {

      suratNomor = `B.${811 + 1}/Un.13/FST/PP.00.9/${skMonth}/${skYear}`;
    }

  } catch (error) {
    suratNomor = `B.${811 + 1}/Un.13/FST/PP.00.9/${skMonth}/${skYear}`;
    console.error("Error parsing SK number for increment, using default fallback:", error);
  }


  const suratDate = skDate;
  console.log('Surat Number:', suratNomor);
 
  try {
    await prisma.judul.update({
      where: { id: submissionId },
      data: {
        no_undangan: suratNomor,
      },
    });
    console.log(`SK Pembimbing (${suratNomor}) berhasil disimpan ke database.`);
  } catch (dbError) {
    console.error('Gagal menyimpan SK Pembimbing ke database:', dbError);
  }
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        /* Hapus margin dari @page agar puppeteer bisa mengontrol penuh */
        @page { size: A4; }

        @font-face {
          font-family: 'Arial MT';
          src: local('Arial MT'), local('Arial');
        }
        
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Arial MT', Arial, sans-serif;
          font-size: 11pt; /* Diubah dari 12pt ke 11pt */
          line-height: 1.2; /* Disesuaikan agar lebih rapat seperti PDF */
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
        
        /* === Halaman 1 & 2: SK === */
        
        .sk-header {
          position: relative;
          height: 90px; /* Ditingkatkan untuk logo yang lebih besar */
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }
        .sk-logo {
          width: 85px; /* Ukuran logo diperbesar */
          height: 85px;
          object-fit: contain;
          display: block;
          margin: 0 auto; /* Center horizontally */
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
          width: 110px; /* Cukup untuk "Memperhatikan" */
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
          width: 25px; /* Cukup untuk "14." */
          vertical-align: top;
          flex-shrink: 0;
        }
        .list-text {
          flex: 1;
        }
        
        .memutuskan {
          text-align: center;
          font-weight: bold;
          letter-spacing: 1px; /* Disesuaikan sedikit */
          margin: 15px 0;
          font-size: 12pt; /* Lebih besar sedikit */
        }

        .menetapkan-content {
          text-align: justify;
          text-transform: uppercase;
          margin: 5px 0 15px 0;
        }
        
        .signature-block {
          width: 40%;
          margin-left: 60%; /* Posisikan ke kanan */
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
          margin-top: 30px;
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
          margin: 20px 0;
          font-size: 11pt; /* Pastikan ukuran font tabel konsisten */
        }
        table.lampiran-table, 
        table.lampiran-table th, 
        table.lampiran-table td {
          border: 1px solid black;
        }
        table.lampiran-table th, 
        table.lampiran-table td {
          padding: 6px; /* Sedikit lebih kecil padding */
          vertical-align: top;
        }
        table.lampiran-table th {
          text-align: center;
        }
        table.lampiran-table td.no {
          width: 30px;
          text-align: center;
        }
         table.lampiran-table td.jabatan {
          width: 120px;
        }
        
        .judul-penelitian-block {
          margin-top: 20px;
        }
        .judul-penelitian-block .judul-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .judul-penelitian-block .judul-text {
          padding-left: 15px; /* Sesuai PDF */
          text-align: justify;
          text-transform: uppercase;
        }

        /* === Halaman 4: Surat Pengantar === */
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
          margin-left: 90px; /* Ruang untuk logo */
          line-height: 1.2;
        }
        .kop-title {
          font-size: 14pt;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
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
        hr.divider.thick { border-top: 3px solid #000; margin-bottom: 1px; }
        hr.divider.thin { border-top: 1px solid #000; }

        table.no-border {
          width: 100%;
          border-collapse: collapse;
          border: none;
        }
        table.no-border td {
          border: none;
          padding: 1px 0; /* Lebih rapat */
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
          margin-top: 15px;
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
          margin-top: 15px;
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
          margin-top: 20px;
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
          <p >Nomor: ${skNomor}</p>
          <br/>
          <p class="font-bold uppercase">TENTANG</p>
          <br/>
          <p >PENETAPAN PEMBIMBING SKRIPSI MAHASISWA</p>
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
                <span class="list-text">bahwa dalam rangka meningkatkan mutu penelitian Skripsi Mahasiswa Fakultas Sains dan Teknologi Universitas Islam Negeri Imam Bonjol Padang dipandang perlu ditetapkan Pembimbing Mahasiswa tersebut;</span>
              </div>
              <div class="list-item">
                <span class="list-label">b.</span>
                <span class="list-text">bahwa mereka yang namanya tercantum dalam Surat Keputusan ini dipandang cakap dan memenuhi syarat untuk diangkat sebagai Pembimbing Skripsi Mahasiswa Program Studi Sistem Informasi.</span>
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
                <span class="list-text">Surat Permohonan Sdr. <strong>${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</strong> perihal Penetapan Pembimbing Skripsi Mahasiswa Program Studi Sistem Informasi.</span>
              </div>
            </div>
          </div>

          <p class="memutuskan">MEMUTUSKAN</p>

          <div class="section-row">
            <span class="section-label ">Menetapkan :</span>
            <div class="section-list">
              <p class="menetapkan-content">
                PENUNJUKAN PEMBIMBING SKRIPSI MAHASISWA PROGRAM STUDI SISTEM INFORMASI FAKULTAS SAINS DAN TEKNOLOGI a.n.<strong>${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</strong>.
              </p>
            </div>
          </div>
          
          <div class="section-row">
            <span class="section-label ">Pertama :</span>
            <div class="section-list">
              <span class="list-text text-justify">Mengangkat mereka yang namanya tercantum dalam lampiran Surat Keputusan ini sebagai Pembimbing Skripsi Mahasiswa Program Studi Sistem Informasi;</span>
            </div>
          </div>
          <div class="section-row">
            <span class="section-label ">Kedua :</span>
            <div class="section-list">
              <span class="list-text text-justify">Kepada Pembimbing Skripsi dimaksud diberikan honorarium sesuai dengan peraturan yang berlaku;</span>
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
            <p style = "margin-top : 25px; font-size: 15px "> $ </p> 
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
          <p class="text-left ">NOMOR : ${skNomor}</p>
          <p class="text-left ">TANGGAL: ${skDate}</p>
        </div>

        <div style="margin-top: 20px;">
          <p class="text-center ">DAFTAR NAMA PEMBIMBING SKRIPSI MAHASISWA</p>
          <p class="text-center ">PROGRAM STUDI SISTEM INFORMASI</p>
          <p class="text-center font-bold uppercase">a.n. ${student?.nama?.toUpperCase() || ''}, NIM. ${student?.nim || ''}</p>
        </div>
        
        <table class="lampiran-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Nama Pembimbing</th>
              <th>Jabatan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="no">1.</td>
              <td>${pembimbing1}</td>
              <td class="jabatan">Pembimbing 1</td>
            </tr>
            <tr>
              <td class="no">2.</td>
              <td>${pembimbing2}</td>
              <td class="jabatan">Pembimbing 2</td>
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
          <p style = "margin-top : 25px; font-size: 15px "> $ </p> 
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
        <hr class="divider thin" />
        
      <div class="surat-info-wrapper">

          <table class="no-border surat-detail-table">
          <tbody>
            <tr>
              <td style="width: 80px;">Nomor</td>
              <td style="width: 10px;">:</td>
              <td>${suratNomor}</td>
            </tr>
            <tr>
              <td>Lamp</td>
              <td>:</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Hal</td>
              <td>:</td>
              <td class="font-bold">Kesediaan Membimbing Skripsi Mahasiswa</td>
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
              <span>1. ${pembimbing1}</span>
              <span>(Pembimbing 1)</span>
            </li>
            <li>
              <span>2. ${pembimbing2}</span>
              <span>(Pembimbing 2)</span>
            </li>
          </ol>
          <p>Di-</p>
          <p style="padding-left: 20px;">tempat</p>
        </div>

        <div class="surat-body">
          <p class="salam"><em>Assalamu'alaikum Wr.Wb.</em></p>
          <p>
            Bersama ini dengan hormat, disampaikan Surat Keputusan Dekan Fakultas Sains dan Teknologi
            Universitas Islam Negeri Imam Bonjol Padang  No.785/Un.13/FST/PP.00.9/05/2024 Tentang
            Penetapan Pembimbing Skripsi Mahasiswa Program Studi Sistem Informasi pada Fakultas Sains
            dan Teknologi Universitas Islam Negeri Imam Bonjol Padang Tahun Akademik ${skYear}/${parseInt(skYear.toString()) + 1}.
          </p>
          <p>
            Atas hal tersebut di atas kiranya Bapak/Ibu berkenan membimbing penelitian Skripsi mahasiswa
            berikut:
          </p>
          
          <table class="no-border" style="width: 100%; margin-left: 20px;">
            <tbody>
              <tr>
                <td style="width: 130px;">Nama</td>
                <td style="width: 10px;">:</td>
                <td class="font-bold uppercase">${student?.nama || ''}</td>
              </tr>
              <tr>
                <td>NIM</td>
                <td>:</td>
                <td class="font-bold">${student?.nim || ''}</td>
              </tr>
              <tr>
                <td style="vertical-align: top;">Judul Penelitian</td>
                <td style="vertical-align: top;">:</td>
                <td class="text-justify">"${submission.judul}"</td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 10px;">Demikianlah disampaikan, atas kesediaan dan kerjasamanya kami ucapkan terima kasih.</p>
          <p class="salam"><em>Wassalam,</em></p>
        </div>

        <div class="signature-block-surat">
          <p>An. Dekan</p>
          <p>Wakil Dekan Bidang</p>
          <p>Akademik dan Kemahasiswaan</p>
          <div class="sig-space">
          <p style = "margin-top : 25px; font-size: 15px "> # </p> 
            </div> 
          <p class="sig-name">Subhan Ajrin Sudirman</p>
          <p class="sig-nip">NIP. 198109282011011006</p>
        </div>

        <div class="tembusan" style="margin-top: 20px;">
          <p">Tembusan Yth:</p>
          <p>Dekan Fakultas Sains dan Teknologi UIN Imam Bonjol Padang</p>
        </div>

        
        
      </div>

    </body>
  </html>`;

  let browser: Browser | null = null;
  try {
    try {
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (launchErr) {
      console.warn('Puppeteer default launch failed, attempting local Chrome executable...', String(launchErr));
      const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      try {
        browser = await puppeteer.launch({ executablePath: chromePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      } catch (localErr) {
        console.error('Failed to launch local Chrome as fallback:', String(localErr));
        throw launchErr;
      }
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1.83cm',
        right: '2cm',
        bottom: '1.83cm',
        left: '2cm',
      },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SK-${student?.nim || submissionId}.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Gagal membuat PDF. Lihat log server untuk detail.' }, { status: 500 });
  } finally {
    if (browser) {
      try { await browser.close(); } catch { }
    }
  }
}