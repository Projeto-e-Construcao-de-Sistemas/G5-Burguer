<?php

/**
 * Controller class for the main page.
 *
 */

use Springy\DB\Where;
use Springy\Kernel;
use Springy\Session;

/**
 * Controller class for the main page.
 */
class Checkout_Controller extends StandardController
{
    /**
     * Set the template variables.
     *
     * @return void
     */
    private function fillTemplate()
    {
        $total = 0;

        if (!Session::get('cart')) {
            return;
        }

        $session = Session::get('cart')['products'];
        $prodId = [];

        foreach ($session as $key => $value) {
            $prodId[] = $key;
        }

        $where = new Where();
        $where->condition(Product::COL_ID, $prodId, Where::OP_IN);
        $product = new Product();
        $product->query($where);

        while ($product->valid()) {
            $session[$product->id]['name'] = $product->name;
            $session[$product->id]['desc'] = $product->description;
            $session[$product->id]['price'] = $product->price;
            $total += $product->price * (int) $session[$product->id]['qtty'];
            $product->next();
        }

        $total += config_get('app.delivery_tax');

        $this->template->assign('tax', config_get('app.delivery_tax'));
        $this->template->assign('products', $session);
        $this->template->assign('total', $total);
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
