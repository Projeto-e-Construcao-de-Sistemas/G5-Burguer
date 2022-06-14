CREATE TABLE `users` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`admin` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	`email` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci',
	`fb_id` VARCHAR(36) NULL COLLATE 'utf8_general_ci',
	`avatar_url` VARCHAR(255) NULL DEFAULT NULL,
	`name` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci',
	`password` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci',
	`cep` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`phone` VARCHAR(20) NOT NULL COLLATE 'utf8_general_ci',
	`deleted` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	UNIQUE INDEX `email` (`email`),
	INDEX `name` (`name`),
	INDEX `cep` (`cep`),
	INDEX `deleted` (`deleted`),
	INDEX `admin` (`admin`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
