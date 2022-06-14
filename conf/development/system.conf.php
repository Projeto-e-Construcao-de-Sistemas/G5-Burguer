<?php

/**
 * General system configutations.
 *
 * Development environment.
 */

$conf = [
    'debug'             => true,
    'ignore_deprecated' => true,
    'maintenance'       => false,
    'cache-control'     => 'no-cache',
    'bug_authentication' => [],
    'session'           => [
        'domain' => '.burguer.devlocal.com.br',
        'secure' => false,
    ],
    'system_internal_methods' => [
        'about' => true,
        'phpinfo' => true,
        'system_errors' => true,
        'test_error' => true,
    ],
];
