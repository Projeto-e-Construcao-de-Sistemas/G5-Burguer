<?php

$conf = [
    'routes' => [
        'api\/([^\/]*)?(\/(.*)?)?(\?(.*))*' => [
            'segment' => 1,
            'controller' => '$1',
            'root_controller' => ['$restful'],
        ],
    ],
    'redirects' => [
        '_' => [
            'segments' => [],
            'get' => [],
            'force_rewrite' => false,
            'host' => 'dynamic',
            'type' => 302,
        ],
        '404' => [
            'segments' => [],
            'get' => [],
            'force_rewrite' => false,
            'host' => 'dynamic',
            'type' => 301,
        ],
    ],
    'prevalidate_controller' => [
        // 'mycontroller'      => ['command' => 301, 'segments' => 2],
        // 'myothercontroller' => ['command' => 404, 'segments' => 2, 'validate' => ['/^[a-z0-9\-]+$/', '/^[0-9]+$/']],
    ],
    'host_controller_path' => [
        'cmd.shell' => ['$command'],
    ],
    'system_root' => '/',
    'register_method_set_common_urls' => null,
    // URLs comuns do site
    'common_urls' => [
        // Administrativo
        'urlAdministrative' => [[], [], false, 'adm', true],
        'urlAdmSignOut'     => [['logout'], [], false, 'adm', true],

        'urlHome'           => [[], [], false, 'store', true],
        'urlMyData'           => [['my-data'], [], false, 'store', true],
        'urlMenu'           => [['menu'], [], false, 'store', true],
        'urlSignOut'        => [['logout'], [], false, 'store', true],

    ],
    'redirect_last_slash'  => true,
    'force_slash_on_index' => true,
    'ignored_segments'     => 0,
    'assets_dir'           => 'assets',
];
