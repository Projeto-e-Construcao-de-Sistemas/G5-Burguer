CREATE TABLE `orders` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`user_id` INT(10) UNSIGNED NOT NULL,
	`situation` TINYINT(3) UNSIGNED NOT NULL,
	`total_value` DECIMAL(11.2) UNSIGNED NOT NULL,
	`shipping_value` DECIMAL(11.2) UNSIGNED NOT NULL,
	`zip_code` VARCHAR(9) NOT NULL DEFAULT '00000-000' COLLATE 'utf8_general_ci',
	`address` VARCHAR(125) NOT NULL DEFAULT '',
	`number` VARCHAR(20) NOT NULL DEFAULT '',
	`complement` VARCHAR(200) NOT NULL DEFAULT '',
    `deleted` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	INDEX `user_id` (`user_id`),
	INDEX `situation` (`situation`),
	INDEX `total_value` (`total_value`),
	INDEX `Coluna 6` (`shipping_value`),
	INDEX `zip_code` (`zip_code`),
    INDEX `deleted` (`deleted`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
