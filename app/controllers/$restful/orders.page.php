<?php

/**
 * RESTful API orders.
 *
 */

use Springy\Configuration;
use Springy\DB\Where;
use Springy\Session;

/**
 * Order_Users_Controller controller.
 */
class OrdersController extends BaseRESTController
{
    /** @var Order */
    protected $model;
    protected $modelObject = Order::class;
    protected $order;
    protected $adminLevelNeeded = false;

    /** @var OrderProduct */
    protected $ordProd;

    protected $routesDELETE = [
        'product',
    ];
    protected $routesPUT = [
        'approve',
        'done',
        'cancel',
        'create'
    ];

    /**
     * Hook function to verify the requisition and adjust the data that will be sent.
     *
     * @return void
     */
    public function _hookLoad()
    {
        $this->join['users'] = [
            'type' => 'LEFT OUTER',
            'on' => 'users.id = orders.user_id',
            'columns' => 'name AS `user_name`',
        ];
    }

    /**
     * Order manual aprovation action.
     *
     * URI: /rest/orders/:id:/approve
     *
     * @return void
     */
    protected function approve(): void
    {
        $this->model->situation = 1;
        $this->model->save();


        $this->_output([]);
    }

    /**
     * Order manual aprovation action.
     *
     * URI: /rest/orders/:id:/approve
     *
     * @return void
     */
    protected function done(): void
    {
        $this->model->situation = 2;
        $this->model->save();

        $this->_output([]);
    }

    /**
     * Order manual aprovation action.
     *
     * URI: /rest/orders/:id:/approve
     *
     * @return void
     */
    public function create(): void
    {
        if (!Session::get('cart')) {
            return;
        }

        $prodId = [];
        $total = 0;

        $session = Session::get('cart')['products'];

        $rua = $this->_data('rua');
        $bairro = $this->_data('bairro');
        $numero = $this->_data('numero');
        $comp = $this->_data('comp');
        $cep = $this->_data('cep');
        $pagamento = $this->_data('pagamento');

        if (
            !$rua
            || !$bairro
            || !$numero
            || !$cep
            || !$pagamento
        ) {
            $this->_killBadRequest();
        }

        foreach ($session as $key => $value) {
            $prodId[] = $key;
        }

        $prods = [];

        $where = new Where();
        $where->condition(Product::COL_ID, $prodId, Where::OP_IN);
        $products = new Product();
        $products->query($where);

        foreach ($products as $product) {
            $total += $products->price * (int) $session[$products->id]['qtty'];
        }

        $this->order = new Order();
        $this->order->user_id = (int)$this->user->id;
        $this->order->situation = (int)Order::SITUATION_NONE;
        $this->order->zip_code = $cep;
        $this->order->payment = (int)$pagamento;
        $this->order->address = $rua;
        $this->order->total_value = $total + config_get('app.delivery_tax');
        $this->order->number = $numero;
        $this->order->complement = $comp;
        $this->order->save();

        foreach ($products as $product) {
            $this->ordProd = new OrderProduct();
            $this->ordProd->order_id = $this->order->id;
            $this->ordProd->product_id = $product['id'];
            $this->ordProd->product_name = (string)$product['name'];
            $this->ordProd->quantity = (int)$session[$product['id']]['qtty'];
            $this->ordProd->unit_price = (float)$product['price'];
            $this->ordProd->observations = (string)$session[$product['id']]['obs'];
            $this->ordProd->save();
        }

        Session::set('cart', []);
        $this->_output([]);
    }

    /**
     * Order manual cancelation action.
     *
     * URI: /rest/orders/:id:/cancel
     *
     * @return void
     */
    protected function cancel(): void
    {
        $this->model->situation = 3;
        $this->model->save();

        $this->_output([]);
    }
}
