ALTER TABLE `users`
	CHANGE COLUMN `zip_code` `zip_code` VARCHAR(50) NULL COLLATE 'utf8_general_ci' AFTER `password`,
	DROP COLUMN `fb_id`;
