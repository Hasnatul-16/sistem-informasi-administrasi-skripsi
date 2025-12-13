'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface KaprodiProfile {
  nama: string;
  nim: string;
  email: string;
  jurusan: string;
  role: string;
}

export default function KaprodiProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<KaprodiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          nama: data.nama || '',
          nim: data.nim || '',
          email: data.email || '',
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load profile'
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        MySwal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Profil Berhasil di update',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        setEditing(false);
        fetchProfile();
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update profile'
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update profile'
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      MySwal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'New passwords do not match'
      });
      return;
    }

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        MySwal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Password Berhasil Diubah ',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to change password'
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to change password'
      });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Failed to load profile</div>
        </div>
      </main>
    );
  }

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'K';
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
             
              <div className="h-25 bg-[#325827]"></div>

              
              <div className="px-6 pb-6">
              
                <div className="flex justify-right -mt-12">
                  <div className="w-25 h-25 bg-[#325827] rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                    {getInitial(profile.nama)}
                  </div>
                </div>

              
                <div className="text-center mt-1">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.nama}</h2>
                  <p className="text-gray-500 text-sm mt-1">{profile.email}</p>

              
                  <div className="mt-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {profile.role}
                    </span>
                  </div>

                 
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Kode Prodi:</span> {profile.nim}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Jurusan:</span> {profile.jurusan}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

         
          <div className="lg:col-span-2">
        
            <div className="bg-[#325827] rounded-2xl shadow-lg p-6 mb-6">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'personal'
                       ? "bg-white text-[#325827] shadow-md"
                        : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Data Pengguna
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'password'
                         ? "bg-white text-[#325827] shadow-md"
                        : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Password
                </button>
              </nav>
            </div>

         
            {activeTab === 'personal' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Data Pengguna</h3>
                    <p className="text-gray-600 text-sm mt-1">Perbarui informasi profil Anda</p>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#325827]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#325827] focus:border-[#325827] text-gray-900"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-900 font-medium">
                        {profile.nama}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#325827] focus:border-[#325827] text-gray-900"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-900 font-medium">
                        {profile.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kode Prodi</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.nim}
                        onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#325827] focus:border-[#325827] text-gray-900"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-900 font-medium">
                        {profile.nim}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jurusan</label>
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-900 font-medium">
                      {profile.jurusan}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={handleUpdateProfile}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#325827] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#325827]"
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#325827]"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Ubah Password</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Saat Ini</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#325827] focus:border-[#325827] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#325827] focus:border-[#325827] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#325827] focus:border-[#325827] text-gray-900"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#325827] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#325827]"
                    >
                      Ubah Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
