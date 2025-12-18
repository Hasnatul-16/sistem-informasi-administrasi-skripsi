import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getBrowser } from '@/lib/puppeteer';
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
  const tahun = searchParams.get('tahun');
  const semester = searchParams.get('semester') as 'GANJIL' | 'GENAP';
  const jurusan = searchParams.get('jurusan') as Jurusan;

  if (!tahun || !semester || !jurusan) {
    return NextResponse.json({ error: 'Parameter tahun, semester, dan jurusan diperlukan.' }, { status: 400 });
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

    const approvedProposals = await prisma.proposal.findMany({
      where: {
        judul: {
          jurusan: jurusan,
        },
        status: Status.DISETUJUI,
        tanggal: { gte: startDate, lte: endDate }
      },
      select: {
        penguji: true,
      },
    });

    const approvedSeminarHasil = await prisma.seminarHasil.findMany({
      where: {
        judul: {
          jurusan: jurusan,
        },
        status: Status.DISETUJUI,
        tanggal: { gte: startDate, lte: endDate }
      },
      select: {
        penguji1: true,
        penguji2: true,
      },
    });

    const statsMap = new Map<string, { nama: string; nip: string; totalPengujiSempro: number; totalPengujiSemhas: number; totalMenguji: number }>();

    const allDosen = await prisma.dosen.findMany({
      where: { jurusan },
      select: { nama: true, nip: true },
    });

    allDosen.forEach(dosen => {
      if (dosen.nama) {
        statsMap.set(dosen.nama, {
          nama: dosen.nama,
          nip: dosen.nip,
          totalPengujiSempro: 0,
          totalPengujiSemhas: 0,
          totalMenguji: 0,
        });
      }
    });

    approvedProposals.forEach(p => {
      if (p.penguji && statsMap.has(p.penguji)) {
        statsMap.get(p.penguji)!.totalPengujiSempro += 1;
      }
    });

    approvedSeminarHasil.forEach(s => {
      if (s.penguji1 && statsMap.has(s.penguji1)) {
        statsMap.get(s.penguji1)!.totalPengujiSemhas += 1;
      }
      if (s.penguji2 && statsMap.has(s.penguji2)) {
        statsMap.get(s.penguji2)!.totalPengujiSemhas += 1;
      }
    });

    const data = Array.from(statsMap.values())
      .map(stat => ({
        ...stat,
        totalMenguji: stat.totalPengujiSempro + stat.totalPengujiSemhas,
      }))
      .filter(d => d.totalMenguji > 0);

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
            .info {
              margin-bottom: 5 px;
              text-align: left;
               font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
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
            .signature {
              margin-top: 50px;
              text-align: right;
            }
            .signature p {
              margin: 0;
            }
            .signature-space {
              height: 80px;
              border-bottom: 1px solid #000;
              margin-top: 20px;
              width: 200px;
              float: right;
            }
               .signature-block-surat {
          width: 45%;
          margin-left: 55%;
          margin-top: 5px;
        }
        .signature-block-surat p {
          margin: 0;
        }

            .sig-space { height: 60px;  }
        
            .sig-name { margin-bottom: 0; font-weight: bold; }
            .sig-nip { margin-top: 0; }
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
           <p class="title">LAPORAN DAFTAR DOSEN PENGUJI</p>

          <div class="info">
            <p ><strong>Jurusan:</strong> ${jurusanFormatted}</p>
            <p><strong>Periode:</strong> ${periode}</p>
            
          </div>


          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Dosen</th>
                <th>NIP</th>
                <th>Penguji Sempro</th>
                <th>Penguji Semhas</th>
                <th>Total Menguji</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((dosen, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${dosen.nama}</td>
                  <td>${dosen.nip}</td>
                  <td>${dosen.totalPengujiSempro}</td>
                  <td>${dosen.totalPengujiSemhas}</td>
                  <td>${dosen.totalMenguji}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="signature-block-surat">
              <p>Padang, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p>Ketua Prodi ${jurusanFormatted}</p>
           <div class="sig-space">
           </div>
              <p class="sig-name">..................................</p>
              <p class="sig-nip">NIP. </p>
        </div>
        </body>
      </html>
    `;

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
          'Content-Disposition': `attachment; filename="Laporan_Penguji_${jurusan}_${periode.replace(' ', '_')}.pdf"`,
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
    console.error('Error generating report:', error);
    return NextResponse.json({
      error: 'Failed to generate report.',
      details: (error as Error).message
    }, { status: 500 });
  }
}
