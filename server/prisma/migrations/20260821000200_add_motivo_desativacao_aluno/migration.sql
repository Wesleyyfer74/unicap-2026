ALTER TABLE `alunos`
  ADD COLUMN `motivoDesativacao` TEXT NULL AFTER `ativo`,
  ADD COLUMN `desativadoEm` DATETIME(3) NULL AFTER `motivoDesativacao`;
