import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getBrowser } from '@/lib/puppeteer';
import { Jurusan, Proposal } from '@prisma/client';

interface ProposalWithIncludes extends Proposal {
  judul: {
    judul: string;
    mahasiswa: {
      nama: string;
      nim: string;
      jurusan: Jurusan;
    };
    pembimbing1: string | null;
    pembimbing2: string | null;
  } | null;
}

interface TemplateData {
  logoDataUri: string;
  studentName: string;
  studentNIM: string;
  judul: string;
  seminarHari: string;
  seminarTanggal: string;
  seminarWaktu: string;
  seminarTempat: string;
  penguji1Name: string;
  penguji2Name: string;
  penguji3Name: string;
  penguji1NIP: string;
  penguji2NIP: string;
  penguji3NIP: string;
  skDate: string;
  studentJurusan: string;

  penguji4Name: string;
  penguji4NIP: string;
}

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

const loadLogo = (): string => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'Logo_UIN_Imam_Bonjol.png');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      const base64 = buffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    }
  } catch (err) {
    console.error('Failed to load logo for PDF generation:', err);
  }
  return '';
};

const fetchProposalData = async (proposalId: number) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      judul: {
        include: { mahasiswa: true },
      },
    },
  });

  if (!proposal || proposal.status !== 'DISETUJUI' || !proposal.judul) {
    throw new Error('Proposal tidak ditemukan atau belum disetujui.');
  }

  return proposal;
};

const prepareTemplateData = async (proposal: ProposalWithIncludes) => {

  const judul = proposal.judul!;
  const student = judul.mahasiswa;
  const studentJurusan = formatJurusanToProdi(student.jurusan);
  const logoDataUri = loadLogo();

  let skDateObj = new Date();
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

  const { skDate } = getSkDateInfo(skDateObj);

  const penguji1Name = proposal.penguji || 'Nama Penguji 1 (Ketua)';
  const penguji2Name = judul.pembimbing1 || 'Nama Penguji 2';
  const penguji3Name = judul.pembimbing2 || 'Nama Penguji 3';

  const penguji1Dosen = await prisma.dosen.findFirst({ where: { nama: penguji1Name } });
  const penguji2Dosen = await prisma.dosen.findFirst({ where: { nama: penguji2Name } });
  const penguji3Dosen = await prisma.dosen.findFirst({ where: { nama: penguji3Name } });

  const penguji1NIP = penguji1Dosen?.nip || '';
  const penguji2NIP = penguji2Dosen?.nip || '';
  const penguji3NIP = penguji3Dosen?.nip || '';

  const seminarJadwal = proposal.jadwal_sidang;
  let seminarHari = 'Hari Seminar';
  let seminarTanggal = 'Tanggal Seminar';
  let seminarWaktu = 'Waktu Seminar WIB';
  let seminarTempat = 'Tempat Seminar';

  if (seminarJadwal) {
    seminarHari = seminarJadwal.toLocaleDateString('id-ID', { weekday: 'long' });
    seminarTanggal = seminarJadwal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const startTime = seminarJadwal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const startHour = parseInt(startTime.substring(0, 2));
    const endHour = (startHour % 24) + 1;
    const endTime = String(endHour).padStart(2, '0') + '.00';

    seminarWaktu = `${startTime} s.d ${endTime} WIB`;
  }

  if (proposal.catatan) {
    seminarTempat = proposal.catatan;
  }

  const penguji4Name = 'H. Teguh B. M.T.I';

  const penguji4Dosen = await prisma.dosen.findFirst({ where: { nama: penguji4Name } });
  const penguji4NIP = penguji4Dosen?.nip || 'NIP Penguji 4';

  return {
    logoDataUri,
    studentName: student.nama,
    studentNIM: student.nim,
    judul: judul.judul,
    seminarHari,
    seminarTanggal,
    seminarWaktu,
    seminarTempat,
    penguji1Name,
    penguji2Name,
    penguji3Name,
    penguji1NIP,
    penguji2NIP,
    penguji3NIP,
    skDate,
    studentJurusan,

    penguji4Name,
    penguji4NIP,
  };
};

const generateHTML = (templateData: TemplateData): string => {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    @page { size: A4; margin: 25mm 25mm 25mm 30mm; }
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
      position: relative;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }
    .font-bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }
    p { margin: 0 0 5px 0; }
    /* Kop Surat Styles */
    .kop-header {
      position: relative;
      min-height: 90px;
      border-bottom: 3px solid #000;
      margin-bottom: 15px;
      padding-bottom: 8px;
    }
    .kop-logo-left {
      position: absolute;
      top: 0;
      left: 0;
      width: 85px;
      height: 85px;
      object-fit: contain;
    }
    .kop-text-center {
      text-align: center;
      margin-left: 100px;
      margin-right: 10px;
      line-height: 1.2;
    }
    .kop-title {
      font-family: 'Arial MT', Arial, sans-serif;
      font-size: 11pt;
      font-weight: 700;
      margin: 0;
    }
    .kop-fakultas {
      font-family: 'Arial MT', Arial, sans-serif;
      font-size: 14pt;
      font-weight: 700;
      margin: 2px 0;
      text-transform: uppercase;
    }
    .kop-address {
      font-family: 'Arial MT', Arial, sans-serif;
      font-size: 9pt;
      margin-top: 6px;
      margin-bottom: 0;
      line-height: 1.3;
    }
    /* Title Styles */
    .title-block {
      text-align: center;
      line-height: 1.3;
      margin-bottom: 20px;
      title-block
    }
    .title-block p {
      margin: 0;
      font-size: 12pt;
      font-weight: 700;
    }
    .title-main {
      margin-bottom: 8px;
    }
    .content-section {
      margin-bottom: 25px;
    }
    /* Info Table Styles */
    table.info-table {
      width: 85%;
      border-collapse: collapse;
      margin: 15px 0 15px 50px;
    }
    table.info-table td {
      padding: 5px 0;
      vertical-align: top;
      font-size: 12pt;
    }
    table.info-table .label {
      width: 120px;
      font-weight: normal;
      padding-left: 10px;
    }
    table.info-table .colon {
      width: 15px;
      text-align: center;
    }
    table.info-table .value {
      text-align: left;
    }
    /* Radio/Checkbox Styles */
    .decision-options {
      margin: 10px 0 10px 60px;
    }
    .radio-option {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .checkbox-box {
      width: 18px;
      height: 18px;
      border: 2px solid #000;
      margin-right: 20px;
      display: inline-block;
      box-sizing: border-box;
      flex-shrink: 0;
      background-color: #fff;
    }
    .decision-text {
      font-size: 12pt;
    }
    /* Closing Statement */
    .closing-statement {
      margin: 5px 0 5px 0;
      text-align: justify;
    }
    /* Signature Styles */
    .signature-section {
      margin-top: 10px;
      margin-left: 50px;
    }
    .signature-title {
      text-align: center;
      font-size: 11pt;
      margin-bottom: 25px;
    }
    .signature-grid {
      display: flex;
      width: 100%;
      justify-content: space-between;
    }
    .signature-column {
      width: 43%;
      display: flex;
      flex-direction: column;
    }
    .signature-item {
      text-align: center;
      margin-bottom: 30px;
    }
    .signature-role {
      text-align: left;
      font-size: 12pt;
      margin-bottom: 70px;
    }
    .signature-name {
      text-align: left;
      font-size: 12pt;
      margin-bottom: 2px;
    }
    .signature-nip {
      text-align: left;
      font-size: 11pt;
      margin: 0;
    }
    /* Page Break */
    .page-break {
      page-break-before: always;
    }
    /* Attendance Table Styles */
    table.attendance-table {
      width: 90%;
      border-collapse: collapse;
      margin: 20px auto;
      font-size: 12pt;
    }
    table.attendance-table th {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      vertical-align: middle;
      font-weight: bold;
    }
    table.attendance-table td {
      border: 1px solid #000;
      padding: 20px;
      text-align: center;
      vertical-align: middle;
    }
    .attendance-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 2px 0;
      text-transform: uppercase;
    }
    /* Revision Table Styles */
    table.revision-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12pt;
    }
    table.revision-table th, table.revision-table td {
      border: 1px solid #000;
      padding: 8px;
      vertical-align: top;
      text-align: left;
    }
    table.revision-table th {

    }
    table.revision-table tbody td {
      padding: 180px 8px;
    }
    .revision-title {
      text-align: center;
      font-size: 12pt;
      
      margin: 20px 0;
    
      font-weight: bold;
    
    }
    /* Third Page Signature Styles */
    .third-page-signatures {
      margin-top: 20px;
      text-align: right;
      font-size: 12pt;
    }
    .third-page-signatures .date-line {
      margin-bottom: 10px;
    }
    .third-page-signatures .signature-grid {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
    .third-page-signatures .signature-item {
      text-align: center;
      margin: 0 10px;
    }
    .third-page-signatures .signature-role {
      margin-bottom: 50px;
      font-size: 12pt;
    }
    .third-page-signatures .signature-name {
      margin-bottom: 2px;
      font-size: 12pt;
    }
    .third-page-signatures .signature-nip {
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Kop Surat -->
    <div class="kop-header">
      ${templateData.logoDataUri ? `<img class="kop-logo-left" src="${templateData.logoDataUri}" alt="logo" />` : ''}
      <div class="kop-text-center">
        <p class="kop-title">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
        <p class="kop-title">UNIVERSITAS ISLAM NEGERI (UIN) IMAM BONJOL PADANG</p>
        <p class="kop-fakultas">FAKULTAS SAINS DAN TEKNOLOGI</p>
        <p class="kop-address">
          Alamat: Sungai Bangek Kelurahan Balai Gadang Kecamatan Koto Tangah Kota Padang<br/>
          Website: https://saintek.uinib.ac.id - e-mail: admin-fst@uinib.ac.id
        </p>
      </div>
    </div>
    <!-- Title -->
    <div class="title-block">
      <p class="title-main uppercase">BERITA ACARA PELAKSANAAN</p>
      <p class="uppercase">SEMINAR PROPOSAL SKRIPSI</p>
    </div>
    <!-- Content -->
    <div class="content-section">
      <p class="text-justify" style="text-indent: 50px; margin-bottom: 20px;">
        Pada hari ini <strong>${templateData.seminarHari}</strong> tanggal ${templateData.seminarTanggal} telah dilaksanakan Seminar Proposal Skripsi di ${templateData.seminarTempat} oleh mahasiswa Program Studi ${templateData.studentJurusan} atas nama:
      </p>
      <!-- Student Information Table -->
      <table class="info-table">
        <tr>
          <td class="label">Nama</td>
          <td class="colon">:</td>
          <td class="value font uppercase">${templateData.studentName}</td>
        </tr>
        <tr>
          <td class="label">NIM</td>
          <td class="colon">:</td>
          <td class="value">${templateData.studentNIM}</td>
        </tr>
        <tr>
          <td class="label" style="vertical-align: top;">Judul</td>
          <td class="colon" style="vertical-align: top;">:</td>
          <td class="value text-justify" style="line-height: 1.4;">${templateData.judul}</td>
        </tr>
      </table>
      <p style="margin: 25px 0 15px 0;">dinyatakan:</p>
      <!-- Decision Options -->
      <div class="decision-options">
        <div class="radio-option">
          <div class="checkbox-box"></div>
          <span class="decision-text">Lulus</span>
        </div>
        <div class="radio-option">
          <div class="checkbox-box"></div>
          <span class="decision-text">Tidak Lulus</span>
        </div>
        <div class="radio-option">
          <div class="checkbox-box"></div>
          <span class="decision-text">Sidang Ulang</span>
        </div>
      </div>
      <p class="closing-statement">dengan catatan terlampir.</p>
      <p style="margin-top: 20px;">Demikian berita acara ini dibuat untuk dilaksanakan.</p>
    </div>
    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-title">Tim Penguji</div>
      <div class="signature-grid">
        <div class="signature-column">
          <div class="signature-item">
            <div class="signature-role">Ketua Majelis/ Penguji 1</div>
            <div class="signature-name">(.......................................)</div>
            <div class="signature-nip">NIP.</div>
          </div>
          <div class="signature-item">
            <div class="signature-role">Penguji 3</div>
            <div class="signature-name">(.......................................)</div>
            <div class="signature-nip">NIP.</div>
          </div>
        </div>
        <div class="signature-column">
          <div class="signature-item">
            <div class="signature-role">Penguji 2</div>
            <div class="signature-name">(.......................................)</div>
            <div class="signature-nip">NIP.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Break -->
    <div class="page-break"></div>

    <!-- Second Page -->
    <div class="page-container">
      <!-- Kop Surat -->
      <div class="kop-header">
        ${templateData.logoDataUri ? `<img class="kop-logo-left" src="${templateData.logoDataUri}" alt="logo" />` : ''}
        <div class="kop-text-center">
          <p class="kop-title">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
          <p class="kop-title">UNIVERSITAS ISLAM NEGERI (UIN) IMAM BONJOL PADANG</p>
          <p class="kop-fakultas">FAKULTAS SAINS DAN TEKNOLOGI</p>
          <p class="kop-address">
            Alamat: Sungai Bangek Kelurahan Balai Gadang Kecamatan Koto Tangah Kota Padang<br/>
            Website: https://saintek.uinib.ac.id - e-mail: admin-fst@uinib.ac.id
          </p>
        </div>
      </div>

      <!-- Title -->
      <div class="revision-title">
       <p class="title-main uppercase">DAFTAR HADIR TIM PENGUJI</p>
       <p class="uppercase">SEMINAR PROPOSAL SKRIPSI</p>
        
      </div>

      <!-- Student Information -->
      <table class="info-table">
        <tr>
          <td class="label">Nama</td>
          <td class="colon">:</td>
          <td class="value font uppercase">${templateData.studentName}</td>
        </tr>
        <tr>
          <td class="label">NIM</td>
          <td class="colon">:</td>
          <td class="value">${templateData.studentNIM}</td>
        </tr>
        <tr>
          <td class="label" style="vertical-align: top;">Judul</td>
          <td class="colon" style="vertical-align: top;">:</td>
          <td class="value text-justify" style="line-height: 1.4;">${templateData.judul}</td>
        </tr>
      </table>

      <!-- Attendance Table -->
      <table class="attendance-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama/NIP</th>
            <th>Jabatan</th>
            <th>Tanda Tangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${templateData.penguji1Name}</td>
            <td>Ketua Majelis/Penguji 1</td>
            <td></td>
          </tr>
          <tr>
            <td>2</td>
            <td>${templateData.penguji2Name}</td>
            <td>Penguji 2</td>
            <td></td>
          </tr>
          <tr>
            <td>3</td>
            <td>${templateData.penguji3Name}</td>
            <td>Penguji 3</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <!-- Signature Section -->
      <div class="third-page-signatures">
        <div class="signature-grid">
          <div class="signature-item">
            <div class="signature-role">Ketua Majelis</div>
            <div class="signature-name">(.......................................)</div>
            <div class="signature-nip">NIP.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Break -->
    <div class="page-break"></div>

    <!-- Third Page -->
    <div class="page-container">
      <!-- Kop Surat -->
      <div class="kop-header">
        ${templateData.logoDataUri ? `<img class="kop-logo-left" src="${templateData.logoDataUri}" alt="logo" />` : ''}
        <div class="kop-text-center">
          <p class="kop-title">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
          <p class="kop-title">UNIVERSITAS ISLAM NEGERI (UIN) IMAM BONJOL PADANG</p>
          <p class="kop-fakultas">FAKULTAS SAINS DAN TEKNOLOGI</p>
          <p class="kop-address">
            Alamat: Sungai Bangek Kelurahan Balai Gadang Kecamatan Koto Tangah Kota Padang<br/>
            Website: https://saintek.uinib.ac.id - e-mail: admin-fst@uinib.ac.id
          </p>
        </div>
      </div>

      <!-- Title -->
      <div class="revision-title">
       <p class="title-main uppercase">LAMPIRAN BERITA ACARA UJIAN</p>
      <p class="uppercase">SEMINAR PROPOSAL SKRIPSI</p>
      </div>

      <!-- Student Information -->
      <table class="info-table">
        <tr>
          <td class="label">Nama</td>
          <td class="colon">:</td>
          <td class="value font uppercase">${templateData.studentName}</td>
        </tr>
        <tr>
          <td class="label">NIM</td>
          <td class="colon">:</td>
          <td class="value">${templateData.studentNIM}</td>
        </tr>
        <tr>
          <td class="label" style="vertical-align: top;">Judul</td>
          <td class="colon" style="vertical-align: top;">:</td>
          <td class="value text-justify" style="line-height: 1.4;">${templateData.judul}</td>
        </tr>
      </table>

      <P>Catata /Daftar Revisi

      <!-- Revision Table -->
      <table class="revision-table">
        <thead>
          <tr>
            <th class="no-column">No</th>
            <th class="description-column">Catatan/Uraian</th>
          </tr>
        </thead>
        <tbody>
            <tr >
              <td class="no-column"></td>
              <td class="description-column"></td>
            </tr>
          
        </tbody>
      </table>

      <!-- Third Page Signatures -->
      <div class="third-page-signatures">
        <div class="date-line">Padang, ${templateData.seminarTanggal}</div>
        <div class="signature-grid">
          <div class="signature-item">
            <div class="signature-role">Penguji/Pembimbing</div>
            <div class="signature-name">(.......................................)</div>
            <div class="signature-nip">NIP.</div>
          </div>
        
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const proposalId = Number(id);
    if (isNaN(proposalId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const proposal = await fetchProposalData(proposalId);
    const templateData = await prepareTemplateData(proposal);
    const html = generateHTML(templateData);

    let browser: any = null;
    try {
      browser = await getBrowser();
      if (!browser) throw new Error("Gagal membuka browser untuk generate PDF");
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '25mm',
          right: '25mm',
          bottom: '25mm',
          left: '30mm',
        },
      });

      await browser.close();

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Berita_Acara_Proposal_${templateData.studentNIM}.pdf"`,
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
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}
