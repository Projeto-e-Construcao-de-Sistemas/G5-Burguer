<?php

/**
 * RESTful controllers base class.
 *
 */

use Springy\DB\Where;
use Springy\Security\AclManager;
use Springy\URI;
use Springy\Utils\ArrayUtils;
use Springy\Utils\JSON;
use Springy\Kernel;
use Springy\Model;

/**
 * BaseRESTController class.
 */
class BaseRESTController extends AclManager
{
    /** @var UserSession */
    protected $user;

    /** @var string Request method */
    protected $reqMethod = '';
    /** @var string Request BODY */
    protected $rawBody = null;
    /** @var array|null Request BODY decoded from JSON format */
    protected $body = null;

    /** @var string ACL module prefix */
    protected $modulePrefix = '';
    /** @var string ACL module separator */
    protected $separator = ';';

    /** @var Model The model object. Will be created by _createModel method. */
    protected $model = null;
    /** @var string|null model class name */
    protected $modelObject = null;
    /** @var array default data order */
    protected $defaultOrder = [];
    /** @var array join table array */
    protected $join = [];
    /** @var array */
    protected $embeddedObj = [];
    /** @var array|int join structure array or int embed level */
    protected $dataJoin = 0;
    /** @var array */
    protected $groupBy = [];
    /** @var array the list os possible data filters */
    protected $dataFilters = [];
    /// Array para tradução dos nomes das colunas do Data Table em colunas do banco de dados para a ordenação
    protected $columnSortNames = [];
    /** @var bool requires authentication to access endpoints */
    protected $authenticationNeeded = true;
    /** @var bool requires admin level to access endpoints (works only if $authenticationNeeded == true) */
    protected $adminLevelNeeded = true;
    /** @var array List of columns on the API call can write */
    protected $writableColumns = [];
    /// Booleano que define se consulta o banco e tráz todos os registros se filtro estiver vazio
    protected $acceptEmptyFilter = true;
    /** @var string output structure type */
    protected $dataListFormat;
    /// Special RESTapi endpoint routes after record ID ex.: controler/{id}/endpoint
    protected $routesDELETE = [];
    protected $routesGET = [];
    protected $routesPATCH = [];
    protected $routesPOST = [];
    protected $routesPUT = [];

    // HTTP response codes.
    public const HTTP_OK = 200;
    public const HTTP_CREATED = 201;
    public const HTTP_ACCEPTED = 202;
    public const HTTP_NO_CONTENT = 204;
    public const HTTP_BAD_REQUEST = 400;
    public const HTTP_UNAUTHORIZED = 401;
    public const HTTP_FORBIDDEN = 403;
    public const HTTP_NOT_FOUND = 404;
    public const HTTP_CONFLICT = 409;
    public const HTTP_PRECONDITION_FAILED = 412;
    public const HTTP_INTERNAL_SERVER_ERROR = 500;
    public const HTTP_NOT_IMPLEMENTED = 501;

    // Resquest method constants.
    public const METHOD_HEAD = 'HEAD';
    public const METHOD_GET = 'GET';
    public const METHOD_POST = 'POST';
    public const METHOD_PUT = 'PUT';
    public const METHOD_PATCH = 'PATCH';
    public const METHOD_DELETE = 'DELETE';
    public const METHOD_OPTIONS = 'OPTIONS';
    public const METHOD_OVERRIDE = '_METHOD';

    // Data list formats.
    public const LF_DATATABLES = 'dt';
    public const LF_RAW = 'raw';

    /**
     * Constructor method.
     *
     * This default construct method will validate user access to the resource.
     */
    public function __construct()
    {
        $this->reqMethod = $_SERVER['REQUEST_METHOD'];
        $this->rawBody = @file_get_contents('php://input');
        $this->body = json_decode($this->rawBody, true);
        $this->dataListFormat = self::LF_RAW;

        /** @var Springy\Security\Authentication */
        $authManager = app('user.auth.manager');
        /** @var UserSession|null */
        $user = $authManager->user();

        // Verifica se há usuário authenticado e não está suspenso
        if ($authManager->check()) {
            parent::__construct($user);
        }

        // Valida necessidade de autenticação para acesso
        if (!$this->authenticationNeeded) {
            return;
        } elseif (is_null($this->user)) {
            $this->_killUnauthorized();
        }

        // The user has access to the module?
        if ($this->isPermitted()) {
            // The user must have admin access?
            if (!$this->adminLevelNeeded || $this->user->isAdmin()) {
                return;
            }
        }

        // debug($this->getAclObjectName());
        $this->_killForbidden();
    }

    /**
     * Output the data in JSON format and terminate the program.
     *
     * @return void
     */
    protected function _output($data, $statusCode = self::HTTP_OK): void
    {
        $json = new JSON($data, $statusCode);
        $json->output();
    }

    /**
     * Stops the program and sends an error response.
     *
     * @param int          $statusCode HTTP status code to send.
     * @param string|array $message    the status message.
     *
     * @return void
     */
    protected function _kill(
        int $statusCode = self::HTTP_UNAUTHORIZED,
        $message = 'You need be authenticated to grant acess to this resource'
    ): void {
        $errorMessages = [
            self::HTTP_BAD_REQUEST => '400 Bad Request',
            self::HTTP_UNAUTHORIZED => '401 Unauthorized',
            402 => '402 Payment Required',
            self::HTTP_FORBIDDEN => '403 Forbidden',
            self::HTTP_NOT_FOUND => '404 Not Found',
            405 => '405 Method Not Allowed',
            406 => '406 Not Acceptable',
            407 => '407 Proxy Authentication Required',
            408 => '408 Request Timeout',
            409 => '409 Conflict',
            410 => '410 Gone',
            411 => '411 Length Required',
            self::HTTP_PRECONDITION_FAILED => '412 Precondition Failed',
            413 => '413 Request Entity Too Large',
            414 => '414 Request-URI Too Long',
            415 => '415 Unsupported Media Type',
            416 => '416 Requested Range Not Satisfiable',
            417 => '417 Expectation Failed',
            self::HTTP_INTERNAL_SERVER_ERROR => '500 Internal Server Error',
            self::HTTP_NOT_IMPLEMENTED => '501 Not Implemented',
            502 => '502 Bad Gateway',
            503 => '503 Service Unavailable',
            504 => '504 Gateway Timeout',
            505 => '505 HTTP Version Not Supported',
        ];
        $json = [
            'error'   => $errorMessages[$statusCode] ?? '',
            'message' => $message,
        ];

        if (ob_get_contents()) {
            ob_clean();
        }

        $this->_output($json, $statusCode);
    }

    /**
     * Sends a bad request response and ends the application.
     *
     * HTTP Error 400 - The request could not be understood by the server.
     *
     * @return void
     */
    protected function _killBadRequest(): void
    {
        $this->_kill(self::HTTP_BAD_REQUEST, 'Sua solicitação não atende às requisições para o recurso');
    }

    /**
     * Sends an unauthorized access response and ends the application.
     *
     * HTTP Error 401 - You need be authenticated to grant acess to this resource.
     *
     * @return void
     */
    protected function _killUnauthorized(): void
    {
        $this->_kill(self::HTTP_UNAUTHORIZED, 'Faça o login para continuar');
    }

    /**
     * Sends a forbidden access response and ends the application.
     *
     * HTTP Error 403 - The server understood the request, but is refusing to fulfill it.
     * Authorization will not help and the request SHOULD NOT be repeated.
     *
     * @return void
     */
    protected function _killForbidden(): void
    {
        $this->_kill(self::HTTP_FORBIDDEN, 'Você não tem acesso a esse recurso.');
    }

    /**
     * Sends an internal server error response and ends the application.
     *
     * HTTP Error 500 - The server encountered an unexpected condition which prevented it from fulfilling the request.
     *
     * @return void
     */
    protected function _killInternalServerError(): void
    {
        $this->_kill(self::HTTP_INTERNAL_SERVER_ERROR, 'Houve um problema imprevisto com sua solicitação');
    }

    /**
     * Sends a not found error response and ends the application.
     *
     * HTTP Error 404 - The server has not found anything matching your request.
     *
     * @return void
     */
    protected function _killNotFound(): void
    {
        $this->_kill(
            self::HTTP_NOT_FOUND,
            'Não foi encontrada nenhuma informação que satisfaça à sua solicitação'
        );
    }

    /**
     * Sends a not implemented response and ends the application.
     *
     * HTTP Error 501 - The server does not support the functionality required to fulfill the request.
     *
     * @return void
     */
    protected function _killNotImplemented(): void
    {
        $this->_kill(self::HTTP_NOT_IMPLEMENTED, 'Funcionalidade não suportada');
    }

    /**
     * Checks the user permission for the called method.
     *
     * @return void
     */
    protected function _authorizationCheck()
    {
        if (is_null($this->user)) {
            /** @var UserSession|null */
            $user = app('user.auth.manager')->user();

            if (is_null($user)) {
                $this->_killForbidden();
            }

            parent::__construct($user);
        }

        if (!$this->isPermitted()) {
            $this->_killForbidden();
        }
    }

    /**
     * Handles registry data to output format.
     *
     * @param array $row the array with the columns of the row.
     *
     * @return array Returns as array with the columns of the row after handled.
     */
    protected function _parseRow($row)
    {
        return $row;
    }

    /**
     * Gets the HTTP request method.
     *
     * @return string
     */
    protected function requestMethod()
    {
        return $this->reqMethod;
    }

    /**
     * Is this a GET request?
     *
     * @return bool
     */
    protected function isGet()
    {
        return $this->requestMethod() === self::METHOD_GET;
    }

    /**
     * Is this a POST request?
     *
     * @return bool
     */
    protected function isPost()
    {
        return $this->requestMethod() === self::METHOD_POST;
    }

    /**
     * Is this a PUT request?
     *
     * @return bool
     */
    protected function isPut()
    {
        return $this->requestMethod() === self::METHOD_PUT;
    }

    /**
     * Is this a PATCH request?
     *
     * @return bool
     */
    protected function isPatch()
    {
        return $this->requestMethod() === self::METHOD_PATCH;
    }

    /**
     * Is this a DELETE request?
     *
     * @return bool
     */
    protected function isDelete()
    {
        return $this->requestMethod() === self::METHOD_DELETE;
    }

    /**
     * Is this a HEAD request?
     *
     * @return bool
     */
    protected function isHead()
    {
        return $this->requestMethod() === self::METHOD_HEAD;
    }

    /**
     * Is this a OPTIONS request?
     *
     * @return bool
     */
    protected function isOptions()
    {
        return $this->requestMethod() === self::METHOD_OPTIONS;
    }

    /**
     * Gets the content of BODY.
     *
     * @param string $var the name of variable.
     *
     * @return mixed the value of the variable or an array with all variable if $var is null.
     */
    protected function getBody($var = null)
    {
        if ($var === null) {
            return $this->body;
        }

        if (is_array($this->body) && isset($this->body[$var])) {
            return $this->body[$var];
        }

        return null;
    }

    /**
     * Returns the parameter value or kills if undefined.
     *
     * @param string $parameter
     *
     * @return mixed
     */
    protected function getMandatoryData(string $parameter)
    {
        $data = $this->_data($parameter);

        if (is_null($data)) {
            $this->_killBadRequest();
        }

        return $data;
    }

    /**
     * Gets a data variable received by JSON, Form-Data POST or query string.
     *
     * @param string $var     the name of the variable.
     * @param mixed  $default the default value if $var does not exists. Default = null.
     *
     * @return mixed the value of $var or $default if it does not exists.
     */
    protected function _data($var, $default = null)
    {
        if (isset($this->body[$var])) {
            return $this->body[$var];
        }

        $result = ArrayUtils::newInstance()->dottedGet($this->body, $var);
        if ($result !== null) {
            return $result;
        }

        return app('input')->get($var, $default);
    }

    /**
     * Constructs the query filter.
     *
     * @return Where the Where object with the conditions of the filter.
     */
    protected function _dataFilter()
    {
        $where = new Where();
        $filters = (array) $this->_data('filter');
        foreach ($filters as $filter => $value) {
            $method = $this->dataFilters[$filter] ?? null;

            if ($method === null || !method_exists($this, $method)) {
                continue;
            }

            $this->$method($where, $value, $filter);
        }

        return $where;
    }

    /**
     * Create the internal model object.
     *
     * @return void
     */
    protected function _createModel()
    {
        if ($this->modelObject === null) {
            $this->_killNotImplemented();
        }

        if ($this->model !== null) {
            return;
        }

        $this->model = new $this->modelObject();
        $this->_hookLoad();
    }

    /**
     * Checks whether has an endpoint in the verb and calls it.
     *
     * @param int|bool $key
     * @param array    $routes
     *
     * @return bool
     */
    protected function hasEndpoint($key, array $routes): bool
    {
        $endpoint = URI::getSegment(1);
        $method = is_string($endpoint)
            ? lcfirst(str_replace('-', '', ucwords($endpoint, '-')))
            : '_';

        if ($endpoint === false) {
            return false;
        } elseif (!in_array($endpoint, $routes) || !method_exists($this, $method)) {
            $this->_killNotImplemented();
        } elseif ($key !== false) {
            $this->_getRecord($key);
        }

        call_user_func([$this, $method]);

        return true;
    }

    /**
     * A hook which will be called after setting data received in payload
     * and before executes the the Model's save method to insert data.
     *
     * @return void
     */
    protected function hookBeforeInsert(): void
    {
    }

    /**
     * A hook which will be called after setting data received in payload
     * and before executes the the Model's save method to update data.
     *
     * @return void
     */
    protected function hookBeforeUpdate(): void
    {
    }

    /**
     * A hook function which is executed after the model object defined and before any query executed.
     *
     * @return void
     */
    protected function _hookLoad()
    {
    }

    /**
     * Get length parameter.
     *
     * @return int
     */
    protected function getLength(): int
    {
        $limit = $this->_data('length');
        // if ($limit === null) {
        //     $this->_kill(411, 'Length required.');
        // }

        // $limit = (int)$limit;
        // if (($limit < 1 || $limit > 100) && (is_null($this->user) || !$this->user->isAdmin())) {
        //     $this->_killBadRequest();
        // }

        return $limit ?? 0;
    }

    /**
     * Loads a record to the model by the given key.
     *
     * @param mixed $key the primary key value or an array with conditions pair column => value.
     *
     * @return void
     */
    protected function _getRecord($key)
    {
        $this->_createModel();
        $where = new Where();

        if (is_array($key)) {
            foreach ($key as $col => $value) {
                $where->condition($col, $value);
            }
        } elseif (count($this->model->getPKColumns()) === 1) {
            $where->condition(
                $this->model->getTableName() . '.' . $this->model->getPKColumns()[0],
                $key
            );
        }

        $this->restrict2MyData($where);

        if (!$where->count()) {
            $this->_killBadRequest();
        }

        if (count($this->join)) {
            $this->model->setJoin($this->join);
        }
        if (count($this->embeddedObj)) {
            $this->model->setEmbeddedObj($this->embeddedObj);
        }
        if (count($this->groupBy)) {
            $this->model->groupBy($this->groupBy);
        }

        $this->model->load($where, $this->dataJoin);
        if (!$this->model->isLoaded()) {
            $this->_killNotFound();
        }
    }

    /**
     * Gets a single record by it's primary key.
     *
     * @param mixed $key the primary key (single column).
     *
     * @return array the columns of the record found.
     */
    protected function _getRecordByPK($key)
    {
        $this->_createModel();

        if (count($this->model->getPKColumns()) > 1) {
            $this->_killBadRequest();
        }

        $filter = $this->_dataFilter();
        $filter->condition(
            $this->model->getTableName() . '.' . $this->model->getPKColumns()[0],
            $key
        );
        $this->restrict2MyData($filter);

        if (count($this->join)) {
            $this->model->setJoin($this->join);
        }
        if (count($this->embeddedObj)) {
            $this->model->setEmbeddedObj($this->embeddedObj);
        }
        if (count($this->groupBy)) {
            $this->model->groupBy($this->groupBy);
        }

        $this->model->query($filter, [], 0, 1, $this->dataJoin);
        if (!$this->model->valid()) {
            $this->_killNotFound();
        }

        return $this->_parseRow($this->model->get());
    }

    /**
     * Creates the array of columns to order by.
     *
     * @return array
     */
    protected function orderBy(): array
    {
        $order = $this->_data('order');

        if (!is_array($order)) {
            return $this->defaultOrder;
        }

        if ($this->dataListFormat === self::LF_DATATABLES) {
            return $this->orderByDT($order);
        }

        $sort = [];
        foreach ($order as $column => $dir) {
            // Procura na relação de traduções
            $column = $this->columnSortNames[$column] ?? $column;

            $sort[$column] = trim(strtoupper($dir)) === 'DESC' ? 'DESC' : 'ASC';
        }

        return $sort;
    }

    /**
     * Creates the array of columns to order by from DataTables parameters.
     *
     * @param array $order
     *
     * @return array
     */
    protected function orderByDT(array $order): array
    {
        $columns = $this->_data('columns');

        if (!is_array($columns)) {
            return $this->defaultOrder;
        }

        $sort = [];

        foreach ($order as $ord) {
            $column = $columns[($ord['column'] ?? '')] ?? null;
            $direction = $ord['dir'] ?? 'ASC';

            if (!is_array($column)) {
                continue;
            }

            $colName = $column['data'] ?? null;
            $orderable = $column['orderable'] ?? false;

            if (is_null($colName) || $orderable != 'true') {
                continue;
            }

            $colName = $this->columnSortNames[$colName] ?? $colName;

            $sort[$colName] = $direction;
        }

        return $sort;
    }

    /**
     * Returns the parsed array of rows from the model.
     *
     * @param Model       $model
     * @param string|null $prefix
     *
     * @return array
     */
    protected function getArrayOrRows(Model $model, ?string $prefix = ''): array
    {
        $row = 0;
        $rows = [];

        while ($model->valid()) {
            $reg = $model->get();
            $data = $this->_parseRow($reg);

            if ($this->dataListFormat === self::LF_DATATABLES) {
                $pkcol = $model->getPKColumns();

                if (count($pkcol) > 0) {
                    $apk = [];
                    foreach ($pkcol as $col) {
                        $apk[$col] = $reg[$col];
                    }
                    $pkey = $apk;
                } else {
                    $pkey = $reg[$pkcol[0]];
                }

                $data['DT_RowId'] = ($prefix ?? $this->modelObject) . '_row_' . (++$row);
                $data['DT_RowData'] = ['pkey' => $pkey];
            }

            $rows[] = $data;
            $model->next();
        }

        return $rows;
    }

    /**
     * Gets data from table and return an array of rows.
     *
     * @return array
     */
    protected function getRecordList($filter, $order, $start = 0, $limit = 0)
    {
        $this->_createModel();

        if (count($this->join)) {
            $this->model->setJoin($this->join);
        }
        if (count($this->embeddedObj)) {
            $this->model->setEmbeddedObj($this->embeddedObj);
        }
        if (count($this->groupBy)) {
            $this->model->groupBy($this->groupBy);
        }

        $this->model->query($filter, $order, $start, $limit, $this->dataJoin);
        $rows = $this->getArrayOrRows($this->model, $this->modelObject);

        return $rows;
    }

    /**
     * Return a JSON with records.
     *
     * @return void
     */
    protected function outputList()
    {
        $data = [];
        $count = 0;
        $draw = (int) $this->_data('draw', 0);
        $start = (int) $this->_data('start', 0);
        $limit = $this->getLength();

        if ($draw) {
            $this->dataListFormat = self::LF_DATATABLES;
        }

        $filter = $this->_dataFilter();
        $this->restrict2MyData($filter);

        if (!empty($filter) || $this->acceptEmptyFilter) {
            $data = $this->getRecordList($filter, $this->orderBy(), $start, $limit);
            $count = $this->model->foundRows();
        }

        $this->_output(
            [
                'data' => $data,
                'draw' => $draw,
                'recordsTotal' => $count,
                'recordsFiltered' => $count,
            ],
            self::HTTP_OK
        );
    }

    /**
     * Deletes a record or all records that match a criteria.
     *
     * @return void
     */
    protected function _delete($key = null)
    {
        $this->_authorizationCheck();
        $this->_createModel();

        // If a key is given find the record
        if ($key) {
            $this->_getRecord($key);
        }

        // Kill if is PUT and no record was loaded
        if (!$this->model->isLoaded()) {
            $this->_killBadRequest();
        }

        $this->triggerBeforeDelete();
        $affectedRows = $this->model->delete();
        $this->triggerAfterDelete();

        $this->_output(['affected_rows' => $affectedRows]);
    }

    /**
     * Reload current record to refresh embedding and joins then sends the Json.
     *
     * @return void
     */
    protected function reloadAndOut(int $statusCode): void
    {
        $key = [];
        foreach ($this->model->getPKColumns() as $column) {
            $key[$column] = $this->model->get($column);
        }

        $this->_getRecord($key);

        $this->_output(
            $this->_parseRow($this->model->get()),
            $statusCode
        );
    }

    /**
     * Sets received data to model columns.
     *
     * Extends this funcion if you want do anything special with received data.
     *
     * @return void
     */
    protected function _setFieldValues()
    {
        if (!is_array($this->body)) {
            return;
        }

        Kernel::addIgnoredError([0, E_USER_WARNING]);

        foreach ($this->body as $col => $value) {
            if (count($this->writableColumns) && !in_array($col, $this->writableColumns)) {
                continue;
            }

            try {
                $this->model->set($col, is_bool($value) ? ($value ? 1 : 0) : $value);
            } catch (Exception $err) {
                $this->_kill(self::HTTP_PRECONDITION_FAILED, $err->getMessage());
            }
        }

        Kernel::delIgnoredError([0, E_USER_WARNING]);
    }

    /**
     * Save the model and reloads its data.
     *
     * @return void
     */
    protected function saveModel(): void
    {
        // Try to save the data
        if (!$this->model->save() && $this->model->validationErrors()->hasAny()) {
            $this->_kill(
                self::HTTP_PRECONDITION_FAILED,
                $this->model->validationErrors()->all()
            );
        }
    }

    /**
     * Save method to insert record.
     *
     * @return void
     */
    protected function saveNew(): void
    {
        $this->_authorizationCheck();
        $this->_createModel();
        $this->triggerBeforeInsert();
        $this->_setFieldValues();
        $this->hookBeforeInsert();
        $this->saveModel();
        $this->triggerAfterInsert();
        $this->reloadAndOut(self::HTTP_OK);
    }

    /**
     * Runs update triggers, save model and outputs its data.
     *
     * @param int $statusCode
     *
     * @return void
     */
    protected function saveNout(int $statusCode): void
    {
        $this->triggerBeforeUpdate();
        $this->_setFieldValues();
        $this->hookBeforeUpdate();
        $this->saveModel();
        $this->triggerAfterUpdate();
        $this->reloadAndOut($statusCode);
    }

    protected function savePatch($key): void
    {
        $this->saveUpdate($key);
    }

    /**
     * Loads the record by a key and updates its data.
     *
     * @param mixed $key
     *
     * @return void
     */
    protected function saveUpdate($key): void
    {
        $this->_authorizationCheck();
        $this->_getRecord($key);
        $this->saveNout(self::HTTP_OK);
    }

    /**
     * Saves the received data by PUT or POST method.
     *
     * @param mixed $key the primary key of the row to be saved.
     *
     * @return void
     *
     * @deprecated feature/trello-1646
     */
    protected function _save($key = null)
    {
        $this->_authorizationCheck();
        $this->_createModel();

        // If a key is given find the record
        if ($key) {
            $this->_getRecord($key);
        }

        // Kill if is PUT and no record was loaded
        if (($this->isPatch() || $this->isPut()) && !$this->model->isLoaded()) {
            $this->_killBadRequest();
        }

        $new = $this->triggerBeforeTrigger();
        $this->_setFieldValues();
        $this->triggerBeforeHook();

        $status = $this->isPatch() ? self::HTTP_NO_CONTENT : self::HTTP_OK;

        // Try to save the data
        if (!$this->model->save() && $this->model->validationErrors()->hasAny()) {
            $this->_kill(
                self::HTTP_PRECONDITION_FAILED,
                $this->model->validationErrors()->all()
            );
        }

        $key = [];
        foreach ($this->model->getPKColumns() as $column) {
            $key[$column] = $this->model->get($column);
        }

        $this->_getRecord($key);
        $this->triggerTrigger($new);

        $this->_output(
            $this->_parseRow($this->model->get()),
            $status
        );
        //a
    }

    /**
     * A trigger which will be called after delete method on Model object.
     *
     * @return void
     */
    protected function triggerAfterDelete(): void
    {
    }

    /**
     * A trigger which will be called after save method on Model object to insert data.
     *
     * @return void
     */
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

    /**
     * Trigger hook before save data.
     *
     * @return void
     *
     * @deprecated feature/trello-1646
     */
    protected function triggerBeforeHook(): void
    {
        if ($this->model->isLoaded()) {
            $this->hookBeforeUpdate();

            return;
        }

        $this->hookBeforeInsert();
    }

    /**
     * A trigger which will be called before setting data received in payload.
     *
     * @return void
     */
    protected function triggerBeforeInsert(): void
    {
    }

    /**
     * A trigger which will be called before delete method on Model object.
     *
     * @return void
     */
    protected function triggerBeforeDelete(): void
    {
    }

    /**
     * Trigger trigger before save method been called.
     *
     * @return bool
     *
     * @deprecated feature/trello-1646
     */
    protected function triggerBeforeTrigger(): bool
    {
        if ($this->model->isLoaded()) {
            $this->triggerBeforeUpdate();

            return false;
        }

        $this->triggerBeforeInsert();

        return true;
    }

    /**
     * A trigger which will be called before setting data received in payload.
     *
     * @return void
     */
    protected function triggerBeforeUpdate(): void
    {
    }

    /**
     * Trigger trigger after been saved.
     *
     * @param bool $new
     *
     * @return void
     *
     * @deprecated feature/trello-1646
     */
    protected function triggerTrigger(bool $new): void
    {
        if ($new) {
            $this->triggerAfterInsert();

            return;
        }

        $this->triggerAfterUpdate();
    }

    /**
     * Executes action for DELETE verb.
     *
     * @param string $key
     * @return void
     */
    protected function endpointDELETE($key)
    {
        if (!$this->isDelete()) {
            return;
        } elseif ($key === false) {
            // There is no a required record key
            $this->_killNotImplemented();
        } elseif ($this->hasEndpoint($key, $this->routesDELETE)) {
            $this->_output([], self::HTTP_NO_CONTENT);
        }

        $this->_delete($key);
    }

    /**
     * Executes action for GET verb.
     *
     * @param string $key
     * @return void
     */
    protected function endpointGET($key)
    {
        if (!$this->isGet()) {
            return;
        } elseif ($key === false) {
            // Retrieving a list or records
            $this->dataListFormat = self::LF_RAW;
            $this->outputList();
        }

        $record = $this->_getRecordByPK($key);
        $this->hasEndpoint(false, $this->routesGET);
        $this->_output($record, self::HTTP_OK);
    }

    /**
     * Executes actions for PATCH verb.
     *
     * @param string $key
     *
     * @return void
     */
    protected function endpointPATCH($key)
    {
        if (!$this->isPatch()) {
            return;
        } elseif ($key === false) {
            // There is no a required record key
            $this->_killNotImplemented();
        } elseif ($this->hasEndpoint($key, $this->routesPATCH)) {
            $this->_output([], self::HTTP_NO_CONTENT);
        }

        $this->savePatch($key);
    }

    /**
     * Executes action for POST verb.
     *
     * @param string $key
     * @return void
     */
    protected function endpointPOST($key)
    {
        if (!$this->isPost()) {
            return;
        } elseif ($key === false) {
            // Default POST method
            $this->saveNew();
        } elseif ($this->hasEndpoint($key, $this->routesPOST)) {
            $this->_output($this->_parseRow($this->model->get()), self::HTTP_OK);
        }

        $this->_killNotImplemented();
    }

    /**
     * Executes actions for PUT verb.
     *
     * @param string $key
     * @return void
     */
    protected function endpointPUT($key)
    {
        if (!$this->isPut()) {
            return;
        } elseif ($key === false) {
            // There is no a required record key
            $this->_killNotImplemented();
        } elseif ($this->hasEndpoint($key, $this->routesPUT)) {
            $this->_output([], 201);
        }

        $this->saveUpdate($key);
    }

    /**
     * Adds conditions to restrict the access to owned data.
     *
     * @param Where $where
     *
     * @return void
     */
    protected function restrict2MyData(Where $where): void
    {
        // Extends this function in the controller to control
        // the access restriction of owned data.
    }

    /**
     * Default entry endpoint method.
     *
     * This is a magic method that will call the right action based upon received request.
     */
    public function _default()
    {
        $key = URI::getSegment(0);
        $this->endpointDELETE($key);
        $this->endpointGET($key);
        $this->endpointPATCH($key);
        $this->endpointPOST($key);
        $this->endpointPUT($key);
    }
}
