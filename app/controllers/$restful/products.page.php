<?php

use Springy\Kernel;

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
        Product::COL_PATH,
    ];
    protected $routesPUT = [
    ];

    public function saveImage()
    {
        $input = app('input');
        if (!$input->isPost() || !$input->hasFile('file') || is_array($input->file('file'))) {
            $this->_killBadRequest();
        }

        $img = $input->file('file');
        $type = $img->getOriginalMimeType();
        $name = $img->getOriginalName();
        $size = $img->getOriginalSize();
        $src = $img->getPathname();

        if (is_null($src)) {
            $this->_kill(412, 'Imagem ilegal!');
        }
        if (!is_file($src)) {
            $this->_kill(500, 'Falha ao realizar o upload do arquivo!');
        }

        $uid = uniqid();
        $path = config_get('system.imgPath') . $uid . '-' . $name;

        $img->moveTo(Kernel::path(Kernel::PATH_ROOT) . DS . 'assets' . DS . 'productImages', $uid . '-' . $name);

        $files = [
            'error' => false,
            'type'  => $type,
            'name'  => $name,
            'size'  => $size,
            'path'   => $path,
        ];

        $this->_output([
            'files' => [$files],
        ]);
    }

    /**
     * Convert properties to a array.
     *
     * @return array
     */
    protected function _parseRow($row)
    {
        $path = json_decode($row['path']);
        $row['path'] = config_get('system.imgPath') . $row['path'];


        return $row;
    }

    /**
     * A trigger which will be called before setting data received in payload.
     *
     * @return void
     */
    public function triggerBeforeUpdate(): void
    {
        if (!$this->user->isAdmin() && $this->model->user_id != $this->user->getPK()) {
            $this->_killForbidden();
        }

        $name = $this->_data('name');
        $price = $this->_data('price');
        $situation = $this->_data('situation');
        $description = $this->_data('description');
        $type = $this->_data('type');
        $img = $this->_data('path');

        if ($this->model->path != $img) {
            unlink(Kernel::path(Kernel::PATH_ROOT) . DS . 'assets' . DS . 'productImages' . DS . $this->model->path);
        }

        $this->model->name = $name;
        $this->model->price = $price;
        $this->model->situation = $situation;
        $this->model->description = $description;
        $this->model->type = $type;
        $this->model->path = $img;

        if (!$this->model->save()) {
            $this->_killInternalServerError();
        }
    }
}
