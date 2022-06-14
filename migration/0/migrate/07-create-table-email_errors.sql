CREATE TABLE `email_errors` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`email` VARCHAR(150) NOT NULL COLLATE 'utf8_general_ci',
	`error_type` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
	`error_at` DATETIME NOT NULL,
	`status_code` VARCHAR(10) NOT NULL COLLATE 'utf8_general_ci',
	`reason` MEDIUMTEXT NOT NULL COLLATE 'utf8_general_ci',
	`created_at` DATETIME NOT NULL,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
	`deleted` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	INDEX `email` (`email`),
	INDEX `error_type` (`error_type`),
	INDEX `error_at` (`error_at`),
	INDEX `created_at` (`created_at`),
	INDEX `deleted` (`deleted`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
