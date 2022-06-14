ALTER TABLE `users`
	CHANGE COLUMN `cep` `zip_code` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci' AFTER `password`,
	DROP INDEX `cep`,
	ADD INDEX `cep` (`zip_code`) USING BTREE;
