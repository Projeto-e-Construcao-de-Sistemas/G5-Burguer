<?php

/**
 * Model for `order_products` database table.
 *
 *
 */

use Springy\Model;

/**
 * OrderProduct model.
 */
class OrderProduct extends Model
{
    // Column names
    public const COL_ID = 'id';
    public const COL_ORDER = 'order_id';
    public const COL_PRODUCT = 'product_id';
    public const COL_PRODUCT_NAME = 'product_name';
    public const COL_QUANTITY = 'quantity';
    public const COL_UNIT_PRICE = 'unit_price';
    public const COL_OBSERVATIONS = 'observations';


    protected $tableName = 'order_products';
    protected $deletedColumn = 'deleted';
    protected $writableColumns = [
        self::COL_ORDER,
        self::COL_PRODUCT,
        self::COL_PRODUCT_NAME,
        self::COL_QUANTITY,
        self::COL_UNIT_PRICE,
        self::COL_OBSERVATIONS,
    ];
    protected $abortOnEmptyFilter = true;

    /**
     * Returns the data validation rules configuration.
     *
     * @return array
     */
    protected function validationRules()
    {

        return [
            self::COL_ORDER => 'Required|Integer|Min:1',
            self::COL_PRODUCT => 'Required|Integer|Min:1',
            self::COL_PRODUCT_NAME => 'Required|LengthBetween:1,150',
            self::COL_QUANTITY => 'Required|Integer|Min:1',
            self::COL_UNIT_PRICE => 'Required|Numeric|Between:0,999999999.99',
            self::COL_OBSERVATIONS => 'LengthBetween:0,200',
        ];
    }

    /**
     * Returns the customized error messages to the validation rules.
     *
     * @return array
     */
    protected function validationErrorMessages()
    {
        return [
            self::COL_ORDER => [
                'Required' => 'O pedido é obrigatório.',
                'Integer' => 'Pedido inválido.',
                'Min' => 'Pedido inválido.',
            ],
            self::COL_PRODUCT => [
                'Required' => 'O produto é obrigatório.',
                'Integer' => 'Valor inválido para o produto.',
                'Min' => 'Produto inválido.',
            ],
            self::COL_PRODUCT_NAME => [
                'Required' => 'O nome do produto é obrigatório!!!!!!!!!.',
                'LengthBetween' => 'Nome do produto inválido.',
            ],
            self::COL_QUANTITY => [
                'Required' => 'A quantidade é obrigatória.',
                'Integer' => 'Valor inválido para a quantidade.',
                'Min' => 'Quantidade inválida.',
            ],
            self::COL_UNIT_PRICE => [
                'Required' => 'O preço unitário é obrigatório.',
                'Numeric' => 'O preço unitário é inválido.',
                'Between' => 'O preço unitário é inválido.',
            ],
            self::COL_OBSERVATIONS => [
                'Required' => 'O nome do produto é obrigatório.',
                'LengthBetween' => 'Nome do produto inválido.',
            ],
        ];
    }
}
