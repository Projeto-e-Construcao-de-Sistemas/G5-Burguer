<?php

/**
 * User authentication and session manager class.
 *
 */

use Springy\DB\Where;
use Springy\Security\AclUserInterface;
use Springy\Security\IdentityInterface;
use Springy\Session;

/**
 * Model class for the table users.
 */
class UserSession implements IdentityInterface, AclUserInterface
{
    /** @var array user's data */
    protected $userData;

    /** @var string user's password memorized for login check */
    protected $password;

    /** @var bool user has admin access */
    protected $admin;

    /** @var int user's data cache expiration time */
    protected $expirationTime;

    /** @var Springy\Utils\MessageContainer */
    protected $errors;

    // Authentication remember me cookie name
    protected const IDENTITY_COOKIE = '_burg_';

    // User's data cache time
    protected const CACHE_TIME = '+5 minutes';

    // User's data
    protected const USER_DATA = 'data';

    // User's properties (columns)
    protected const COL_PK = 'id';
    protected const COL_UUID = 'uuid';
    protected const COL_EMAIL = 'email';
    protected const COL_NAME = 'name';
    protected const COL_PHONE = 'phone';
    protected const COL_PASSWORD = 'password';
    protected const COL_ADMIN = 'admin';

    public const ACL_SEPARATOR = ';';

    protected function clearUser(): void
    {
        $this->userData = [];
        $this->password = null;

        $this->admin = false;

        $this->expirationTime = 0;

        $this->errors = null;
    }

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->clearUser();
    }

    /**
     * Gets any user data;
     *
     * @param string $name
     *
     * @return mixed
     */
    public function __get($name)
    {
        switch ($name) {
            case self::COL_PASSWORD:
                return $this->password;
        }

        return $this->userData[$name] ?? null;
    }

    /**
     * Sets any user data.
     *
     * @param string $name
     * @param mixed  $value
     */
    public function __set($name, $value)
    {
        $user = new User();

        if (!in_array($name, $user->getWritableColumns())) {
            throw new Exception('Undefined user column', E_USER_ERROR);
        }

        $this->userData[$name] = $value;
    }

    /**
     * Returns user's email.
     *
     * @return string|null
     */
    public function getEmail(): ?string
    {
        return $this->__get(self::COL_EMAIL);
    }

    /**
     * Returns user's name.
     *
     * @return string|null
     */
    public function getName(): ?string
    {
        return $this->__get(self::COL_NAME);
    }

    /**
     * Returns user's primary key (id).
     *
     * @return int|null
     */
    public function getPK(): ?int
    {
        return $this->__get(self::COL_PK);
    }

    /**
     * Returns the User model for current user.
     *
     * @return User
     */
    public function getUser(): User
    {
        $where = new Where();
        $where->condition('id', $this->getPK());

        return new User($where);
    }

    /**
     * Load the user data from the session.
     *
     * This method is executed to load the user data by a given array with the data columns.
     *
     * @param array
     *
     * @return void
     */
    public function fillFromSession(array $data)
    {
        $this->userData = $data[self::USER_DATA] ?? [];

        $this->admin = $data[self::COL_ADMIN] ?? false;

        if ($this->expirationTime < time()) {
            $this->refreshSession();
        }
    }

    /**
     * Get the user credentials.
     *
     * @return array the array with credential data.
     */
    public function getCredentials()
    {
        return [
            'login'    => self::COL_EMAIL,
            'password' => self::COL_PASSWORD,
        ];
    }

    /**
     * Get the user ID.
     *
     * @return string|null.
     */
    public function getId()
    {
        return $this->__get(self::COL_UUID);
    }

    /**
     * Get the user id column name.
     *
     * @return string the column name of the user id.
     */
    public function getIdField()
    {
        return self::COL_UUID;
    }

    /**
     * Get the user permission for the given ACL.
     *
     * @param string $aclObjectName the name of the ACL.
     *
     * @return bool True if the user has permission to access or false if not.
     */
    public function getPermissionFor($aclObjectName)
    {
        return true;
    }

    /**
     * Get the session data.
     *
     * @return array the array with data to be saved in session.
     */
    public function getSessionData()
    {
        return [
            self::USER_DATA => $this->userData,

            self::COL_ADMIN => $this->admin,
        ];
    }

    /**
     * Get the session key.
     *
     * @return string the name of the session key.
     */
    public function getSessionKey()
    {
        return self::IDENTITY_COOKIE;
    }

    /**
     * Returns last validation errors on trying to save data.
     *
     * @return Springy\Utils\MessageContainer|null
     */
    public function getValidationErrors(): ?Springy\Utils\MessageContainer
    {
        return $this->errors;
    }

    /**
     * Checks whether the user has access rights.
     *
     * @param string $method
     * @param string $aclObjectName
     *
     * @return bool
     */
    public function hasAccess(string $method, string $aclObjectName): bool
    {
        return true;
    }

    /**
     * Returns true whether user has admin access.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->admin;
    }

    /**
     * Returns true if the user's data was loaded.
     *
     * @return bool
     */
    public function isLoaded(): bool
    {
        return !is_null($this->__get(self::COL_PK));
    }

    /**
     * Loads the identity data by given credential.
     *
     * This method is executed when the user is loaded by a given array of conditions for a query.
     *
     * @param array $data the array with the condition to load the data.
     *
     * @return void
     */
    public function loadByCredentials(array $data)
    {
        $column = key($data);
        $value = current($data);

        $where = new Where();
        $where->condition($column, $value);

        $user = new User($where);

        if (!$user->isLoaded()) {
            $this->clearUser();

            return;
        }

        $this->password = $user->get(self::COL_PASSWORD);

        $this->admin = (bool) $user->get(self::COL_ADMIN);

        $this->userData = [
            self::COL_PK => (int) $user->get(self::COL_PK),
            self::COL_UUID => $user->get(self::COL_UUID),
            self::COL_EMAIL => $user->get(self::COL_EMAIL),
            self::COL_NAME => $user->get(self::COL_NAME),
            self::COL_PHONE => $user->get(self::COL_PHONE),
        ];

        $this->expirationTime = strtotime(self::CACHE_TIME);
    }

    /**
     * Refreshes the user's data and updates the session.
     *
     * @return void
     */
    public function refreshSession(): void
    {
        if (is_null($this->getPK())) {
            return;
        }

        $this->loadByCredentials([self::COL_UUID => $this->getId()]);
        $this->updateSession();
    }

    /**
     * Saves the user data.
     *
     * @return void
     */
    public function save()
    {
        $where = new Where();
        $where->condition(self::COL_PK, $this->getPK());

        $user = new User($where);

        if (!$user->isLoaded() || $user->suspended) {
            throw new Exception('User not found', E_USER_ERROR);
        }

        foreach ($user->getWritableColumns() as $column) {
            if (!isset($this->userData[$column])) {
                continue;
            }

            $user->set($column, $this->userData[$column]);
        }

        $save = $user->save();

        $this->errors = $user->validationErrors();

        if ($save) {
            $this->refreshSession();
        }

        return $save;
    }

    /**
     * Updates the user session.
     *
     * @return void
     */
    public function updateSession(): void
    {
        Session::set($this->getSessionKey(), $this->getSessionData());
    }
}
