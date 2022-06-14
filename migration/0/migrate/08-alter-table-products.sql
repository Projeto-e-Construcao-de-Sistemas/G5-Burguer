ALTER TABLE `products`
	CHANGE COLUMN `price` `price` DECIMAL(10,2) UNSIGNED NOT NULL AFTER `description`;