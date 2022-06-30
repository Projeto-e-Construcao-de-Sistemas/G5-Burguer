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
        'welcome-email' => [
            'mail_template' => 'd-d4173fff790549a2892435c6dd047cc8',
            'subject' => 'Bem-vindo ao Quero Burguer!',
        ],
        'password-reset' => [
            'mail_template' => 'd-96c596cf21a04cddbbd2eef67a39f3b4',
            'subject' => 'Troca de senha',
        ],
    ],
];
