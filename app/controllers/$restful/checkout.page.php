<?php

use Springy\URI;
use GuzzleHttp\Client as GuzzleClient;
use Springy\Kernel;

class Checkout_Controller extends BaseRESTController
{
    protected $authenticationNeeded = false;
    protected $adminLevelNeeded = false;

    /**
     * Overwrites the default method.
     */
    public function _default()
    {
        $this->getZip();
        // $this->_killNotImplemented();
    }

    protected function getZip()
    {
        $zip = $this->_data('zip');

        $zip = str_replace('-', '', $zip);

        $guz = new GuzzleClient([
            'timeout'  => 3.0,
        ]);

        Kernel::addIgnoredError([0, 404]);

        try {
            $response = $guz->get('https://viacep.com.br/ws/'. $zip .'/json/');
        } catch (Exception $err) {
            Kernel::delIgnoredError([0, 404]);

            return false;
        }

        $addr = json_decode($response->getBody());

        $this->_output([
            'rua' => $addr->logradouro,
            'bairro' => $addr->bairro
        ], self::HTTP_OK);
    }
}
