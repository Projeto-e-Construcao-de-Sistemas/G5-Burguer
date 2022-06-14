<?php
/**
 * Bootstrap application.
 */

use Springy\Configuration;
use Springy\Kernel;

/**
 * Binds all default dependencies.
 *
 * @return void
 */
function bindDefaultDependencies(): void
{
    // Load the application helper.
    $app = app();

    // Start BCrypt as security hasher for user passwords.
    $app->bind('security.hasher', function () {
        return new Springy\Security\BCryptHasher();
    });

    // Define the user authentication class.
    $app->bind('user.auth.identity', function () {
        return new UserSession();
    });

    // Define the authentication driver for test users sign in.
    $app->bind('user.auth.driver', function ($drv) {
        $hasher = $drv['security.hasher'];
        $user = $drv['user.auth.identity'];

        return new Springy\Security\DBAuthDriver($hasher, $user);
    });

    // Define the authentication manager for you application.
    $app->instance('user.auth.manager', function ($drv) {
        return new Springy\Security\Authentication($drv['user.auth.driver']);
    });

    // Initiate the flash message manager. This is used by Errors class. Do not remove it.
    $app->instance('session.flashdata', new Springy\Utils\FlashMessagesManager());

    // Initiate the input helper. You can remove it ou can use it. :)
    $app->instance('input', new Springy\Core\Input());
}

/**
 * Returns the URL of static files.
 *
 * This method is registered as a template plugin function on errors.
 *
 * @param array  $params the array of parameters.
 * @param Object $smarty the Smarty template object.
 *
 * @return string
 */
function errorAssetURL($params, $smarty): string
{
    $url = Configuration::get(
        'assets',
        str_replace('/', '.', $params['file'])
    );
    if ($url) {
        return $url;
    }

    return '';
}

/**
 * The error handler hook.
 *
 * @return void
 */
function errorHook($msg, $errorType, $errorId, $additionalInfo = ''): void
{
    if (!count(Kernel::getTemplateFunctions())) {
        Kernel::registerTemplateFunction('function', 'assetURL', 'errorAssetURL');
    }

    Kernel::assignTemplateVar('app', app());
    Kernel::assignTemplateVar('flashErrorMessages', app('session.flashdata')->lastErrors());
    Kernel::assignTemplateVar('flashMessages', app('session.flashdata')->lastMessages());
    Kernel::assignTemplateVar('restrictedPage', true);
    Kernel::assignTemplateVar(
        'userLoggedIn',
        app('user.auth.manager')->check()
            ? app('user.auth.manager')->user()
            : false
    );

    if ($errorType == 500) {
        return;
    }
}

date_default_timezone_set('America/Sao_Paulo');
bindDefaultDependencies();
Kernel::setErrorHook('all', 'errorHook');
