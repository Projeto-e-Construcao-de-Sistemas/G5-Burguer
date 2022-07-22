<?php

/**
 * API REST controller to cart actions.
 */

use Springy\DB\Where;
use Springy\Session;
use Springy\URI;

/**
 * Cart API controller.
 */
class Cart_Controller extends BaseRESTController
{
    protected $authenticationNeeded = false;
    protected $adminLevelNeeded = false;

    /** @var CartHelper */
    private $cart;

    /**
     * Constructor.
     *
     * Loads the cart from session.
     */
    public function __construct()
    {
        $this->cart = Session::get('cart') ?: $this->newCart();

        parent::__construct();
    }

    /**
     * Returns a new cart structured array.
     *
     * @return array
     */
    private function newCart(): array
    {
        return [
            'products' => [],
        ];
    }

    /**
     * Overwrites the default method.
     */
    public function _default()
    {
        $key = URI::getSegment(0);

        if ($this->isGet()) {
            $this->_killNotImplemented();
        } elseif ($this->isPost()) {
            $this->addToCart();
        } elseif ($this->isPut() && $key) {
            $this->updateCartItemQuantity($key);
        } elseif ($this->isDelete()) {
            $this->deleteCart();
        }

        $this->_killNotImplemented();
    }

    /**
     * Sends the JSON.
     *
     * @param string $key
     * @param mixed  $moreInfo
     *
     * @return void
     */
    private function jsonResult($key, $moreInfo = null)
    {
        $this->_output([
            'cartItem' => $this->cart->getItemAsArray($key),
        ]);
    }

    /**
     * Returns true if the item exists in cart.
     *
     */
    public function hasItem($key)
    {
        return isset($this->cart['products'][$key]);
    }

    /**
     * Changes the quantity of an item.
     *
     * @param string  $key
     * @param integer $quantity
     *
     * @return void
     */
    public function changeItemQuantity($key, $quantity): void
    {
        if (!$this->hasItem($key)) {
            return;
        }

        // Update item quantity
        $this->cart['products'][$key]['qtty'] = (int)$quantity;
        if ($this->cart['products'][$key]['qtty'] < 1) {
            unset($this->cart['products'][$key]);
        }
    }

    public function addItem($key, $qtty, $obs): void
    {
        $this->cart['products'][$key]['qtty'] = $qtty;
        $this->cart['products'][$key]['obs'] = $obs ?? '';

        return;
    }

    /**
     * Adds item to cart.
     *
     * @return void
     */
    private function addToCart()
    {
        $productId = $this->_data('id');
        $qtty = $this->_data('qtty');
        $obs = $this->_data('observations');

        if (!is_int($productId) || !is_int($qtty) || !is_string($obs)) {
            $this->_killBadRequest();
        }

        // Item already in cart?
        if (isset($this->cart['products']->$productId)) {
            $this->cart->changeItemQuantity($productId, $this->cart->getItemQuantity($productId) + 1);
            $this->cart->saveInSession();

            $this->jsonResult($productId);
        }

        // Add item to cart into session
        $this->addItem($productId, $qtty, $obs);
        Session::set('cart', $this->cart);

        $this->jsonResult($productId);

    }

    /**
     * Removes a item from the cart.
     *
     * @param string $key
     *
     * @return void
     */
    private function deleteCart()
    {
        Session::set('cart', []);

        $this->_output([]);
    }

    /**
     * Updates the quantity of an item of the cart.
     *
     * The quantity is defined in 'quantity' entry of the request.
     *
     * @param string $key
     *
     * @return void
     */
    private function updateCartItemQuantity($key)
    {
        if ($this->_data('quantity') === null || !is_numeric($this->_data('quantity'))) {
            $this->_killBadRequest();
        }

        if (!$this->cart->hasItem($key)) {
            $this->_kill(412, 'Esse produto não está em seu carrinho.');
        }

        $old = clone $this->cart->getItem($key);

        // Update item quantity
        $this->cart->changeItemQuantity($key, $this->_data('quantity'));
        $this->cart->saveInSession();

        $this->jsonResult($key, $old->asArray());
    }

}
