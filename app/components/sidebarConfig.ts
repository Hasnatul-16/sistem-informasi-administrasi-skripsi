

import { Home, Edit, Layers, User, BarChart2, Archive } from "lucide-react";

// Tipe untuk item di dalam sub-menu
export type SubMenuItem = {
  title: string;
  url: string;
};

// Tipe utama untuk menu, sekarang bisa memiliki sub-menu (subItems)
export type MenuItem = {
  title: string;
  url?: string; // URL menjadi opsional karena item induk tidak punya URL
  icon: React.ElementType;
  subItems?: SubMenuItem[];
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
    { 
      title: "Pengajuan Judul", 
      icon: Edit,
      
      subItems: [
        { title: "Sistem Informasi", url: "/dashboard/admin/verifikasi/SISTEM_INFORMASI" },
        { title: "Matematika", url: "/dashboard/admin/verifikasi/MATEMATIKA" },
      ],
    },
    { 
      title: "Seminar Proposal", 
      icon: Layers, // Menggunakan ikon yang sesuai
      // Anda bisa membuat halaman dinamis untuk ini juga nanti
      subItems: [
        { title: "Sistem Informasi", url: "/dashboard/admin/sempro/SISTEM_INFORMASI" },
        { title: "Matematika", url: "/dashboard/admin/sempro/MATEMATIKA" },
      ],
    },
    { 
      title: "Seminar Hasil", 
      icon: User, // Menggunakan ikon yang sesuai
      // Anda bisa membuat halaman dinamis untuk ini juga nanti
      subItems: [
        { title: "Sistem Informasi", url: "/dashboard/admin/semhas/SISTEM_INFORMASI" },
        { title: "Matematika", url: "/dashboard/admin/semhas/MATEMATIKA" },
      ],
    },
    { title: "Monitoring", url: "/dashboard/admin/monitoring", icon: BarChart2 },
    { title: "Arsip SK", url: "/dashboard/admin/arsip", icon: Archive },
  ],

  
  kaprodi: [
    { title: "Dashboard", url: "/dashboard/kaprodi", icon: Home },
    { title: "Persetujuan Judul", url: "/dashboard/kaprodi/persetujuan-judul", icon: Edit },
    { title: "Jadwal Seminar", url: "/dashboard/kaprodi/jadwal-seminar", icon: Layers },
  ],
};