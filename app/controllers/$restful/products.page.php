<?php

/**
 * RESTful API controller to products.
 *
 */


/**
 * Products controller class.
 */
class Products_Controller extends BaseRESTController
{

    /** @var Product */
    protected $model;
    protected $modelObject = 'Product';

    protected $dataFilters = [
        'type' => 'filterArrayOrInt',
        'name' => 'filterLike',
        'situation' => 'filterArrayOrInt',
    ];
    protected $authenticationNeeded = false;
    protected $writableColumns = [
        Product::COL_TYPE,
        Product::COL_SITUATION,
        Product::COL_NAME,
        Product::COL_DESCRIPTION,
        Product::COL_PRICE,
    ];
    protected $routesPUT = [
    ];
}
