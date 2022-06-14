/**
 * @file      Admin system.
 *
 */
/* global admModules, Toastify */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['root', 'jquery'], factory);
    } else if (root.mainApp) {
        // Set as a controller of the mainApp
        root.mainApp.controller = factory(root, root.mainApp, window.jQuery || window.$);
    } else {
        // Browser globals
        console.error('Main application was not loaded'); // eslint-disable-line
    }
}(typeof self !== 'undefined' ? self : this, function (root, parent, $) {
    'use strict';

    // Template object for tables DataTable
    const dataTablesObj = {
        // ajax: {},
        autoWidth: false,
        columns: [],
        deferLoading: 0,
        deferRender: true,
        dom: '<"row"<"col-sm-12"tr>><"row"<"col-xs-12 text-center"i>><"row"<"col-sm-6"l><"col-sm-6"p>>',
        language: parent.dataTablesTranslation('pt-BR'),
        order: [],
        pagingType: 'numbers',
        processing: false,
        scrollX: true,
        scrollCollapse: true,
        serverSide: true,
        stateDuration: 3600,
        stateSave: false
    };

    const iconBugClassName = 'fa-bug text-gray';

    // Initiate the variables
    let jconfirm = null;
    let resizeTimeout;

    /**
     * Returns a HTML code for an a element.
     * @param {Object} element
     * @returns {String}
     */
    const aLinkString = element => {
        const link = document.createElement('a');

        $(link).attr({
            'href': element.href,
            'title': element.title ? element.title : element.text,
            'data-toggle': 'tooltop',
            'target': element.target ? element.target : ''
        }).html(element.text);

        return link.outerHTML;
    };

    /**
     * Returns the the correspondent condition or the default value.
     * @param {*} value
     * @param {Object} conditions
     * @param {*} defValue
     */
    const decision = (value, conditions, defValue) => {
        if (typeof defValue === 'undefined') {
            defValue = 'n/a';
        }

        if (typeof conditions[value] === 'undefined') {
            return defValue;
        }

        return conditions[value];
    };

    /**
     * Checks if was change in form fields content.
     * @param {Boolean} silent
     */
    const formContentChange = (fields, silent) => {
        const form = $('[data-window="form"]');
        let hasChange = Array.isArray(fields) ?
            fields.find(field => {
                const original = field[0] || '';
                const value = field[1] || '';

                return (original !== value);
            }) :
            fields;

        if (form.length && form.is(':visible')) {
            if (hasChange && !silent) {
                // console.warn(hasChange); // eslint-disable-line

                hasChange = !confirm('As alterações não foram salvas.\n\nDeseja continuar?');
            }

            return !(!hasChange);
        }

        return false;
    };

    /**
     * Hides the jConfirm dialog if has an opened one.
     */
    const hideConfirmDialog = () => {
        if (jconfirm) {
            jconfirm.close();
            jconfirm = null;
        }
    };

    /**
     * Returns a HTML code for an i element with the FontAwesome icon.
     * @param {Object} properties
     * @returns {String}
     */
    const htmlIcon = properties => {
        const icon = document.createElement('i');

        $(icon).addClass('fa')
            .addClass(properties.className)
            .attr({
                'title': properties.title,
                'data-toggle': 'tooltip'
            });

        return icon.outerHTML;
    };

    /**
     * Returns the HTML element for message situation icon.
     * @param {String|Number} situation
     * @returns {String}
     */
    const messageSituationIcon = function (situation) {
        return htmlIcon({
            title: messageSituationText(situation),
            className: decision(parseInt(situation, 10), {
                0: 'fa-question text-gray',
                1: 'fa-thumbs-o-up text-success',
                2: 'fa-quote-left text-warning',
                3: 'fa-thumbs-o-down text-danger',
                4: 'fa-hand-paper-o text-gray'
            }, iconBugClassName)
        });
    };

    /**
     * Returns a text description for the message situation.
     * @param {String|Number} situation
     * @returns {String}
     */
    const messageSituationText = function (situation) {
        return decision(parseInt(situation, 10), {
            0: 'Pendente',
            1: 'Aprovada',
            2: 'Moderada',
            3: 'Recusada',
            4: 'Ignorada'
        });
    };

    /**
     * Initializes the module.
     * @param {Object} module
     */
    const moduleDone = module => {
        if (typeof module !== 'object' || typeof module.ready !== 'function') {
            return;
        }

        module.ready();
    };

    /**
     * Initializes the module.
     * @param {Object} module
     * @param {Object} parameters
     */
    const moduleInit = (module, parameters) => {
        if (typeof module !== 'object' || typeof module.init !== 'function') {
            return;
        }

        module.init(parameters);
    };

    /**
     * Normalizes the object for DataTables.
     * @param {Object} data
     * @returns {Object}
     */
    const normalizeDTObj = data => {
        // const dtObj = Object.assign({}, dataTablesObj, data);
        const dtObj = $.normalizeData(dataTablesObj, data);

        if (
            typeof dtObj.ajax === 'object' &&
            dtObj.ajax !== null &&
            typeof dtObj.ajax.url === 'string'
        ) {
            dtObj.ajax.url = restfulUrl(dtObj.ajax.url);
        }

        return dtObj;
    };

    /**
     * Normalizes the object for Select2.
     * @param {Object} data
     * @param {String|null} url
     * @returns {Object}
     */
    const normalizeS2Obj = (data, url, processor, filter) => {
        const ajaxData = params => {
            return {
                'filter': typeof filter === 'function' ?
                    filter(params.term) :
                    {
                        'name': params.term,
                    },
                'start': ((params.page || 1) - 1) * 10,
                'length': 10
            };
        };
        const defObj = {
            allowClear: true,
            language: 'pt-BR',
            minimumInputLength: 3,
            placeholder: 'Clique para selecionar',
            closeOnSelect: false,
            theme: 'bootstrap',
            ajax: url ?
                {
                    url: url,
                    method: 'GET',
                    delay: 250,
                    data: ajaxData,
                    processResults: (result, params) => {
                        let rows = [];

                        params.page = params.page || 1;

                        result.data.forEach(row => {
                            rows.push(
                                typeof processor === 'function' ?
                                    processor(row) :
                                    {
                                        id: row.id,
                                        text: row.name,
                                        disabled: false
                                    }
                            );
                        });

                        return {
                            results: rows,
                            pagination: {
                                more: (params.page * 10) < result.recordsTotal
                            }
                        };
                    },
                    cache: true
                } :
                null,
        };
        // const dtObj = Object.assign({}, defObj, data);
        const s2Obj = $.normalizeData(defObj, data);

        if (
            typeof s2Obj.ajax === 'object' &&
            s2Obj.ajax !== null &&
            typeof s2Obj.ajax.url === 'string'
        ) {
            s2Obj.ajax.url = restfulUrl(s2Obj.ajax.url);
        }

        return s2Obj;
    };

    /**
     * Returns the HTML with icon for the situation of the order item.
     * @param {String|Number} status
     * @returns {String} The HTML for the icon.
     */
    const orderItemSituationIcon = function (status) {
        return htmlIcon({
            title: orderItemSituationText(status),
            className: decision(status, {
                '1': 'fa-clock-o text-gray',
                '2': 'fa-cog fa-spin text-green',
                '3': 'fa-truck text-light-blue',
                '4': 'fa-check-square-o text-green',
                '5': 'fa-truck fa-flip-horizontal text-orange',
                '6': 'fa-undo text-danger',
                '7': 'fa-times text-red',
            }, iconBugClassName)
        });
    };

    /**
     * Returns the text of the situation of the order item.
     * @param {String|Number} status
     * @returns {String}
     */
    const orderItemSituationText = function (status) {
        return decision(status, {
            '1': 'Aguardando aprovação',
            '2': 'Aprovado/Em preparação',
            '3': 'A caminho',
            '4': 'Entregue',
            '5': 'Retornando',
            '6': 'Devolvido',
            '7': 'Cancelado',
        });
    };

    /**
     * Returns the HTML with icon for the situation of the order.
     * @param {String|Number} status
     * @returns {String} The HTML for the icon.
     */
    const orderReferralIcon = status => {
        return htmlIcon({
            title: orderReferralText(status),
            className: decision(status, {
                '0': 'fa-shopping-cart text-yellow',
                '1': 'fa-graduation-cap text-danger',
                '2': 'fa-glass text-fuchsia',
                '3': 'fa-briefcase text-olive',
                '4': 'fa-university text-aqua',
            }, iconBugClassName)
        });
    };

    /**
     * Returns the text for referral of the order.
     * @param {String|Number} status
     * @returns {String}
     */
    const orderReferralText = status => {
        return decision(status, {
            '0': 'Marketplace',
            '3': 'Orçamento',
        });
    };

    /**
     * Returns the HTML with icon for the situation of the order.
     * @param {String|Number} status
     * @returns {String} The HTML for the icon.
     */
    const orderSituationIcon = status => {
        return htmlIcon({
            title: orderSituationText(status),
            className: decision(status, {
                '1': 'fa-clock-o text-gray',
                '2': 'fa-thumbs-o-up text-green',
                '3': 'fa-check-square-o text-green',
                '4': 'fa-times text-red',
            }, iconBugClassName)
        });
    };

    /**
     * Returns the text of the situation of the order.
     * @param {String|Number} status
     * @returns {String}
     */
    const orderSituationText = status => {
        return decision(status, {
            '1': 'Lanche',
            '2': 'Acompanhamento',
            '3': 'Bebida',
        });
    };

    /**
     * Builds the HTML element for message tables with person
     * @param {Object} user
     * @param {Object} store
     * @returns {String}
     */
    const personUserHyperlink = function (user, store) {
        if (store.id) {
            return aLinkString({
                href: '/stores#' + store.id,
                text: store.name
            });
        }

        return aLinkString({
            href: '/users#' + user.id,
            text: user.name
        });
    };

    /**
     * Returns the HTML element for product situation.
     * @param {String|Number} situation
     * @returns {String}
     */
    const productSituationIcon = function (situation) {
        return htmlIcon({
            title: productSituationText(situation),
            className: decision(parseInt(situation, 10), {
                0: 'fa-fw fa-pencil text-gray',
                1: 'fa-fw fa-eye text-green',
                2: 'fa-fw fa-unlink text-warning',
                3: 'fa-fw fa-trash text-red',
                4: 'fa-fw fa-ban text-danger',
                5: 'fa-fw fa-eye-slash text-gray',
            }, iconBugClassName)
        });
    };

    /**
     * Returns a text description for the product situation.
     * @returns {String}
     */
    const productSituationText = function (situation) {
        return decision(parseInt(situation, 10), {
            0: 'Rascunho',
            1: 'Ativo',
            2: 'Inativo',
            3: 'Excluído',
            4: 'Suspenso',
            5: 'Oculto',
        });
    };

    /**
     * Returns the HTML with icon for the situation of the purchase order.
     * @param {String|Number} status
     * @returns {String} The HTML for the icon.
     */
    const purchaseOrderSituationIcon = status => {
        return htmlIcon({
            title: purchaseOrderSituationText(status),
            className: decision(status, {
                '1': 'fa-clock-o text-gray',
                '2': 'fa-thumbs-o-up text-green',
                '3': 'fa-industry text-green',
                '4': 'fa-times text-red',
            }, iconBugClassName)
        });
    };

    /**
     * Returns the text of the situation of the purchase order.
     * @param {String|Number} status
     * @returns {String}
     */
    const purchaseOrderSituationText = status => {
        return decision(status, {
            '1': 'Aguardando aprovação',
            '2': 'Aprovada',
            '3': 'Requerida',
            '4': 'Cancelada',
        });
    };

    /**
     * Risize throttler to avoid DataTables header columns size mismatch.
     */
    const resizeThrottler = () => {
        // ignore resize events as long as an resizeTimeout execution is in the queue
        if (!resizeTimeout) {
            resizeTimeout = setTimeout(() => {
                resizeTimeout = null;

                $.fn.dataTable.tables({
                    visible: true,
                    api: true
                }).columns.adjust();
            }, 66);
        }
    };

    /**
     * Returns a HTML element with action definitions.
     * @param {Object} action
     */
    const rowAction = action => {
        if (action.href) {
            return rowActionLink(action);
        }

        return rowActionSpacer(action);
    };

    /**
     * Returns a HTML link element with an action button.
     * @param {Object} action
     */
    const rowActionLink = action => {
        const button = document.createElement('a');
        const icon = document.createElement('i');

        button.className = 'btn btn-default btn-xs';
        button.append(icon);
        icon.className = `fa fa-${action.icon}`;

        $(button).attr({
            'href': action.href,
            'title': action.title,
            'data-toggle': 'tooltip',
            'data-placement': action.placement || 'top'
        });

        if (action.className) {
            $(button).addClass(action.className);
        }

        if (action.target) {
            $(button).attr('target', action.target);
        }

        if (action.disabled) {
            $(button).addClass('disabled').attr('disabled', true);
        }

        return button;
    };

    /**
     * Returns a HTML element div spacer.
     * @param {Object} action
     */
    const rowActionSpacer = action => {
        const spacer = document.createElement('div');

        spacer.style = 'display:' + (action.display || 'inline-block') +
            ';width:' + (action.width || '4px') +
            ';height:' + (action.height || '4px');

        return spacer;
    };

    /**
     * Returns a HTML string with action buttons for the table row.
     * @param {Object} actions an array of Json objects.
     * @returns {String} The string with all buttons.
     */
    const rowActions = (actions, spacer = true) => {
        let buttons = '';

        actions.forEach(action => {
            const button = rowAction(action);

            buttons += button.outerHTML + (
                spacer ? rowActionSpacer({}).outerHTML : ''
            );
        });

        return buttons.trim();
    };

    /**
     * Shows a jConfirm dialog.
     * @param {Object} parameters
     */
    const showConfirmDialog = parameters => {
        jconfirm = $.confirm(parameters);
    };

    /**
     * Removes accents, swap ñ for n, etc.
     * @param {string} str
     * @returns {string}
     */
    const stringToSlug = function (str) {
        const from = 'àáâãåäªèéëêÆæìíïîòóöôõºðŒØøœùúüûµÑñç¢Ð£ßŠ§šýÿ¥ž¹²³·/_,:;';
        const to = 'aaaaaaaeeeeeeiiiiooooooooooouuuuunnccdlssssyyyz123------';

        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();
        $.each(from.split(''), index => {
            str = str.replace(new RegExp(from.charAt(index), 'g'), to.charAt(index));
        });

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    };

    /**
     * Switchs to the choosen window.
     * @param {String} name the name of the window.
     */
    $.switchWindow = name => {
        const windows = $(`[data-window="${name}"]`);
        const others = $(`[data-window][data-window!="${name}"]`);

        hideConfirmDialog();
        $('.sidebar-form').find('input').val('');

        if (windows.length) {
            windows.addClass('active');
            $(`[data-menu="${name}"]`).show();
        }

        if (others.length) {
            others.removeClass('active');
            $(`[data-menu][data-menu!="${name}"]`).hide();
        }

        resizeThrottler();

        return windows;
    };

    // Maps global functions
    root.decision = decision;
    root.htmlIcon = htmlIcon;
    root.htmlLink = aLinkString;
    root.stringToSlug = stringToSlug;

    // Initializes common admin elements
    parent.slideToTop();

    // Close toolbar on item click
    $('.with-toobar .navbar-static-top .navbar-collapse').on('click', 'a', function () {
        if ($(this).hasClass('dropdown-toggle')) {
            return;
        }

        $(this).parents('.navbar-collapse').collapse('hide');
    });

    /**
     * Opens a yes or no jConfirm dialog box for confirms the action
     * and executes it if confirmed.
     * @param {Object} actions
     * @param {String} action
     */
    $.confirmAction = (actions = {}, action = '') => {
        const options = actions[action] || {};

        $.confirmDialog(options);
    };

    /**
     * Opens a yes or no jConfirm dialog box for confirms the action
     * and executes it if confirmed.
     * @param {Object} options
     */
    $.confirmDialog = (options = {}) => {
        const cancel = (
            Object.prototype.hasOwnProperty.call(options, 'cancel') &&
            (options.cancel instanceof Function)
        ) ? options.cancel : () => history.back();
        const yesLbl = options.confirmText || 'Sim';
        const noLbl = options.cancelText || 'Não';

        if (
            !Object.prototype.hasOwnProperty.call(options, 'action')
            || !(options.action instanceof Function)
        ) {
            location.hash = '';

            return;
        }

        showConfirmDialog({
            title: options.title,
            content: options.content,
            icon: 'fa fa-question',
            theme: 'modern',
            buttons: {
                yes: {
                    text: yesLbl,
                    btnClass: 'btn-success',
                    action: options.action,
                },
                no: {
                    text: noLbl,
                    btnClass: 'btn-danger',
                    action: cancel,
                }
            }
        });
    };

    /**
     * Formats brazilian document number.
     * @param {String} value
     * @returns {String}
     */
    $.formatBrazilianDocument = value => {
        const docnumber = value.replace(/\D/g, '');

        if (docnumber.length === 11) {
            return docnumber.replace(
                /(\d{3})(\d{3})(\d{3})(\d{2})/g,
                '$1.$2.$3-$4'
            );
        }

        if (docnumber.length !== 14) {
            return docnumber;
        }

        return docnumber.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,
            '$1.$2.$3/$4-$5'
        );
    };

    /**
     * Checks wheter the module and action is enabled.
     * @param {String} module
     * @param {String} action
     * @returns {Boolean}
     */
    $.hasAdmModule = (module, action) => {
        return !(!admModules[module] || !admModules[module].includes(action));
    };

    /**
     * Shows a success toast message.
     * @param {String} message
     */
    $.error = message => {
        const options = {
            text: message,
            duration: 3000,
            gravity: 'bottom',
            position: 'center',
            className: 'bg-red-gradient',
            stopOnFocus: true,
            onClick: () => {
                toast.hideToast();
            }
        };
        let toast;

        toast = Toastify(options).showToast();
    };

    /**
     * Shows a success toast message.
     * @param {String} message
     */
    $.success = message => {
        const options = {
            text: message,
            duration: 3000,
            gravity: 'bottom',
            position: 'center',
            className: 'bg-green-gradient',
            stopOnFocus: true,
            onClick: () => {
                toast.hideToast();
            }
        };
        let toast;

        toast = Toastify(options).showToast();
    };

    /**
     * Implements an Object prototype extension to deep compare two object.
     * @param {Object} obj1
     * @param {Object} obj2
     */
    Object.isSimilar = (obj1, obj2) => {
        // Loop through properties in object 1
        for (var p in obj1) {
            // Ignores if property does not exists in object 2
            if (Object.prototype.hasOwnProperty.call(obj1, p) !== Object.prototype.hasOwnProperty.call(obj2, p)) {
                continue;
            }

            if (typeof obj1[p] !== typeof obj2[p]) {
                console.warn(`${p} typeof mismatch`); // eslint-disable-line

                return false;
            }

            switch (typeof (obj1[p])) {
            case 'object': // Deep compare objects
                if (Array.isArray(obj1[p]) && obj1[p].length != obj2[p].length) {
                    console.warn(`${p} array length mismatch`); // eslint-disable-line

                    return false;
                } else if (!Object.isSimilar(obj1[p], obj2[p])) {
                    console.warn(`${p} objects mismatch`); // eslint-disable-line

                    return false;
                }

                break;
            case 'function': // Compare function code
                if (
                    typeof (obj2[p]) == 'undefined' ||
                    (p != 'compare' && obj1[p].toString() != obj2[p].toString())
                ) {
                    console.warn(`${p} functions mismatch`); // eslint-disable-line

                    return false;
                }

                break;
            default: // Compare values
                if (obj1[p] != obj2[p]) {
                    console.warn(`${p} values mismatch. ${obj1[p]} != ${obj2[p]}`); // eslint-disable-line

                    return false;
                }
            }
        }

        //Check object 2 for any extra properties
        // for (var p in obj2) {
        //     if (typeof (obj1[p]) == 'undefined') {
        //         return false;
        //     }
        // }

        return true;
    };

    // Sets default error mode for DataTables.
    $.fn.dataTable.ext.errMode = (e, settings, techNote, message) => {
        parent.showError(
            'Ocorreu um erro ao recuperar os dados da tabela.<br><br>Mensagem de erro: ' +
            message + '<br><br>Nota técnica: ' + techNote
        );
    };

    // AdminLTE hamburger click events
    $(document).on('expanded.pushMenu', resizeThrottler);
    $(document).on('collapsed.pushMenu', resizeThrottler);
    // Window resize event and observer for main sidebar resize
    window.addEventListener('resize', resizeThrottler, false);
    new ResizeObserver(resizeThrottler)
        .observe(document.querySelector('.main-sidebar'));

    // Extends jQuery
    $.fn.extend({
        brazilianDocInputMask: function (options = {}) {
            return $(this).inputmask(
                $.objectNormalizer(options, {
                    mask: ['999.999.999-99', '99.999.999/9999-99'],
                    greedy: false,
                    clearIncomplete: true,
                    autoUnmask: true,
                    onBeforePaste: pastedValue => {
                        return pastedValue.replace(/\D/g, '');
                    }
                })
            ).on('focus', function () {
                $(this).select();
            });
        },
        setDataTable: function (options) {
            return $(this).DataTable(
                normalizeDTObj(options)
            );
        },
        setSelect2: function (options, url = false, processor = false, filter = false) {
            return $(this).select2(
                normalizeS2Obj(options, url, processor, filter)
            );
        },
        setSelectUser: function (filter = false, options = {}) {
            return $(this).setSelect2(
                $.normalizeData(
                    {
                        templateResult: data => {
                            if (!data.id) {
                                return data.text;
                            }

                            return $(
                                `<span>${data.text} - <small>${data.email}</small></span>`
                            );
                        }
                    },
                    options
                ),
                'users',
                row => {
                    return {
                        id: row.id,
                        text: row.name,
                        email: row.email,
                        disabled: false
                    };
                },
                filter
            );
        },
        valBRL: function (options) {
            const $this = $(this);

            $this.val('R$ ' + $.number(options, 2, ',', '.'));

            return $this;
        },
        valDateTime: function (options) {
            const $this = $(this);

            $this.val(parent.formatDateTime(options));

            return $this;
        },
    });

    /**
     * Returns the controller object.
     * @class
     */
    return {
        /**
         * Initiates the controller and load child module.
         * @param {Object} options
         */
        init: function (options) {
            if (!options.module) {
                return;
            }

            // Loads the child module
            $.cachedScript(options.module).done(() => {
                moduleInit(this.module, options.parameters);

                if (typeof this.module.actions !== 'object') {
                    this.module.actions = {};
                }

                if (typeof this.module.formChangeInspect === 'function') {
                    this.module.checkFormChange = (silent) => {
                        return formContentChange(
                            this.module.formChangeInspect(),
                            silent
                        );
                    };
                }

                this.initDataTable();
                this.initGetHash();

                // Prevents lost changes
                if (this.module.checkFormChange) {
                    window.addEventListener('beforeunload', event => {
                        if (this.module.checkFormChange(true)) {
                            event.preventDefault();

                            event.returnValue = '';
                        }
                    });
                    window.addEventListener('popstate', () => {
                        if (this.module.checkFormChange(false)) {
                            history.pushState(
                                null,
                                document.title,
                                document.body.getAttribute('data-hash')
                            );
                        }
                    });
                }

                checkAnchor();

                moduleDone(this.module);
            });
        },
        /**
         * Default module function.
         */
        module: {
            init: () => {
                console.error('No modules has been loaded!'); // eslint-disable-line
            }
        },

        // The dataTable object for the main table of the admin page
        dataTable: null,
        // Regular expression to get a record
        getRecordExp: /^#([\w]+|new)(.*)?$/,
        // Record ID position in regular expression
        getRecordIdx: 1,
        // Regular expression used by showDetails
        hashDetailsExp: /^#([0-9]+|new)(\/(.*))?$/,
        // Regular expression used by showDetails for actions
        hashSubCommand: /^([\w-]+)((:([0-9]+|new))?(\/.*)?)?$/,
        // Regular expression of a record ID to direct load
        recordIdExp: /^[0-9]+$/,

        permatab: false,

        /**
         * Initiates the main table in the admin page.
         */
        initDataTable: function () {
            const filterForm = $('form[role="filter"]');
            const sidebarForm = $('.sidebar-form');
            const dtElm = $(this.module.dataTableEl || '#dataTable');
            const lstElm = this.module.lstElm || '#list-box';
            const refreshBtn = $('a[href="#refresh"]');
            const nullFunc = () => null;

            /**
             * Applies filter to table.
             */
            const applyFilter = form => {
                const action = form.attr('action');
                const box = $(form.data('target'));

                hideFilterBox(box);

                if (action && typeof this.module[action] === 'function') {
                    this.module[action]();

                    return;
                }

                if (
                    $('.area-table').is(':visible') ||
                    $('[data-window="table"]').is(':visible')
                ) {
                    this.dataTable.draw();

                    return;
                }

                location.hash = '';
            };

            /**
             * Hides the filter form box.
             */
            const hideFilterBox = box => {
                const menu = box.parents('.filter-menu');

                if (menu.length) {
                    menu.removeClass('open');
                }
            };

            /**
             * Resets all form fields.
             */
            const resetFilter = form => {
                this.module.resetFilter(form);
            };

            /**
             * Maps module canFilter checker method.
             */
            const canFilter = () => {
                return this.module.canFilter();
            };

            /**
             * Switches visibility of filtering notice callout.
             */
            const switchFilterNotice = notice => {
                if (notice.length) {
                    notice.toggleClass(
                        'hidden',
                        !this.module.isFiltering(notice)
                    );
                }
            };

            if (typeof this.module.resetRecord !== 'function') {
                this.module.resetRecord = nullFunc;
            }

            if (typeof this.module.resetFilter !== 'function') {
                this.module.resetFilter = nullFunc;
            }

            if (typeof this.module.isFiltering !== 'function') {
                this.module.isFiltering = () => false;
            }

            if (typeof this.module.canFilter !== 'function') {
                this.module.canFilter = () => true;
            }

            if (typeof this.module.sidebarSearchForm !== 'function') {
                this.module.sidebarSearchForm = () => false;
            }

            if (typeof this.module.dataTableObj !== 'undefined') {
                if (!dtElm.data('notice')) {
                    dtElm.attr('data-notice', '#filtering-notice');
                }

                this.dataTable = dtElm.setDataTable(
                    this.module.dataTableObj
                ).on('draw', (e) => {
                    const refBtn = $(`a[href="#refresh"][data-target="#${e.target.id}"]`);

                    if (refBtn.length) {
                        refreshBtn.find('.fa-refresh').removeClass('fa-pulse');
                    }

                    deleteOverlay(lstElm);
                    $('[data-toggle="tooltip"]').tooltip();

                    if (e.target.dataset.notice) {
                        switchFilterNotice(
                            $(e.target.dataset.notice)
                        );
                    }
                }).on('processing', (e, settings, processing) => {
                    const refBtn = $(`a[href="#refresh"][data-target="#${e.target.id}"]`);

                    if (processing) {
                        addOverlay(lstElm);

                        if (refBtn.length) {
                            refBtn.find('.fa-refresh').addClass('fa-pulse');
                        }
                    }
                });

                // Register hash to show table
                parent.registerHash(
                    '',
                    () => {
                        this.permatab = false;
                        this.module.resetRecord();
                        $.switchWindow('table');
                        this.dataTable.draw('page');
                    }
                );
                // Binds action to create a new record
                // parent.registerHash(/^#(0|new)(\/(.*))?$/, () => {
                //     this.module.resetRecord();
                //     this.showDetails();
                // });
            }

            // Refresh buttons action
            if (refreshBtn.length) {
                refreshBtn.each(function () {
                    const $this = $(this);
                    const defaultId = dtElm.attr('id');

                    if (!$this.data('target')) {
                        $this.attr('data-target', `#${defaultId}`);
                    }
                });

                refreshBtn.on('click', function (evt) {
                    const target = $($(this).data('target'));

                    evt.preventDefault();

                    target.DataTable().draw();
                });
            }

            // Binds filter actions
            if (filterForm.length) {
                // Binds filter form submit action
                filterForm.on('submit', function (evt) {
                    const form = $(this);

                    evt.preventDefault();

                    if (canFilter()) {
                        applyFilter(form);
                    }
                });
                // filterForm.find('button[type="submit"]').on('click', function () {
                //     $(this).parents('form:eq(0)').submit();
                // });

                // Binds filter clear buttons click
                $('[data-filter-clear]').click(function (evt) {
                    const box = $($(this).data('filter-clear'));
                    const form = box.find('form');

                    evt.preventDefault();

                    form.get(0).reset();
                    resetFilter(form);
                    applyFilter(form);
                });

                // To avoid closing filter dropdown by select2 or daterangepicker
                $(document).on(
                    'click',
                    '.select2-results__option, .select2-selection__choice__remove, .select2-search, .daterangepicker.ltr>*',
                    () => {
                        return false; // prevent propagation
                    }
                );
            }

            // Binds sidebar search form submit
            if (sidebarForm.length) {
                sidebarForm.submit(evt => {
                    const inputField = sidebarForm.find('input');
                    const search = inputField.val();

                    evt.preventDefault();

                    inputField.val('');
                    $('body').removeClass('sidebar-open');

                    if (!search) {
                        return;
                    }

                    // Is a number? Maybe an ID.
                    if (this.recordIdExp.test(search)) {
                        location.hash = search;

                        return;
                    }

                    // Performs the seach;
                    if (this.module.sidebarSearchForm(search)) {
                        applyFilter(filterForm);
                    }
                });
            }
        },
        /**
         * Initiates the hash bind to get the selected record.
         */
        initGetHash: function () {
            const windows = $('[data-window="form"]');
            const checkFormChange = this.module.checkFormChange;
            const formSave = this.module.formSave;

            if (
                (typeof this.module.getRecord !== 'function') ||
                (typeof this.module.currentRecord === 'undefined') ||
                (this.dataTable === null) ||
                (typeof this.module.fillDetails !== 'function') ||
                (typeof this.module.resetRecord !== 'function')
            ) {
                return;
            }

            // Register hash to get the record and shows it
            parent.registerHash(this.getRecordExp, match => {
                const recId = match[this.getRecordIdx];

                if (!recId) {
                    location.hash = '';

                    return;
                }

                if (recId === this.module.currentRecord().id) {
                    this.showDetails(false);

                    return;
                }

                // this.module.resetRecord();

                if (recId.match(/^(0|new)$/)) {
                    this.module.resetRecord();
                    this.showDetails(true);
                    // this.showDetails(
                    //     windows.is(':hidden')
                    // );

                    return;
                }

                this.module.getRecord(recId, () => {
                    this.showDetails(true);
                });
            });

            // Inspects tab changes to reload child DataTables if needed.
            $('a[data-toggle="tab"]').on('shown.bs.tab', evt => {
                const href = $(evt.target).attr('href');
                const table = $(href).find('table.dataTable');

                if (table.length) {
                    const dtable = table.DataTable();
                    const body = dtable.table().body();

                    if (body.className == 'MR') {
                        body.className = '';
                        dtable.draw();
                    }
                }

                $.fn.dataTable.tables({
                    visible: true,
                    api: true
                }).columns.adjust();
            });

            if (!windows.length || typeof formSave !== 'function') {
                return;
            }

            // Form submit
            const submitForm = () => {
                if (!checkFormChange(true)) {
                    $.error('Nenhuma alteração para salvar.');

                    return false;
                }

                return formSave();
            };

            windows.on('submit', 'form', evt => {
                evt.preventDefault();

                return submitForm();
            });
            windows.on('click', '[data-save="form"]', function (evt) {
                const $this = $(this);

                evt.preventDefault();

                if ($this.hasClass('disabled')) {
                    return false;
                }

                return submitForm();
            });
        },
        /**
         * Switch to details of the record box.
         */
        showDetails: function (redraw = true) {
            const recId = this.module.currentRecord().id || 'new';
            const match = window.location.hash.match(this.hashDetailsExp) || [];
            const method = match[3] || '';
            const forms = $.switchWindow('form');

            document.body.setAttribute('data-hash', location.hash);

            /**
             * Process a verb for current record.
             * @param {String} expression
             */
            const recordCommand = (expression) => {
                const match = expression.match(this.hashSubCommand);
                const command = match[1] || '';
                const childId = match[4] || '';
                const superCommand = command + (match[5] || '#');
                const superForm = (match[5] || '').substring(1);
                const childs = $(`[data-window="form-${command}"]`);
                const grandchild = $(`[data-window="form-${command}-${superForm}"]`);

                /**
                 * Sets back to form window action button.
                 * @param {Object} elm
                 */
                const setBackLink = elm => {
                    const btn = elm.find('[data-close-child]');

                    if (btn.length) {
                        btn.attr(
                            'href',
                            btn.data('close-child')
                                .replace('[id]', recId)
                                .replace('[childId]', childId ? `:${childId}` : '')
                        );
                    }
                };

                const showForm = (elm, name) => {
                    $(`[data-menu="form-${name}"]`).show();
                    $(`[data-menu="form-${name}"] > a`).each(function () {
                        const $this = $(this);

                        $this.attr(
                            'href',
                            $this.attr('data-href')
                                .replace('[id]', recId)
                                .replace('[childId]', childId ? `:${childId}` : '')
                        );
                    });
                    forms.addClass('reduced');
                    elm.addClass('active');
                    setBackLink(elm);
                };

                this.permatab = true;

                $('[data-menu="form"].hidable').hide();
                $('[data-save="form"]').hide();

                if (grandchild.length) {
                    $(`[data-menu="form-${command}"].hidable`).hide();
                    showForm(grandchild, `${command}-${superCommand}`);
                } else if (childs.length) {
                    showForm(childs, command);
                }

                // Has a method for the command?
                if (typeof this.module.actions[command] === 'function') {
                    this.module.actions[command](childId);
                }
                // Has an method for the superCommand?
                if (typeof this.module.actions[superCommand] === 'function') {
                    this.module.actions[superCommand](childId);
                }
            };

            /**
             * Form tab panels control.
             */
            const yabaTab = () => {
                const firstTab = this.permatab ?
                    [] :
                    $('#main-form .nav.nav-tabs').find('a[href^="#tab-"]:visible:first');

                if (!firstTab.length) {
                    this.permatab = false;

                    return;
                }

                $('#main-form .tab-pane table tbody').addClass('MR');
                firstTab.tab('show');

                const firstTable = $(firstTab.attr('href')).find('table.dataTable');

                if (firstTable.length) {
                    const dtable = firstTable.DataTable();
                    const body = dtable.table().body();

                    body.className = '';
                    dtable.draw();
                }
            };

            // Updates menu actions link
            $('[data-menu="form"] > a').each(function () {
                const $this = $(this);

                $this.attr(
                    'href',
                    $this.attr('data-href').replace('[id]', recId)
                );
            });
            // Calls module method to fills window with data
            if (redraw) {
                this.module.fillDetails();
            }
            // Calls form command menu toggler function
            if (typeof this.module.formCommandsToggler === 'function') {
                this.module.formCommandsToggler();
            }

            if (recId && method) {
                recordCommand(method);

                return;
            }

            forms.removeClass('reduced');
            $('[data-save="form"]').show();
            yabaTab();
        },
        dataTablesObj: normalizeDTObj,
        htmlLink: aLinkString,
        iconBug: htmlIcon({
            className: iconBugClassName,
            title: 'N/A'
        }),
        messageSituationIcon: messageSituationIcon,
        messageSituationText: messageSituationText,
        orderItemSituationIcon: orderItemSituationIcon,
        orderItemSituationText: orderItemSituationText,
        orderReferralIcon: orderReferralIcon,
        orderReferralText: orderReferralText,
        orderSituationIcon: orderSituationIcon,
        orderSituationText: orderSituationText,
        productSituationIcon: productSituationIcon,
        productSituationText: productSituationText,
        personUserHyperlink: personUserHyperlink,
        purchaseOrderSituationIcon: purchaseOrderSituationIcon,
        purchaseOrderSituationText: purchaseOrderSituationText,
        rowActions: rowActions,
        /**
         * Returns the description of shipping origin code.
         * @param {Number} cod
         * @returns string
         */
        shippingOriginName: (cod) => {
            return ({
                0: 'Cálculo legado',
                1: 'Sistema dos Correios',
                2: 'Arbitrado por falha no sistema dos Correios',
                3: 'Tabela de fretes do produto',
                4: 'Produto com frete grátis',
                6: 'Cadastrado manualmente no orçamento',
            })[cod] || 'Indefinido';
        },
        showConfirmDialog: showConfirmDialog,
        hideConfirmDialog: hideConfirmDialog,
    };
}));