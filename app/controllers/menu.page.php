<?php

/**
 * Controller class for the menu page.
 *
 */

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

        // foreach ($products as $product => &$val) {
        //     $val['newUrl'] = Kernel::path(Kernel::PATH_ROOT) . DS . 'productImages' . DS . $val['url'];
        // }
        // while ($products->valid()) {
        //     $products->url = Kernel::path(Kernel::PATH_ROOT) . DS . 'productImages' . DS . $products->url;
        //     $products->next();
        // }
        // dd($products);
        // dd(__LINE__);

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
        // dd($this->getPds());
        $this->template->display();
    }
}
