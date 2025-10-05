// src/app/components/sidebarConfig.ts

import { Home, Edit, Layers, User, BarChart2, Archive } from "lucide-react";

export type MenuItem = {
  title: string;
  url: string;
  icon: React.ElementType;
};

export const menuItemsByRole: { [key: string]: MenuItem[] } = {
  mahasiswa: [
    { title: "Dashboard", url: "/dashboard/mahasiswa", icon: Home },
    { title: "Pengajuan Judul", url: "/dashboard/mahasiswa/pengajuan-judul", icon: Edit },
    { title: "Seminar Proposal", url: "/dashboard/mahasiswa/seminar-proposal", icon: Layers },
    { title: "Sidang Skripsi", url: "/dashboard/mahasiswa/sidang-skripsi", icon: User },
  ],
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Verifikasi Pengajuan", url: "/dashboard/admin/verifikasi", icon: Edit },
    { title: "Monitoring", url: "/dashboard/admin/monitoring", icon: BarChart2 },
    { title: "Arsip SK", url: "/dashboard/admin/arsip", icon: Archive },
  ],
  kaprodi: [
    { title: "Dashboard", url: "/dashboard/kaprodi", icon: Home },
    { title: "Persetujuan Judul", url: "/dashboard/kaprodi/persetujuan-judul", icon: Edit },
    { title: "Jadwal Seminar", url: "/dashboard/kaprodi/jadwal-seminar", icon: Layers },
  ],
};