<?php

/**
 * Controller for RESTful API to profile.
 */

use Springy\DB\Where;
use Springy\Kernel;
use Springy\Utils\Strings;

class Perfil_Controller extends BaseRESTController
{
    const AVATAR_SIZE = 120;

    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = false;

    /**
     * Endpoint to save user's data.
     *
     * @return void
     */
    public function save()
    {
        if (!$this->isPut()) {
            $this->_killBadRequest();
        }

        $this->user->name = $this->_data('data.name', $this->user->getName());
        $this->user->email = mb_strtolower($this->_data('data.email', $this->user->getEmail()));
        $this->user->password = $this->_data('data.password', $this->user->password);
        $this->user->phone = mb_strtolower($this->_data('data.phone', $this->user->phone));
        $this->user->zip_code = mb_strtolower($this->_data('data.zip_code', $this->user->zip_code));

        if (!$this->user->save() && $this->user->getValidationErrors()->hasAny()) {
            $this->_kill(
                412,
                implode(
                    '<br>',
                    $this->user->getValidationErrors()->all()
                )
            );
        }

        $this->_output([], self::HTTP_NO_CONTENT);
    }

    /**
     *  @brief Set data field value.
     */
    private function _setData($model, $field)
    {
        if ($this->_data($field) === null) {
            return;
        }

        $model->set($field, $this->_data($field));
    }

}
