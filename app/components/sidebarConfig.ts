import { Home, Edit, Layers, User, BarChart2, Archive, ClipboardCheck, Layers2Icon } from "lucide-react"; 
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
    { title: "Sidang Skripsi", url: "/dashboard/mahasiswa/sidang-skripsi", icon: User },
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
      title: "Seminar Hasil", 
      icon: User,
      subItems: [
        { title: "Matematika", url: "/dashboard/admin/seminar-hasil/MATEMATIKA" },
        { title: "Sistem Informasi", url: "/dashboard/admin/seminar-hasil/SISTEM_INFORMASI" },

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