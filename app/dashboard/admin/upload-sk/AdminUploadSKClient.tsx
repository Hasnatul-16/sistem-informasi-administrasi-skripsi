"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Jurusan, Status } from "@prisma/client";
import {
  FiSearch,
  FiLoader,
  FiAlertTriangle,
  FiUpload,
  FiX,
  FiUser,
  FiHash,
  FiFileText,
} from "react-icons/fi";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const FileUploadBox = ({
  id,
  label,
  file,
  onChange,
  required = false
}: {
  id: string;
  label: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => (
  <div>
    <label
      htmlFor={id}
      className="flex flex-col items-center justify-center w-full h-40 px-4 text-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex flex-col items-center justify-center">
        {file ? (
          <>
            <FiFileText className="w-10 h-10 mb-2 text-green-500" />
            <p className="text-sm font-medium text-gray-800 break-all">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">Klik untuk mengganti file</p>
          </>
        ) : (
          <>
            <FiUpload className="w-10 h-10 mb-2 text-gray-400" />
            <p className="font-semibold text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </p>
            <p className="text-xs text-gray-500">Klik untuk upload</p>
          </>
        )}
      </div>
      <input
        id={id}
        type="file"
        className="hidden"
        onChange={onChange}
        accept=".pdf"
        required={required}
      />
    </label>
  </div>
);

interface MahasiswaUploadData {
  id: number;
  nama: string;
  nim: string;
  jurusan: Jurusan;
  role: "MAHASISWA" | "ADMIN" | "KAPRODI";
  judul_status: Status;
  judul_id: number;
  proposal_status: Status | null;
  proposal_id: number | null;
  seminar_status: Status | null;
  seminar_id: number | null;
  file_sk_pembimbing: string | null;
  file_sk_proposal: string | null;
  file_sk_seminar: string | null;
}

const ALL_JURUSAN: Jurusan[] = ["SISTEM_INFORMASI", "MATEMATIKA"];

const formatJurusan = (jurusan: Jurusan) => {
  return jurusan.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
};
export default function AdminUploadSKClient() {
  const [data, setData] = useState<MahasiswaUploadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJurusan, setSelectedJurusan] = useState<Jurusan>("SISTEM_INFORMASI");

  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    mahasiswa: MahasiswaUploadData | null;
    type: "judul" | "proposal" | "seminar" | null;
  }>({ isOpen: false, mahasiswa: null, type: null });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/upload-sk?jurusan=${selectedJurusan}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedJurusan]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const filtered = useMemo(
    () =>
      data
        .filter((m) => m.role === "MAHASISWA")
        .filter(
          (m) =>
            m.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.nim.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [data, searchTerm]
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadModal.mahasiswa || !uploadModal.type) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append("type", uploadModal.type);
    fd.append("mahasiswa_id", uploadModal.mahasiswa.id.toString());
    fd.append(
      "submission_id",
      uploadModal.type === "judul"
        ? uploadModal.mahasiswa.judul_id.toString()
        : uploadModal.type === "proposal"
          ? (uploadModal.mahasiswa.proposal_id || "").toString()
          : (uploadModal.mahasiswa.seminar_id || "").toString()
    );
    fd.append("file", uploadFile);

    try {
      const res = await fetch("/api/admin/upload-sk", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      await MySwal.fire({
        icon: "success",
        title: "Upload Berhasil!",
        text: "SK telah disimpan ke database.",
        timer: 2000,
        showConfirmButton: false,
      });

      setUploadModal({ isOpen: false, mahasiswa: null, type: null });
      setUploadFile(null);
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      MySwal.fire({ icon: "error", title: "Upload Gagal", text: msg });
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="space-y-4 sm:space-y-6">
    
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md border">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-3 sm:p-4 rounded-lg shadow-md flex flex-col gap-3 sm:gap-4">

          {/* Filter Jurusan on left, Search on right - Mobile Stacked, Desktop Horizontal */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
            {/* Left side: Filter Jurusan */}
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-semibold text-white mb-2">
                Filter Jurusan
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {ALL_JURUSAN.map((j) => (
                  <button
                    key={j}
                    onClick={() => setSelectedJurusan(j)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition ${
                      selectedJurusan === j
                        ? "bg-white text-blue-600 shadow-md"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {formatJurusan(j)}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Search */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        {isLoading ? (
          <div className="text-center py-10 text-blue-500 flex flex-col items-center">
            <FiLoader className="h-8 w-8 animate-spin" />
            <p className="mt-2">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
            <FiAlertTriangle className="h-5 w-5" />
            <p className="font-medium">Error: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <FiUser size={14} className="text-blue-600" />
                      <span>Mahasiswa</span>
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap min-w-[100px]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <FiHash size={14} className="text-blue-600" />
                      <span>NIM</span>
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap min-w-[120px]">
                    <span>Pengajuan Judul</span>
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap min-w-[120px]">
                    <span>Proposal</span>
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap min-w-[120px]">
                    <span>Sidang Skripsi</span>
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">
                      Tidak ada mahasiswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((mhs) => (
                    <tr key={mhs.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2">
                        {mhs.nama}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap min-w-[100px]">
                        {mhs.nim}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap min-w-[120px]">
                        {mhs.file_sk_pembimbing && mhs.file_sk_pembimbing.trim() !== '' ? (
                          <button
                            onClick={() => window.open(mhs.file_sk_pembimbing!, "_blank")}
                            className="text-blue-600 font-semibold hover:text-blue-800 hover:underline"
                          >
                            Selesai
                          </button>
                        ) : mhs.judul_status === "DISETUJUI" ? (
                          <button
                            onClick={() => setUploadModal({ isOpen: true, mahasiswa: mhs, type: "judul" })}
                            className="text-blue-600 font-semibold hover:text-blue-800 hover:underline"
                          >
                            Upload SK
                          </button>
                        ) : (
                          <span className="text-gray-500">Belum Ada</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap min-w-[120px]">
                        {mhs.file_sk_proposal && mhs.file_sk_proposal.trim() !== '' ? (
                          <button
                            onClick={() => window.open(mhs.file_sk_proposal!, "_blank")}
                            className="text-green-600 font-semibold hover:text-green-800 hover:underline"
                          >
                            Selesai
                          </button>
                        ) : mhs.proposal_status === "DISETUJUI" ? (
                          <button
                            onClick={() => setUploadModal({ isOpen: true, mahasiswa: mhs, type: "proposal" })}
                            className="text-green-600 font-semibold hover:text-green-800 hover:underline"
                          >
                            Upload SK
                          </button>
                        ) : (
                          <span className="text-gray-500">Belum Ada</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap min-w-[120px]">
                        {mhs.file_sk_seminar && mhs.file_sk_seminar.trim() !== '' ? (
                          <button
                            onClick={() => window.open(mhs.file_sk_seminar!, "_blank")}
                            className="text-purple-600 font-semibold hover:text-purple-800 hover:underline"
                          >
                            Selesai
                          </button>
                        ) : mhs.seminar_status === "DISETUJUI" ? (
                          <button
                            onClick={() => setUploadModal({ isOpen: true, mahasiswa: mhs, type: "seminar" })}
                            className="text-purple-600 font-semibold hover:text-purple-800 hover:underline"
                          >
                            Upload SK
                          </button>
                        ) : (
                          <span className="text-gray-500">Belum Ada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {uploadModal.isOpen && uploadModal.mahasiswa && uploadModal.type && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Upload SK - {uploadModal.mahasiswa.nama}
              </h2>
              <button
                onClick={() => setUploadModal({ isOpen: false, mahasiswa: null, type: null })}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-4 sm:p-6 space-y-4">
              <FileUploadBox
                id="sk-upload"
                label={
                  uploadModal.type === "judul"
                    ? "SK Pembimbing"
                    : uploadModal.type === "proposal"
                      ? "SK Penguji Proposal"
                      : "SK Penguji Sidang"
                }
                file={uploadFile}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setUploadFile(file);
                }}
                required
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModal({ isOpen: false, mahasiswa: null, type: null });
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isUploading ? "Mengunggah..." : "Unggah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
