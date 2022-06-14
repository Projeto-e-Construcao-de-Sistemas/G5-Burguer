CREATE TABLE `products` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`type` TINYINT(10) UNSIGNED NOT NULL DEFAULT '0',
	`situation` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	`name` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci',
	`description` VARCHAR(300) NOT NULL COLLATE 'utf8_general_ci',
	`price` DECIMAL(10.2) UNSIGNED NOT NULL,
	`deleted` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	INDEX `name` (`name`),
	INDEX `type` (`type`),
	INDEX `situation` (`situation`),
	INDEX `deleted` (`deleted`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
