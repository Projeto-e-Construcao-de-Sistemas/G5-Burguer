<?php

/**
 * Base for application Controllers.
 *
 */

use Springy\Configuration;
use Springy\Controller;
use Springy\Cookie;
use Springy\DB\Where;
use Springy\Errors;
use Springy\Session;
use Springy\Template;
use Springy\URI;
use Springy\Utils\Strings;

/**
 * Base class for application controllers.
 *
 * This class extends the Springy\Controller class and implement specific resources for this applications.
 */
class StandardController extends Controller
{
    /** @var string Module prefix string. */
    protected $modulePrefix = '';
    /** @var UserSession */
    protected $user;
    /** @var string ACL separator char. */
    protected $separator = ';';
    /** @var bool Sets the authenticated access requirement. */
    protected $authNeeded = false;
    /** @var bool Sets the admin level user requirement. */
    protected $adminLevelNeeded = false;
    /** @var bool Sets the controller as part of administrative system. */
    protected $adminController = false;

    /**
     * @var array Defines a URL to redirect the user if it is not signed
     *            ($authNeeded must be true). Can be a string or an array
     *            used by URI::buildUrl();
     */
    protected $redirectUnsigned = [
        'segments'     => [],
        'query'        => [],
        'forceRewrite' => false,
        'host'         => 'store',
    ];

    /** @var bool Cached page switch. */
    protected $tplIsCached = false;
    /** @var int Cache live time in seconds. */
    protected $tplCacheTime = 1800; // 30 minutes default.
    /** @var mixed Cache identifier. */
    protected $tplCacheId;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->logonUserByQueryString();

        parent::__construct();
    }

    /**
     * Login user by uuid received by query string.
     *
     * @return void
     */
    private function logonUserByQueryString(): void
    {
        return;

        $uuid = URI::getParam('uid');

        if (
            !$uuid
            || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid)
        ) {
            return;
        }

        /** @var Springy\Security\Authentication */
        $authManager = app('user.auth.manager');

        dd("TESTE");
        if ($authManager->check() && $authManager->user()->uuid != $uuid) {
            $this->_forbidden();
        }

        $where = new Where();
        $where->condition('uuid', $uuid);
        $user = new User($where);

        if (!$user->isLoaded() || $user->suspended) {
            return;
        }

        $authManager->loginWithId($uuid);
    }

    /**
     * Extents to stoping redirect method and/or forbidden page impression.
     */
    protected function _forbidden()
    {
        if ($this->user->isLoaded()) {
            new Errors(403, 'Forbidden');
        }
    }

    /**
     * Ends with a 404 - Page not found error.
     *
     * @return void
     */
    protected function _pageNotFound()
    {
        new Errors(404, 'Page not found');
    }

    /**
     * Redirects to another URL.
     *
     * @return void.
     */
    protected function _redirect($url, $params = [], $get = [], $site = 'store')
    {
        if (is_array($url)) {
            URI::redirect(URI::buildURL($url, $get, false, $site));
        }

        if (preg_match('@^http[s]?://@', $url)) {
            URI::redirect($url);
        }

        $segments = Configuration::get('uri', 'appURLs.' . $url . '.segments');

        if ($segments) {
            foreach ($params as $param => $value) {
                $idx = array_search($param, $segments);

                if ($idx !== false) {
                    $segments[$idx] = $value;
                }
            }

            URI::redirect(
                URI::buildURL(
                    $segments,
                    $get,
                    false,
                    Configuration::get('uri', 'appURLs.' . $url . '.site')
                )
            );
        }

        $cfg = Configuration::get('uri', 'common_urls.' . $url);

        if ($cfg) {
            URI::redirect(URI::buildURL($cfg[0], $get, $cfg[2], $cfg[3], $cfg[4]));
        }

        URI::redirect(URI::buildURL([], $get, false, $site));
    }

    /**
     * Template initialization method.
     *
     * @param string $template the name of the template to be created.
     *
     * @return Template Return the created template object.
     */
    protected function _template($template = null)
    {
        if ($this->authNeeded && !$this->user->isLoaded()) {
            $template = ['login'];
        }

        $this->template = new Template($template);
        $this->bindDefaultTemplateVars();
        $this->bindOtherTemplateVars();

        // Template is cached?
        if ($this->tplIsCached) {
            $this->template->setCaching('current');
            $this->template->setCacheLifetime($this->tplCacheTime);

            if (!$this->tplCacheId) {
                $this->tplCacheId = URI::currentPage();
            }

            $this->template->setCacheId($this->tplCacheId);
        }

        return $this->template;
    }

    /**
     * Does all user special verifications.
     */
    protected function _userSpecialVerifications()
    {
        if (!$this->isPermitted()) {
            return false;
        }

        // Valida necessidade de ser administrador
        if ($this->adminLevelNeeded && !$this->user->isAdmin()) {
            return false;
        }

        return true;
    }

    /**
     * Sets all default template variables.
     *
     * @return void
     */
    protected function bindDefaultTemplateVars()
    {
        // Creates a variable with access to the application container
        $this->template->assign('app', app());
        // Admin environment?
        $this->template->assign('adminEnvironment', $this->adminController);
        // Sets default template variables
        $this->template->assign('urlCurrentURL', URI::buildURL(URI::getAllSegments(), []));
        // Creates a variable with last error messages
        $this->template->assign('flashErrorMessages', app('session.flashdata')->lastErrors());
        // Creates a variable with last flash messages
        $this->template->assign('flashMessages', app('session.flashdata')->lastMessages());

        $this->bindUserTemplateVars();

        $this->template->registerPlugin('function', 'assetURL', [$this, 'assetURL']);
    }

    /**
     * Sets all default template variables.
     *
     * @return void
     */
    protected function bindOtherTemplateVars()
    {
        // Restricted page?
        $this->template->assign('restrictedPage', $this->authNeeded);
    }

    /**
     * Sets all template variables for current logged in user.
     *
     * @return void
     */
    protected function bindUserTemplateVars()
    {
        if (!$this->user->isLoaded()) {
            $this->template->assign('userLoggedIn', false);

            return;
        }

        // Add user data to the template engine
        $this->template->assign('userLoggedIn', $this->user);
    }

    /**
     * Default endpoint method.
     */
    public function _default()
    {
        $this->_template();
        $this->template->display();
    }

    /**
     * Returns the URL of static files.
     *
     * Checks whether the file was deployed to AWS S3 bucket or not and then
     * calls classic assetFile template method.
     *
     * This method is registered as a template plugin function.
     *
     * @param array  $params the array of parameters.
     * @param Object $smarty the Smarty template object.
     *
     * @return string
     */
    public function assetURL($params, $smarty): string
    {
        $url = Configuration::get(
            'assets',
            str_replace('/', '.', $params['file'])
        );

        if ($url) {
            return $url;
        }

        return $this->template->templateObject()->assetFile($params, $smarty);
    }
}
