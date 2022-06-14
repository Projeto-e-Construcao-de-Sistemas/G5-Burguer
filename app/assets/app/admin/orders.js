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

    const PAYMENT_RELEASED = 1;
    const PAYMENT_NEVER_PAY = 2;

    // Data model
    const dataModel = {
        'id': 0,
        'order_number': '',
        'referral': '',
        'situaton': '',
        'seller_id': 0,
        'user_id': '',
        'products_value': 0,
        'shipping_value': 0,
        'discount_value': 0,
        'interest_value': 0,
        'total_paid': 0,
        'returned_value': 0,
        'approved_at': '',
        'created_at': '',
        'addresses': [],
        'products': [],
        'transactions': [],
    };

    const dateRangeInputMask = {
        mask: '99/99/9999 - 99/99/9999',
        greedy: false,
        clearIncomplete: true,
        autoUnmask: false
    };
    const dateRangeInputParams = {
        autoUpdateInput: false,
        locale: {
            format: 'DD/MM/YYYY',
            separator: ' - ',
            applyLabel: 'Aplicar',
            cancelLabel: 'Limpar',
            fromLabel: 'De',
            toLabel: 'Até',
            customRangeLabel: 'Personalizado',
            weekLabel: 'S',
            daysOfWeek: [
                'Do',
                'Se',
                'Te',
                'Qu',
                'Qu',
                'Se',
                'Sa'
            ],
            monthNames: [
                'Janeiro',
                'Fevereiro',
                'Março',
                'Abril',
                'Maio',
                'Junho',
                'Julho',
                'Agosto',
                'Setembro',
                'Outubro',
                'Novembro',
                'Dezembro'
            ]
        },
        ranges: {
            'Hoje': [
                moment(),
                moment()
            ],
            'Ontem': [
                moment().subtract(1, 'days'),
                moment().subtract(1, 'days')
            ],
            'Últimos 7 Dias': [
                moment().subtract(6, 'days'),
                moment()
            ],
            'Últimos 30 Dias': [
                moment().subtract(29, 'days'),
                moment()
            ],
            'Este mês': [
                moment().startOf('month'),
                moment().endOf('month')
            ],
            'Mês anterior': [
                moment().subtract(1, 'month').startOf('month'),
                moment().subtract(1, 'month').endOf('month')
            ]
        }
    };

    // Action buttons
    const actApprove = $('[data-form-action="approve"]');
    const actCancel = $('[data-form-action="cancel"]');
    const actCancelProd = $('[data-form-product-action="cancel"]');
    const actChangeSeller = $('[data-form-action="change-seller"]');
    const actCommiss = $('[data-form-product-action="commissionate"]');
    const actPayStore = $('[data-form-product-action="pay-store"]');
    const actProdDelvrd = $('[data-form-product-action="delivered"]');
    const actRefund = $('[data-form-transaction-action="refund"]');
    const actTransactApprov = $('[data-form-transaction-action="approve"]');

    // Containers
    const cntAddresses = $('#order-addresses');
    const cntCommiss = $('#commissioning-data');
    const cntDesigner = $('#designer-data');
    const cntFinancial = $('#financial-data');
    const cntOrderData = $('#order-data');
    const cntOrdItmDet = $('#order-item-data');
    const cntPurchOrd = $('#purchase-order-data');
    const cntRefund = $('#order-transaction-refund-data');
    const cntShipments = $('#shipments-data');
    const cntStore = $('#store-data');
    const cntTransact = $('#order-transaction-data');
    const infRefund = $('#callout-refund');

    const imgProduct = $('#product-image');

    // Input fields
    const inpId = $('#record-id');
    const inpOrdTranId = $('#order-transaction-id');
    const inpPrdItemId = $('#order-item-id');
    const inpRefundId = $('#order-transaction-refund-id');

    const edtRefundVal = $('#return-value');
    const edtRefundTxt = $('#return-description');
    const edtSeller = $('#edit-seller');
    const edtSellerLog = $('#edit-seller-log');

    // Filter fields
    const fltApprovedAtRange = $('#filter-approved-at');
    const fltCreatedAtRange = $('#filter-created-at');
    const fltReferral = $('#filter-referral');
    const fltProduct = $('#filter-product');
    const fltSituation = $('#filter-situation');
    const fltStore = $('#filter-store');
    const fltUser = $('#filter-user');
    const fltItem = $('#filter-item');

    // Forms
    const frmChangeSeller = $('#form-change-seller');
    const frmRefund = $('#form-transaction-refund');

    // Templates
    const tplAddresses = $('#tpl-addresses').html();
    const tplCalloutErr = $('#callout-error').html();
    const tplCommiss = $('#tpl-commissioning').html();
    const tplDesigner = $('#tpl-designer').html();
    const tplFinancial = $('#tpl-financial').html();
    const tplOrder = $('#tpl-order').html();
    const tplOrdItmDet = $('#tpl-order-item').html();
    const tplPurchOrd = $('#tpl-purchase-order').html();
    const tplRefund = $('#tpl-order-transaction-refund').html();
    const tplShipments = $('#tpl-shipments').html();
    const tplStore = $('#tpl-store').html();
    const tplTransact = $('#tpl-order-transaction').html();

    // Situation constants
    const SITUATION_WAITING = 1;
    const SITUATION_APPROVED = 2;
    const SITUATION_CANCELED = 4;

    // Item situation constants
    const ITEM_PROCESSING = 2;
    const ITEM_SHIPPED = 3;
    const ITEM_DELIVERED = 4;
    const ITEM_RETURNING = 5;
    const ITEM_RETURNED = 6;

    // Referral constants
    const REFERRAL_WEDDING_LIST = 2;
    const REFERRAL_QUOTATION = 3;
    const REFERRAL_FISICAL_STORE = 4;

    // Transaction method constants
    const METHOD_BANK_TRANSFER = 6;
    const METHOD_MONEY = 8;
    const METHOD_CREDITCARD_STORE = 9;

    // Transaction situation constants
    const TRANSACTION_WAITING = 1;
    const TRANSACTION_APPROVED = 3;

    // Commission type constants
    const COMM_TYPE_RT = 1;

    // Initiate the variables
    let currentRecord = $.objectNormalizer(dataModel, dataModel);
    let dtApprovedFrom = null;
    let dtApprovedUntil = null;
    let dtCreatedFrom = null;
    let dtCreatedUntil = null;

    /**
     * Returns address type description.
     * @param {Number|String} value
     * @returns {String}
     */
    const addressTypeName = value => {
        return decision(value, {
            '1': 'Endereço de entrega',
            '2': 'Endereço de cobrança',
            '3': 'Endereço de entrega e cobrança',
        });
    };

    /**
     * Goes back to parent details window.
     */
    const backToDetails = () => {
        if (!currentRecord.id) {
            window.location.hash = '';
        }

        window.location.hash = `#${currentRecord.id}`;
    };

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
     * Calls an order item action endpoint.
     * @param {String} command
     * @param {String} endpoint
     * @param {String} childId
     */
    const callOrderItemAction = (command, endpoint, childId, message, log = null) => {
        const recId = currentRecord.id || false;

        if (!recId) {
            return;
        }

        mainApp.ajax({
            url: `orders/${recId}/${endpoint}/${childId}`,
            method: command,
            data: {
                'log': log,
            },
            dataType: 'json',
            success: () => {
                resetRecord();
                history.back();
                $.success(`Item de pedido ${message} com sucesso.`);
            },
            error: () => history.back()
        });
    };

    /**
     * Toggles visual infos for current record situation.
     */
    const checkSituation = () => {
        const danger = parseInt(currentRecord.situation, 10) === SITUATION_CANCELED;
        const span = document.createElement('span');

        inpId.toggleClass('text-red', danger);
        $('#main-form .form-group').toggleClass('has-error', danger);
        edtSeller.prop('disabled', danger);

        span.className = 'label label-danger text-sm';
        span.innerText = 'CANCELADO';

        if (danger) {
            inpId.append(' ')
                .append(span.outerHTML);
        }
    };

    /**
     * Returns HTML string with input field.
     * @returns {String}
     */
    const confirmInputLog = () => {
        return '<br><br><form action="" class="formName">' +
            '<div class="form-group has-float-label no-margin">' +
            '<textarea placeholder="Motivo" class="form-control" lines="3" style="resize:none" required></textarea>' +
            '<label>Forneça o motivo</label>' +
            '</div>' +
            '</form>';
    };

    const getInputLog = (dialog, text, callback) => {
        const elm = dialog.$content.find('textarea');
        const reason = elm.val();

        if (!reason || reason.length < 1) {
            $.error(`Entre um motivo para ${text}.`);

            return false;
        }

        callback(reason);

        return true;
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
            content: `Confirma a aprovação manual do pedido<br><b>${currentRecord.order_number}</b>?${confirmInputLog()}`,
            action: function () {
                return getInputLog(
                    this,
                    'a aprovação do pedido',
                    log => callOrderAction('approve', 'aprovado', log),
                );
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
            content: `Confirma o cancelamento do pedido<br><b>${currentRecord.order_number}</b>?${confirmInputLog()}`,
            action: function () {
                return getInputLog(
                    this,
                    'o cancelamento do pedido',
                    log => callOrderAction('cancel', 'cancelado', log),
                );
            },
        });
    };

    /**
     * Confirms order item cancel method.
     */
    const confirmProductCancel = itemId => {
        const item = currentRecord.products.find(element => {
            return parseInt(element.id, 10) === parseInt(itemId, 10);
        });

        if (item === undefined || !isProductCancelable(item)) {
            $.error('Item não pode ser cancelado.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Cancelamento',
            content: `Confirma o cancelamento do produto<br><b>${item.product_name}</b><br>do pedido<br><b>${currentRecord.order_number}</b>?${confirmInputLog()}`,
            action: function () {
                return getInputLog(
                    this,
                    'o cancelamento do produto',
                    log => callOrderItemAction(
                        'DELETE',
                        'product',
                        item.id,
                        'cancelado',
                        log
                    )
                );
            }
        });
    };


    /**
     * Confirms order item as delivered method.
     */
    const confirmProductDelivered = itemId => {
        const item = currentRecord.products.find(element => {
            return parseInt(element.id, 10) === parseInt(itemId, 10);
        });

        if (item === undefined || !isProductDeliverable(item)) {
            $.error('Item não pode ser definido como entregue.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Entrega',
            content: `Confirma que o produto<br><b>${item.product_name}</b><br>do pedido<br><b>${currentRecord.order_number}</b><br>foi entregue ao comprador?`,
            action: () => callOrderItemAction(
                'PUT',
                'delivered',
                item.id,
                'entregue'
            )
        });
    };

    /**
     * Confirms order item as delivered method.
     */
    const confirmProductStoreCredit = itemId => {
        const item = currentRecord.products.find(element => {
            return parseInt(element.id, 10) === parseInt(itemId, 10);
        });

        if (item === undefined || !isProductPayable(item)) {
            $.error('A liberação dos crédito da loja para esse produto não está disponível.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Créditos da Loja',
            content: `Confirma a liberação dos créditos da loja para o produto<br><b>${item.product_name}</b>?`,
            action: () => callOrderItemAction(
                'PUT',
                'paystore',
                item.id,
                'teve seus créditos iberados para a loja'
            )
        });
    };

    /**
     * Confirms order transaction as approved.
     */
    const confirmTransactionApproval = transId => {
        const item = currentRecord.transactions.find(element => {
            return parseInt(element.id, 10) === parseInt(transId, 10);
        });

        if (!item || !isTransactionApprovable(item)) {
            $.error('A aprovação dessa transação não está disponível.');

            history.back();

            return;
        }

        $.confirmDialog({
            title: 'Aprovação',
            content: `Confirma a aprovação manual da transacão<br><b>${item.id}</b>?${confirmInputLog()}`,
            action: function () {
                return getInputLog(
                    this,
                    'aprovação da transação',
                    log => {
                        mainApp.ajax({
                            url: `orders/${currentRecord.id}/paidout/${item.id}`,
                            method: 'PUT',
                            data: {
                                'log': log,
                            },
                            dataType: 'json',
                            success: () => {
                                resetRecord();
                                history.back();
                                $.success('Transação aprovada com sucesso.');
                            },
                            error: () => history.back()
                        });
                    },
                );
            }
        });
    };

    /**
     * Builds filtering parameters object.
     * @returns {Object}
     */
    const dataFilter = () => {
        let filter = {};

        if (dtApprovedFrom) {
            filter.approvedAtFrom = dtApprovedFrom;
        }
        if (dtApprovedUntil) {
            filter.approvedAtUntil = dtApprovedUntil;
        }
        if (dtCreatedFrom) {
            filter.createdAtFrom = dtCreatedFrom;
        }
        if (dtCreatedUntil) {
            filter.createdAtUntil = dtCreatedUntil;
        }
        if (fltProduct.val().length) {
            filter.productId = fltProduct.val();
        }
        if (fltReferral.val().length) {
            filter.referral = fltReferral.val();
        }
        if (fltSituation.val().length) {
            filter.situation = fltSituation.val();
        }
        if (fltStore.val().length) {
            filter.storeId = fltStore.val();
        }
        if (fltUser.val().length) {
            filter.user_id = fltUser.val();
        }
        if (fltItem.val().length) {
            filter.itemId = fltItem.val();
        }

        return filter;
    };

    const getTransactObj = item => {
        return Object.assign(
            {},
            item,
            {
                createdAt: function () {
                    return mainApp.formatDateTimeSecs(item.created_at);
                },
                documentNumber: function () {
                    return $.formatBrazilianDocument(item.document);
                },
                dueDate: function () {
                    return mainApp.formatDate(item.due_date);
                },
                updatedAt: function () {
                    return mainApp.formatDateTimeSecs(item.updated_at);
                },
                gatewayName: function () {
                    return decision(item.gateway, {
                        '0': 'Indefinido',
                    });
                },
                paymentMethodIcon: function () {
                    return transactionMethodIcon(item.method);
                },
                paymentMethodText: function () {
                    return transactionMethodText(item.method);
                },
                value: function () {
                    return $.brlFormat(item.transaction_value);
                },
                interestValue: function () {
                    return $.brlFormat(item.interest_value);
                },
                returnedValue: function () {
                    return $.brlFormat(item.returned);
                },
                interestRate: function () {
                    return $.number(item.interest_rate, 2, ',', '.') + '% a.m.';
                },
                situationIcon: function () {
                    return transactionSituationIcon(item.situation);
                },
                situationText: function () {
                    return transactionSituationText(item.situation);
                },
            }
        );
    };

    /**
     * Informs when currente order is approvable.
     */
    const isOrderApprovable = () => {
        return parseInt(currentRecord.situation, 10) === SITUATION_WAITING &&
            $.hasAdmModule('orders', 'approval');
    };

    /**
     * Informs when currente order is cancelable.
     */
    const isOrderCancelable = () => {
        const cancelables = [SITUATION_WAITING, SITUATION_APPROVED];
        const current = parseInt(currentRecord.situation, 10);

        return cancelables.includes(current) &&
            $.hasAdmModule('orders', 'write');
    };

    /**
     * Informs if the item is cancelable.
     */
    const isProductCancelable = item => {
        const cancelable = [
            ITEM_PROCESSING,
            ITEM_SHIPPED,
            ITEM_DELIVERED,
            ITEM_RETURNING,
            ITEM_RETURNED
        ];

        return cancelable.includes(parseInt(item.situation, 10)) &&
            $.hasAdmModule('orders', 'write');
    };

    /**
     * Informs if the item can be set as delivered.
     */
    const isProductDeliverable = item => {
        const deliverable = [
            ITEM_PROCESSING,
            ITEM_SHIPPED
        ];

        return deliverable.includes(parseInt(item.situation, 10)) &&
            $.hasAdmModule('orders', 'write');
    };

    /**
     * Informs if the item can be payed to the store.
     */
    const isProductPayable = item => {
        const payable = [
            ITEM_PROCESSING,
            ITEM_SHIPPED,
            ITEM_DELIVERED,
            ITEM_RETURNING,
            ITEM_RETURNED
        ];

        return payable.includes(parseInt(item.situation, 10)) &&
            parseInt(item.store.id, 10) > 0 &&
            parseInt(item.store.payment_released, 10) == 0 &&
            $.hasAdmModule('orders', 'write');
    };

    /**
     * Informs whether the order has a refundable value.
     */
    const isRefundable = item => {
        const refundables = [TRANSACTION_APPROVED];
        const current = parseInt(item.situation, 10);
        const refundableValue = parseFloat(item.transaction_value) - parseFloat(item.returned);

        return refundables.includes(current) &&
            refundableValue > 0 &&
            $.hasAdmModule('orders', 'write');
    };

    /**
     * Informs when currente order seller's can be changed.
     */
    const isSellerChangeable = () => {
        return parseInt(currentRecord.referral, 10) !== REFERRAL_WEDDING_LIST &&
            $.hasAdmModule('orders', 'set-seller');
    };

    /**
     * Informs whether the transaction is approvable.
     */
    const isTransactionApprovable = item => {
        const approvables = [TRANSACTION_WAITING];
        const methods = [METHOD_BANK_TRANSFER, METHOD_MONEY, METHOD_CREDITCARD_STORE];
        const current = parseInt(item.situation, 10);
        const method = parseInt(item.method, 10);

        return approvables.includes(current) &&
            methods.includes(method) &&
            $.hasAdmModule('orders', 'write');
    };

    /**
     * Returns HTML content for JSON log.
     * @param {Number|String} logId
     * @param {*} json
     */
    const logJsonButton = (logId, json) => {
        const pre = document.createElement('pre');

        pre.setAttribute('id', `json${logId}`);


        try {
            let msg = JSON.parse(json);

            pre.innerText = JSON.stringify(msg, null, 4);

            setTimeout(() => {
                $(`#json${logId}`).jsonViewer(msg, {
                    collapsed: true,
                    rootCollapsable: true,
                    withQuotes: false,
                });
            }, 1000);

            return json ? pre.outerHTML : '';
        } catch (err) {
            return json.replace(/";/g, '";<br>');
        }
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
     * Sets value for seller field.
     */
    const setSeller = () => {
        edtSeller.prop('disabled', true);
        edtSellerLog.val('');

        if ((typeof currentRecord.seller.name === 'undefined') || (!currentRecord.id)) {
            edtSeller.val(null).trigger('change');

            return;
        }

        if (!edtSeller.find(`option[value="${currentRecord.seller_id}"]`).length) {
            const newOption = new Option(
                currentRecord.seller.name,
                currentRecord.seller.id,
                false,
                false
            );

            edtSeller.append(newOption);
        }

        edtSeller.val(currentRecord.seller_id).trigger('change');
    };

    /**
     * Returns shipping direction description.
     * @param {Number|String} value
     * @returns {String}
     */
    const shippingDirection = value => {
        return decision(value, {
            '1': 'Envio para o comprador',
            '2': 'Devolução para o vendedor',
        });
    };

    /**
     * Shows quotation id.
     */
    const showDiscountCouponId = () => {
        if (currentRecord.discount_coupon_id <= 0) {
            $('#coupon-id').toggleClass('hidden');

            return;
        }

        const discountCouponLink = currentRecord.discount_coupon_id <= 0 ?
            `/orders#${currentRecord.id}` :
            `/discount-coupons#${currentRecord.discount_coupon_id}`;

        $('#coupon-id').attr('href', discountCouponLink);
    };

    /**
     * Shows quotation id.
     */
    const showQuotationId = () => {
        if (
            currentRecord.referral != REFERRAL_QUOTATION &&
            currentRecord.referral != REFERRAL_FISICAL_STORE
        ) {
            $('#quotation-id').toggleClass('hidden');

            return;
        }

        mainApp.ajax({
            url: 'quotes',
            method: 'GET',
            data: {
                filter: {
                    'order_id': currentRecord.id,
                },
                start: 0,
                length: 1,
            },
            success: result => {
                result.data.forEach(quote => {
                    const fail = (parseInt(quote.id, 10) === 0);
                    const quotationLink = fail ? `#${currentRecord.id}` : `/quotes#${quote.id}`;

                    $('#quotation-id').attr('href', quotationLink);
                });
            },
            error: () => {
                location.hash = '';
            }
        });
    };

    /**
     * Shows order's addresses list.
     */
    const showAddresses = () => {
        cntAddresses.html(
            Mustache.render(
                tplAddresses,
                {
                    addresses: currentRecord.addresses,
                    addrType: function () {
                        return addressTypeName(this.address_type);
                    },
                    documentNumber: function () {
                        return $.formatBrazilianDocument(this.document);
                    },
                    zipCode: function () {
                        return $.formatZIP(this.zip_code);
                    },
                }
            )
        );
    };

    /**
     * Shows order's item commissioning data.
     * @param {Array} commissioning
     */
    const showCommissioning = commissioning => {
        let data = {
            commissioning: commissioning,
            commissionIcon: function () {
                return htmlIcon({
                    title: '',
                    className: decision(this.commission_type, {
                        '1': 'fa-graduation-cap text-red',
                        '2': 'fa-gift text-fuchsia',
                        '3': 'fa-handshake-o text-aqua',
                    }, '')
                });
            },
            commissionType: function () {
                return decision(
                    this.commission_type,
                    {
                    }
                );
            },
            commissionValue: function () {
                return $.brlFormat(this.commission_value);
            },
            willNeverPay: function () {
                return parseInt(this.payment_released, 10) === PAYMENT_NEVER_PAY;
            },
            paymentReleased: function () {
                return parseInt(this.payment_released, 10) === PAYMENT_RELEASED;
            }
        };
        let userIds = commissioning
            .filter(element => (element.user_id && !element.name))
            .map(element => element.user_id);
        let template = tplCommiss;

        const showTemplate = () => {
            cntCommiss.html(
                Mustache.render(
                    template,
                    data
                )
            ).show();
        };

        // No commissioning?
        if (!commissioning.length) {
            cntCommiss.empty().hide();

            return;
        }

        // No new users?
        if (!userIds.length) {
            showTemplate();

            return;
        }

        // Gets users data
        mainApp.ajax({
            url: 'users',
            method: 'GET',
            data: {
                filter: {
                    id: userIds
                },
                length: 0
            },
            success: result => {
                result.data.forEach(user => {
                    commissioning.forEach(element => {
                        if (element.user_id == user.id) {
                            element.name = user.name;
                            element.email = user.email;
                        }
                    });
                });
            },
            error: (jqXHR, textStatus, errorThrown) => {
                data = {
                    title: 'Erro ao recuperar dados de usuários',
                    message: mainApp.ajaxErrorMessage(jqXHR, textStatus, errorThrown),
                };
                template = tplCalloutErr;
            },
            complete: showTemplate
        }, true);
    };

    /**
     * Shows order's item designer data.
     * @param {Object} product
     */
    const showDesigner = item => {
        let designer = {};
        let template = tplDesigner;

        const showTemplate = data => {
            cntDesigner.html(
                Mustache.render(template, data)
            ).show();
        };

        if (parseInt(item.designerId, 10) === 0) {
            cntDesigner.hide();

            return;
        }

        if (item.designer) {
            showTemplate(item.designer);

            return;
        }

        mainApp.ajax({
            url: `designers/${item.designerId}`,
            method: 'GET',
            success: result => {
                item.designer = result;
                designer = result;
            },
            error: (jqXHR, textStatus, errorThrown) => {
                designer = {
                    title: 'Erro ao recuperar dados do designer',
                    message: mainApp.ajaxErrorMessage(jqXHR, textStatus, errorThrown),
                };
                template = tplCalloutErr;
            },
            complete: () => {
                showTemplate(designer);
            }
        }, true);
    };

    /**
     * Shows order's data.
     */
    const showFormData = () => {
        inpId.text(currentRecord.id);
        cntOrderData.html(
            Mustache.render(
                tplOrder,
                Object.assign(
                    {},
                    currentRecord,
                    {
                        createdAt: mainApp.formatDateTime(currentRecord.created_at),
                        approvedAt: mainApp.formatDateTime(currentRecord.approved_at),
                        referralIcon: parent.orderReferralIcon(currentRecord.referral),
                        referralText: parent.orderReferralText(currentRecord.referral),
                        situationIcon: parent.orderSituationIcon(currentRecord.situation),
                        situationText: parent.orderSituationText(currentRecord.situation),
                        discount_coupon: currentRecord.discount_coupon_id != 0 ?
                            currentRecord.discount_coupon_id : 'Sem cupom'
                    }
                )
            )
        );
        cntFinancial.html(
            Mustache.render(
                tplFinancial,
                {
                    productsValue: $.brlFormat(currentRecord.products_value),
                    shippingValue: $.brlFormat(currentRecord.shipping_value),
                    discountValue: $.brlFormat(currentRecord.discount_value),
                    interestValue: $.brlFormat(currentRecord.interest_value),
                    amountTotal: $.brlFormat(
                        parseFloat(currentRecord.products_value) +
                        parseFloat(currentRecord.shipping_value) -
                        parseFloat(currentRecord.discount_value) +
                        parseFloat(currentRecord.interest_value)
                    ),
                    couponId: currentRecord.discount_coupon_id,
                    subtotal: $.brlFormat(
                        parseFloat(currentRecord.products_value) +
                        parseFloat(currentRecord.shipping_value) -
                        parseFloat(currentRecord.discount_value)
                    ),
                    totalPayd: $.brlFormat(currentRecord.total_paid),
                    returnedValue: $.brlFormat(currentRecord.returned_value),
                }
            )
        );

        showAddresses();
        showQuotationId();
        showDiscountCouponId();
        setSeller();
        tblProducts.ajax.reload();
        tblTransactions.ajax.reload();
        tblOrderLogs.search(currentRecord.id).draw();

        checkSituation();
    };

    /**
     * Shows order's item product data.
     * @param {Number|String} itemId
     */
    const showProduct = itemId => {
        const item = currentRecord.products.find(element => {
            return parseInt(element.id, 10) === parseInt(itemId, 10);
        });

        if (!item) {
            backToDetails();

            return;
        }

        imgProduct.attr('src', imgProduct.data('original-src'));
        inpPrdItemId.text(item.id);

        cntOrdItmDet.html(
            Mustache.render(
                tplOrdItmDet,
                Object.assign(
                    {},
                    item,
                    {
                        situationIcon: parent.orderItemSituationIcon(item.situation),
                        situationText: parent.orderItemSituationText(item.situation),
                        unitPrice: $.brlFormat(item.unit_price),
                        shippingValue: $.brlFormat(item.shipping_value),
                        mktpDiscountValue: $.brlFormat(item.discount),
                        mktpReferralFees: $.brlFormat(item.referral_fees),
                        storeDiscountValue: $.brlFormat(
                            item.store.id ?
                                item.store.discount :
                                0
                        ),
                        subtotal: $.brlFormat(
                            (parseFloat(item.unit_price) * parseInt(item.quantity, 10)) +
                            parseFloat(item.shipping_value) -
                            parseFloat(item.discount) -
                            parseFloat(item.store.id ? item.store.discount : 0)
                        ),
                        deliveryPlanned: mainApp.formatDate(item.delivery_planned),
                        arrivalExpected: mainApp.formatDate(item.arrival_expected),
                        shippingOrigin: parent.shippingOriginName(parseInt(item.shipping_origin, 10)),
                    }
                )
            )
        );

        showThumbnail(item);
        showCommissioning(item.commissioning);
        showPurchaseOrder(item.purchase_order);
        showShipments(item.shipments);
        showStore(item.store);
        tblProductLogs.search(itemId).draw();

        actCancelProd.toggle(isProductCancelable(item));
        actProdDelvrd.toggle(isProductDeliverable(item));
        actCommiss.hide();

        if (isProductCancelable(item)) {
            item.commissioning.forEach(commission => {
                if (parseInt(commission.commission_type, 10) != COMM_TYPE_RT) {
                    return;
                }

                actCommiss.toggle(parseInt(commission.payment_released, 10) == 0);
                actCommiss.data('commission', commission);
            });
        }
    };

    /**
     * Shows purchase order data for order's item.
     * @param {Object} poData
     */
    const showPurchaseOrder = poData => {
        let orderData = {};
        let template = tplPurchOrd;
        const showTemplate = data => {
            cntPurchOrd.html(
                Mustache.render(template, data)
            ).show();
        };

        if (!poData.id) {
            cntPurchOrd.empty().hide();

            return;
        }

        if (poData.purchaseOrder) {
            showTemplate(poData);

            return;
        }

        mainApp.ajax({
            url: `purchase-orders/${poData.purchase_order_id}`,
            method: 'GET',
            data: {
                'embdp': 1,
            },
            success: result => {
                orderData = Object.assign(
                    {},
                    result,
                    {}
                );
                poData.purchaseOrder = orderData;
            },
            error: (jqXHR, textStatus, errorThrown) => {
                poData = {
                    title: 'Erro ao recuperar dados da ordem de compra',
                    message: mainApp.ajaxErrorMessage(jqXHR, textStatus, errorThrown),
                };
                template = tplCalloutErr;
            },
            complete: () => {
                showTemplate(poData);
            }
        }, true);
    };

    /**
     * Shows refund form.
     * @param {Number} transId
     */
    const showRefundForm = transId => {
        const item = currentRecord.transactions.find(element => {
            return parseInt(element.id, 10) === parseInt(transId, 10);
        });

        if (!item || !isRefundable(item)) {
            backToDetails();

            return;
        }

        inpRefundId.text(item.id);
        cntRefund.html(
            Mustache.render(tplRefund, getTransactObj(item))
        );

        const refundable = parseFloat(item.transaction_value) - parseFloat(item.returned);

        edtRefundVal.attr('max', refundable).inputNumber();
        edtRefundTxt.val('');
        infRefund.toggle(parseInt(item.method, 10) == TRANSACTION_APPROVED);

        frmRefund.data({
            'id': item.id,
            'max': refundable,
        });

        mainApp.setFocus(edtRefundVal);
    };

    /**
     * Shows order's item shipments data.
     */
    const showShipments = shipments => {
        if (!shipments.length) {
            cntShipments.empty().hide();

            return;
        }

        cntShipments.html(
            Mustache.render(
                tplShipments,
                {
                    shipments: shipments,
                    shippingIcon: function () {
                        return htmlIcon({
                            title: '',
                            className: decision(this.destination, {
                                '1': 'fa-truck text-green',
                                '2': 'fa-truck fa-flip-horizontal text-red',
                            }, '')
                        });
                    },
                    shippingDirection: function () {
                        return shippingDirection(this.destination);
                    },
                    situationIcon: function () {
                        return htmlIcon({
                            title: '',
                            className: decision(this.situation, {
                                '1': 'fa-plane text-blue',
                                '2': 'fa-check-square-o text-green',
                                '3': 'fa-clock-o text-warning',
                                '4': 'fa-plane fa-flip-horizontal text-yellow',
                                '5': 'fa-exchange text-muted',
                                '6': 'fa-exclamation-triangle text-red',
                            }, '')
                        });
                    },
                    situationText: function () {
                        return decision(this.situation, {
                            '1': 'A caminho',
                            '2': 'Entregue',
                            '3': 'Atrasado',
                            '4': 'Retornando',
                            '5': 'Devolvido',
                            '6': 'Extraviado',
                        }, '');
                    },
                    situationClass: function () {
                        return decision(this.situation, {
                            '1': '',
                            '2': '',
                            '3': 'has-error',
                            '4': '',
                            '5': '',
                            '6': 'has-error',
                        }, '');
                    },
                    shippeddAt: function () {
                        return mainApp.formatDateTime(this.shipped_at);
                    },
                    arrivalExpected: function () {
                        return mainApp.formatDate(this.arrival_forecast);
                    },
                }
            )
        ).show();
    };

    /**
     * Shows order's item store seller data.
     * @param {Object} store
     */
    const showStore = store => {
        const showTemplate = data => {
            actPayStore.toggle(!data.paymentReleased);
            cntStore.html(
                Mustache.render(template, data)
            ).show();
        };
        let storeData = {};
        let template = tplStore;

        actPayStore.hide();

        if (!store.id) {
            cntStore.empty().hide();

            return;
        }

        if (store.data) {
            showTemplate(store.data);

            return;
        }

        mainApp.ajax({
            url: `stores/${store.store_id}`,
            method: 'GET',
            success: result => {
                storeData = Object.assign(
                    {},
                    result,
                    {
                        commissionValue: $.brlFormat(store.commission),
                        netValue: $.brlFormat(store.net_value),
                        referralFees: $.brlFormat(store.referral_fees),
                        paymentReleased: !!parseInt(store.payment_released, 10),
                    }
                );
                store.data = storeData;
            },
            error: (jqXHR, textStatus, errorThrown) => {
                storeData = {
                    title: 'Erro ao recuperar dados da loja',
                    message: mainApp.ajaxErrorMessage(jqXHR, textStatus, errorThrown),
                };
                template = tplCalloutErr;
            },
            complete: () => {
                showTemplate(storeData);
            }
        }, true);
    };

    /**
     * Shows order's item thumbnail and designer.
     * @param {Object} item
     */
    const showThumbnail = item => {
        if (item.thumbnail) {
            imgProduct.attr('src', item.thumbnail);
            showDesigner(item);

            return;
        }

        // Product data
        mainApp.ajax({
            url: `products/${item.product_id}`,
            method: 'GET',
            success: result => {
                item.thumbnail = result.thumbnail;
                item.designerId = result.designer_id;
                showThumbnail(item);
            },
            error: () => {
                cntDesigner.hide();
            },
        }, true);
    };

    /**
     * Show order's transaction data.
     * @param {Number|String} transId
     */
    const showTransaction = transId => {
        const item = currentRecord.transactions.find(element => {
            return parseInt(element.id, 10) === parseInt(transId, 10);
        });

        if (!item) {
            backToDetails();

            return;
        }

        inpOrdTranId.text(item.id);
        cntTransact.html(
            Mustache.render(tplTransact, getTransactObj(item))
        );
        tblTransactionLogs.search(transId).draw();
        tblTransactionRefs.search(transId).draw();

        actRefund.toggle(isRefundable(item) && !frmRefund.is(':visible'));
        actTransactApprov.toggle(isTransactionApprovable(item) && !frmRefund.is(':visible'));
    };

    /**
     * Returns a HTML with icon thats represent transaction method.
     * @param {Number|String} value
     */
    const transactionMethodIcon = value => {
        return htmlIcon({
            title: transactionMethodText(value),
            className: decision(value, {
                '0': 'fa-question-circle-o text-gray',
                '1': 'fa-credit-card text-orange',
                '2': 'fa-university text-green',
                '3': 'fa-usd text-aqua',
                '4': 'fa-graduation-cap text-teal',
                '5': 'fa-gift text-yellow',
                '6': 'fa-exchange text-olive',
                '8': 'fa-money text-olive',
                '9': 'fa-credit-card text-orange',
                '10': 'fa-usd text-aqua',
            }, '')
        });
    };

    /**
     * Returns the transaction method text.
     */
    const transactionMethodText = value => {
        return decision(value, {
            '0': 'Indefinido',
        });
    };

    /**
     * Returns a HTML with an icon thats represents transaction situation.
     * @param {Number|String} value
     */
    const transactionSituationIcon = value => {
        return htmlIcon({
            title: transactionSituationText(value),
            className: decision(value, {
                '1': 'fa-hourglass-start text-gray',
                '2': 'fa-spinner fa-spin text-yellow',
                '3': 'fa-thumbs-o-up text-green',
                '4': 'fa-thumbs-o-down text-red',
                '5': 'fa-recycle text-red',
                '6': 'fa-exclamation-triangle text-red',
                '7': 'fa-times text-red',
                '8': 'fa-undo text-red',
            }, '')
        });
    };

    /**
     * Returns the transaction situation text.
     */
    const transactionSituationText = value => {
        return decision(value, {
            '1': 'Aguardando pagamento',
            '2': 'Em análise',
            '3': 'Aprovado',
            '4': 'Recusado',
            '5': 'Reembolsado',
            '6': 'Fraude',
            '7': 'Cancelado',
            '8': 'Cancelado em crédito',
        });
    };

    // Table of order's item situation logs
    const tblOrderLogs = $('#order-user-log').setDataTable({
        ordering: false,
        ajax: {
            url: 'order-logs',
            method: 'GET',
            data: data => {
                data.filter = {
                    'order_id': data.search.value
                };
                data.length = -1;
            },
            error: mainApp.ajaxError
        },
        columns: [
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTimeSecs,
                width: '1%',
            },
            {
                data: 'situation',
                render: parent.orderSituationIcon,
                width: '1%',
            },
            {
                data: 'situation',
                render: parent.orderSituationText,
                className: 'text-nowrap',
                width: '1%',
            },
            {
                data: 'user',
                render: (user, type) => {
                    if (type !== 'display') {
                        return user;
                    }

                    return user.name || '';
                },
                className: 'text-nowrap',
            },
            {
                data: 'remote_ip',
                className: 'text-nowrap',
                width: '1%',
            },
            {
                data: 'log_message',
                render: (log, type, row) => {
                    if (type !== 'display') {
                        return log;
                    }

                    return logJsonButton(row.id, log);
                }
            },
        ],
        dom: '<"row"<"col-sm-12"tr>>',
    });

    // Table of order's item situation logs
    const tblProductLogs = $('#order-product-log').setDataTable({
        ordering: false,
        ajax: {
            url: 'order-product-logs',
            method: 'GET',
            data: data => {
                data.filter = {
                    'order_product_id': data.search.value
                };
                data.length = -1;
            },
        },
        columns: [
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTimeSecs,
                width: '1%',
            },
            {
                data: 'situation',
                render: parent.orderItemSituationIcon,
                width: '1%',
            },
            {
                data: 'situation',
                render: parent.orderItemSituationText,
                className: 'text-nowrap',
                width: '1%',
            },
            {
                data: 'remote_ip',
                className: 'text-nowrap',
                width: '1%',
            },
            {
                data: 'log_message',
                render: (log, type, row) => {
                    if (type !== 'display') {
                        return log;
                    }

                    return logJsonButton(row.id, log);
                }
            },
        ],
        dom: '<"row"<"col-sm-12"tr>>',
    });

    // Table of products
    const tblProducts = $('#order-products').setDataTable({
        serverSide: false,
        paging: false,
        ajax: function (data, callback) {
            callback({
                data: currentRecord.products
            });
        },
        columns: [
            // ID
            {
                data: 'id',
                className: 'text-right',
                render: (data, type) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `#${currentRecord.id}/product:${data}`,
                        text: data
                    });
                },
                width: '1%',
            },
            // Situation
            {
                data: 'situation',
                className: 'text-center',
                render: parent.orderItemSituationIcon,
                width: '1%'
            },
            // Description
            {
                data: 'product_name',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `#${currentRecord.id}/product:${row.id}`,
                        text: data
                    });
                }
            },
            // Quantity
            {
                data: 'quantity',
                className: 'text-right',
                width: '1%',
            },
            // Unity price
            {
                data: 'unit_price',
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%',
            },
            // Shipping charges
            {
                data: 'shipping_value',
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%',
            },
            // Discount
            {
                data: null,
                className: 'text-right text-nowrap',
                render: (data, type) => {
                    const total = parseFloat(data.discount) +
                        (
                            data.store === Object(data.store) &&
                            Object.prototype.hasOwnProperty.call(data.store, 'discount') ?
                                parseFloat(data.store.discount) :
                                0
                        );

                    if (type !== 'display') {
                        return total;
                    }

                    return $.brlFormat(total);
                },
                width: '1%',
            },
            // Total
            {
                data: null,
                className: 'text-right text-nowrap',
                render: (data, type) => {
                    const total = (
                        parseInt(data.quantity, 10) *
                        parseFloat(data.unit_price)
                    ) + parseFloat(data.shipping_value) -
                        parseFloat(data.discount) -
                        parseFloat(data.store.id ?
                            data.store.discount :
                            0
                        );

                    if (type !== 'display') {
                        return total;
                    }

                    return $.brlFormat(total);
                },
                width: '1%',
            },
        ],
        order: [
            [0, 'asc']
        ],
        dom: '<"row"<"col-sm-12"tr>>',
    });

    // Table of transaction logs
    const tblTransactionLogs = $('#order-transaction-log').setDataTable({
        ordering: false,
        ajax: {
            url: 'order-transaction-logs',
            method: 'GET',
            data: data => {
                data.filter = {
                    'order_transaction_id': data.search.value
                };
                data.length = -1;
            },
        },
        columns: [
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTimeSecs,
                width: '1%',
            },
            {
                data: 'situation',
                render: transactionSituationIcon,
                width: '1%',
            },
            {
                data: 'situation',
                render: transactionSituationText,
                className: 'text-nowrap',
                width: '1%',
            },
            {
                data: 'remote_ip',
                className: 'text-nowrap',
                width: '1%',
            },
            {
                data: 'log_message',
                render: (log, type, row) => {
                    if (type !== 'display') {
                        return log;
                    }

                    return logJsonButton(row.id, log);
                }
            },
        ],
        dom: '<"row"<"col-sm-12"tr>>',
    });

    // Table of transaction refunds
    const tblTransactionRefs = $('#order-transaction-refund').setDataTable({
        ordering: false,
        ajax: {
            url: 'order-transaction-refunds',
            method: 'GET',
            data: data => {
                data.filter = {
                    'order_transaction_id': data.search.value
                };
                data.length = -1;
            },
        },
        columns: [
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: mainApp.formatDateTimeSecs,
                width: '1%',
            },
            // Unity price
            {
                data: 'rafund_value',
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%',
            },
            // Description
            {
                data: 'description',
            },
        ],
        dom: '<"row"<"col-sm-12"tr>>',
    });

    // Table of transactions
    const tblTransactions = $('#order-transactions').setDataTable({
        serverSide: false,
        paging: false,
        ajax: function (data, callback) {
            callback({
                data: currentRecord.transactions
            });
        },
        columns: [
            // ID
            {
                data: 'id',
                className: 'text-right',
                render: (data, type) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `#${currentRecord.id}/transaction:${data}`,
                        text: data
                    });
                },
                width: '1%',
            },
            // Situation
            {
                data: 'situation',
                className: 'text-center',
                render: transactionSituationIcon,
                width: '1%'
            },
            // Method
            {
                data: 'method',
                className: 'text-nowrap',
                render: (data, type, row) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return htmlLink({
                        href: `#${currentRecord.id}/transaction:${row.id}`,
                        text: transactionMethodText(data),
                    });
                }
            },
            // Transaction value
            {
                data: 'transaction_value',
                className: 'text-right text-nowrap',
                render: $.brlFormat,
                width: '1%',
            },
            // Installments
            {
                data: 'installments',
                className: 'text-right',
                width: '1%',
            },
            // Interest rate
            {
                data: 'interest_rate',
                className: 'text-right text-nowrap',
                render: (data, type) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return $.number(data, 2, ',', '.') + '% a.m.';
                },
                width: '1%',
            },
            // Due date
            {
                data: 'due_date',
                className: 'text-nowrap',
                render: (data, type) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return mainApp.formatDate(data);
                },
                width: '1%'
            },
            // Created at
            {
                data: 'created_at',
                className: 'text-nowrap',
                render: (data, type) => {
                    if (type !== 'display') {
                        return data;
                    }

                    return mainApp.formatDateTime(data);
                },
                width: '1%'
            },
        ],
        order: [
            [0, 'asc']
        ],
        dom: '<"row"<"col-sm-12"tr>>',
    });

    // Initiates Inputmask/Daterangepicker for date range filter
    fltApprovedAtRange.inputmask(dateRangeInputMask)
        .daterangepicker(dateRangeInputParams)
        .on('apply.daterangepicker', function (ev, picker) {
            dtApprovedFrom = picker.startDate.format('DD/MM/YYYY');
            dtApprovedUntil = picker.endDate.format('DD/MM/YYYY');

            $(this).val(picker.startDate.format('DD/MM/YYYY') +
                ' - ' + picker.endDate.format('DD/MM/YYYY'));
        }).on('cancel.daterangepicker', function () {
            dtApprovedFrom = null;
            dtApprovedUntil = null;

            $(this).val('');
        });

    fltCreatedAtRange.inputmask(dateRangeInputMask)
        .daterangepicker(dateRangeInputParams)
        .on('apply.daterangepicker', function (ev, picker) {
            dtCreatedFrom = picker.startDate.format('DD/MM/YYYY');
            dtCreatedUntil = picker.endDate.format('DD/MM/YYYY');

            $(this).val(picker.startDate.format('DD/MM/YYYY') +
                ' - ' + picker.endDate.format('DD/MM/YYYY'));
        }).on('cancel.daterangepicker', function () {
            dtCreatedFrom = null;
            dtCreatedUntil = null;

            $(this).val('');
        });

    // Initiates Select2 for products filter
    fltProduct.setSelect2(
        {},
        'products',
        false,
        term => {
            return {
                'name': term,
            };
        }
    );

    // Initiates Select2 for referer type filter
    fltReferral.setSelect2({
        minimumInputLength: 0,
        closeOnSelect: true,
        templateResult: data => {
            if (!data.element || !data.element.dataset.content) {
                return data.text;
            }

            return $(
                '<span><i class="fa fa-fw ' +
                data.element.dataset.content +
                '"></i> ' + data.text + '</span>'
            );
        }
    });

    // Initiates Select2 for payment status filter
    fltSituation.setSelect2({
        minimumInputLength: 0,
        closeOnSelect: true,
        templateResult: (data) => {
            if (!data.element || !data.element.dataset.content) {
                return data.text;
            }

            return $(
                '<span><i class="fa fa-fw ' +
                data.element.dataset.content +
                '"></i> ' + data.text + '</span>'
            );
        }
    });

    // Initiates Select2 for responsible field
    edtSeller.setSelectUser(term => {
        return {
            'admin': 1,
            'name': term,
        };
    }, {
        closeOnSelect: true,
    });

    // Initiates Select2 for stores filter
    fltStore.setSelect2({}, 'stores');

    // Initiates Select2 for users filter
    fltUser.setSelectUser();

    // Change seller submit
    frmChangeSeller.on('submit', evt => {
        const sellerId = parseInt(edtSeller.val() || 0, 10);
        const logMsg = edtSellerLog.val().trim();

        evt.preventDefault();

        if (!isSellerChangeable()) {
            $.error('Esse pedido não pode ter o vendedor alterado.');
            backToDetails();

            return;
        } else if (logMsg.length === 0) {
            $.error('Informe o motivo da mudança de vendedor.');

            return;
        }

        mainApp.ajax({
            url: `orders/${currentRecord.id}/set-seller`,
            method: 'PUT',
            data: {
                'seller_id': sellerId,
                'log': logMsg,
            },
            dataType: 'json',
            success: () => {
                resetRecord();
                history.back();
                $.success('Vendedor alterado com sucesso.');
            },
            error: () => history.back()
        });
    });
    $('[data-save="change-seller"]').on('click', evt => {
        evt.preventDefault();

        frmChangeSeller.submit();
    });

    // Transaction refund submit
    frmRefund.on('submit', evt => {
        const refundValue = edtRefundVal[0].value;
        const refundMotiv = edtRefundTxt.val().trim();
        const data = frmRefund.data();

        evt.preventDefault();

        if (refundValue < 0.01) {
            $.error('Forneça o valor do reembolso.');

            return;
        } else if (refundValue > data.max) {
            $.error('Valor fornecido ultrapassa limite máximo do reembolso.');

            return;
        } else if (refundMotiv.length === 0) {
            $.error('Informe o motivo do reembolso.');

            return;
        }

        mainApp.ajax({
            url: `orders/${currentRecord.id}/refund/${data.id}`,
            method: 'PUT',
            data: {
                'value': parseFloat(edtRefundVal[0].value),
                'description': refundMotiv,
            },
            dataType: 'json',
            success: () => {
                resetRecord();
                history.back();
                $.success('Reembolso solicitado com sucesso.');
            },
            error: () => history.back()
        });
    });
    $('[data-save="transaction-refund"]').on('click', evt => {
        evt.preventDefault();

        frmRefund.submit();
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
            'product': showProduct,
            'product/cancel': confirmProductCancel,
            'product/commissionate': confirmProductCommiss,
            'product/delivered': confirmProductDelivered,
            'product/pay-store': confirmProductStoreCredit,
            'transaction': showTransaction,
            'transaction/approve': confirmTransactionApproval,
            'transaction/refund': showRefundForm,
            'pdf': () => {
                const md5 = CryptoJS.MD5(
                    `${currentRecord.id}${currentRecord.name}${currentRecord.user_id}`
                ).toString();

                window.open(restfulUrl(`download/orderpdf/${currentRecord.id}/${md5}`), '_blank');
                history.back();
            },
        },
        currentRecord: () => currentRecord,
        // Object to creates the main dataTables
        dataTableObj: {
            ajax: {
                url: 'orders',
                method: 'GET',
                data: data => {
                    data.filter = dataFilter();
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
                            href: `#${row.id}`,
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
                // Customer name
                {
                    data: 'user_name',
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
                // Products quantity
                {
                    data: 'items_quantity',
                    orderable: false,
                    className: 'text-right text-nowrap',
                    width: '1%',
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
                            parseFloat(data.interest_value) -
                            parseFloat(data.discount_value)
                        );
                    },
                    width: '1%'
                },
                // Total paid
                {
                    data: 'total_paid',
                    orderable: false,
                    className: 'text-right text-nowrap',
                    render: (data, type) => {
                        if (type !== 'display') {
                            return data;
                        }

                        return $.brlFormat(data);
                    },
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
            ],
            stateSave: true,
        },
        fillDetails: showFormData,
        formCommandsToggler: () => {
            actApprove.toggle(isOrderApprovable());
            actCancel.toggle(isOrderCancelable());
            actChangeSeller.toggle(isSellerChangeable());
        },
        getRecord: (rowId, callback) => {
            mainApp.ajax({
                url: `orders/${rowId}`,
                method: 'GET',
                data: {
                    embdc: 1
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
        isFiltering: () => {
            return dtApprovedFrom ||
                dtCreatedFrom ||
                fltProduct.val().length ||
                fltReferral.val().length ||
                fltSituation.val().length ||
                fltStore.val().length ||
                fltUser.val().length;
        },
        resetRecord: resetRecord,
        resetFilter: () => {
            dtApprovedFrom = null;
            dtApprovedUntil = null;
            dtCreatedFrom = null;
            dtCreatedUntil = null;
            fltApprovedAtRange.val('');
            fltCreatedAtRange.val('');
            fltProduct.val('').trigger('change');
            fltReferral.val('').trigger('change');
            fltSituation.val('').trigger('change');
            fltStore.val('').trigger('change');
            fltUser.val('').trigger('change');
        },
        sidebarSearchForm: search => {
            // Legacy beauty order number?
            if (/^20\d{2}(0?[1-9]|1[012])([0-9]){6}$/.test(search)) {
                search = parseInt(search.substring(6, 12), 10);
            }

            // New order number?
            if (/^\d{2}[ACEFHKLNPRUX]{1}-([0-9]){6}\.\d{1}-\d{1}$/gmi.test(search)) {
                search = parseInt(search.substring(4, 12), 10);
            }

            // Is not a number? Not an ID.
            if (!/^([0-9])+$/.test(search)) {
                return false;
            }

            location.hash = search;

            return false;
        },

        /**
         * Initiates the controller.
         */
        init: () => {
            // Initiates filter fields popover helpers
            $('[data-toggle="popover"]').popover();

            // Remove templates
            $('#tpl-addresses').remove();
            $('#tpl-store').remove();
            $('#callout-error').remove();
        }
    };
}));