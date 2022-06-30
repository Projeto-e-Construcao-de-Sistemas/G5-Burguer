ALTER TABLE `products`
	CHANGE COLUMN `url` `path` VARCHAR(150) NULL DEFAULT NULL COLLATE 'utf8_general_ci' AFTER `description`;
