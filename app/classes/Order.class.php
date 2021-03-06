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
            'Recebemos uma venda, acesse a plataforma para mais informa????es!',
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
                'Required' => 'O pedido ?? obrigat??rio.',
                'Integer' => 'Pedido inv??lido.',
                'Min' => 'Pedido inv??lido.',
            ],
            self::COL_SITUATION => [
                'Required' => 'O produto ?? obrigat??rio.',
                'Integer' => 'Valor inv??lido para o produto.',
                'Min' => 'Produto inv??lido.',
            ],
            self::COL_TOTAL_VALUE => [
                'Required' => 'O pre??o unit??rio ?? obrigat??rio.',
                'Numeric' => 'O pre??o unit??rio ?? inv??lido.',
                'Between' => 'O pre??o unit??rio ?? inv??lido.',
            ],
            self::COL_ZIP_CODE => [
                'Required' => 'O nome do produto ?? obrigat??rio.',
                'LengthBetween' => 'Nome do produto inv??lido.',
            ],
            self::COL_PAYMENT => [
                'Required' => 'O produto ?? obrigat??rio.',
                'Integer' => 'Valor inv??lido para o produto.',
                'Min' => 'Produto inv??lido.',
            ],
            self::COL_ADDRESS => [
                'Required' => 'O nome do produto ?? obrigat??rio.',
                'LengthBetween' => 'Nome do produto inv??lido.',
            ],
            self::COL_NUMBER => [
                'Required' => 'O nome do produto ?? obrigat??rio.',
                'LengthBetween' => 'Nome do produto inv??lido.',
            ],
            self::COL_COMPLEMENT => [
                'Required' => 'O nome do produto ?? obrigat??rio.',
                'LengthBetween' => 'Complemento inv??lido.',
            ],
        ];
    }
}
