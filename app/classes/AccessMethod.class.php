<?php

/**
 * Access Control List constantes.
 *
 */
class AccessMethod
{
    // Admin modules access types
    public const ACCESS_ADMIN = 'admin';
    public const ACCESS_READ = 'read';
    public const ACCESS_WRITE = 'write';

    // Special access types
    public const ACCESS_APPROVAL = 'approval';
    public const ACCESS_MANAGER = 'manager';
    public const ACCESS_SET_SELLER = 'set-seller';

    // Action methods
    public const METHOD_GET = 'GET';
    public const METHOD_PATCH = 'PATCH';
    public const METHOD_POST = 'POST';
    public const METHOD_PUT = 'PUT';
    public const METHOD_DELETE = 'DELETE';

    // System modules
    public const SYS_ROOT = 'root';
    public const SYS_ADM = '$admin';
    public const SYS_API = '$restful';
}
