<?php

$conf = [
    '_migration' => [
        'table_name' => '_database_version_control',
    ],
    'default' => [
        'database_type' => 'mysql',
        'host_name'     => getenv('DB_HOST'),
        'user_name'     => getenv('DB_USER'),
        'password'      => getenv('DB_PASS'),
        'database'      => getenv('DB_NAME'),
        'charset'       => 'utf8mb4',
        'persistent'    => false,
    ],
];
