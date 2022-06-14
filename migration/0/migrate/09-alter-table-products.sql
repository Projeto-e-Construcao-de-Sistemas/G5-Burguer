ALTER TABLE `products`
	ADD COLUMN `url` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci' AFTER `description`;
