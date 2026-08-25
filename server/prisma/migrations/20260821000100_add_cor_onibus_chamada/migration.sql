ALTER TABLE `chamadas`
  ADD COLUMN `corOnibus` VARCHAR(50) NOT NULL DEFAULT 'Não informada' AFTER `turno`;
