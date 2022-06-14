<?php

/**
 * Controller class for the register page.
 *
 */

use Springy\Kernel;

/**
 * Controller class for the main page.
 */
class Register_Controller extends StandardController
{

    /**
     * Sets all template variables for current logged in user.
     *
     * @return void
     */
    protected function checkUser()
    {
        if (!$this->user->isLoaded()) {
            Kernel::assignTemplateVar('userLoggedIn', false);

            return;
        }

        $this->_redirect('urlMenu');
    }

    public function _default()
    {
        $this->checkUser();
        $this->_template();
        $this->template->display();
    }
}
