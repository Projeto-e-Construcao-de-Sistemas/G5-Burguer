<?php

$conf = [

    'delivery_tax' => (int) getenv('DELIVERY_TAX'),

    'social' => [
        'facebook_app_id' => getenv('FB_APP_ID'),
        'facebook_app_secret' => getenv('FB_APP_SECRET'),
    ],

    'integrations' => [
        'sendgrid' => [
            'unsubscribe_group'  => 937,
            'newsletter_list_id' => 540000,
        ],
    ],

    /*
     * Known bad domains for e-mail.
     */
    'bad_domains' => [
        'ail.com',
        'ayhoo.com',
        'g-mail.com',
        'gamil.com',
        'gmai.com',
        'gmail.co.com',
        'gmaill.com',
        'gmal.com',
        'gmil.com',
        'gnail.com',
        'hitmail.com',
        'hmail.com',
        'hotma.com',
        'hotmai.com',
        'hotmal.com',
        'hotmaul.com',
        'hotmil.com',
        'hotmsil.com',
        'gmaul.com',
        'gmsil.com',
        'mail.ru',
        'rotmail.com',
        'uahoo.com.br',
        'yaboo.com.br',
        'yaho.com',
        'yaoo.com',
        'yhoo.com',
    ],

    'mail' => [
        'exemplo' => [
            'mail_template' => 'd-857f4eb1e4924a38ad8340899bfed70d',
            'subject' => 'Bem-vindo ao Quero Burguer!',
            'category' => 'user-welcome',
        ],
    ],
];
