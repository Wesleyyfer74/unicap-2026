ALTER TABLE `fiscais` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `alunos` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `fiscais_deletedAt_idx` ON `fiscais`(`deletedAt`);
CREATE INDEX `alunos_deletedAt_idx` ON `alunos`(`deletedAt`);
