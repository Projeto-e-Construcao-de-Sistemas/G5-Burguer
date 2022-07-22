<?php

use Springy\DB\Where;

/**
 * Controller class for the main page.
 */
class My_Data_Controller extends StandardController
{
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = false;

    public function fillOrders()
    {
        $where = new Where();
        $where->condition(Order::COL_USER, $this->user->id);
        $orders = new Order();
        $orders->query($where, ['id' => 'DESC']);

        return $orders;
    }

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
        $this->template->assign('orders', $this->fillOrders());
        $this->template->display();
    }
}
