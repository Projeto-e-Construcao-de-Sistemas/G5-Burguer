ALTER TABLE `products`
	CHANGE COLUMN `url` `url` VARCHAR(150) NULL COLLATE 'utf8_general_ci' AFTER `description`;
