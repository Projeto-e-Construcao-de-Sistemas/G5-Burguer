<?php

/**
 * Read only base for Resful API controllers.
 *
 */
class ReadOnlyApi extends BaseRESTController
{
    /**
     * A trigger which will be called before delete method on Model object.
     *
     * @return void
     */
    protected function triggerBeforeDelete(): void
    {
        $this->_killNotImplemented();
    }

    /**
     * A trigger which will be called before setting data received in payload.
     *
     * @return void
     */
    protected function triggerBeforeInsert(): void
    {
        $this->_killNotImplemented();
    }

    /**
     * A trigger which will be called before setting data received in payload.
     *
     * @return void
     */
    protected function triggerBeforeUpdate(): void
    {
        $this->_killNotImplemented();
    }
}
