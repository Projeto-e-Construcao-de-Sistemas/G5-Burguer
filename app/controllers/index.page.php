<?php

/**
 * Controller class for the main page.
 *
 */

use Springy\Kernel;

/**
 * Controller class for the main page.
 */
class Index_Controller extends StandardController
{
    /** @var bool turning off the cache of the page */
    protected $tplIsCached = false;
    /** @var int 5 minutes cache life time. */
    protected $tplCacheTime = 300;

    /**
     * Set the template variables.
     *
     * @return void
     */
    private function fillTemplate()
    {
        // If cache is valid, return
        if ($this->template->isCached()) {
            return;
        }
    }

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

    /**
     * Default endpoint method.
     */
    public function _default()
    {
        $this->checkUser();
        $this->_template();
        $this->fillTemplate();
        $this->template->display();
    }
}
