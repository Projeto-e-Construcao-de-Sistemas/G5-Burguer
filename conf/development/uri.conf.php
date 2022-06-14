<?php

/*
 * URI configurations for development environment.
 */

$conf = [
    'host_controller_path' => [
        'adm.burguer.devlocal.com.br' => ['$admin'],
    ],
    'dynamic' => $_SERVER['HTTP_HOST'] ?? 'http://burguer.devlocal.com.br',
    'static'  => $_SERVER['HTTP_HOST'] ?? 'http://burguer.devlocal.com.br',
    'secure'  => $_SERVER['HTTP_HOST'] ?? 'http://burguer.devlocal.com.br',
    'adm'     => 'http://adm.burguer.devlocal.com.br',
    'store'   => 'http://burguer.devlocal.com.br',
];
$over_conf = [
    'cmd.shell' => [
        'dynamic' => 'http://burguer.devlocal.com.br',
        'static'  => 'http://burguer.devlocal.com.br',
        'secure'  => 'http://burguer.devlocal.com.br',
    ],
    'www.burguer.devlocal.com.br' => [
        'redirects' => [
            '(.+)?' => [
                'segments'      => [],
                'get'           => [],
                'force_rewrite' => false,
                'host'          => 'portal',
                'type'          => 301,
            ],
        ],
    ],
];
