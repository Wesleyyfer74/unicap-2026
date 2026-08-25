ALTER TABLE `alunos`
  ADD COLUMN `cpfHash` CHAR(64) NULL AFTER `uuid`,
  ADD UNIQUE INDEX `alunos_cpfHash_key` (`cpfHash`);
