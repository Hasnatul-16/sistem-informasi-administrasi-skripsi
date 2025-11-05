"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Proposal, Judul, Mahasiswa, User, Dosen, Status } from '@prisma/client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import { FiX, FiCheckCircle, FiCalendar, FiUser, FiBook, FiUsers, FiHash, FiFilter, FiSearch, FiEdit, FiFile, FiSave } from 'react-icons/fi';

const MySwal = withReactContent(Swal);


type ProposalWithDetails = Proposal & {
    judul: Judul & {
        mahasiswa: Mahasiswa & { user: User };
    };
};

interface KaprodiProposalTableProps {
    initialProposals: ProposalWithDetails[];
    lecturers: Dosen[];
}


const StatusBadge = ({ status }: { status: Status }) => {

    const statusConfig: { [key in Status]?: { text: string; color: string } } = {
        DIPROSES_KAPRODI: { text: "Belum Ditetapkan", color: "bg-purple-100 text-purple-800" },
        DISETUJUI: { text: "Penguji Ditetapkan", color: "bg-green-100 text-green-800" },
        
    };
    const config = statusConfig[status] || { text: status.replace('_', ' '), color: "bg-gray-100 text-gray-800" };

    return (
        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
        </span>
    );
};


const formatDateToLocalInput = (dateString: string | Date): string => {
    if (!dateString) return '';
    

    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};


export default function KaprodiProposalTable({ initialProposals, lecturers }: KaprodiProposalTableProps) {
    const [proposals, setProposals] = useState(initialProposals ?? []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<ProposalWithDetails | null>(null);


    const [actionData, setActionData] = useState({
        penguji: '',
        jadwalSidang: '',
    });

    const [isLoading, setIsLoading] = useState(false);


    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [dateInputs, setDateInputs] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        search: ''
    });
    const [displayData, setDisplayData] = useState<ProposalWithDetails[]>([]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const applyFilter = () => {
        setAppliedFilters({ ...dateInputs, search: searchQuery });
    };


    useEffect(() => {
        setProposals(initialProposals ?? []);
    }, [initialProposals]);



    useEffect(() => {
        const start = new Date(appliedFilters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(appliedFilters.endDate);
        end.setHours(23, 59, 59, 999);
        const searchLower = appliedFilters.search.toLowerCase();

        const filtered = proposals.filter(p => {

            const proposalDate = new Date(p.tanggal);
            const dateMatch = proposalDate >= start && proposalDate <= end;


            const searchMatch = (
                p.judul.mahasiswa.nama.toLowerCase().includes(searchLower) ||
                p.judul.mahasiswa.nim.toLowerCase().includes(searchLower) ||
                p.judul.judul.toLowerCase().includes(searchLower) ||
                p.judul.topik.toLowerCase().includes(searchLower)
            );

            return dateMatch && searchMatch;
        });

        setDisplayData(filtered);
    }, [proposals, appliedFilters]);



    const resetActionData = useCallback(() => {
        setActionData({
            penguji: '',
            jadwalSidang: '',
        });
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedProposal(null);
        resetActionData();
    }, [resetActionData]);

    const openModal = (proposal: ProposalWithDetails) => {
        setSelectedProposal(proposal);

        let initialJadwal = '';
        
        if (proposal.jadwal_sidang) {
            initialJadwal = formatDateToLocalInput(proposal.jadwal_sidang); 
        }

        setActionData({
            penguji: proposal.penguji || '',
            jadwalSidang: initialJadwal,
        });
        setIsModalOpen(true);
    };

    const handleActionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setActionData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleAssign = useCallback(async () => {

        if (!selectedProposal || !actionData.penguji || !actionData.jadwalSidang) {
            MySwal.fire({ icon: 'warning', title: 'Belum Lengkap', text: 'Harap lengkapi Dosen Penguji dan Jadwal Sidang.' });
            return;
        }

        setIsLoading(true);

        const newStatus = selectedProposal.status === 'DIPROSES_KAPRODI' ? 'DISETUJUI' : selectedProposal.status;
        const actionTitle = selectedProposal.status === 'DIPROSES_KAPRODI' ? 'Penetapan' : 'Pembaruan';


        try {
            const localDate = new Date(actionData.jadwalSidang);
            const isoStringForDB = localDate.toISOString(); 

            const response = await fetch(`/api/proposal/kaprodi/${selectedProposal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    penguji: actionData.penguji,
                    jadwalSidang: isoStringForDB, 
                    status: newStatus 
                }),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(errorResponse?.message || `Gagal ${actionTitle.toLowerCase()} data`);
            }
            const updated = await response.json();

            MySwal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `${actionTitle} Penguji dan Jadwal berhasil.`,
                timer: 2000,
                showConfirmButton: false
            });

          
            setProposals(prev =>
                prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)
            );
            setDisplayData(prev =>
                prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)
            );

            closeModal();
        } catch (error: any) {
            MySwal.fire({ icon: 'error', title: 'Oops...', text: error.message || 'Terjadi kesalahan pada server.' });
        } finally {
            setIsLoading(false);
        }
    }, [selectedProposal, actionData, closeModal]);


    return (
        <>

           
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 rounded-lg shadow-md flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div>
                        <label htmlFor="startDate" className="text-white font-semibold text-sm">Tanggal Mulai</label>
                        <input type="date" id="startDate" name="startDate" value={dateInputs.startDate} onChange={handleDateChange} className="w-full mt-1 p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="text-white font-semibold text-sm">Tanggal Akhir</label>
                        <input type="date" id="endDate" name="endDate" value={dateInputs.endDate} onChange={handleDateChange} className="w-full mt-1 p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50" />
                    </div>
                    <div className="self-end">
                        <button
                            onClick={applyFilter}
                            className="bg-white text-blue-600 font-bold py-2 px-4 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <FiFilter size={16} /> Terapkan Filter
                        </button>
                    </div>
                </div>
                <div className="self-end relative">
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama, NIM, atau judul..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                applyFilter();
                            }
                        }}
                        className="w-64 mt-1 p-2 pl-10 border border-white/30 rounded-md bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:bg-white focus:text-gray-800 transition-all"
                    />
                    <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-white/70 focus:text-blue-600" />
                </div>
            </div>



            <div className="overflow-x-auto bg-white rounded-lg shadow-md border">
                <table className="min-w-full">
                    <thead className="border-b-2 border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]"><div className="flex items-center gap-2"><FiUser size={16} className="text-blue-600" /> <span>Mahasiswa</span></div></th>
                            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiCalendar size={16} className="text-blue-600" /> <span>Tgl Pengajuan</span></div></th>
                            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[35%]"><div className="flex items-center gap-2"><FiBook size={16} className="text-blue-600" /> <span>Judul Skripsi</span></div></th>
                            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]"><div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /> <span>Penguji/Jadwal</span></div></th>
                            <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[10%]"><div className="flex items-center gap-2"><FiCheckCircle size={16} className="text-blue-600" /> <span>Aksi</span></div></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayData.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center text-gray-500">Tidak ada pengajuan proposal yang perlu diproses pada filter ini.</td></tr>
                        ) : (
                            displayData.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{p.judul.mahasiswa.nama}</div>
                                        <div className="text-sm text-gray-500">{p.judul.mahasiswa.nim}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(p.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4"><p className="text-sm text-gray-800 whitespace-normal">{p.judul.judul}</p></td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {p.status === 'DISETUJUI' ? (
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                <li>Penguji: <strong>{p.penguji}</strong></li>
                                                <li>Jadwal: <strong>{new Date(p.jadwal_sidang!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></li>
                                            </ul>
                                        ) : (
                                            <StatusBadge status={p.status} />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.status === 'DIPROSES_KAPRODI' ? (
                                            <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 transition-colors">
                                                <FiSave size={14} /> Tetapkan
                                            </button>
                                        ) : p.status === 'DISETUJUI' ? ( 
                                            <button
                                                onClick={() => openModal(p)}
                                                className="text-green-600 hover:text-green-800 text-sm font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                <FiEdit size={14} /> Edit 
                                            </button>
                                        ) : (
                                            <StatusBadge status={p.status} />
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {isModalOpen && selectedProposal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl animate-fade-in-scale">
                        <div className="flex justify-between items-start mb-4 pb-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {selectedProposal.status === 'DISETUJUI' ? 'Edit' : 'Tetapkan'} Penguji & Jadwal Sidang Proposal
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedProposal.status === 'DISETUJUI' ?
                                        'Perbarui Penguji atau Jadwal Sidang yang sudah ditetapkan.' :
                                        'Review detail pengajuan dan pembimbing yang sudah ditetapkan sebelum menetapkan penguji.'
                                    }
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                                <FiX size={20} />
                            </button>
                        </div>


                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Detail Pengajuan</h3>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pb-4 border-b">
                            <div className='space-y-2'>
                                <div>
                                    <p className="text-xs text-gray-500">Nama Mahasiswa</p>
                                    <p className="font-semibold text-base">{selectedProposal.judul.mahasiswa.nama}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">NIM</p>
                                    <p className="font-semibold text-base flex items-center gap-1"><FiHash size={12} className='text-gray-400' />{selectedProposal.judul.mahasiswa.nim}</p>
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <div>
                                    <p className="text-xs text-gray-500">Topik</p>
                                    <p className="font-semibold text-base">{selectedProposal.judul.topik}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Tgl. Pengajuan</p>
                                    <p className="font-semibold text-base flex items-center gap-1"><FiCalendar size={12} className='text-gray-400' />{new Date(selectedProposal.tanggal).toLocaleDateString('id-ID')}</p>
                                </div>
                            </div>
                        </div>


                        <div className="bg-slate-50 p-4 rounded-lg border mt-4 mb-6">
                            <p className="text-xs text-gray-500 mb-1">Judul Skripsi</p>
                            <p className="font-semibold text-base leading-snug">{selectedProposal.judul.judul}</p>
                        </div>


                        <div className="mb-6 pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Dosen Pembimbing yang Sudah Ditetapkan</h3>
                            <div className='p-4 bg-blue-50 rounded-lg border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Pembimbing Utama (1)</p>
                                    <p className="font-semibold text-blue-700 text-base">{selectedProposal.judul.pembimbing1 || 'Belum Ditetapkan'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Pembimbing Pendamping (2)</p>
                                    <p className="font-semibold text-blue-700 text-base">{selectedProposal.judul.pembimbing2 || 'Belum Ditetapkan'}</p>
                                </div>

                            </div>
                        </div>


                        <div className='mb-6'>
                            <h3 className="text-lg font-semibold text-green-600 mb-3">Penetapan/Pengeditan Penguji & Jadwal Sidang Proposal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Dosen Penguji (1 Orang)</label>
                                    <select
                                        name="penguji"
                                        value={actionData.penguji}
                                        onChange={handleActionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                                        required
                                    >
                                        <option value="" disabled>-- Pilih Dosen Penguji --</option>
                                        {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>)}
                                    </select>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu Sidang</label>
                                    <input
                                        type="datetime-local"
                                        name="jadwalSidang"
                                        value={actionData.jadwalSidang}
                                        onChange={handleActionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors text-sm">Batal</button>
                            <button onClick={handleAssign} disabled={isLoading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isLoading ? 'Menyimpan...' : (selectedProposal.status === 'DISETUJUI' ? 'Simpan Perubahan' : 'Simpan & Tetapkan Jadwal')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}