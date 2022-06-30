<?php

class Forgot_Password_Controller extends StandardController
{
    public function __invoke()
    {
        if ($this->user->getPK()) {
            $this->_redirect('urlMenu');
        }

        $this->_template();
        $this->template->display();
    }
}
