<?php

/**
 * Model for `email_errors` database table.
 *
 */

use Springy\Configuration;
use Springy\DB\Where;
use Springy\Model;

/**
 * Email_Error model.
 */
class Email_Error extends Model
{
    protected $tableName = 'email_errors';
    protected $insertDateColumn = 'created_at';
    protected $deletedColumn = 'deleted';
    protected $writableColumns = [
        'email',
        'error_at',
        'error_type',
        'reason',
        'status_code',
    ];
    protected $abortOnEmptyFilter = false;

    // Result constants
    public const ERR_BOUNCE = 1;
    public const ERR_INVALID = 2;
    public const ERR_SPAM_REPORT = 3;

    /**
     * Returns the data validation rules configuration.
     *
     * @return array
     */
    protected function validationRules()
    {
        return [
            'email'       => 'Required|MaxLength:150',
            'error_type'  => 'Required|Integer|Between:1,3',
            'status_code' => 'Required|MaxLength:10',
            'reason'      => 'Required',
        ];
    }

    /**
     * A service to prevent bounce and invalid address.
     *
     * @param string $email
     * @param mixed  $caller
     *
     * @return bool Return true if email is valid or false if is invalid.
     */
    public function isValidAddress($email, $caller = null): bool
    {

        /// Known bad domains list
        $knownBadDomains = Configuration::get('app', 'bad_domains');

        if (in_array(explode('@', $email)[1], $knownBadDomains)) {
            return false;
        }

        $where = new Where();
        $where->condition('email', $email);

        // Check if exists in email with errors
        $error = new self();
        $error->query($where, [], 0, 1);
        if ($error->valid()) {
            return false;
        }
        unset($error);

        // Check if exists in users
        if ($caller === null) {
            $user = new User($where);
            if ($user->isLoaded()) {
                return true;
            }
            unset($user);
        }

        // // Invalid email. Save it to future use.
        // $error = new self();
        // $error->email = $email;
        // $error->error_type = self::ERR_INVALID;
        // $error->error_at = date('Y-m-d H:i:s');
        // $error->status_code = 404;
        // $error->reason = 'Failed check';
        // $error->save();

        return true;
    }
}
