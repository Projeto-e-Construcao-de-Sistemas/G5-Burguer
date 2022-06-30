<?php

$baseDir = realpath(__DIR__ . '/..');
$GLOBALS['SYSTEM'] = [
    'SYSTEM_NAME'       => 'burguer',
    'SYSTEM_VERSION'    => [0, 0, 2],
    'PROJECT_CODE_NAME' => 'Mc Donalds',
    'CHARSET'           => 'UTF-8',
    'TIMEZONE'          => 'America/Sao_Paulo',

    'ACTIVE_ENVIRONMENT'   => '',
    'ENVIRONMENT_VARIABLE' => 'SPRINGY_ENVIRONMENT',
    'CONSIDER_PORT_NUMBER' => false,
    'ENVIRONMENT_ALIAS'    => [],

    // Web server doc root directory
    'ROOT_PATH'      => __DIR__,
    // Project root directory
    'PROJECT_PATH'   => $baseDir,
    // Springy library directory
    'SPRINGY_PATH'   => $baseDir . '/springy',
    // Configuration directory
    'CONFIG_PATH'    => $baseDir . '/conf',
    // Application directory
    'APP_PATH'       => $baseDir . '/app',
    // Application controllers directory
    'CONTROLER_PATH' => $baseDir . '/app/controllers',
    // Application classes directory
    'CLASS_PATH'     => $baseDir . '/app/classes',
    // Directory where the system writes data during the course of its operation
    'VAR_PATH'       => $baseDir . '/var',
    // Directory for the subdirectories with migration scripts
    'MIGRATION_PATH' => $baseDir . '/migration',
    // Vendor directory
    'VENDOR_PATH'    => $baseDir . '/vendor',
];
