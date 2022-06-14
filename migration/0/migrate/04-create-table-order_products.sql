CREATE TABLE `order_products` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`order_id` INT(10) UNSIGNED NOT NULL,
	`situation` INT(10) UNSIGNED NOT NULL,
	`product_id` INT(10) UNSIGNED NOT NULL,
	`product_name` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci',
	`quantity` INT(10) UNSIGNED NOT NULL,
	`unit_price` DECIMAL(10.2) UNSIGNED NOT NULL,
	`observations` VARCHAR(200) NOT NULL COLLATE 'utf8_general_ci',
	`deleted` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	INDEX `order_id` (`order_id`),
	INDEX `situation` (`situation`),
	INDEX `product_id` (`product_id`),
	INDEX `deleted` (`deleted`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
