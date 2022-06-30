<?php

/**
 * Controller class for the main page.
 */
class My_Data_Controller extends StandardController
{
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = false;

    /**
     * Default endpoint method.
     */
    public function __invoke()
    {
        if (!$this->user->isLoaded()) {
            $this->_redirect('urlHome');
            return;
        }

        $this->_template();
        $this->template->display();
    }
}
