<?php

/**
 * Controller class for RESTful API to dashboard.
 *
 */


class Dashboard_Controller extends ReadOnlyApi
{
    protected $authenticationNeeded = true;
    protected $adminLevelNeeded = true;

    /**
     * Get data resume.
     *
     * @return void
     */
    public function brief(): void
    {

        $this->_output([
        ]);
    }
}
