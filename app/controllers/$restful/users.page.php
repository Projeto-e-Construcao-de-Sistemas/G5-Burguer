<?php

use Springy\DB\Where;
use Springy\Utils\Strings;
use Springy\Utils\UUID;

class Users_Controller extends BaseRESTController
{
    protected $modelObject = User::class;
    protected $dataFilters = [
        'id' => 'filterArrayOrInt',
        'email' => 'filterLike',
        'name' => 'filterLike',
        'admin' => 'filterEqualInt',
        'suspended' => 'filterEqualInt',
    ];
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = false;
    protected $writableColumns = [
        'email',
        'uuid',
        'password',
        'avatar_url',
        'name',
        'phone',
        'zip_code',
    ];
    protected $routesPUT = [
        'admin',
    ];

    /** @var int is a special method for pre and pos proccessing */
    private $specialMethod = 0;
    /** @var string temporary password */
    private $tmpPass;

    /**
     * Endpoint to saves admin switch and accesskeys for an user.
     *
     * @return void
     */
    protected function admin(): void
    {
        $this->writableColumns = ['admin'];
        $this->saveNout(self::HTTP_OK);
    }

    /**
     * Filters with like.
     *
     * @param Where  $where
     * @param string $value
     * @param string $column
     *
     * @return void
     */
    protected function filterLike(Where $where, $value, $column): void
    {
        if (trim($value) === '') {
            return;
        }

        $where->condition($column, '%' . $value . '%', Where::OP_LIKE);
    }

    /**
     * Constructs the query filter.
     *
     * @return Where the Where object with the conditions of the filter.
     */
    protected function _dataFilter()
    {
        $filter = parent::_dataFilter();

        // No filters
        if ($this->_data('filter') === null || !is_array($this->_data('filter'))) {
            return $filter;
        }

        if ($this->_data('filter.seller')) {
            $filter->condition('seller', 1);
        }
        if ($this->_data('filter.type')) {
            switch ($this->_data('filter.type')) {
                case 'admin':
                    $filter->condition('admin', 1);
                    break;
                case 'professional':
                    $filter->condition('professional', 1);
                    break;
                case 'seller':
                    $filter->condition('seller', 1);
                    break;
                case 'user':
                    $filter->condition('admin', 0);
                    $filter->condition('professional', 0);
                    $filter->condition('seller', 0);
                    break;
            }
        }

        return $filter;
    }

    /**
     * Embeds consultant in the result set.
     *
     * @return void
     */
    private function embedConsultant()
    {
        if (!$this->_data('embCnt')) {
            return;
        }

        $this->dataJoin = $this->dataJoin ?: 1;
        $this->embeddedObj['consultant'] = [
            'model'    => 'User',
            'type'     => 'data',
            'found_by' => 'id',
            'column'   => 'consultant_id',
            'columns'  => ['id', 'name', 'avatar_url'],
        ];
    }

    /**
     * A hook function executed after the model object defined and before any query executed.
     *
     * @return void
     */
    protected function _hookLoad()
    {
        $this->embedConsultant();
    }

    /**
     *  @brief Set data into $this->model object.
     *
     *  This method get the values received from the request and put it into relative properties of the model.
     */
    protected function _setFieldValues()
    {
        if ($this->specialMethod) {
            return;
        }

        parent::_setFieldValues();
    }

    protected function triggerAfterInsert(): void
    {
    }

    /**
     * A trigger which will be called after save method on Model object to update data.
     *
     * @return void
     */
    protected function triggerAfterUpdate(): void
    {
    }

    protected function triggerBeforeInsert(): void
    {
        $this->tmpPass = substr(
            str_shuffle(
                '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@$%'
            ),
            0,
            8
        );

        $this->model->uuid = UUID::random();
        $this->model->password = $this->tmpPass;
        $this->model->registration_ip = Strings::getRealRemoteAddr();
    }
}
