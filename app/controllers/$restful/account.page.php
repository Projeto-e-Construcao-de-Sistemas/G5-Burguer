<?php

/**
 * RESTful API to account actions.
 *
 */

use Springy\Configuration;
use Springy\Session;
use Springy\DB\Where;
use Springy\Utils\UUID;

/**
 * Account controller.
 */
class Account_Controller extends BaseRESTController
{
    protected $authenticationNeeded = false;
    protected $adminLevelNeeded = false;

    /**
     * Kills with not implemented error.
     *
     * @return void
     */
    public function data(): void
    {
        $this->_killNotImplemented();
    }

    /**
     * Performs last verifications after successfully sign in action.
     *
     * @return void
     */
    private function successfullySignIn(): void
    {
        /** @var UserSession $user */
        $user = app('user.auth.manager')->user();

        $this->_output([
        ]);
    }

    /**
     * RESTful endpoint to log in action.
     *
     * @return void
     */
    public function login(): void
    {
        $email = $this->_data('email') ?? '';
        $passw = $this->_data('password') ?? '';

        if (!$this->isPost()) {
            $this->_killBadRequest();
        } elseif (!$email || !$passw) {
            $this->_kill(412, 'Usuário e/ou senha inválido!');
        } elseif (!app('user.auth.manager')->attempt($email, $passw, false)) {
            $this->_kill(403, 'Usuário e/ou senha inválido!');
        }

        $this->successfullySignIn();
    }

    /**
     * RESTful endpoint to sign in.
     *
     * @return void
     */
    public function signin(): void
    {
        if (!$this->isPost()) {
            $this->_killBadRequest();
        }

        if (!$this->_data('name')) {
            $this->_kill(412, 'Você precisa informar seu nome.');
        } elseif (!$this->_data('email')) {
            $this->_kill(412, 'Você precisa informar seu email.');
        } elseif (!$this->_data('password')) {
            $this->_kill(412, 'Você precisa definir sua senha.');
        } elseif (
            mb_strlen($this->_data('phone'))  < 4
            && mb_strlen($this->_data('phone')) > 20
        ) {
            $this->_kill(412, 'Telefone inválido.');
        }


        $email = mb_strtolower($this->_data('email'));
        $passw = $this->_data('password');
        $phone = $this->_data('phone');

        $user = new User();
        $user->email = $email;
        $user->uuid = UUID::random();
        $user->name = $this->_data('name');
        $user->password = $passw;
        $user->phone = $phone;

        if (!$user->save()) {
            $this->_kill(
                500,
                $user->validationErrors()->hasAny()
                    ? implode('<br>', $user->validationErrors()->all())
                    : 'Não foi possível realizar seu cadastro.'
            );
        }

        app('user.auth.manager')->loginWithId($user->uuid, true);
        $this->_output([
        ]);
    }

    /**
     * RESTful endpoint to request reset password.
     *
     * @return void
     */
    public function resetPassword(): void
    {
        $email = trim($this->_data('email') ?? '');

        if (!$this->isPost()) {
            $this->_killBadRequest();
        } elseif (empty($email)) {
            $this->_kill(412, 'Informe seu endereço de e-mail');
        }

        $where = new Where();
        $where->condition('email', $email);

        $user = new User($where);

        if (!$user->isLoaded()) {
            $this->_output([]);

            return;
        }

        $newPass = uniqid();
        $user->password = $newPass;

        $mail = new StandardMail('password-reset');
        $mail->to($user->email, $user->name);
        $mail->substitutionTag([
            'password' => $newPass,
        ]);
        $mail->send();

        if (!$user->save()) {
            $this->_kill(
                500,
                $user->validationErrors()->hasAny()
                    ? implode('<br>', $user->validationErrors()->all())
                    : 'Não foi possível recuperar sua senha.'
            );
        }

        unset($mail, $user);

        $this->_output([]);
    }

    /**
     * RESTful endpoint to change the user password from a reset request.
     *
     * @return void
     */
    public function acceptResetPassword(): void
    {
        $token = $this->_data('token') ?? '';
        $passw = $this->_data('password') ?? '';
        $passc = $this->_data('password2') ?? '';

        if (
            !$this->isPost()
            || !$token
            || !preg_match(
                '/^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i',
                $token
            )
        ) {
            $this->_killBadRequest();
        } elseif (!$passw) {
            $this->_kill(412, 'Por favor, preencha o campo com a nova senha');
        } elseif (!$passc) {
            $this->_kill(412, 'Por favor, preencha o campo com a confirmação da nova senha');
        } elseif ($passw !== $passc) {
            $this->_kill(412, 'Você precisa digitar a mesma senha nos dois campos');
        }

        $where = new Where();
        $where->condition('reset_password_token', $token);

        $user = new User($where);
        if (!$user->isLoaded()) {
            $this->_kill(404, 'Esse link para alteração de senha não é mais válido.');
        }

        // $user->uuid = UUID::random();
        $user->password = $passw;
        $user->reset_password_token = '0';
        if (!$user->save()) {
            $this->_kill(
                500,
                $user->validationErrors()->hasAny()
                    ? implode('<br>', $user->validationErrors()->all())
                    : 'Houve uma falha ao tentar redefinir sua senha.<br>Tente novamente mais tarde.'
            );
        }

        $this->_output([]);
    }
}
