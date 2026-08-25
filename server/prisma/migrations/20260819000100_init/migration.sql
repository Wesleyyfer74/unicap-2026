-- CreateTable
CREATE TABLE `administradores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `administradores_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscais` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fiscais_nome_idx`(`nome`),
    INDEX `fiscais_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alunos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `nomeCompleto` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `alunos_uuid_key`(`uuid`),
    INDEX `alunos_nomeCompleto_idx`(`nomeCompleto`),
    INDEX `alunos_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chamadas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fiscalId` INTEGER NOT NULL,
    `turno` ENUM('MATUTINO', 'INTEGRAL', 'NOTURNO') NOT NULL,
    `data` DATE NOT NULL,
    `status` ENUM('ABERTA', 'FINALIZADA') NOT NULL DEFAULT 'ABERTA',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chamadas_fiscalId_idx`(`fiscalId`),
    INDEX `chamadas_data_turno_idx`(`data`, `turno`),
    INDEX `chamadas_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presencas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamadaId` INTEGER NOT NULL,
    `alunoId` INTEGER NOT NULL,
    `registradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `presencas_alunoId_idx`(`alunoId`),
    INDEX `presencas_registradoEm_idx`(`registradoEm`),
    UNIQUE INDEX `presencas_chamadaId_alunoId_key`(`chamadaId`, `alunoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ocorrencias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamadaId` INTEGER NOT NULL,
    `alunoId` INTEGER NOT NULL,
    `fiscalId` INTEGER NOT NULL,
    `observacao` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ocorrencias_chamadaId_idx`(`chamadaId`),
    INDEX `ocorrencias_alunoId_idx`(`alunoId`),
    INDEX `ocorrencias_fiscalId_idx`(`fiscalId`),
    INDEX `ocorrencias_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `viagens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamadaId` INTEGER NOT NULL,
    `nomeMotorista` VARCHAR(191) NOT NULL,
    `fiscalId` INTEGER NOT NULL,
    `linhaRota` VARCHAR(191) NULL,
    `turno` ENUM('MATUTINO', 'INTEGRAL', 'NOTURNO') NULL,
    `horarioSaida` TIME(0) NULL,
    `horarioChegada` TIME(0) NULL,
    `hodometroSaida` DECIMAL(10, 1) NULL,
    `hodometroChegada` DECIMAL(10, 1) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `viagens_chamadaId_key`(`chamadaId`),
    INDEX `viagens_fiscalId_idx`(`fiscalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chamadas` ADD CONSTRAINT `chamadas_fiscalId_fkey` FOREIGN KEY (`fiscalId`) REFERENCES `fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presencas` ADD CONSTRAINT `presencas_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `chamadas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presencas` ADD CONSTRAINT `presencas_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocorrencias` ADD CONSTRAINT `ocorrencias_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `chamadas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocorrencias` ADD CONSTRAINT `ocorrencias_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocorrencias` ADD CONSTRAINT `ocorrencias_fiscalId_fkey` FOREIGN KEY (`fiscalId`) REFERENCES `fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viagens` ADD CONSTRAINT `viagens_chamadaId_fkey` FOREIGN KEY (`chamadaId`) REFERENCES `chamadas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viagens` ADD CONSTRAINT `viagens_fiscalId_fkey` FOREIGN KEY (`fiscalId`) REFERENCES `fiscais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
