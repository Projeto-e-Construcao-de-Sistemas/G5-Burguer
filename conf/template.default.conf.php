<?php

$conf = [
    'template_engine' => 'smarty',
    'debug' => false,
    'strict_variables' => true,

    'debugging_ctrl'         => 'NONE', // NONE or URL
    'default_template_path'  => sysconf('APP_PATH') . DS . 'templates_default',
    'template_path'          => sysconf('APP_PATH') . DS . 'templates',
    'template_config_path'   => sysconf('APP_PATH') . DS . 'templates_conf',
    'compiled_template_path' => sysconf('VAR_PATH') . DS . 'compiled',
    'template_cached_path'   => sysconf('VAR_PATH') . DS . 'cache',
    'use_sub_dirs'           => false,
    'errors'                 => [
        403 => '_error403',
        404 => '_error404',
        500 => '_error500',
        503 => '_error503',
    ],
];
