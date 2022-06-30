<?php

/**
 * General system configutations.
 *
 * Development environment.
 */

$conf = [
    'debug'             => false,
    'ignore_deprecated' => true,
    'maintenance'       => false,
    'cache-control'     => 'no-cache',
    'bug_authentication' => [],
    'session'           => [
        'domain' => '.burguer.erick.tec.br',
        'secure' => false,
    ],
    'system_internal_methods' => [
        'about' => false,
        'phpinfo' => false,
        'system_errors' => true,
        'test_error' => false,
    ],
];
