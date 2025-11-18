import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import puppeteer, { Browser } from 'puppeteer';
import { Jurusan, Status } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const formatJurusanToProdi = (jurusanEnum: Jurusan): string => {
  return jurusanEnum.toString().split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nip = searchParams.get('nip');
  const tahun = searchParams.get('tahun');
  const semester = searchParams.get('semester') as 'GANJIL' | 'GENAP';
  const jurusan = searchParams.get('jurusan') as Jurusan;
  const role = searchParams.get('role'); 

  if (!nip || !tahun || !semester || !jurusan || !role) {
    return NextResponse.json({
      error: 'Parameter nip, tahun, semester, jurusan, dan role diperlukan.'
    }, { status: 400 });
  }

  try {
  
    let startDate: Date;
    let endDate: Date;

    if (semester === 'GANJIL') {
      startDate = new Date(parseInt(tahun), 7, 1); 
      endDate = new Date(parseInt(tahun) + 1, 1, 28, 23, 59, 59);
    } else {
      startDate = new Date(parseInt(tahun), 2, 1); 
      endDate = new Date(parseInt(tahun), 6, 31, 23, 59, 59);
    }

    const dosen = await prisma.dosen.findUnique({
      where: { nip },
      select: { nama: true, nip: true },
    });

    if (!dosen || !dosen.nama) {
      return NextResponse.json({ error: 'Dosen tidak ditemukan.' }, { status: 404 });
    }

    let riwayatData: any[] = [];

    if (role === 'pembimbing') {

      const approvedJudul = await prisma.judul.findMany({
        where: {
          jurusan: jurusan,
          status: Status.DISETUJUI,
          tanggal: { gte: startDate, lte: endDate },
          OR: [
            { pembimbing1: dosen.nama },
            { pembimbing2: dosen.nama }
          ]
        },
        select: {
          judul: true,
          mahasiswa: {
            select: {
              nama: true,
              nim: true,
            }
          },
          pembimbing1: true,
          pembimbing2: true,
          tanggal: true,
        },
        orderBy: { tanggal: 'desc' }
      });

      riwayatData = approvedJudul.map(j => ({
        mahasiswa: j.mahasiswa.nama,
        nim: j.mahasiswa.nim,
        judul: j.judul,
        tanggal: j.tanggal,
        role: j.pembimbing1 === dosen.nama ? 'Pembimbing 1' : 'Pembimbing 2'
      }));

      const totalPembimbing1 = riwayatData.filter(r => r.role === 'Pembimbing 1').length;
      const totalPembimbing2 = riwayatData.filter(r => r.role === 'Pembimbing 2').length;
      const totalBimbingan = riwayatData.length;
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

    const periode = `${semester.charAt(0) + semester.slice(1).toLowerCase()} ${tahun}`;
    const jurusanFormatted = formatJurusanToProdi(jurusan);

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            @page { size: A4; margin: 20mm; }
            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Arial', Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
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
              font-size: 12pt;
              font-weight: 700;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .kop-fakultas {
              font-size: 14pt;
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
            .title {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 5px;
              text-align: center;
            }
            .info-table {
              width: 100%;
              border: none;
              margin-bottom: 5px;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
            }
            .info-table td {
              border: none;
              padding: 0;
              vertical-align: top;
            }
            .info-left {
              width: 50%;
            }
            .info-right {
              width: 50%;
              text-align: left;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {

            }
            .summary-table {
              margin-bottom: 20px;
              width: 100%;
            }
            .summary-table th, .summary-table td {
              text-align: center;
            }
           
          </style>
        </head>
        <body>
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

          <p class="title">LAPORAN DETAIL RIWAYAT PEMBIMBING</p>

          <table class="info-table">
            <tr>
              <td class="info-left">
                <p><strong>Nama:</strong> ${dosen.nama}</p>
                <p><strong>NIP:</strong> ${dosen.nip}</p>
              </td>
              <td class="info-right">
                <p><strong>Jurusan:</strong> ${jurusanFormatted}</p>
                <p><strong>Periode:</strong> ${periode}</p>
              </td>
            </tr>
          </table>

          <table class="summary-table">
            <thead>
              <tr>
                <th>Total Bimbingan</th>
                <th>Pembimbing 1</th>
                <th>Pembimbing 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${riwayatData.length}</td>
                <td>${riwayatData.filter(r => r.role === 'Pembimbing 1').length}</td>
                <td>${riwayatData.filter(r => r.role === 'Pembimbing 2').length}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Mahasiswa</th>
                <th>NIM</th>
                <th>Judul</th>
                <th>Tanggal</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              ${riwayatData.length > 0 ? riwayatData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.mahasiswa}</td>
                  <td>${item.nim}</td>
                  <td>${item.judul}</td>
                  <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                  <td>${item.role}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align: center;">Tidak ada data riwayat bimbingan</td></tr>'}
            </tbody>
          </table>

         
        </body>
      </html>
    `;

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
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`Detail_Pembimbing_${dosen.nama.replace(/\s+/g, '_')}_${periode.replace(' ', '_')}.pdf`)}`,
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
    console.error('Error generating detail report:', error);
    return NextResponse.json({
      error: 'Failed to generate detail report.',
      details: (error as Error).message
    }, { status: 500 });
  }
}
