ALTER TABLE `orders`
	CHANGE COLUMN `total_value` `total_value` DECIMAL(10,2) UNSIGNED NOT NULL AFTER `situation`;
