/**
 * @file Orders admin module.
 *
 */
/* global moment, CryptoJS, Mustache */
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

    // const tblProducts = $('#order-products');

    // Data model
    const dataModel = {
        'id': 0,
    };

    const SITUATION_WAITING = 0;
    const SITUATION_SENT = 1;

    // Action buttons
    const actApprove = $('[data-form-action="approve"]');
    const actCancel = $('[data-form-action="cancel"]');
    const actDone = $('[data-form-action="done"]');

    // Input fields
    const inpId = $('#record-id');

    // Initiate the variables
    let currentRecord = $.objectNormalizer(dataModel, dataModel);

    /**
     * Calls an order action endpoint.
     * @param {String} command
     */
    const callOrderAction = (command, message, log = null) => {
        const recId = currentRecord.id || false;

        if (!recId) {
            return;
        }

        mainApp.ajax({
            url: `orders/${recId}/${command}`,
            method: 'PUT',
            data: {
                'log': log,
            },
            dataType: 'json',
            success: () => {
                resetRecord();
                window.location.hash = `#${recId}`;
                $.success(`Pedido ${message} com sucesso.`);
            },
            error: () => history.back()
        });
    };

    /**
     * Returns HTML string with input field.
     * @returns {String}
     */
     const confirmInputLog = () => {
        return '<br><br><form action="" class="formName">' +
            '<div class="form-group has-float-label no-margin">' +
            '</div>' +
            '</form>';
    };

    /**
     * Confirms order approve method.
     */
    const confirmOrderApprove = () => {
        if (!isOrderApprovable()) {
            $.error('Pedido não pode ser aprovado.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Aprovação',
            content: `Confirma a aprovação manual do pedido<br><b>${currentRecord.id}</b>?${confirmInputLog()}`,
            action: function () {
                callOrderAction('approve', 'enviado')
            }
        });
    };

    /**
     * Confirms order approve method.
     */
    const confirmOrderDone = () => {
        if (!isOrderDone()) {
            $.error('Pedido não pode ser enviado.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Aprovação',
            content: `Confirma a aprovação manual do pedido<br><b>${currentRecord.id}</b>?${confirmInputLog()}`,
            action: function () {
                callOrderAction('done', 'enviado')
            }
        });
    };

    /**
     * Confirms order cancel method.
     */
    const confirmOrderCancel = () => {
        if (!isOrderCancelable()) {
            $.error('Pedido não pode ser cancelado.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Cancelamento',
            content: `Confirma o cancelamento do pedido<br><b>${currentRecord.id}</b>?${confirmInputLog()}`,
            action: function () {
                callOrderAction('cancel', 'cancelado')
            },
        });
    };


    /**
     * Informs when currente order is approvable.
     */
    const isOrderApprovable = () => {
        return parseInt(currentRecord.situation, 10) === SITUATION_WAITING
    };

    /**
     * Informs when currente order is approvable.
     */
    const isOrderDone = () => {
        return parseInt(currentRecord.situation, 10) === SITUATION_SENT
    };

    /**
     * Informs when currente order is cancelable.
     */
    const isOrderCancelable = () => {
        const cancelables = [SITUATION_WAITING, SITUATION_SENT];
        const current = parseInt(currentRecord.situation, 10);

        return cancelables.includes(current);
    };

    /**
     * Clears the current selected records.
     */
    const resetRecord = () => {
        setRecord(dataModel);
    };

    /**
     * Sets record data.
     * @param {Object} data
     */
    const setRecord = data => {
        currentRecord = $.objectNormalizer(data, dataModel);
    };


    /**
     * Shows order's data.
     */
    const showFormData = () => {
        inpId.text(currentRecord.id);
        // tblProducts.clear();

        // console.log(currentRecord);
        $(tblProducts.table().body()).empty();

        $('#user-id').val(currentRecord.user_name);
        $('#situation').val(parent.orderReferralText(currentRecord.situation));
        $('#total-value').val($.brlFormat(currentRecord.total_value));
        $('#payment').val(parent.orderPaymentText(currentRecord.payment));
        $('#address').val(currentRecord.address + ', ' + currentRecord.number);

        tblProducts.draw();
    };

    // Table of products
    const tblProducts = $('#order-products').setDataTable({
        ajax: {
            url: 'order-products',
            method: 'GET',
            data: data => {
                data.filter = {
                    'order_id': currentRecord.id
                };
            }
        },
        columns: [
            // ID
            {
                data: 'id',
                className: 'text-right',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `products#${row.id}`,
                        text: data
                    });
                },
                width: '1%',
            },
            // Product Name
            {
                data: 'product_name',
                className: 'text-right',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `products#${row.id}`,
                        text: data || '[ produto sem nome ]'
                    });
                },
                width: '1%',
            },
            // Product Quantity
            {
                data: 'quantity',
                className: 'text-right',
                width: '1%',
            },
            // ID
            {
                data: 'unit_price',
                className: 'text-right',
                render: $.brlFormat,
                width: '1%',
            },
            // ID
            {
                data: 'observations',
                className: 'text-right',
            },
        ],
        order: [

        ]
    }).on('draw', () => {
        deleteOverlay('#box-products');
    }).on('processing', (e, settings, processing) => {
        if (processing) {
            addOverlay('#box-products');
        }
    });

    /**
     * Creates the controller.
     * @class
     */
    return {
        // List of actions for the current record
        actions: {
            'approve': confirmOrderApprove,
            'cancel': confirmOrderCancel,
            'done': confirmOrderDone,
        },
        currentRecord: () => currentRecord,
        // Object to creates the main dataTables
        dataTableObj: {
            ajax: {
                url: 'orders',
                method: 'GET',
                // data: {}
            },
            columns: [
                // Status
                {
                    data: 'situation',
                    className: 'text-center',
                    render: parent.orderSituationIcon,
                    width: '1%'
                },
                {
                    data: 'id',
                    className: 'text-nowrap',
                    render: (data, type, row) => {
                        if (type !== 'display') {
                            return data;
                        }

                        return htmlLink({
                            href: `#${row.id}`,
                            text: data
                        });
                    },
                    type: 'html',
                    width: '1%'
                },
                {
                    data: 'user_name',
                    className: 'text-nowrap',
                    type: 'html',
                    width: '1%'
                },
                {
                    data: 'total_value',
                    className: 'text-nowrap',
                    render: $.brlFormat,
                    type: 'html',
                    width: '1%'
                },
                {
                    data: null,
                    className: 'text-nowrap',
                    render: (data) => {
                        return data.address + ', ' + data.number;
                    },
                    type: 'html',
                    width: '1%'
                },
            ],
            order: [
                // [0, 'desc']
            ],
            stateSave: true,
        },
        fillDetails: showFormData,
        formCommandsToggler: () => {
            actApprove.toggle(isOrderApprovable());
            actCancel.toggle(isOrderCancelable());
            actDone.toggle(isOrderDone());
        },
        getRecord: (rowId, callback) => {
            mainApp.ajax({
                url: `orders/${rowId}`,
                method: 'GET',
                data: {},
                success: result => {
                    setRecord(result);
                    callback();
                },
                error: () => {
                    location.hash = '';
                }
            });
        },
        isFiltering: () => {

        },
        resetRecord: resetRecord,
        resetFilter: () => {

        },
        sidebarSearchForm: search => {

        },

        /**
         * Initiates the controller.
         */
        init: () => {

        }
    };
}));