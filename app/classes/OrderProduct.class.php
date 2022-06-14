<?php

/**
 * Model for `order_products` database table.
 *
 *
 */

use Springy\Model;
use Springy\Validation\Validator;

/**
 * OrderProduct model.
 */
class OrderProduct extends Model
{
    use ModelHelperTraits;

    // Column names
    public const COL_ID = 'id';
    public const COL_ORDER = 'order_id';
    public const COL_PRODUCT = 'product_id';
    public const COL_SITUATION = 'situation';
    public const COL_VARIATION_KEY = 'variation_key';
    public const COL_PRODUCT_NAME = 'product_name';
    public const COL_VARIATION_DESC = 'variation_description';
    public const COL_QUANTITY = 'quantity';
    public const COL_UNIT_PRICE = 'unit_price';
    public const COL_SHIPPING_COST = 'shipping_value';
    public const COL_DISCOUNT = 'discount';
    public const COL_REFERRAL_FEES = 'referral_fees';
    public const COL_MANUFACTURING_DAYS = 'manufacturing_days';
    public const COL_SHIPPING_ORIGIN = 'shipping_origin';
    public const COL_DELIVERY_PLANNED = 'delivery_planned';
    public const COL_ARRIVAL_EXPECTED = 'arrival_expected';

    // Situation constants
    public const SITUATION_WAITING_APPROVAL = 1;
    public const SITUATION_PROCESSING = 2;
    public const SITUATION_SHIPPED = 3;
    public const SITUATION_DELIVERED = 4;
    public const SITUATION_RETURNING = 5;
    public const SITUATION_RETURNED = 6;
    public const SITUATION_CANCELED = 7;

    protected $tableName = 'order_products';
    protected $insertDateColumn = 'created_at';
    protected $deletedColumn = 'deleted';
    protected $writableColumns = [
        self::COL_ORDER,
        self::COL_PRODUCT,
        self::COL_SITUATION,
        self::COL_VARIATION_KEY,
        self::COL_PRODUCT_NAME,
        self::COL_VARIATION_DESC,
        self::COL_QUANTITY,
        self::COL_UNIT_PRICE,
        self::COL_SHIPPING_COST,
        self::COL_DISCOUNT,
        self::COL_REFERRAL_FEES,
        self::COL_MANUFACTURING_DAYS,
        self::COL_SHIPPING_ORIGIN,
        self::COL_DELIVERY_PLANNED,
        self::COL_ARRIVAL_EXPECTED,
    ];
    protected $abortOnEmptyFilter = true;

    /**
     * A trigger which will be called by save method on Model object before insert data.
     *
     * @return bool True if all is ok or false if has an error.
     */
    protected function triggerBeforeInsert()
    {
        return $this->isOrderValid((int) $this->get(self::COL_ORDER))
            && $this->isProductValid((int) $this->get(self::COL_PRODUCT), false);
    }

    /**
     * Returns the data validation rules configuration.
     *
     * @return array
     */
    protected function validationRules()
    {
        $validSituations = implode(
            ',',
            [
                self::SITUATION_WAITING_APPROVAL,
                self::SITUATION_PROCESSING,
                self::SITUATION_SHIPPED,
                self::SITUATION_DELIVERED,
                self::SITUATION_RETURNING,
                self::SITUATION_RETURNED,
                self::SITUATION_CANCELED,
            ]
        );

        return [
            self::COL_ORDER => 'Required|Integer|Min:1',
            self::COL_PRODUCT => 'Required|Integer|Min:1',
            self::COL_SITUATION => 'Required|Integer|In:' . $validSituations,
            self::COL_VARIATION_KEY => 'Required|LengthBetween:32,32',
            self::COL_PRODUCT_NAME => 'Required|LengthBetween:1,150',
            self::COL_QUANTITY => 'Required|Integer|Min:1',
            self::COL_UNIT_PRICE => 'Required|Numeric|Between:0,999999999.99',
            self::COL_SHIPPING_COST => 'Required|Numeric|Between:0,999999999.99',
            self::COL_DISCOUNT => 'Required|Numeric|Between:0,999999999.99',
            self::COL_REFERRAL_FEES => 'Required|Numeric|Between:0,999999999.99',
            self::COL_MANUFACTURING_DAYS => 'Required|Integer|Between:0,999',
            self::COL_SHIPPING_ORIGIN => [
                Validator::V_INTEGER,
                Validator::V_IN => implode(',', ShippingCalculator::VALID_SPO),
            ],
            self::COL_DELIVERY_PLANNED => Validator::V_DATE,
            self::COL_ARRIVAL_EXPECTED => Validator::V_DATE,
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
            self::COL_SITUATION => [
                'Required' => 'A situação do produto é obrigatória.',
                'Integer'  => 'Situação inválida.',
                'Between'  => 'Situação inválida.',
            ],
            self::COL_VARIATION_KEY => [
                'Required' => 'A chave de variação é obrigatória.',
                'LengthBetween' => 'Chave de variação inválida.',
            ],
            self::COL_PRODUCT_NAME => [
                'Required' => 'O nome do produto é obrigatório.',
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
            self::COL_SHIPPING_COST => [
                'Required' => 'O valor do frete é obrigatório.',
                'Numeric' => 'O valor do frete é inválido.',
                'Between' => 'O frete é inválido.',
            ],
            self::COL_DISCOUNT => [
                'Required' => 'O valor do desconto dado pela plataforma é obrigatório.',
                'Numeric' => 'O valor do desconto dado pela plataforma é inválido.',
                'Between' => 'O desconto dado pela plataforma é inválido.',
            ],
            self::COL_REFERRAL_FEES => [
                'Required' => 'O valor da reserva técnica paga pela plataforma é obrigatório.',
                'Numeric' => 'O valor da reserva técnica paga pela plataforma é inválido.',
                'Between' => 'A reserva técnica da plataforma é inválida.',
            ],
            self::COL_MANUFACTURING_DAYS => [
                'Required' => 'A quantidade de dias de preparo é obrigatória.',
                'Integer' => 'Valor inválido para a quantidade de dias de preparo.',
                'Between' => 'O valor da quantidade de dias de preparo é inválido.',
            ],
            self::COL_SHIPPING_ORIGIN => [
                Validator::V_INTEGER => 'Origem do valor do frete inválido.',
                Validator::V_IN => 'Origem do valor do frete inválido.',
            ],
            self::COL_DELIVERY_PLANNED => [
                'Date' => 'Data prevista de envio inválida.',
            ],
            self::COL_ARRIVAL_EXPECTED => [
                'Date' => 'Data prevista de entrega inválida.',
            ],
        ];
    }
}
