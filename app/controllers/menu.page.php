<?php

/**
 * Controller class for the menu page.
 *
 */

use Springy\DB\Where;

/**
 * Controller class for the main page.
 */
class Menu_Controller extends StandardController
{
    protected function getProducts() {
        $where = new Where();
        $where->condition(Product::COL_SITUATION, ProductStatus::ACTIVE);
        $product = new Product();
        $product->query($where);

        return $product;
    }

    public function __invoke()
    {
        if (!$this->user->isLoaded()) {
            $this->_redirect('urlHome');
            return;
        }

        $this->_template();
        $this->template->assign('products', $this->getProducts());
        $this->template->display();
    }
}
