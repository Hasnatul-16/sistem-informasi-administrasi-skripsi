"use client";

import { useState, useEffect, useCallback } from 'react';
import { Role, Jurusan } from '@prisma/client';
import {
    FiUser, FiMail, FiEdit, FiTrash2, FiSearch,
    FiLoader, FiAlertTriangle, FiCheckCircle, FiX, FiUsers, FiSettings,
    FiShield
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Pagination } from '@/components/ui/pagination';

const MySwal = withReactContent(Swal);

type UserData = {
    id: number;
    nama: string | null;
    email: string;
    role: Role;
    jurusan: Jurusan;
    mahasiswa?: {
        id: number;
        nim: string;
    } | null;
};

const ALL_ROLES: Role[] = ['MAHASISWA', 'ADMIN', 'KAPRODI'];

const getRoleBadgeColor = (role: Role) => {
    switch (role) {
        case 'ADMIN':
            return 'bg-red-100 text-red-800';
        case 'KAPRODI':
            return 'bg-blue-100 text-blue-800';
        case 'MAHASISWA':
        default:
            return 'bg-green-100 text-green-800';
    }
};

export default function UserManagementClient() {
    const [userList, setUserList] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        nama: '',
        role: 'MAHASISWA' as Role,
    });


    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let url = `/api/users/manage?search=${encodeURIComponent(searchTerm)}`;
            if (selectedRole !== 'ALL') url += `&role=${selectedRole}`;

            const response = await fetch(url);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Gagal memuat data pengguna');
            }
            const data = await response.json();
            setUserList(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
            setError(errorMessage);
            setUserList([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, selectedRole]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/users/manage/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal menyimpan data pengguna');
            }

            await MySwal.fire({
                icon: 'success',
                title: 'Berhasil Diperbarui!',
                text: 'Data pengguna telah diperbarui.',
                timer: 2000,
                showConfirmButton: false,
            });

            closeModal();
            fetchUsers();

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
            MySwal.fire({
                icon: 'error',
                title: 'Oops...',
                text: message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user: UserData) => {
        const result = await MySwal.fire({
            title: 'Apakah Anda yakin?',
            html: `
        <p>Data pengguna <strong>${user.nama || user.email}</strong> akan dihapus permanen!</p>
        ${user.mahasiswa ? '<p class="text-sm text-orange-600 mt-2">⚠️ Pengguna ini memiliki data mahasiswa yang akan ikut terhapus.</p>' : ''}
      `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/users/manage/${user.id}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Gagal menghapus pengguna');
                }

                await MySwal.fire({
                    icon: 'success',
                    title: 'Berhasil Dihapus!',
                    text: 'Data pengguna telah dihapus.',
                    timer: 1500,
                    showConfirmButton: false,
                });

                fetchUsers();

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
                MySwal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus',
                    text: message,
                });
            }
        }
    };

    const openEditModal = (user: UserData) => {
        setFormData({
            nama: user.nama || '',
            role: user.role,
        });
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const closeModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setFormData({ nama: '', role: 'MAHASISWA' });
    };


    const totalItems = userList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = userList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };


    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRole]);

    return (
        <main className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Manajemen Pengguna</h1>
            </div>

            <p className="text-sm sm:text-base text-gray-600 break-words">Kelola semua akun pengguna sistem administrasi skripsi</p>

           
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md border space-y-3 sm:space-y-4">

             
                <div className="bg-[#325827] p-3 sm:p-4 rounded-lg shadow-md flex flex-col gap-3 sm:gap-4">

             
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-3 sm:gap-4">
                       
                        <div className="flex flex-col w-full sm:w-auto">
                            <label className="text-xs sm:text-sm font-semibold text-white mb-2">
                                Filter Role
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setSelectedRole('ALL')}
                                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition duration-150 whitespace-nowrap ${selectedRole === 'ALL'
                                        ? 'bg-white text-[#325827] shadow-md'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                >
                                    Semua
                                </button>
                                {ALL_ROLES.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setSelectedRole(r)}
                                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition duration-150 whitespace-nowrap ${selectedRole === r
                                            ? 'bg-white text-[#325827] shadow-md'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                  
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama atau email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-72 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 font-sans text-xs sm:text-sm"
                            />
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                    </div>
                </div>

            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">
        
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="px-3 py-1 bg-gray-100 rounded-full">
                        Total: <strong>{totalItems}</strong> pengguna
                    </span>
                    {selectedRole !== 'ALL' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Role: <strong>{selectedRole}</strong>
                        </span>
                    )}
                </div>

             
                <div className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-10 text-[#325827] flex flex-col items-center">
                            <FiLoader className="h-8 w-8 animate-spin" />
                            <p className="mt-2">Memuat data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
                            <FiAlertTriangle className="h-5 w-5" />
                            <p className='font-medium'>Error: {error}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left">
                                                <div className="flex items-center gap-1 sm:gap-2"><FiUsers size={14} className="text-green-800" /><span>Pengguna</span></div>
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                                <div className="flex items-center gap-1 sm:gap-2"><FiMail size={14} className="text-green-800" /><span>Email</span></div>
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                                <div className="flex items-center gap-1 sm:gap-2"><FiShield size={14} className="text-green-800" /><span>Role</span></div>
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                                <div className="flex items-center gap-1 sm:gap-2"><FiCheckCircle size={14} className="text-green-800" /><span>Jurusan</span></div>
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                                <div className="flex items-center gap-1 sm:gap-2"><FiSettings size={14} className="text-green-800" /><span>Aksi</span></div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedData.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada data pengguna ditemukan.</td></tr>
                                        ) : (
                                            paginatedData.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <FiUser size={14} className="text-green-800" />
                                                                <span className="text-sm font-semibold text-gray-800">
                                                                    {user.nama || 'Nama tidak tersedia'}
                                                                </span>
                                                            </div>
                                                            {user.mahasiswa && (
                                                                <span className="text-xs text-gray-500 ml-5">
                                                                    NIM: {user.mahasiswa.nim}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {user.email}
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                                            {user.jurusan.replace('_', ' ')}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(user)}
                                                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                                                            >
                                                                <FiEdit className="h-4 w-4" />Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user)}
                                                                className="inline-flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                                                            >
                                                                <FiTrash2 className="h-4 w-4" /> Hapus
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={handleItemsPerPageChange}
                                totalItems={totalItems}
                            />
                        </>
                    )}
                </div>
            </div>

      
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 transform transition-all animate-fade-in-scale">

                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Edit Pengguna
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-800">
                                <FiX className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                            <div className="p-4 bg-blue-50 rounded-lg text-sm">
                                <p className="text-blue-800">
                                    <strong>Email:</strong> {editingUser.email}
                                </p>
                                {editingUser.mahasiswa && (
                                    <p className="text-blue-800 mt-1">
                                        <strong>NIM:</strong> {editingUser.mahasiswa.nim}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="nama" className="flex text-xs sm:text-sm font-semibold text-gray-700 items-center gap-2">
                                    <FiUser className="h-4 w-4 text-green-800" />
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <input
                                        id="nama"
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                                        className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-900 transition duration-200 bg-gray-50 focus:bg-white"
                                        placeholder="Masukkan nama lengkap"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="role" className="flex text-xs sm:text-sm font-semibold text-gray-700 items-center gap-2">
                                    <FiShield className="h-4 w-4 text-green-800" />
                                    Role
                                </label>
                                <div className="relative">
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                                        className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-800 transition duration-200 bg-gray-50 focus:bg-white appearance-none"
                                    >
                                        {ALL_ROLES.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 font-medium flex items-center gap-2"
                                >
                                    <FiX className="h-4 w-4" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-[#325827] text-white rounded-xl hover:bg-green-800 disabled:bg-gray-400 transition duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiLoader className="h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <FiEdit className="h-4 w-4" />
                                            Perbarui
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
