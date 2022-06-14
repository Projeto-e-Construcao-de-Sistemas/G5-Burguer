<?php

/**
 * Sign out page.
 *
 */

use Springy\Cookie;

/**
 * Logout controller.
 */
class Logout_Controller extends StandardController
{
    /**
     * Constructor method.
     */
    function __construct()
    {
        app('user.auth.manager')->logout();

        Cookie::delete('nlmck');

        session_regenerate_id();
        session_destroy();
        $this->_redirect('home', [], []);
    }
}
