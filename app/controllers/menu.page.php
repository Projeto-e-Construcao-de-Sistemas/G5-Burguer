<?php

/**
 * Controller class for the menu page.
 *
 */

use Springy\Configuration;
use Springy\DB\Where;
use Springy\Kernel;

/**
 * Controller class for the main page.
 */
class Menu_Controller extends StandardController
{
    protected function getPds() {
        $where = new Where();
        $where->condition(Product::COL_SITUATION, ProductStatus::ACTIVE);
        $products = new Product();
        $products->query($where);

        return $products;
    }

    public function __invoke()
    {
        if (!$this->user->isLoaded()) {
            $this->_redirect('urlHome');
            return;
        }

        $this->_template();
        $this->template->assign('products', $this->getPds());
        $this->template->display();
    }
}
