<?php

/**
 * Model class for the table users.
 *
 */

use Springy\DB\Where;
use Springy\Model;
use Springy\Session;

/**
 * Model class for the table users.
 */
class User extends Model
{
    use ModelHelperTraits;

    protected $tableName = 'users';
    protected $tableColumns = '*';
    protected $deletedColumn = 'deleted';
    protected $writableColumns = [
        'email',
        'uuid',
        'password',
        'avatar_url',
        'name',
        'admin',
        'phone',
        'zip_code',
    ];
    protected $hookedColumns = [
        'email'           => 'trimEmail',
        'name'            => 'trimTags',
        'password'        => 'hashPass',
        'phone'           => 'trimTags',
    ];
    protected $abortOnEmptyFilter = false;

    /**
     * Hook function to compute the password column.
     *
     * @param string $password the password in plain text mode.
     *
     * @return string the password hash.
     */
    protected function hashPass($password)
    {
        return with(new \Springy\Security\BCryptHasher())->make($password);
    }

    /**
     * Remove trim trailing spaces and converts to lowercase from the value.
     *
     * @param string $value the value of the column.
     *
     * @return string
     */
    protected function trimEmail($value)
    {
        return trim(mb_strtolower($value));
    }

    /**
     * Validates the user email.
     *
     * @return bool True if e-mail is valid or false if not.
     */
    protected function validateEmail()
    {
        // Validate the email
        $error = new Email_Error();

        if ($error->isValidAddress($this->email, $this)) {
            return true;
        }

        return $this->makeValidationError('Você informou um email inválido');
    }

    /**
     * Returns the data validation rules configuration.
     *
     * @return array
     */
    protected function validationRules()
    {
        return [
            'email'           => 'Required|email',
            'uuid'            => 'Required|Regex:/^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i',
            'name'            => 'Required',
            'password'        => 'Required',
            'phone'           => 'Required',
        ];
    }

    /**
     * Returns the customized error messages to the validation rules.
     *
     * @return array
     */
    protected function validationErrorMessages()
    {
        return [
            'email' => [
                'Required' => 'O email é obrigatório!',
                'email'    => 'O email inserido não é válido!',
            ],
            'uuid' => [
                'Required' => 'O UUID é obrigatório!',
                'Regex'    => 'O UUID inserido não é válido!',
            ],
            'name' => [
                'Required' => 'O nome é obrigatório!',
            ],
            'password' => [
                'Required' => 'A senha é obrigatória!',
            ],
            'phone' => [
                'Required' => 'O telefone é obrigatório!',
            ],
        ];
    }

    /**
     * A trigger which will be called by save method on Model object after insert data.
     *
     * @return void
     */
    protected function triggerAfterInsert()
    {
        // Send the welcome message to the user
        // if (!Session::get('noWelcome')) {
        // }
        $mail = new StandardMail('welcome-email');
        $mail->to($this->email, $this->name);
        $mail->substitutionTag([
            'user' => $this->name,
        ]);
        $mail->send();
    }

    /**
     * A trigger which will be called by save method on Model object before insert data.
     *
     * This trigger will test the email address to prevent duplicate key.
     *
     * @return bool True if all is ok or false if has an error.
     */
    protected function triggerBeforeInsert()
    {
        $where = new Where();
        $where->condition('email', $this->email);
        $where->condition($this->deletedColumn, 0, Where::OP_GREATER_EQUAL);
        $user = new self($where);

        if ($user->isLoaded()) {
            return $this->makeValidationError('Esse email já está sendo usado.');
        }

        return $this->validateEmail();
    }

    /**
     * A trigger which will be called by save method on Model object before update data.
     *
     * This trigger will test the new user's email, if it was changed, to prevent duplicate key.
     *
     * @return bool True if all is ok or false if has an error.
     */
    protected function triggerBeforeUpdate()
    {
        $where = new Where();
        $where->condition('email', $this->email);
        $where->condition($this->deletedColumn, 0, Where::OP_GREATER_EQUAL);
        $user = new self($where);

        if ($user->isLoaded() && $user->id != $this->id) {
            return $this->makeValidationError('Esse email já está sendo usado.');
        }

        return $this->validateEmail();
    }

    /**
     * Returns the writable columns array.
     *
     * @return array
     */
    public function getWritableColumns(): array
    {
        return $this->writableColumns;
    }
}
