import { Home, Edit, Layers, User, BarChart2, Archive, ClipboardCheck, Layers2Icon } from "lucide-react"; // <-- 1. Impor ikon baru

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
    { title: "Seminar Proposal", url: "/dashboard/mahasiswa/proposal", icon: Layers },
    { title: "Sidang Skripsi", url: "/dashboard/mahasiswa/sidang-skripsi", icon: User },
  ],

  
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    
    // --- PERUBAHAN UTAMA DI BLOK INI ---
    { 
      title: "Verifikasi Pengajuan", // <-- 2. Nama menu diubah
      icon: ClipboardCheck,          // <-- 3. Ikon diubah agar lebih sesuai
      
      // URL sub-menu sudah benar sesuai struktur folder yang kita buat
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/verifikasi/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/verifikasi/SISTEM_INFORMASI" },
        
      ],
    },
    // ------------------------------------

    { 
      title: "Seminar Proposal", 
      icon: Layers,
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/proposal/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/proposal/SISTEM_INFORMASI" },
        
      ],
    },
    { 
      title: "Seminar Hasil", 
      icon: User,
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/semhas/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/semhas/SISTEM_INFORMASI" },

      ],
    },
    { title: "Monitoring", url: "/dashboard/admin/monitoring", icon: BarChart2 },
    { title: "Arsip SK", url: "/dashboard/admin/arsip", icon: Archive },
  ],

  
  kaprodi: [
    { title: "Dashboard", url: "/dashboard/kaprodi", icon: Home },
    { title: "Pengajuan Judul", url: "/dashboard/kaprodi/pengajuan_judul", icon: Edit },
    { title: "Seminar Proposal", url: "/dashboard/kaprodi/proposal", icon:  Layers2Icon },
    { title: "Seminar hasil", url: "/dashboard/kaprodi/jadwal-seminar", icon: Layers },
    { title: "Profile", url: "/dashboard/kaprodi/jadwal-seminar", icon: User },
  ],
};