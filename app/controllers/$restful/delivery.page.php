<?php

/**
 * RESTful API controller to products.
 *
 */

use Springy\Configuration;

/**
 * Products controller class.
 */
class Delivery_Controller extends BaseRESTController
{

    public function __invoke()
    {
        if (!$this->isPut()) {
            $this->_killNotImplemented();
        }

        $delivery =(int) $this->_data('delivery_tax');
        Configuration::set('app','delivery_tax', $delivery);
        Configuration::save('app');

        $this->_output([], self::HTTP_NO_CONTENT);
    }
}
