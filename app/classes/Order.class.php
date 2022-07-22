<?php

/**
 * Model for `orders` database table.
 *
 */

use Springy\Configuration;
use Springy\Model;

/**
 * Order model.
 */
class Order extends Model
{

    // Column names
    public const COL_ID = 'id';
    public const COL_USER = 'user_id';
    public const COL_SITUATION = 'situation';
    public const COL_TOTAL_VALUE = 'total_value';
    public const COL_PAYMENT = 'payment';
    public const COL_ZIP_CODE = 'zip_code';
    public const COL_ADDRESS = 'address';
    public const COL_NUMBER = 'number';
    public const COL_COMPLEMENT = 'complement';

    // Situation constants
    public const SITUATION_NONE = 0;
    public const SITUATION_WAITING = 1;
    public const SITUATION_APPROVED = 2;
    public const SITUATION_CANCELED = 3;

    protected $tableName = 'orders';
    protected $deletedColumn = 'deleted';
    protected $writableColumns = [
        self::COL_USER,
        self::COL_SITUATION,
        self::COL_TOTAL_VALUE,
        self::COL_ZIP_CODE,
        self::COL_PAYMENT,
        self::COL_ADDRESS,
        self::COL_NUMBER,
        self::COL_COMPLEMENT,
    ];
    protected $abortOnEmptyFilter = false;

    /**
     * Returns the data validation rules configuration.
     *
     * @return array
     */
    protected function validationRules()
    {

        return [
            self::COL_USER => 'Required|Integer|Min:1',
            self::COL_SITUATION => 'Required|Integer|Min:0',
            self::COL_TOTAL_VALUE => 'Numeric|Between:0,999999999.99',
            self::COL_ZIP_CODE => 'Required|LengthBetween:1,9',
            self::COL_PAYMENT => 'Required|Integer|Min:1',
            self::COL_ADDRESS => 'Required|LengthBetween:1,125',
            self::COL_NUMBER => 'Required|LengthBetween:1,20',
            self::COL_COMPLEMENT => 'LengthBetween:0,200',
        ];
    }

    /**
     * A trigger which will be called after save method on Model object to insert data.
     *
     * @return void
     */
    public function triggerAfterInsert(): void
    {
        $telegram = new Telegram();
        $telegram->sendMessage(
            Configuration::get('app', 'integrations.telegram.notifications.webmaster'),
            'Recebemos uma venda, acesse a plataforma para mais informações!',
        );
    }

    /**
     * Returns the customized error messages to the validation rules.
     *
     * @return array
     */
    protected function validationErrorMessages()
    {
        return [
            self::COL_USER => [
                'Required' => 'O pedido é obrigatório.',
                'Integer' => 'Pedido inválido.',
                'Min' => 'Pedido inválido.',
            ],
            self::COL_SITUATION => [
                'Required' => 'O produto é obrigatório.',
                'Integer' => 'Valor inválido para o produto.',
                'Min' => 'Produto inválido.',
            ],
            self::COL_TOTAL_VALUE => [
                'Required' => 'O preço unitário é obrigatório.',
                'Numeric' => 'O preço unitário é inválido.',
                'Between' => 'O preço unitário é inválido.',
            ],
            self::COL_ZIP_CODE => [
                'Required' => 'O nome do produto é obrigatório.',
                'LengthBetween' => 'Nome do produto inválido.',
            ],
            self::COL_PAYMENT => [
                'Required' => 'O produto é obrigatório.',
                'Integer' => 'Valor inválido para o produto.',
                'Min' => 'Produto inválido.',
            ],
            self::COL_ADDRESS => [
                'Required' => 'O nome do produto é obrigatório.',
                'LengthBetween' => 'Nome do produto inválido.',
            ],
            self::COL_NUMBER => [
                'Required' => 'O nome do produto é obrigatório.',
                'LengthBetween' => 'Nome do produto inválido.',
            ],
            self::COL_COMPLEMENT => [
                'Required' => 'O nome do produto é obrigatório.',
                'LengthBetween' => 'Complemento inválido.',
            ],
        ];
    }
}
