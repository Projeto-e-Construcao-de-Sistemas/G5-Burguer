<?php

use Springy\DB\Where;

class Order_Products_Controller extends ReadOnlyApi
{
    /** @var OrderProduct */
    protected $model;
    protected $modelObject = OrderProduct::class;
    protected $dataFilters = [
        'order_id' => 'filterArrayOrInt',
    ];
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = true;

    /**
     * Filters by column in an array or exact value.
     *
     * @param Where     $where
     * @param int|array $value
     * @param string    $column
     *
     * @return void
     */
    protected function filterArrayOrInt(Where $where, $value, $column): void
    {
        if (is_string($value) && trim($value) === '') {
            return;
        }

        if (!is_array($value)) {
            $where->condition($column, (int) $value);

            return;
        }

        $where->condition($column, $value, Where::OP_IN);
    }

    /**
     * Hook function to verify the requisition and adjust the data that will be sent.
     *
     * @return void
     */
    protected function _hookLoad()
    {
    }
}
