/**
 * @file Complementar script for the administrative of users.
 *
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (root.mainApp.controller) {
        // Set as a module for the controller
        root.mainApp.controller.module = factory(mainApp.controller, window.jQuery || window.$);
    } else if (root.mainApp) {
        // Set as a controller for main application
        root.mainApp.controller = factory(mainApp, window.jQuery || window.$);
    } else {
        // Browser globals
        console.error('Main application was not loaded'); // eslint-disable-line
    }
}(typeof self !== 'undefined' ? self : this, function (parent, $) {
    'use strict';

    // Data model
    const dataModel = {
        'id': 0,
        'consultant_id': 0,
        'name': '',
        'email': '',
        'phone': '',
        'document_number': '',
        'birth_date': '',
        'seller': 0,
        'professional': 0,
        'admin': 0,
        'registration_ip': '',
        'suspended': 0
    };
    const dataConv = {
        'consultant_id': val => parseInt(val, 10),
        'phone': val => (val || ''),
        'document_number': val => (val || ''),
        'birth_date': val => (val || ''),
        'seller': val => parseInt(val, 10),
        'professional': val => parseInt(val, 10),
        'admin': val => parseInt(val, 10),
        'suspended': val => parseInt(val, 10),
    };
    const addressModel = {
        'id': 0,
        'user_id': 0,
        'name': '',
        'zip_code': '',
        'address': '',
        'number': '',
        'complement': '',
        'neighborhood': '',
        'city': '',
        'state': ''
    };

    const suspendedIcon = {
        '0': htmlIcon({
            className: 'fa-check text-green',
            title: 'Ativo'
        }),
        '1': htmlIcon({
            className: 'fa-ban text-red',
            title: 'Suspenso'
        })
    };

    // Action buttons
    const actDemote = $('[data-form-action="demote"]');
    const actPromote = $('[data-form-action="promote"]');
    const actReactivate = $('[data-form-action="reactivate"]');
    const actSuspend = $('[data-form-action="suspend"]');

    // Filter fields
    const filterConsult = $('#filter-consultant_id');
    const filterEmail = $('#filter-email');
    const filterName = $('#filter-name');
    const filterType = $('#filter-type');
    const filterSuspended = $('#filter-suspended');

    // Form fields
    const inpId = $('#record-id');
    const inpAddrId = $('#address-id');

    const editBirth = $('#edit-birth_date');
    const editConsult = $('#edit-consultant_id');
    const editName = $('#edit-name');
    const editEmail = $('#edit-email');
    const editPhone = $('#edit-phone');
    const editDocument = $('#edit-document_number');

    // Address form fields
    const editAddrNam = $('#edit-address-name');
    const editAddrZip = $('#edit-address-zip_code');
    const editAddrStr = $('#edit-address-address');
    const editAddrNum = $('#edit-address-number');
    const editAddrCpl = $('#edit-address-complement');
    const editAddrNgb = $('#edit-address-neighborhood');
    const editAddrCit = $('#edit-address-city');
    const editAddrStt = $('#edit-address-state');
    const formAddr = $('#form-address');

    const isApple = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    // Current record data
    let currentRecord = $.objectNormalizer(dataModel, dataModel);
    let currentAddress = addressModel;

    /**
     * Builds the payload Json.
     * @returns {Object}
     */
    const buildPayload = () => {
        return {
            'consultant_id': parseInt(editConsult.val() || 0, 10),
            'name': editName.val(),
            'email': editEmail.val(),
            'phone': editPhone.val(),
            'document_number': editDocument.val(),
            'birth_date': $.brDateFormat(editBirth.val()),
        };
    };

    /**
     * Checks wheter filter form has no restriction for filtering.
     * @returns {Boolean}
     */
    const canFilter = () => {
        if (filterName.val() && filterName.val().length < 3) {
            mainApp.showError(
                'Tente ser mais específico.<br>Texto muito pequeno para filtrar pelo nome.'
            );

            return false;
        }

        return true;
    };

    /**
     * Informs if can toggles professional flag for the current user.
     * @param {Boolean} status
     * @returns {Boolean}
     */
    const canTogglePro = status => {
        const enabled = parseInt(currentRecord.suspended, 10) === 0;
        const isPro = parseInt(currentRecord.professional, 10) === 1;

        return enabled &&
            isPro !== status &&
            $.hasAdmModule('users', 'corp');
    };

    /**
     * Informs if can toggles suspension flag for the current user.
     * @param {Boolean} status
     * @returns {Boolean}
     */
    const canToggleSuspension = status => {
        const enabled = parseInt(currentRecord.suspended, 10) === 0;

        return enabled === status &&
            $.hasAdmModule('users', 'write');
    };

    /**
     * Calls a special method to sets an user flag.
     * @param {string} method the API method.
     */
    const changeUserFlag = (method, message) => {
        mainApp.ajax({
            url: `users/${currentRecord.id}/${method}`,
            method: 'PUT',
            data: {
                embCnt: 1,
            },
            success: result => {
                setRecord(result);
                fillEditForm();
                history.back();
                $.success(`Cliente ${message} com sucesso.`);
            },
            error: () => {
                history.back();
            }
        });
    };

    /**
     * Checks if current user is suspended and toggles visual infos.
     */
    const checkSuspended = () => {
        const suspended = parseInt(currentRecord.suspended, 10) == 1;
        const span = document.createElement('span');

        inpId.toggleClass('text-red', suspended);
        $('#main-form .form-group').toggleClass('has-error', suspended);

        span.className = 'label label-danger text-sm';
        span.innerText = 'SUSPENSO';

        if (suspended) {
            inpId.append(' ')
                .append(span.outerHTML);
        }
    };

    /**
     * Clears the filter fields.
     */
    const clearFilter = () => {
        filterConsult.val('').trigger('change');
    };

    /**
     * Returns an object with list of confirmations for $.confirmAction extension.
     * @param {*} params
     * @returns {Object}
     */
    const confirmations = (params = {}) => {
        return {
        };
    };

    /**
     * Confirms the remotion of the user from professional access.
     */
    const confirmProDel = () => {
        if (!canTogglePro(false)) {
            $.error('Usuário não pode ser desassociado do corporativo.');

            history.back();

            return;
        }

        $.confirmAction(confirmations(currentRecord), 'demotePro');
    };

    /**
     * Confirms reactivation of the user.
     */
    const confirmReactivation = () => {
        if (!canToggleSuspension(false)) {
            $.error('Usuário não pode ser reativado.');

            history.back();

            return;
        }

        $.confirmAction(confirmations(currentRecord), 'reactivate');
    };

    /**
     * Confirms suspension of the user.
     */
    const confirmSuspension = () => {
        if (!canToggleSuspension(true)) {
            $.error('Usuário não pode ser suspenso.');

            history.back();

            return;
        }

        $.confirmAction(confirmations(currentRecord), 'suspend');
    };

    /**
     * Builds filtering parameters object.
     * @returns {Object}
     */
    const dataFilter = () => {
        let filter = {};

        if (filterConsult.val().length) {
            filter.consultant_id = filterConsult.val();
        }
        if (filterName.val().trim()) {
            filter.name = filterName.val().trim();
        }
        if (filterEmail.val().trim()) {
            filter.email = filterEmail.val().trim();
        }
        if (filterType.val()) {
            filter.type = filterType.val();
        }
        if (filterSuspended.val()) {
            filter.suspended = filterSuspended.val();
        }

        return filter;
    };

    /**
     * Fills form edit fields.
     */
    const fillEditForm = () => {
        inpId.text(currentRecord.id);

        // User data
        $('#edit-uuid').val(currentRecord.uuid);
        editName.val(currentRecord.name);
        editEmail.val(currentRecord.email);
        editPhone.val(currentRecord.phone);
        editDocument.inputmask('setvalue', currentRecord.document_number || '');
        $('#edit-balance').val($.brlFormat(currentRecord.balance));
        $('#edit-registration_ip').val(currentRecord.registration_ip);
        $('#edit-created_at').val(mainApp.formatDateTime(currentRecord.created_at));

        if (isApple) {
            editBirth.val(mainApp.formatDate(currentRecord.birth_date));
        } else {
            editBirth.datepicker(
                'update',
                mainApp.formatDate(currentRecord.birth_date)
            );
        }

        setAttribute('facebook', currentRecord.fb_id ? 1 : 0);
        setAttribute('professional', currentRecord.professional);
        setAttribute('shopkeeper', currentRecord.seller);
        setAttribute('admin', currentRecord.admin);
        setConsultant();
        checkSuspended();

        mainApp.setFocus(editName);

        // tableOrders.draw();
    };

    /**
     * Fills form to edit address.
     */
    const fillEditFormAddress = () => {
        inpAddrId.text(currentAddress.id);

        editAddrNam.val(currentAddress.name);
        editAddrZip.val(currentAddress.zip_code);
        editAddrStr.val(currentAddress.address);
        editAddrNum.val(currentAddress.number);
        editAddrCpl.val(currentAddress.complement);
        editAddrNgb.val(currentAddress.neighborhood);
        editAddrCit.val(currentAddress.city);
        editAddrStt.val(currentAddress.state);

        mainApp.setFocus(editAddrNam);
    };

    /**
     * Gets the address record.
     * @param {String|Number} addressId
     */
    const getAddress = addressId => {
        if (!addressId) {
            history.back();

            return;
        }

        if (addressId === currentAddress.id) {
            fillEditFormAddress();

            return;
        }

        currentAddress = addressModel;

        mainApp.ajax({
            url: `addresses/${addressId}`,
            method: 'GET',
            success: result => {
                currentAddress = $.objectNormalizer(result, addressModel);
                fillEditFormAddress();
            },
            error: () => {
                history.back();
            }
        });
    };

    /**
     * Builds the html element for column table with person of the message.
     * @param {Object} data
     */
    const messagePerson = data => {
        if (!data.message || !data.message.conversation) {
            return 'Erro!';
        }

        if (data.message.sender_user_id === currentRecord.id) {
            return parent.personUserHyperlink(data.message.receiverUser, data.message.receiverStore);
        }

        return parent.personUserHyperlink(data.message.senderUser, data.message.senderStore);
    };

    /**
     * Clear the current selected user.
     */
    const resetRecord = () => {
        setRecord(dataModel);
    };

    /**
     * Sets user's attribute information.
     * @param {String} name
     * @param {String|Number} value
     */
    const setAttribute = (name, value) => {
        const isOn = parseInt(value, 10) === 1;

        $(`#info-${name}`).val(isOn ? 'Sim' : 'Não');
        $(`#sign-${name}`)
            .toggleClass('text-green', isOn)
            .toggleClass('text-gray', !isOn);
    };

    /**
     * Sets value for all consultant fields.
     */
    const setConsultant = () => {
        // editConsult.prop('disabled', true);

        if (
            (typeof currentRecord.consultant === 'undefined') ||
            (typeof currentRecord.consultant.name === 'undefined') ||
            (!currentRecord.id)
        ) {
            editConsult.val(null).trigger('change');

            return;
        }

        if (!editConsult.find(`option[value="${currentRecord.consultant.id}"]`).length) {
            const newOption = new Option(
                currentRecord.consultant.name,
                currentRecord.consultant.id,
                false,
                false
            );

            editConsult.append(newOption);
        }

        editConsult.val(currentRecord.consultant.id).trigger('change');
    };

    /**
     * Sets record data.
     * @param {Object} data
     */
    const setRecord = data => {
        currentRecord = $.objectNormalizer(data, dataModel, dataConv);
    };

    /**
     * Returns the HTML code for situation label.
     * @param {Number} code
     */
    const situationTag = code => {
        const texts = {
            '0': 'Novo',
            '1': 'Em cotação',
            '2': 'Em aprovação',
            '3': 'Pronto',
            '4': 'Aprovado',
            '5': 'Expirado',
            '6': 'Excluído',
            '7': 'Descontinuado',
        };
        const colors = {
            '0': 'aqua-gradient',
            '1': 'maroon-gradient',
            '2': 'yellow-gradient',
            '3': 'light-blue-gradient',
            '4': 'green-gradient',
            '5': 'gray-active',
            '6': 'black-gradient',
            '7': 'red-gradient',
        };

        if (!texts[code]) {
            return '';
        }

        const label = document.createElement('span');

        label.className = `label bg-${colors[code]} text-sm`;
        label.innerText = texts[code];

        return label.outerHTML;
    };

    // Table of addresses.
    const tableAddresses = $('#users-addresses').setDataTable({
        ordering: false,
        ajax: {
            url: 'addresses',
            method: 'GET',
            data: data => {
                data.filter = {
                    'user_id': currentRecord.id
                };
            }
        },
        columns: [
            // Name
            {
                data: 'name',
                className: 'text-nowrap',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `#${currentRecord.id}/address:${row.id}`,
                        text: data
                    });
                }
            },
            // Address
            {
                data: 'address',
                className: 'text-nowrap',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `#${currentRecord.id}/address:${row.id}`,
                        text: data
                    });
                }
            },
            // Number
            {
                data: 'number',
                className: 'text-right text-nowrap',
            },
            // Complement
            {
                data: 'complement',
                className: 'text-nowrap',
            },
            // Neighborhood
            {
                data: 'neighborhood',
                className: 'text-nowrap',
            },
            // City
            {
                data: 'city',
                className: 'text-nowrap',
            },
            // State
            {
                data: 'state',
                className: 'text-nowrap',
                width: '1%'
            },
            // ZIP code
            {
                data: 'zip_code',
                className: 'text-nowrap',
                render: $.formatZIP,
                width: '1%'
            },
            {
                data: null,
                className: 'text-center text-nowrap',
                orderable: false,
                type: 'html',
                width: '1%',
                render: data => {
                    return parent.rowActions([{
                        href: `#${currentRecord.id}/address:${data.id}`,
                        icon: 'pencil',
                        title: 'Editar',
                        disabled: false
                    }, {
                        href: `#${currentRecord.id}/address:${data.id}/delete`,
                        icon: 'trash',
                        title: 'Excluir',
                        disabled: false,
                        target: false
                    }]);
                }
            }
        ],
    }).on('draw', () => {
        deleteOverlay('#users-addresses');
        tableAddresses.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-addresses');
        }
    });

    // Table of credit cards.
    const tableCreditCards = $('#users-cards').setDataTable({
        ajax: {
            url: 'cards',
            method: 'GET',
            data: data => {
                data.filter = {
                    'user_id': currentRecord.id
                };
            }
        },
        columns: [
            // Gateway
            {
                data: 'gateway',
                className: 'text-nowrap',
                render: data => {
                    return decision(data, {
                        '1': 'Moip',
                        '2': 'Pagar.me'
                    });
                }
            },
            // Card flag
            {
                data: 'card_flag',
                className: 'text-nowrap',
            },
            // Last 4 digits
            {
                data: 'card_last_digits',
                className: 'text-nowrap',
                width: '1%'
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
            // Actions
            {
                data: null,
                className: 'text-center text-nowrap',
                orderable: false,
                type: 'html',
                width: '1%',
                render: data => {
                    return parent.rowActions([{
                        href: `#${currentRecord.id}/credit-cards:${data.id}/delete`,
                        icon: 'trash',
                        title: 'Excluir',
                        disabled: false
                    }]);
                }
            }
        ],
        ordering: false
    }).on('draw', () => {
        deleteOverlay('#users-cards');
        tableCreditCards.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-cards');
        }
    });

    // Table of collections
    const tableCollections = $('#users-collections').setDataTable({
        ajax: {
            url: 'collections',
            method: 'GET',
            data: data => {
                data.filter = {
                    'user_id': currentRecord.id
                };
            }
        },
        columns: [
            // Name
            {
                data: 'name',
                className: 'text-nowrap',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `/collections#${row.id}`,
                        text: data
                    });
                }
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
        ],
        order: [
            [0, 'asc']
        ]
    }).on('draw', () => {
        deleteOverlay('#users-collections');
        tableCollections.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-collections');
        }
    });

    // Table of messages
    const tableMessages = $('#users-messages').setDataTable({
        ajax: {
            url: 'user-messages',
            method: 'GET',
            error: mainApp.ajaxError,
            data: data => {
                data.filter = {
                    user_id: currentRecord.id
                };
            }
        },
        columns: [
            // Direction
            {
                data: null,
                orderable: false,
                className: 'text-center text-nowrap',
                type: 'html',
                width: '1%',
                render: data => {
                    if (data.message.sender_user_id === currentRecord.id) {
                        return htmlIcon({
                            className: 'fa-share text-primary',
                            title: 'Out'
                        });
                    }

                    return htmlIcon({
                        className: 'fa-reply text-warning',
                        title: 'In'
                    });
                }
            },
            // Was read icon
            {
                data: 'was_read',
                orderable: false,
                className: 'text-center text-nowrap',
                type: 'html',
                width: '1%',
                render: data => {
                    if (data === '1') {
                        return htmlIcon({
                            className: 'fa-envelope-open-o text-gray',
                            titla: 'Lida'
                        });
                    }

                    return htmlIcon({
                        className: 'fa-envelope-o',
                        title: 'Não lida'
                    });
                }
            },
            // Modaration icon
            {
                data: 'message.moderation',
                orderable: false,
                className: 'text-center text-nowrap',
                type: 'html',
                width: '1%',
                render: parent.messageSituationIcon
            },
            // Person
            {
                data: null,
                className: 'text-nowrap',
                orderable: false,
                render: messagePerson
            },
            // Subject
            {
                data: 'message.conversation.subject',
                className: 'text-nowrap',
                orderable: false,
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `/messages#${row.message_id}`,
                        text: data
                    });
                }
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
            // Actions
            {
                data: null,
                className: 'text-center text-nowrap',
                orderable: false,
                render: function (data) {
                    return parent.rowActions([{
                        href: `/messages#${data.message_id}`,
                        icon: 'eye',
                        title: 'Ver detalhes' +
                            (data.message.moderation === '0' ? ' | Moderar' : ''),
                        disabled: false
                    }, {
                        href: `/messages#${data.message_id}/conversation`,
                        icon: 'comments',
                        title: 'Ver toda a conversa',
                        disabled: false
                    }]);
                },
                type: 'html',
                width: '1%'
            }
        ],
        order: [
            [5, 'desc']
        ]
    }).on('draw', () => {
        deleteOverlay('#users-messages');
        tableMessages.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-messages');
        }
    });

    // Table of orders.
    const tableOrders = $('#users-orders').setDataTable({
        ajax: {
            url: 'orders',
            method: 'GET',
            data: data => {
                data.filter = {
                    'user_id': currentRecord.id
                };
            }
        },
        columns: [
            // Order number
            {
                data: 'order_number',
                className: 'text-nowrap',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `/orders#${row.id}`,
                        text: data
                    });
                },
                type: 'html',
                width: '1%'
            },
            // Order situation
            {
                data: 'situation',
                className: 'text-center',
                render: parent.orderSituationIcon,
                width: '1%'
            },
            // Order referral
            {
                data: 'referral',
                orderable: false,
                className: 'text-center',
                render: parent.orderReferralIcon,
                type: 'html',
                width: '1%'
            },
            // Products quantity
            {
                data: 'items_quantity',
                orderable: false,
                className: 'text-right text-nowrap',
                width: '1%',
            },
            // Products value
            {
                data: 'products_value',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Shipping value
            {
                data: 'shipping_value',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Discount
            {
                data: 'discount_value',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Interest value
            {
                data: 'interest_value',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Total value
            {
                data: null,
                orderable: false,
                className: 'text-right text-nowrap',
                render: data => {
                    return $.brlFormat(
                        parseFloat(data.products_value) +
                        parseFloat(data.shipping_value) +
                        parseFloat(data.interest_value),
                        2,
                        ',',
                        '.'
                    );
                },
                width: '1%'
            },
            // Total paid
            {
                data: 'total_paid',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Returned value
            {
                data: 'returned_value',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Approved at
            {
                data: 'approved_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
        ],
        order: [
            [0, 'desc']
        ]
    }).on('draw', () => {
        deleteOverlay('#users-orders');
        tableOrders.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-orders');
        }
    });

    // Table of products in cart.
    const tableShoppingCart = $('#users-cart').setDataTable({
        ordering: false,
        ajax: {
            url: 'carts/user',
            method: 'GET',
            error: mainApp.ajaxError,
            data: data => {
                data.id = currentRecord.id;
            }
        },
        columns: [
            // Product
            {
                data: null,
                className: 'text-nowrap',
                render: data => {
                    return htmlLink({
                        href: `/products#${data.product.id}`,
                        text: data.product.name
                    });
                }
            },
            // Variation
            {
                data: 'product.variation.name',
                className: 'text-nowrap',
            },
            // Designer
            {
                data: null,
                className: 'text-nowrap',
                orderable: false,
                render: data => {
                    return htmlLink({
                        href: '/designers#' + data.designer.id,
                        text: data.designer.name
                    });
                }
            },
            // Store
            {
                data: null,
                className: 'text-nowrap',
                render: data => {
                    return htmlLink({
                        href: '/stores#' + data.store.id,
                        text: data.store.name
                    });
                }
            },
            // Quantity
            {
                data: 'quantity',
                className: 'text-right text-nowrap',
                width: '1%'
            }
        ],
        dom: '<"row"<"col-sm-12"tr>>',
        order: [],
        paging: false
    }).on('draw', () => {
        deleteOverlay('#users-cart');
        tableShoppingCart.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-cart');
        }
    });

    // Table of statement.
    const tableStatements = $('#users-statement').setDataTable({
        ajax: {
            url: 'user-statement',
            method: 'GET',
            error: mainApp.ajaxError,
            data: data => {
                data.filter = {
                    'user_id': currentRecord.id
                };
            }
        },
        columns: [
            // ID
            {
                data: 'id',
                className: 'text-right',
                width: '1%'
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
            // Description
            {
                data: 'description',
                className: 'text-nowrap',
                orderable: false
            },
            // Reference id
            {
                data: 'reference_id',
                orderable: false,
                className: 'text-right text-nowrap',
                width: '1%'
            },
            // Transaction value
            {
                data: 'transaction_value',
                orderable: false,
                className: 'text-right text-nowrap',
                render: data => {
                    const value = parseFloat(data);
                    const span = document.createElement('span');

                    span.className = (value < 0) ?
                        'text-red' :
                        'text-blue';
                    span.innerText = $.brlFormat(value);

                    return span.outerHTML;
                },
                width: '1%'
            }
        ],
        order: [
            [1, 'desc']
        ]
    }).on('draw', () => {
        deleteOverlay('#users-statement');
        tableStatements.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-statement');
        }
    });

    // Table of quotes.
    const tableQuotes = $('#users-quotes').setDataTable({
        ajax: {
            url: 'quotes',
            method: 'GET',
            error: mainApp.ajaxError,
            data: data => {
                data.embRsp = 1;
                data.filter = {
                    'user_id': currentRecord.id
                };
            }
        },
        columns: [
            // Quote id
            {
                data: 'id',
                className: 'text-nowrap',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `/quotes#${row.id}`,
                        text: data
                    });
                },
                type: 'html',
                width: '1%'
            },
            // Name
            {
                data: 'name',
                className: 'text-nowrap',
                orderable: false,
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `/quotes#${row.id}`,
                        text: data
                    });
                },
                type: 'html',
                width: '1%'
            },
            // Quote situation
            {
                data: 'situation',
                className: 'hidden-xs text-center text-nowrap',
                render: situationTag,
                width: '1%'
            },
            // Quote Responsible
            {
                data: null,
                className: 'hidden-xs',
                orderable: false,
                render: data => {
                    if (!data.responsible.id) {
                        return 'Nenhum responsável';
                    }

                    return htmlLink({
                        href: '/users#' + data.responsible.id,
                        text: data.responsible.name
                    });
                }
                // data: 'responsible_id',
                // className: 'text-nowrap',
                // orderable: false,
                // type: 'html',
                // width: '1%'
            },
            // Quote total
            {
                data: 'total',
                orderable: false,
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%'
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            },
            // Updated at
            {
                data: 'updated_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTime,
                width: '1%'
            }
        ],
        order: [
            [2, 'asc']
        ]
    }).on('draw', () => {
        deleteOverlay('#users-favorites');
        tableQuotes.columns.adjust();
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#users-favorites');
        }
    });

    // Initiates Inputmas/Datepicker for birth date field
    if (isApple) {
        editBirth.inputmask({
            alias: 'datetime',
            inputFormat: 'dd/mm/yyyy',
            clearIncomplete: true,
        });
    } else {
        editBirth.datepicker({
            autoclose: true,
            dateFormat: 'dd/mm/yy',
            changeMonth: true,
            changeYear: true,
            endDate: '-1d',
            language: 'pt-BR',
            orientation: 'bottom'
        });
    }

    // Initiates Inputmask for phone field
    editPhone.inputmask({
        mask: ['(99) 9999-9999', '(99) 99999-9999'],
        greedy: true,
        clearIncomplete: true
    });

    // Initiates Inputmask for document number field
    editDocument.brazilianDocInputMask();

    // Initiates Inputmask for zip Code field
    editAddrZip.zipEdit(result => {
        editAddrStr.val(result.log_nome);
        editAddrNum.val(result.log_number);
        editAddrCpl.val('');
        editAddrNgb.val(result.bai_no);
        editAddrCit.val(result.loc_nosub);
        editAddrStt.val(result.ufe_sg);

        mainApp.setFocus(editAddrNum);
    });

    // Initiates Select2 for consultant field
    editConsult.setSelectUser(term => {
        return {
            'name': term,
            'type': 'admin',
        };
    }, {
        closeOnSelect: true,
    });

    // Initiates Select2 for consultant filter
    filterConsult.setSelectUser(term => {
        return {
            'name': term,
            'type': 'admin',
        };
    });

    // Save address changes
    formAddr.on('submit', evt => {
        evt.preventDefault();

        mainApp.ajax({
            url: `addresses/${currentAddress.id}`,
            method: 'PUT',
            data: {
                'name': editAddrNam.val(),
                'zip_code': editAddrZip.val().replace(/\D/g, ''),
                'address': editAddrStr.val(),
                'number': editAddrNum.val(),
                'complement': editAddrCpl.val(),
                'neighborhood': editAddrNgb.val(),
                'city': editAddrCit.val(),
                'state': editAddrStt.val()
            },
            dataType: 'json',
            success: result => {
                currentAddress = $.objectNormalizer(result, addressModel);
                tableAddresses.draw();
                $.success('Endereço salvo com sucesso.');
            }
        });
    });
    $('[data-save="address"]').on('click', evt => {
        evt.preventDefault();

        formAddr.submit();
    });

    /**
     * Creates the controller.
     * @class
     */
    return {
        // List of subforms or actions for the current record
        actions: {
            'address': getAddress,
            'address/delete': addrId => $.confirmAction(confirmations(addrId), 'addressDelete'),
            'credit-cards/delete': cardId => $.confirmAction(confirmations(cardId), 'creditcardDelete'),
            'demote': confirmProDel,
            'promote': confirmProAccess,
            'suspend': confirmSuspension,
            'reactivate': confirmReactivation,
        },
        /**
         * Method to checks whether the filter form has no restriction.
         * @returns {Boolean}
         */
        canFilter: canFilter,
        /**
         * Returns current record.
         */
        currentRecord: () => currentRecord,
        // Object to creates the main dataTables
        dataTableObj: {
            ajax: {
                url: 'users',
                method: 'GET',
                error: mainApp.ajaxError,
                data: data => {
                    data.filter = dataFilter();
                }
            },
            columns: [
                // Admin flag hidden
                {
                    data: 'admin',
                    visible: false
                },
                // Seller flag hidden
                {
                    data: 'seller',
                    visible: false
                },
                // Professional flag hidden
                {
                    data: 'professional',
                    visible: false
                },
                // Suspended status
                {
                    data: 'suspended',
                    className: 'text-center text-nowrap',
                    width: '1%',
                    render: data => {
                        return decision(data, suspendedIcon);
                    }
                },
                // User flags visible
                {
                    data: null,
                    className: 'text-center text-nowrap',
                    orderData: [0, 1, 2, 3],
                    width: '1%',
                    render: data => {
                        let icon = 'fa-user';
                        let title = 'Cliente';

                        if (data.admin === '1') {
                            icon = 'fa-user-secret';
                            title = 'Administrador';
                        } else if (data.seller === '1') {
                            icon = 'fa-university';
                            title = 'Lojista';
                        } else if (data.professional === '1') {
                            icon = 'fa-graduation-cap';
                            title = 'Profissional';
                        }

                        return htmlIcon({
                            className: icon,
                            title: title
                        });
                    }
                },
                // Name
                {
                    data: 'name',
                    className: 'text-nowrap',
                    render: (data, type, row) => {
                        if (type !== 'display') {
                            return data;
                        }

                        return htmlLink({
                            href: `#${row.id}`,
                            text: data
                        });
                    }
                },
                // Email
                {
                    data: 'email',
                    className: 'text-nowrap',
                    render: (data, type, row) => {
                        if (type !== 'display') {
                            return data;
                        }

                        return htmlLink({
                            href: `#${row.id}`,
                            text: data
                        });
                    }
                },
                // Created at
                {
                    data: 'created_at',
                    className: 'text-nowrap',
                    render: mainApp.formatDateTime,
                    width: '1%'
                },
            ],
            order: [
                [3, 'asc'],
                [5, 'asc']
            ],
            stateSave: true
        },
        /**
         * Method to populates main form.
         */
        fillDetails: fillEditForm,
        /**
         * Method called to checks whether main form data was changed.
         * @returns {Boolean}
         */
        formChangeInspect: () => {
            const payload = $.objectNormalizer(buildPayload(), currentRecord, dataConv);

            return !Object.isSimilar(currentRecord, payload);
        },
        /**
         * Method to toggle form's menu options usable.
         */
        formCommandsToggler: () => {
            actDemote.toggle(canTogglePro(false));
            actPromote.toggle(canTogglePro(true));
            actReactivate.toggle(canToggleSuspension(false));
            actSuspend.toggle(canToggleSuspension(true));
        },
        /**
         * Method called when user submits the main form data.
         */
        formSave: () => {
            mainApp.ajax({
                url: `users/${currentRecord.id}`,
                method: 'PUT',
                data: buildPayload(),
                dataType: 'json',
                success: result => {
                    setRecord(result);
                    $.success('Cliente salvo com sucesso.');
                }
            });
        },
        /**
         * Method to loads selected data from RESTful API.
         * @param {String|Number} rowId
         * @param {Function} callback
         */
        getRecord: (rowId, callback) => {
            mainApp.ajax({
                url: `users/${rowId}`,
                method: 'GET',
                data: {
                    embCnt: 1,
                },
                success: result => {
                    setRecord(result);
                    callback();
                },
                error: () => {
                    location.hash = '';
                }
            });
        },
        /**
         * Returns true whether a filter is active.
         * @returns {Boolean}
         */
        isFiltering: () => {
            return filterConsult.val().length ||
                filterName.val() ||
                filterEmail.val() ||
                filterType.val() ||
                filterSuspended.val();
        },
        /**
         * Method to reset current data.
         */
        resetRecord: resetRecord,
        /**
         * Method to clears the filter fields.
         */
        resetFilter: clearFilter,
        /**
         * Search by sidebar form input.
         * @param {String} search
         * @returns {Boolean}
         */
        sidebarSearchForm: search => {
            clearFilter();

            // E-mail?
            if (mainApp.testEmail(search)) {
                filterEmail.val(search);

                return canFilter();
            }

            filterName.val(search);

            return canFilter();
        },

        /**
         * Initiates the controller.
         */
        init: () => {}
    };
}));