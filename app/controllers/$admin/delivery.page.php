<?php

/**
 * Controller class for the administrative page.
 *
 */
class Delivery_Controller extends AdministrativeController
{
    public function __invoke()
    {
        $this->_template();
        $this->template->assign(
            'delivery_tax',
            config_get('app.delivery_tax')
        );

        $this->template->display();
    }
}
