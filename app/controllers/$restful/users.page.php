<?php

use Springy\DB\Where;
use Springy\Utils\Strings;
use Springy\Utils\UUID;

class Users_Controller extends BaseRESTController
{
    protected $modelObject = User::class;
    protected $dataFilters = [
        'id' => 'filterArrayOrInt',
        'consultant_id' => 'filterArrayOrInt',
        'email' => 'filterEqual',
        'name' => 'filterLike',
        'admin' => 'filterEqualInt',
        'suspended' => 'filterEqualInt',
    ];
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = true;
    protected $writableColumns = [
        'consultant_id',
        'birth_date',
        'document_number',
        'email',
        'name',
        'phone',
    ];
    protected $routesPUT = [
        'admin',
        'demote',
        'promote',
        'reactivate',
        'suspend',
    ];

    /** @var int is a special method for pre and pos proccessing */
    private $specialMethod = 0;
    /** @var string temporary password */
    private $tmpPass;

    protected const SM_ANY = 1;
    protected const SM_PRO = 2;
    protected const SM_NRM = 3;

    /**
     * Endpoint to saves admin switch and accesskeys for an user.
     *
     * @return void
     */
    protected function admin(): void
    {
        $this->writableColumns = ['admin', 'accesskeys'];
        $this->saveNout(self::HTTP_OK);
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

    /**
     * Endpoint to demote an user from professional.
     */
    protected function demote()
    {
        if (!$this->model->professional) {
        }

        $this->specialMethod = self::SM_NRM;
        $this->model->professional = 0;
        $this->saveNout(self::HTTP_OK);
    }

    /**
     * Endpoint to reactivate an user.
     */
    protected function reactivate()
    {
        if (!$this->model->suspended) {
            $this->_kill(412, 'Esse usuário não está suspenso.');
        }

        $this->specialMethod = self::SM_ANY;
        $this->model->suspended = 0;
        $this->model->suspended_at = null;
        $this->saveNout(self::HTTP_OK);
    }

    /**
     * Endpoint to suspend an user.
     */
    protected function suspend()
    {
        if ($this->model->suspended) {
            $this->_kill(412, 'Esse usuário já está suspenso.');
        }

        $this->specialMethod = self::SM_ANY;
        $this->model->suspended = 1;
        $this->model->suspended_at = date('Y-m-d H:i:s');
        $this->saveNout(self::HTTP_OK);
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
