<?php

/**
 * Administrative controllers base class.
 *
 */

use Springy\Controller;
use Springy\Template;
use Springy\URI;

class AdministrativeController extends StandardController
{
    /** @var bool Turns controller as administrative */
    protected $adminController = true;
    /** @var bool Turns authentication needed */
    protected $authNeeded = true;
    /** @var bool Turns user administrative level needed */
    protected $adminLevelNeeded = true;
    /** @var bool Turns off template cache */
    protected $tplIsCached = false;

    protected const MENU_DESCRIPTION = 'desc';
    protected const MENU_ENABLED = 'enabled';
    protected const MENU_ICON = 'icon';
    protected const MENU_ITEMS = 'items';
    protected const MENU_LINK = 'link';

    /**
     * Constructor.
     */
    public function __construct()
    {
        Controller::__construct();
    }

    /**
     * Returns an admin URL for given segments.
     *
     * @param array $segments
     * @param array $query
     *
     * @return string
     */
    private function buildAdminLink(array $segments, array $query = []): string
    {
        return URI::buildURL($segments, $query, false, 'adm', true);
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
        $this->bindMenuTemplateVar();

        return $this->template;
    }

    /**
     * Sets template variable for main menu construct.
     *
     * @return void
     */
    protected function bindMenuTemplateVar()
    {
        $menu = $this->filterMenuItems([
            'menuItemProducts' => [
                self::MENU_ICON => 'barcode',
                self::MENU_DESCRIPTION => 'Produtos',
                self::MENU_LINK => 'products',
            ],
            'menuItemOrderUsers' => [
                self::MENU_ICON => 'shopping-bag',
                self::MENU_DESCRIPTION => 'Pedidos',
                self::MENU_LINK => 'orders',
            ],
            'menuItemAdmins' => [
                self::MENU_ICON => 'user-secret',
                self::MENU_DESCRIPTION => 'Administradores',
                self::MENU_LINK => 'admins',
            ],'menuItemDelivery' => [
                self::MENU_ICON => 'truck',
                self::MENU_DESCRIPTION => 'Taxa de entrega',
                self::MENU_LINK => 'delivery',
            ],
        ]);

        $this->template->assign('mainMenu', $menu);
    }

    /**
     * Filters enabled menu items.
     *
     * @param array $menu
     *
     * @return array
     */
    protected function filterMenuItems(array $menu): array
    {
        $items = [];

        foreach ($menu as $name => $props) {
            $menuItems = [];
            $subItems = $props[self::MENU_ITEMS] ?? [];
            $link = is_array($props[self::MENU_LINK] ?? '')
                ? $props[self::MENU_LINK]
                : [($props[self::MENU_LINK] ?? '')];
            $acl = $link;
            array_unshift($acl, AccessMethod::SYS_ADM);
            $acl = implode(
                UserSession::ACL_SEPARATOR,
                count($acl) > 2 ? $acl : (array_push($acl, '') ? $acl : $acl)
            );
            $enabled = count($subItems)
                ? true
                : $this->user->hasAccess(AccessMethod::METHOD_GET, $acl);

            if ($enabled && count($subItems)) {
                $menuItems = $this->filterMenuItems($subItems);
                $enabled = $enabled && count($menuItems) > 0;
            }

            if ($enabled) {
                $items[$name] = [
                    self::MENU_ICON => $props[self::MENU_ICON] ?? '',
                    self::MENU_DESCRIPTION => $props[self::MENU_DESCRIPTION] ?? '',
                    self::MENU_LINK => $link[0] ? $this->buildAdminLink($link) : null,
                    self::MENU_ENABLED => $enabled,
                    self::MENU_ITEMS => $menuItems,
                ];
            }
        }

        return $items;
    }
}
