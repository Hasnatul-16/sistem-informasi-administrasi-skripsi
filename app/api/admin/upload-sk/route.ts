import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { uploadToSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jurusan = searchParams.get("jurusan");
    const tahun = searchParams.get("tahun");
    const semester = searchParams.get("semester");
    const month = searchParams.get("month");

    if (!jurusan) {
      return NextResponse.json(
        { message: "Jurusan parameter is required" },
        { status: 400 }
      );
    }

    // Build date filter based on month OR tahun+semester
    let dateFilter: { gte: Date; lt: Date } | undefined = undefined;
    if (month) {
      // month expected as YYYY-MM
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      dateFilter = { gte: start, lt: end };
    } else if (tahun && semester) {
      if (semester === 'GANJIL') {
        const start = new Date(`${tahun}-07-01`);
        const end = new Date(`${Number(tahun) + 1}-01-01`);
        dateFilter = { gte: start, lt: end };
      } else if (semester === 'GENAP') {
        const start = new Date(`${tahun}-01-01`);
        const end = new Date(`${tahun}-07-01`);
        dateFilter = { gte: start, lt: end };
      }
    }

    const whereClause: Prisma.MahasiswaWhereInput = { jurusan: jurusan as "SISTEM_INFORMASI" | "MATEMATIKA" };
    if (dateFilter) {
      // only include mahasiswa who have a judul with tanggal in range
      whereClause.judul = { some: { tanggal: { gte: dateFilter.gte, lt: dateFilter.lt } } };
    }

    const mahasiswaList = await prisma.mahasiswa.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        nim: true,
        jurusan: true,
        user: {
          select: {
            role: true,
          },
        },
        judul: {
          select: {
            id: true,
            status: true,
            file_sk_pembimbing: true,
            proposal: {
              select: {
                id: true,
                status: true,
                file_sk_proposal: true,
              },
              take: 1,
              orderBy: { id: "desc" },
            },
            seminar_hasil: {
              select: {
                id: true,
                status: true,
                file_sk_skripsi: true,
              },
              take: 1,
              orderBy: { id: "desc" },
            },
          },
          take: 1,
          orderBy: { id: "desc" },
        },
      },
    });

    const result = mahasiswaList.map((m) => {
      const latestJudul = m.judul[0];
      const latestProposal = latestJudul?.proposal[0];
      const latestSeminar = latestJudul?.seminar_hasil[0];

      return {
        id: m.id,
        nama: m.nama,
        nim: m.nim,
        jurusan: m.jurusan,
        role: m.user.role,
        judul_status: latestJudul?.status || null,
        judul_id: latestJudul?.id || null,
        proposal_status: latestProposal?.status || null,
        proposal_id: latestProposal?.id || null,
        seminar_status: latestSeminar?.status || null,
        seminar_id: latestSeminar?.id || null,
        file_sk_pembimbing: latestJudul?.file_sk_pembimbing || null,
        file_sk_proposal: latestProposal?.file_sk_proposal || null,
        file_sk_seminar: latestSeminar?.file_sk_skripsi || null,
      };
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("GET /api/admin/upload-sk error:", error);
    return NextResponse.json({ message: error.message || "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const mahasiswa_id = parseInt(formData.get("mahasiswa_id") as string);
    const submission_id = parseInt(formData.get("submission_id") as string);
    const file = formData.get("file") as File;
    if (!type || !mahasiswa_id || !submission_id || !file) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!["judul", "proposal", "seminar"].includes(type)) {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswa_id },
      select: {
        id: true,
        judul: {
          select: {
            id: true,
            status: true,
            file_sk_pembimbing: true,
            proposal: {
              select: {
                id: true,
                status: true,
                file_sk_proposal: true,
              },
            },
            seminar_hasil: {
              select: {
                id: true,
                status: true,
                file_sk_skripsi: true,
              },
            },
          },
          take: 1,
          orderBy: { id: "desc" },
        },
      },
    });

    if (!mahasiswa || !mahasiswa.judul[0]) {
      return NextResponse.json(
        { message: "Mahasiswa or submission not found" },
        { status: 404 }
      );
    }

    const judul = mahasiswa.judul[0];

    if (type === "judul") {
      if (judul.status !== "DISETUJUI") {
        return NextResponse.json(
          { message: "Pengajuan judul must be DISETUJUI to upload SK pembimbing" },
          { status: 400 }
        );
      }
      if (judul.file_sk_pembimbing) {
        return NextResponse.json(
          { message: "SK pembimbing already uploaded" },
          { status: 400 }
        );
      }
    } else if (type === "proposal") {
      const proposal = judul.proposal.find((p) => p.id === submission_id);
      if (!proposal || proposal.status !== "DISETUJUI") {
        return NextResponse.json(
          { message: "Proposal must be DISETUJUI to upload SK penguji" },
          { status: 400 }
        );
      }
      if (proposal.file_sk_proposal) {
        return NextResponse.json(
          { message: "SK penguji proposal already uploaded" },
          { status: 400 }
        );
      }
    } else if (type === "seminar") {
      const seminar = judul.seminar_hasil.find((s) => s.id === submission_id);
      if (!seminar || seminar.status !== "DISETUJUI") {
        return NextResponse.json(
          { message: "Seminar hasil must be DISETUJUI to upload SK penguji" },
          { status: 400 }
        );
      }
      if (seminar.file_sk_skripsi) {
        return NextResponse.json(
          { message: "SK penguji sidang already uploaded" },
          { status: 400 }
        );
      }
    }

    const folder = `sk/${type}`;
    const publicUrl = await uploadToSupabase(file, folder);

    if (type === "judul") {
      await prisma.judul.update({
        where: { id: submission_id },
        data: { file_sk_pembimbing: publicUrl  },
      });
    } else if (type === "proposal") {
      await prisma.proposal.update({
        where: { id: submission_id },
        data: { file_sk_proposal: publicUrl  },
      });
    } else if (type === "seminar") {
      await prisma.seminarHasil.update({
        where: { id: submission_id },
        data: { file_sk_skripsi: publicUrl  },
      });
    }

    return NextResponse.json({
      message: "SK uploaded successfully",
      path: publicUrl ,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("POST /api/admin/upload-sk error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to upload SK" },
      { status: 500 }
    );
  }
}
