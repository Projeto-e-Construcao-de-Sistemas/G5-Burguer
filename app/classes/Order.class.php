<?php

/**
 * Model for `orders` database table.
 *
 */

use Springy\Model;
use Springy\Validation\Validator;

/**
 * Order model.
 */
class Order extends Model
{
    use DateHelper;
    use ModelHelperTraits;
    use UserHelper;

    // Column names
    public const COL_ID = 'id';
    public const COL_USER = 'user_id';
    public const COL_REFERRAL = 'referral';
    public const COL_SITUATION = 'situation';
    public const COL_SELLER = 'seller_id';
    public const COL_DISCOUNT_COUPON = 'discount_coupon_id';
    public const COL_ITENS_NUMBER = 'items_number';
    public const COL_ITENS_QTTY = 'items_quantity';
    public const COL_PRODUCTS_TOTAL = 'products_value';
    public const COL_SHIPPING_TOTAL = 'shipping_value';
    public const COL_DISCOUNT_TOTAL = 'discount_value';
    public const COL_INTEREST_TOTAL = 'interest_value';
    public const COL_TOTAL_PAID = 'total_paid';
    public const COL_RETURNED = 'returned_value';
    public const COL_COMMISSION = 'mktp_commission';
    public const COL_REFEE_STORE = 'referral_fees_stor';
    public const COL_REFEE_MKTP = 'referral_fees_mktp';
    public const COL_APPROVED_AT = 'approved_at';

    // Referral constants
    public const REFERRAL_NONE = 0;
    public const REFERRAL_PROFESSIONAL = 1;
    public const REFERRAL_WEDDING_LIST = 2;
    public const REFERRAL_QUOTATION = 3;
    public const REFERRAL_FISICAL_STORE = 4;

    // Situation constants
    public const SITUATION_NONE = 0;
    public const SITUATION_WAITING = 1;
    public const SITUATION_APPROVED = 2;
    public const SITUATION_DONE = 3;
    public const SITUATION_CANCELED = 4;

    protected $tableName = 'orders';
    protected $insertDateColumn = 'created_at';
    protected $deletedColumn = 'deleted';
    protected $writableColumns = [
        self::COL_USER,
        self::COL_REFERRAL,
        self::COL_SITUATION,
        self::COL_SELLER,
        self::COL_DISCOUNT_COUPON,
        self::COL_ITENS_NUMBER,
        self::COL_ITENS_QTTY,
        self::COL_PRODUCTS_TOTAL,
        self::COL_SHIPPING_TOTAL,
        self::COL_DISCOUNT_TOTAL,
        self::COL_INTEREST_TOTAL,
        self::COL_TOTAL_PAID,
        self::COL_RETURNED,
        self::COL_COMMISSION,
        self::COL_REFEE_STORE,
        self::COL_REFEE_MKTP,
        self::COL_APPROVED_AT,
    ];
    protected $abortOnEmptyFilter = false;

    /**
     * Returns a string formated order number.
     *
     * @param int      $orderId
     * @param DateTime $createdAt
     * @param int      $referral
     *
     * @return string
     */
    protected function computeOrderNumber(int $orderId, DateTime $createdAt, int $referral): string
    {
        $orderId = str_pad(
            substr((string) $orderId, -6),
            6,
            '0',
            STR_PAD_LEFT
        );
        $year = $createdAt->format('y');
        $month = (int) $createdAt->format('n');
        $referral = (int) substr((string) $referral, -1);

        $dv1 = (
            (((int) substr($year, 0, 1)) * 10)
            + (((int) substr($year, -1)) * 9)
            + ($month * 8)
        );

        $yield = 7;
        $sum = 0;

        for ($pos = 0; $pos < 6; $pos++) {
            $sum += ((int) substr($orderId, $pos, 1)) * ($yield--);
        }

        $dv2 = substr((string) (($dv1 + $sum + $referral) % 11), -1);

        return sprintf(
            '%02u%s-%06u.%1u-%s',
            $year,
            substr('ACEFHKLNPRUX', $month - 1, 1),
            $orderId,
            $referral,
            $dv2
        );
    }

    protected function triggerAfterInsert()
    {
        $key = key($this->rows);

        $this->rows[$key]['order_number'] = $this->computeOrderNumber(
            (int) ($this->rows[$key]['id'] ?? 0),
            new DateTime($this->rows[$key]['created_at'] ?? null),
            (int) ($this->rows[$key][self::COL_REFERRAL] ?? self::REFERRAL_NONE)
        );
        $this->rows[$key]['**CHANGED**'] = ['order_number'];
        unset($this->rows[$key]['**NEW**']);

        $this->save();
    }

    protected function triggerBeforeInsert()
    {
        return $this->isUserValid((int) $this->get(self::COL_USER), false);
    }

    protected function validationRules()
    {
        return [
            self::COL_USER => [
                Validator::V_REQUIRED,
                Validator::V_INTEGER,
                Validator::V_MIN => [1],
            ],
            self::COL_REFERRAL => [
                Validator::V_REQUIRED,
                Validator::V_INTEGER,
                Validator::V_IN => [
                    self::REFERRAL_NONE,
                    self::REFERRAL_PROFESSIONAL,
                    self::REFERRAL_WEDDING_LIST,
                    self::REFERRAL_QUOTATION,
                    self::REFERRAL_FISICAL_STORE,
                ],
            ],
            self::COL_SELLER => [
                Validator::V_REQUIRED,
                Validator::V_INTEGER,
                Validator::V_MIN => [0],
            ],
            self::COL_SITUATION => [
                Validator::V_REQUIRED,
                Validator::V_INTEGER,
                Validator::V_IN => [
                    self::SITUATION_WAITING,
                    self::SITUATION_APPROVED,
                    self::SITUATION_DONE,
                    self::SITUATION_CANCELED,
                ],
            ],
            self::COL_DISCOUNT_COUPON => [
                Validator::V_INTEGER,
                Validator::V_MIN => [0],
            ],
            self::COL_ITENS_NUMBER => [
                Validator::V_INTEGER,
                Validator::V_MIN => [0],
            ],
            self::COL_ITENS_QTTY => [
                Validator::V_INTEGER,
                Validator::V_MIN => [0],
            ],
            self::COL_PRODUCTS_TOTAL => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_SHIPPING_TOTAL => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_DISCOUNT_TOTAL => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_INTEREST_TOTAL => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_TOTAL_PAID => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_RETURNED => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_COMMISSION => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_REFEE_STORE => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
            self::COL_REFEE_MKTP => [
                Validator::V_REQUIRED,
                Validator::V_NUMERIC,
                Validator::V_MIN => [0],
            ],
        ];
    }

    protected function validationErrorMessages()
    {
        return [
            self::COL_USER => [
                Validator::V_REQUIRED => 'O comprador é obrigatório.',
                Validator::V_INTEGER => 'Valor inválido para o comprador.',
                Validator::V_MIN => 'Comprador inválido.',
            ],
            self::COL_REFERRAL => [
                Validator::V_REQUIRED => 'A referência do pedido é obrigatória.',
                Validator::V_INTEGER => 'Valor inválido para a referência do pedido.',
                Validator::V_IN => 'Referência do pedido inválida.',
            ],
            self::COL_SITUATION => [
                Validator::V_REQUIRED => 'A situação do pedido é obrigatória.',
                Validator::V_INTEGER => 'Valor inválido para a situação do pedido.',
                Validator::V_IN => 'Situação inválida.',
            ],
            self::COL_SELLER => [
                Validator::V_REQUIRED => 'O vendedor é obrigatório.',
                Validator::V_INTEGER => 'Valor inválido para o vendedor.',
                Validator::V_MIN => 'Vendedor inválido.',
            ],
            self::COL_DISCOUNT_COUPON => [
                Validator::V_INTEGER => 'Valor inválido para o cupom de desconto.',
                Validator::V_MIN => 'Cupom de desconto inválido.',
            ],
            self::COL_ITENS_NUMBER => [
                Validator::V_INTEGER => 'Valor inválido para o número de itens do pedido.',
                Validator::V_MIN => 'Número de itens inválido.',
            ],
            self::COL_ITENS_QTTY => [
                Validator::V_INTEGER => 'Valor inválido para a quantidade de itens do pedido.',
                Validator::V_MIN => 'Quantidade de itens inválida.',
            ],
            self::COL_PRODUCTS_TOTAL => [
                Validator::V_REQUIRED => 'O total em produtos é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para o total em produtos.',
                Validator::V_MIN => 'Total em produtos inválido.',
            ],
            self::COL_SHIPPING_TOTAL => [
                Validator::V_REQUIRED => 'O total do frete é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para o total do frete.',
                Validator::V_MIN => 'Total do frete inválido.',
            ],
            self::COL_DISCOUNT_TOTAL => [
                Validator::V_REQUIRED => 'O total do desconto é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para o total do desconto.',
                Validator::V_MIN => 'Total do desconto inválido.',
            ],
            self::COL_INTEREST_TOTAL => [
                Validator::V_REQUIRED => 'O valor do juros é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para o juros.',
                Validator::V_MIN => 'Valor do juros inválido.',
            ],
            self::COL_TOTAL_PAID => [
                Validator::V_REQUIRED => 'O valor total pago é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para o total pago.',
                Validator::V_MIN => 'Valor total pago inválido.',
            ],
            self::COL_RETURNED => [
                Validator::V_REQUIRED => 'O valor devolvido é obrigatório.',
                Validator::V_NUMERIC => 'Valor devolvido é inválido.',
                Validator::V_MIN => 'Valor devolvido inválido.',
            ],
            self::COL_COMMISSION => [
                Validator::V_REQUIRED => 'O valor da comissão da plataforma é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para a comissão da plataforma.',
                Validator::V_MIN => 'Valor da comissão da plataforma inválido.',
            ],
            self::COL_REFEE_STORE => [
                Validator::V_REQUIRED => 'O valor da reserva técnica da loja é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para a reserva técnica da loja.',
                Validator::V_MIN => 'Valor da reserva técnica da loja inválido.',
            ],
            self::COL_REFEE_MKTP => [
                Validator::V_REQUIRED => 'O valor da reserva técnica da plataforma é obrigatório.',
                Validator::V_NUMERIC => 'Valor inválido para a reserva técnica da plataforma.',
                Validator::V_MIN => 'Valor da reserva técnica da plataforma inválido.',
            ],
        ];
    }
}
