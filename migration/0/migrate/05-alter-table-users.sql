ALTER TABLE `users`
	ADD COLUMN `uuid` VARCHAR(36) NOT NULL COLLATE 'utf8_general_ci' AFTER `id`,
	ADD UNIQUE INDEX `uuid` (`uuid`);
