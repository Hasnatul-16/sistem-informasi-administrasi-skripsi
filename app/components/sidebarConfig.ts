import {
    Home, Edit, Layers, User, Archive,
    ClipboardCheck, Layers2, Layers3, Upload, UserPlus
} from "lucide-react";

export type SubMenuItem = {
  title: string;
  url: string;
};

export type MenuItem = {
  title: string;
  url?: string; 
  icon: React.ElementType;
  subItems?: SubMenuItem[];
};


export const menuItemsByRole: { [key: string]: MenuItem[] } = {
  
  mahasiswa: [
    { title: "Dashboard", url: "/dashboard/mahasiswa", icon: Home },
    { title: "Pengajuan Judul", url: "/dashboard/mahasiswa/pengajuan-judul", icon: Edit },
    { title: "Seminar Proposal", url: "/dashboard/mahasiswa/proposal", icon: Layers },
    { title: "Sidang Skripsi", url: "/dashboard/mahasiswa/seminar-hasil", icon: Layers},
  ],

  
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    
    { 
      title: "Verifikasi Pengajuan", 
      icon: ClipboardCheck,      
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/verifikasi/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/verifikasi/SISTEM_INFORMASI" },
      ],
    },

    { 
      title: "Seminar Proposal", 
      icon: Layers,
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/proposal/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/proposal/SISTEM_INFORMASI" },
      ],
    },
    { 
      title: "Sidang Skripsi", 
      icon: Layers3, 
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/seminar-hasil/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/seminar-hasil/SISTEM_INFORMASI" },
      ],
    },
    { title: "Arsip ", url: "/dashboard/admin/arsip", icon: Archive },
    { title: "Manajemen Dosen", url: "/dashboard/admin/dosen/add", icon: UserPlus },
     { title: "Upload SK", url: "/dashboard/admin/upload-sk", icon: Upload },
    { 
      title: "Tabel Dosen", 
      icon: User,
      subItems: [
        { title: "Dosen Penguji", url: "/dashboard/admin/dosen" },
        { title: "Dosen Pembimbing", url: "/dashboard/admin/dosen/pembimbing" },
      ],
    },
  ],

  
  kaprodi: [
    { title: "Dashboard", url: "/dashboard/kaprodi", icon: Home },
    { title: "Pengajuan Judul", url: "/dashboard/kaprodi/pengajuan_judul", icon: Edit },
    { title: "Seminar Proposal", url: "/dashboard/kaprodi/proposal", icon:  Layers2 },
    { title: "Sidang Skripsi", url: "/dashboard/kaprodi/seminar-hasil", icon: Layers },
    { title: "Dosen Pembimbing", url: "/dashboard/kaprodi/dosen/pembimbing",icon: User },
    { title: "Dosen penguji", url: "/dashboard/kaprodi/dosen", icon: Layers },
      
  ],
};