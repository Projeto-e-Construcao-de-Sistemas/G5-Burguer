<?php

$conf = [
    'default_driver' => 'default',
    // Drivers
    'mailers'        => [
        'default' => [
            'driver'  => 'sendgrid',
            'apikey'  => getenv('SG_API_KEY'),
            'options' => [
                'protocol'                  => 'https',
                'raise_exceptions'          => false,
                'turn_off_ssl_verification' => false,
            ],
        ],
    ],

    // Mail to notify system errors (used by framework)
    'errors_go_to' => 'erick@fval.com.br',

    // System Admin (used by framework)
    'system_adm_mail' => 'erick@fval.com.br',
    'system_adm_name' => 'System Admin',

    // Default Application Mail Sender
    'app_sender_mail' => 'erick@fval.com.br',
    'app_sender_name' => 'Quero Burguer',
];
