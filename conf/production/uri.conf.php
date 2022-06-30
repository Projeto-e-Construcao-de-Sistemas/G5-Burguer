<?php

/*
 * URI configurations for development environment.
 */

$conf = [
    'host_controller_path' => [
        'adm.burguer.erick.tec.br' => ['$admin'],
    ],
    'dynamic' => $_SERVER['HTTP_HOST'] ?? 'http://burguer.erick.tec.br',
    'static'  => $_SERVER['HTTP_HOST'] ?? 'http://burguer.erick.tec.br',
    'secure'  => $_SERVER['HTTP_HOST'] ?? 'http://burguer.erick.tec.br',
    'adm'     => 'http://adm.burguer.erick.tec.br',
    'store'   => 'http://burguer.erick.tec.br',
];
$over_conf = [
    'cmd.shell' => [
        'dynamic' => 'http://burguer.erick.tec.br',
        'static'  => 'http://burguer.erick.tec.br',
        'secure'  => 'http://burguer.erick.tec.br',
    ],
    'www.burguer.erick.tec.br' => [
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
