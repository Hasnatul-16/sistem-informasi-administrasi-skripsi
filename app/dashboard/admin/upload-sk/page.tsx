import AdminUploadSKClient from "./AdminUploadSKClient";

export default function AdminUploadSKPage() {
  return (
    <main className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
          Upload SK (Surat Keputusan)
        </h1>
      </div>

      <p className="text-sm sm:text-base text-gray-600 break-words">
        Upload SK pembimbing, SK penguji proposal, dan SK penguji sidang mahasiswa yang telah di TTE.
      </p>

      <AdminUploadSKClient />
    </main>
  );
}
