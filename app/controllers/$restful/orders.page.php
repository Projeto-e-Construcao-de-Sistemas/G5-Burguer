<?php

/**
 * RESTful API orders.
 *
 */

use Springy\DB\Where;
use Springy\URI;
use Springy\Utils\Strings;

/**
 * Order_Users_Controller controller.
 */
class OrdersController extends BaseRESTController
{

    /** @var Order */
    protected $model;
    protected $modelObject = Order::class;
    protected $dataFilters = [
        'approvedAtFrom' => 'filterApprovedAtFrom',
        'approvedAtUntil' => 'filterApprovedAtUntil',
        'createdAtFrom' => 'filterCreatedAtFrom',
        'createdAtUntil' => 'filterCreatedAtUntil',
        'productId' => 'filterWithProducts',
        'storeId' => 'filterWithStores',
        'itemId' => 'filterWithItem',
        'referral' => 'filterArrayOrInt',
        'situation' => 'filterSituation',
        'user_id' => 'filterArrayOrInt',
    ];
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = true;
    protected $routesDELETE = [
        'product',
    ];
    protected $routesPUT = [
        'approve',
        'cancel',
        'commissionate',
        'delivered',
        'paidout',
        'paystore',
        'refund',
        'set-seller',
    ];

    /**
     * Embed children data if required.
     *
     * @return void
     */
    private function embedChildren(): void
    {
        if ($this->_data('embdc') != 1) {
            return;
        }

        $this->embeddedObj = [
            'user' => [
                'model' => User::class,
                'type' => 'data',
                'found_by' => 'id',
                'column' => Order::COL_USER,
                'columns' => [
                    'id',
                    'name',
                    'email',
                    'avatar_url',
                ],
            ],
            'seller' => [
                'model' => User::class,
                'type' => 'data',
                'found_by' => 'id',
                'column' => Order::COL_SELLER,
                'columns' => [
                    'id',
                    'name',
                    'email',
                    'avatar_url',
                ],
            ],
            'addresses' => [
                'model' => OrderAddress::class,
                'type' => 'list',
                'found_by' => 'order_id',
                'column' => 'id',
            ],
            'products' => [
                'model' => OrderProduct::class,
                'type' => 'list',
                'found_by' => OrderProduct::COL_ORDER,
                'column' => Order::COL_ID,
                'embedded_obj' => [
                    'store' => [
                        'model' => OrderStore::class,
                        'type' => 'data',
                        'found_by' => OrderStore::COL_ORDER_PRODUCT,
                        'column' => OrderProduct::COL_ID,
                    ],
                    'shipments' => [
                        'model' => OrderShipping::class,
                        'type' => 'list',
                        'found_by' => 'order_product_id',
                        'column' => OrderProduct::COL_ID,
                    ],
                    'commissioning' => [
                        'model' => OrderCommission::class,
                        'type' => 'list',
                        'found_by' => OrderCommission::COL_ORDER_PRODUCT,
                        'column' => OrderProduct::COL_ID,
                    ],
                    'purchase_order' => [
                        'model' => PurchaseOrderItem::class,
                        'type' => 'data',
                        'found_by' => 'order_product_id',
                        'column' => OrderProduct::COL_ID,
                    ]
                ],
            ],
            'transactions' => [
                'model' => OrderTransaction::class,
                'type' => 'list',
                'found_by' => OrderTransaction::COL_ORDER,
                'column' => Order::COL_ID,
            ],
        ];
        $this->dataJoin = 2;
    }

    /**
     * Sets the join with order items.
     *
     * @return void
     */
    private function setJoinItems(): void
    {
        if (isset($this->join['order_products'])) {
            return;
        }

        $this->join['order_products'] = [
            'type' => 'INNER',
            'on' => 'order_products.order_id = orders.id AND order_products.deleted = 0',
            'columns' => [
                'order_products.product_id',
                'COUNT(0) AS childs',
            ],
        ];
        $this->groupBy = [
            'orders.id',
            'order_products.product_id',
        ];
    }

    /**
     * Hook function to verify the requisition and adjust the data that will be sent.
     *
     * @return void
     */
    protected function _hookLoad()
    {
        $draw = (int) $this->_data('draw', 0);
        $withJoin = (int) $this->_data('wu', 0);

        if (!$draw && !$withJoin) {
            $this->embedChildren();

            return;
        }

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
        if ($this->model->situation != Order::SITUATION_WAITING) {
            $this->_kill(self::HTTP_PRECONDITION_FAILED, 'Pedido não está aguardando pagamento.');
        }

        $log = $this->getReasonLog();
        $service = new OrderService($this->model);
        $service->approve($log, $this->user->getPK());

        $this->_output(
            $this->_parseRow(
                $this->model->get()
            ),
            self::HTTP_OK
        );
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
        $cancelable = [
            Order::SITUATION_APPROVED,
            Order::SITUATION_WAITING,
        ];

        if (!in_array($this->model->situation, $cancelable)) {
            $this->_kill(self::HTTP_PRECONDITION_FAILED, 'Pedido não pode ser cancelado.');
        }

        $log = $this->getReasonLog();
        $service = new OrderService($this->model);
        $service->cancel($log, $this->user->getPK(), true);

        $this->_output(
            $this->_parseRow(
                $this->model->get()
            ),
            self::HTTP_OK
        );
    }

    /**
     * Action to release commissions for the product.
     *
     * URI: /rest/orders/:id1:/commissionate/:id2:
     *
     * @return void
     */
    protected function commissionate(): void
    {
        $prodId = $this->getItemIdSegment();

        if (!$this->isPut()) {
            $this->_killNotFound();
        }

        $orderItem = $this->getItem($prodId);

        if ((int) $orderItem->situation == OrderProduct::SITUATION_CANCELED) {
            $this->_kill(self::HTTP_PRECONDITION_FAILED, 'Item não pode ser comissionado.');
        }

        $where = new Where();
        $where->condition('order_product_id', (int) $orderItem->id);
        $where->condition('commission_type', OrderCommission::COMM_TYPE_RT);
        $where->condition('payment_released', OrderCommission::PAYMENT_BLOCKED);

        $commissions = new OrderCommission();
        $commissions->query($where);

        while ($commissions->valid()) {
            $value = (float) $commissions->commission_value;
            $professional = $this->getAffiliateRecord((int) $commissions->user_id);

            if ($value > 0 && $professional->isLoaded()) {
                $this->createAffiliateStatement(
                    $professional,
                    ProfessionalStatement::TT_ORDER_COMPLETED,
                    $value,
                    (int) $commissions->order_product_id
                );
            }

            $commissions->payment_released = OrderCommission::PAYMENT_RELEASED;
            $commissions->save();
            $commissions->next();
        }

        $this->_output([], self::HTTP_NO_CONTENT);
    }

    /**
     * Sets an order product as delivered.
     *
     * URI: /rest/orders/:id1:/delivered/:id2:
     *
     * @return void
     */
    protected function delivered(): void
    {
        $prodId = $this->getItemIdSegment();

        if (!$this->isPut()) {
            $this->_killNotFound();
        }

        $orderItem = $this->getItem($prodId);

        if (
            !in_array(
                (int) $orderItem->situation,
                [
                OrderProduct::SITUATION_PROCESSING,
                OrderProduct::SITUATION_SHIPPED,
                ]
            )
        ) {
            $this->_kill(self::HTTP_PRECONDITION_FAILED, 'Item não pode ser declarado entregue.');
        }

        $orderItem->situation = OrderProduct::SITUATION_SHIPPED;
        $service = new OrderService($this->model);
        $service->setItemAsDelivered($orderItem);

        if ($orderItem->situation != OrderProduct::SITUATION_DELIVERED) {
            $this->_kill(self::HTTP_CONFLICT, 'Situação do item não foi alterada.');
        }

        $this->_output([], self::HTTP_NO_CONTENT);
    }

    /**
     * Filters with greater or equal using created_at column.
     *
     * @param Where  $where
     * @param string $value
     *
     * @return void
     */
    protected function filterApprovedAtFrom(Where $where, $value): void
    {
        $this->filterGreaterEqual(
            $where,
            $this->validateDateInput($value) . ' 00:00:00',
            'orders.approved_at'
        );
    }

    /**
     * Filters with less than or equal using created_at column.
     *
     * @param Where  $where
     * @param string $value
     *
     * @return void
     */
    protected function filterApprovedAtUntil(Where $where, $value): void
    {
        $this->filterLessEqual(
            $where,
            $this->validateDateInput($value) . ' 23:59:59',
            'orders.approved_at'
        );
    }

    /**
     * Filters with greater or equal using created_at column.
     *
     * @param Where  $where
     * @param string $value
     *
     * @return void
     */
    protected function filterCreatedAtFrom(Where $where, $value): void
    {
        $this->filterGreaterEqual(
            $where,
            $this->validateDateInput($value) . ' 00:00:00',
            'orders.created_at'
        );
    }

    /**
     * Filters with less than or equal using created_at column.
     *
     * @param Where  $where
     * @param string $value
     *
     * @return void
     */
    protected function filterCreatedAtUntil(Where $where, $value): void
    {
        $this->filterLessEqual(
            $where,
            $this->validateDateInput($value) . ' 23:59:59',
            'orders.created_at'
        );
    }

    /**
     * Filters orders by its situation.
     *
     * This gateway function avoids ambigous columns with table joins.
     *
     * @param Where  $where
     * @param [type] $value
     *
     * @return void
     */
    protected function filterSituation(Where $where, $value): void
    {
        $this->filterArrayOrInt($where, $value, 'orders.situation');
    }

    /**
     * Filters orders with selected products.
     *
     * @param Where     $where
     * @param array|int $value
     *
     * @return void
     */
    protected function filterWithProducts(Where $where, $value): void
    {
        $this->setJoinItems();
        $this->filterArrayOrInt($where, $value, 'order_products.product_id');
    }

    /**
     * Filters orders with selected products.
     *
     * @param Where     $where
     * @param array|int $value
     *
     * @return void
     */
    protected function filterWithItem(Where $where, $value): void
    {
        $this->setJoinItems();
        $this->filterArrayOrInt($where, $value, 'order_products.id');
    }

    /**
     * Filters orders with selected stores.
     *
     * @param Where     $where
     * @param array|int $value
     *
     * @return void
     */
    protected function filterWithStores(Where $where, $value): void
    {
        $this->setJoinItems();

        $this->join['order_stores'] = [
            'type' => 'INNER',
            'on' => 'order_stores.order_product_id = order_products.id AND order_stores.deleted = 0',
            'columns' => ['order_stores.store_id'],
        ];
        $this->groupBy[] = 'order_stores.store_id';

        $this->filterArrayOrInt($where, $value, 'order_stores.store_id');
    }

    /**
     * Gets the owner user of the current order.
     *
     * @return User
     */
    protected function getCustomer(): User
    {
        $where = new Where();
        $where->condition('id', $this->model->user_id);
        $user = new User($where);

        if (!$user->isLoaded()) {
            $this->_kill(
                self::HTTP_PRECONDITION_FAILED,
                'Comprador não localizado.'
            );
        }

        return $user;
    }

    /**
     * Returns a current order's product object by given id.
     *
     * Or kill sending a HTTP 404 not found error.
     *
     * @param int $prodId
     *
     * @return OrderProduct
     */
    protected function getItem(int $prodId): OrderProduct
    {
        $where = new Where();
        $where->condition('id', $prodId);
        $where->condition('order_id', (int) $this->model->id);

        $orderItem = new OrderProduct($where);

        if (!$orderItem->isLoaded()) {
            $this->_killNotFound();
        }

        return $orderItem;
    }

    /**
     * Gets the order item id from URI segments.
     *
     * Or returns HTTP 400 error.
     *
     * @return int
     */
    protected function getItemIdSegment(): int
    {
        $prodId = URI::getSegment(2);

        if (is_null($prodId) || !preg_match('/^\d+$/', $prodId)) {
            $this->_killBadRequest();
        }

        return (int) $prodId;
    }

    /**
     * Returns a Json string with reason log and its author.
     *
     * @return string
     */
    protected function getReasonLog(): string
    {
        $log = $this->_data('log');

        if (!is_string($log)) {
            $this->_killBadRequest();
        }

        $log = trim(strip_tags($log));

        if (mb_strlen($log) < 1) {
            $this->_kill(
                self::HTTP_PRECONDITION_FAILED,
                'Motivo vazio.'
            );
        }

        return json_encode([
            'user_id' => $this->user->getPK(),
            'reason' => $log
        ]);
    }

    /**
     * Gets a current order transaction and with defined situation.
     *
     * @param int $transactId
     * @param int $situation
     *
     * @return OrderTransaction
     */
    protected function getTransaction(int $transactId, int $situation): OrderTransaction
    {
        $where = new Where();
        $where->condition('id', $transactId);
        $where->condition('order_id', $this->model->id);
        $where->condition('situation', $situation);
        $transaction = new OrderTransaction($where);

        if (!$transaction->isLoaded()) {
            $this->_killNotFound();
        }

        return $transaction;
    }

    /**
     * Action to set an order transaction as approved (paid out).
     *
     * URI: /rest/orders/:id1:/paidout:
     *
     * @return void
     */
    protected function paidout(): void
    {
        $transId = URI::getSegment(2);

        if (is_null($transId) || !preg_match('/^\d+$/', $transId)) {
            $this->_killBadRequest();
        }

        $transaction = $this->getTransaction($transId, OrderTransaction::SITUATION_WAITING);

        if (
            $transaction->method != OrderTransaction::METHOD_BANK_TRANSFER &&
            $transaction->method != OrderTransaction::METHOD_MONEY &&
            $transaction->method != OrderTransaction::METHOD_CREDITCARD_STORE
        ) {
            $this->_kill(
                self::HTTP_PRECONDITION_FAILED,
                'Método da transação não permite aprovação manual'
            );
        }

        // Set transaction approved
        $log = $this->getReasonLog();
        $service = new OrderTransactionService($transaction, $this->model);
        $service->setCustomer($this->getCustomer());
        $service->setSituation(OrderTransaction::SITUATION_APPROVED, $log);

        $this->_output($transaction->get());
    }

    /**
     * Action to release store credits for the product.
     *
     * URI: /rest/orders/:id1:/paystore/:id2:
     *
     * @return void
     */
    protected function paystore(): void
    {
        $prodId = $this->getItemIdSegment();

        if (!$this->isPut()) {
            $this->_killNotFound();
        }

        $orderItem = $this->getItem($prodId);

        if ((int) $orderItem->situation == OrderProduct::SITUATION_CANCELED) {
            $this->_kill(self::HTTP_PRECONDITION_FAILED, 'Item não pode ser pago.');
        }

        $where = new Where();
        $where->condition('order_product_id', (int) $orderItem->id);
        $where->condition('payment_released', OrderStore::PAYMENT_BLOCKED);

        $orderStore = new OrderStore();
        $orderStore->query($where);

        while ($orderStore->valid()) {
            $prodId = (int) $orderItem->id;
            $storeId = (int) $orderStore->store_id;

            // Products value + shipping cost - discount
            $value = round(
                ((float) $orderItem->unit_price * (int) $orderItem->quantity)
                + (float) $orderItem->shipping_value
                - (float) $orderStore->discount,
                2
            );
            $this->createStoreStatement(
                $storeId,
                StoreStatement::TT_DELIVERED_PRODUCT,
                $value,
                $prodId
            );

            // Marketplace rate
            $value = -1 * ((float) $orderStore->commission + (float) $orderStore->referral_fees);
            $this->createStoreStatement(
                $storeId,
                StoreStatement::TT_MARKETPLACE_RATE,
                $value,
                $prodId
            );

            $orderStore->payment_released = OrderCommission::PAYMENT_RELEASED;
            $orderStore->save();
            $orderStore->next();
        }

        $this->_output([], self::HTTP_NO_CONTENT);
    }

    /**
     * Order product actions endpoint.
     *
     * URI: /rest/orders/:id1:/product/:id2:
     *
     * @return void
     */
    protected function product(): void
    {
        $prodId = $this->getItemIdSegment();

        if (!$this->isDelete()) {
            $this->_killNotFound();
        }

        $log = $this->getReasonLog();
        $orderItem = $this->getItem($prodId);
        $service = new OrderService($this->model);
        $service->cancelItem($orderItem, $log, $this->user->getPK(), true);

        $this->_output([], self::HTTP_NO_CONTENT);
    }

    /**
     * Requests a refund value to an order transaction.
     *
     * URI: /rest/orders/:id1:/refund/:id2:
     *
     * @return void
     */
    protected function refund(): void
    {
        $transId = URI::getSegment(2);
        $value = $this->_data('value');
        $desc = $this->_data('description');

        if (
            is_null($transId)
            || !preg_match('/^\d+$/', $transId)
            || is_null($value)
            || !is_numeric($value)
            || $value <= 0
            || is_null($desc)
            || trim($desc) === ''
        ) {
            $this->_killBadRequest();
        } elseif (!$this->isPut()) {
            $this->_killNotFound();
        }

        $value = (float) $value;

        $transaction = $this->getTransaction($transId, OrderTransaction::SITUATION_APPROVED);
        $refundable = (float) $transaction->transaction_value - (float) $transaction->returned;

        if ($value > $refundable) {
            $this->_kill(self::HTTP_PRECONDITION_FAILED, 'Valor inválido.');
        }

        // Request refund
        $service = new OrderTransactionService($transaction, $this->model);
        $service->setCustomer($this->getCustomer());
        $service->refund($value, $desc);

        $this->_output($transaction->get());
    }

    /**
     * Action to sets the order's seller.
     *
     * URI: /rest/orders/:id1:/set-seller:
     *
     * @return void
     */
    protected function setSeller(): void
    {
        $seller = $this->_data('seller_id');
        $notes = $this->_data('log');

        if (
            !is_int($seller)
            || !is_string($notes)
        ) {
            $this->_killBadRequest();
        } elseif ($this->model->get(Order::COL_REFERRAL) == Order::REFERRAL_WEDDING_LIST) {
            $this->_kill(
                self::HTTP_BAD_REQUEST,
                'Este pedido não pode ter seu vendedor alterado.'
            );
        }

        $where = new Where();
        $where->condition('id', $seller);
        $where->condition('admin', 1);
        $where->condition('suspended', 0);
        $user = new User($where);

        if (!$user->isLoaded()) {
            $this->_kill(
                self::HTTP_PRECONDITION_FAILED,
                'Este usuário não pode ser definido como vendedor do pedido.'
            );
        }

        $this->model->set(Order::COL_SELLER, $seller);
        $this->saveModel();

        $log = new OrderLog();
        $log->set([
            OrderLog::COL_ORDER => $this->model->get(Order::COL_ID),
            OrderLog::COL_AUTHOR => $this->user->getPK(),
            OrderLog::COL_SITUATION => Order::SITUATION_NONE,
            OrderLog::COL_REMOTE_IP => Strings::getRealRemoteAddr(),
            OrderLog::COL_LOG_MESSAGE => $notes,
        ]);
        $log->save();

        $this->_output([], self::HTTP_NO_CONTENT);
    }

    protected function triggerBeforeInsert(): void
    {
        $this->_killNotImplemented();
    }
}
