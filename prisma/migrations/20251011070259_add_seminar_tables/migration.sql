-- CreateTable
CREATE TABLE `ProposalSeminar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `proposalFileUrl` VARCHAR(191) NOT NULL,
    `lembarPersetujuanUrl` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `jadwalSidang` DATETIME(3) NULL,
    `nilai` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProposalSeminar_submissionId_key`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HasilSeminar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `skripsiFullUrl` VARCHAR(191) NOT NULL,
    `artikelJurnalUrl` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `jadwalSidang` DATETIME(3) NULL,
    `nilai` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HasilSeminar_submissionId_key`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProposalSeminar` ADD CONSTRAINT `ProposalSeminar_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `ThesisSubmission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HasilSeminar` ADD CONSTRAINT `HasilSeminar_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `ThesisSubmission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
