<?php

/**
 * Model for `products` table.
 *
 */

use Springy\{Model};

/**
 * Model class for `products` table.
 */
class Product extends Model
{
    use ModelHelperTraits;

    // Column names
    public const COL_ID = 'id';
    public const COL_TYPE = 'type';
    public const COL_SITUATION = 'situation';
    public const COL_NAME = 'name';
    public const COL_DESCRIPTION = 'description';
    public const COL_PRICE = 'price';
    public const COL_DELETED = 'deleted';

    public const SORT_LAST = 9999999999;

    // Type constansts
    public const TYPE_MEAL = 1;
    public const TYPE_SIDE_DISH = 2;
    public const TYPE_DRINK = 3;

    protected $tableName = 'products';
    protected $insertDateColumn = 'created_at';
    protected $deletedColumn = self::COL_DELETED;
    protected $writableColumns = [
        self::COL_TYPE,
        self::COL_SITUATION,
        self::COL_NAME,
        self::COL_DESCRIPTION,
        self::COL_PRICE,
    ];
    protected $hookedColumns = [
        self::COL_NAME => 'trimTags',
    ];
    protected $abortOnEmptyFilter = false;

    // Properties to checkDependencies method
    protected $store;
    protected $error = '';


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
                ProductStatus::INACTIVE,
                ProductStatus::ACTIVE,
                ProductStatus::DELETED,
            ]
        );

        return [
            self::COL_TYPE => 'Required|Integer|Min:0',
            self::COL_SITUATION => 'Required|Integer|In:' . $validSituations,
            self::COL_NAME => 'LengthBetween:0,150',
            self::COL_DESCRIPTION => 'LengthBetween:0,300',
            self::COL_PRICE => 'Numeric|Between:0.00,9999999.99',
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
            self::COL_SITUATION => [
                'Required' => 'A situação do produto é obrigatória.',
                'Integer' => 'Valor inválido para a situação do produto.',
                'In' => 'Situação do produto inválida.',
            ],
            self::COL_TYPE => [
                'Required' => 'O tipo do produto precisa ser informado.',
                'Integer' => 'Tipo inválido.',
                'Min' => 'Tipo inválido.',
            ],
            self::COL_NAME => [
                'LengthBetween' => 'O nome não pode conter mais que 150 caracteres.',
            ],
            self::COL_DESCRIPTION => [
                'LengthBetween' => 'A descrição não pode contar mais que 300 caracteres.',
            ],
            self::COL_PRICE => [
                'Numeric' => 'Preço do produto inválido.',
                'Between' => 'O preço do produto está fora dos limites.',
            ],
        ];
    }
}
