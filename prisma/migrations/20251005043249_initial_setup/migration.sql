-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('MAHASISWA', 'ADMIN', 'KAPRODI') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nim` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `jurusan` ENUM('MATEMATIKA', 'SISTEM_INFORMASI') NOT NULL,

    UNIQUE INDEX `StudentProfile_userId_key`(`userId`),
    UNIQUE INDEX `StudentProfile_nim_key`(`nim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThesisSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `topik` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `status` ENUM('TERKIRIM', 'DIPERIKSA_ADMIN', 'DITOLAK_ADMIN', 'DIPROSES_KAPRODI', 'DISETUJUI') NOT NULL DEFAULT 'TERKIRIM',
    `catatanAdmin` TEXT NULL,
    `transkripUrl` VARCHAR(191) NULL,
    `uktUrl` VARCHAR(191) NULL,
    `konsultasiUrl` VARCHAR(191) NULL,
    `usulanPembimbing1` VARCHAR(191) NOT NULL,
    `usulanPembimbing2` VARCHAR(191) NOT NULL,
    `usulanPembimbing3` VARCHAR(191) NULL,
    `pembimbing1` VARCHAR(191) NULL,
    `pembimbing2` VARCHAR(191) NULL,
    `skPembimbingUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dosen` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jurusan` ENUM('MATEMATIKA', 'SISTEM_INFORMASI') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudentProfile` ADD CONSTRAINT `StudentProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThesisSubmission` ADD CONSTRAINT `ThesisSubmission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
