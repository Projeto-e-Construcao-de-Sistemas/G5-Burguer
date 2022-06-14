/**
 * @file Complementar script for products admin page.
 *
 */
/* global Cropper, Mustache */
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


    const NO_IMAGE = 'https://via.placeholder.com/400?text=sem+foto';

    // Data model
    const dataModel = {
        'id': 0,
        'type': 0,
        'situation': 0,
        'name': '',
        'description': '',
        'price': 0,
        'name': '',
        'url': ''
    };
    const dataConv = {
        'price': val => val === null ? 0 : parseFloat(val),
        'type': val => parseInt(val, 10),
        'situation': val => parseInt(val, 10),
        'description': val => val || '',
        'name': val => val || '',
    };

    // Form fields
    const inpId = $('#record-id');


    // Option types
    const IN_STOCK = '0';
    const TYPE_EXTERNAL = 'external';

    // Current record data
    let currentRecord = $.objectNormalizer(dataModel, dataModel);


    /**
     * Builds the payload Json.
     * @returns {Object}
     */
    const buildPayload = () => {
        return {
            // Columns
            // 'name': edtName.val().trim(),
            // 'price': edtPrice.val() ? edtPrice.val() : null,
        };
    };

    /**
     * Calls a special endpoint method.
     * @param {String} method the API method.
     */
    const callSpecialMethod = (command, message) => {
        mainApp.ajax({
            url: `products/${currentRecord.id}/${command}`,
            method: 'PUT',
            dataType: 'json',
            success: result => {
                setRecord(result);
                fillEditForm();
                history.back();
                $.success(`Produto ${message} com sucesso.`);
            },
            error: () => history.back()
        });
    };

    /**
     * Fills the fields.
     */
    const fillEditForm = () => {
        inpId.text(currentRecord.id || '0');

    };

    /**
     * Returns number in brazilian format.
     * @param {Number|String} number
     * @param {Number} precision
     */
    const numberFormat = (number, precision) => {
        return $.number(number, precision, ',', '.');
    };

    /**
     * Clears the current selected product.
     */
    const resetRecord = function () {
        setRecord(dataModel);
    };

    /**
     * Sets record data.
     * @param {Object} data
     */
    const setRecord = data => {
        currentRecord = $.objectNormalizer(data, dataModel, dataConv);
    };

    // Initiates numeric input fields
    $.inputNumber();

    // Initiates Select2 for store filter field
    // filterStore.setSelect2({}, 'stores');

    /**
     * Loads selected data from RESTful API.
     * @param {String|Number} rowId
     * @param {Function} callback
     */
     const getRecord = (rowId, callback) => {
        mainApp.ajax({
            url: `products/${rowId}`,
            method: 'GET',
            data: {
            },
            success: result => {
                setRecord(result);
                callback();
            },
            error: () => {
                location.hash = '';
            }
        });
    };


    /**
     * Creates the module.
     * @class
     */
    return {
        /**
         * Returns current record.
         */
        currentRecord: () => currentRecord,
        // Object to creates the dataTables
        dataTableObj: {
            ajax: {
                url: 'products',
                method: 'GET',
                // data: data => {

                // }
            },
            columns: [
                // Situation
                {
                    data: 'situation',
                    className: 'text-center text-nowrap',
                    width: '1%',
                    render: parent.productSituationIcon
                },
                // Name
                {
                    data: 'type',
                    className: 'text-nowrap',
                    render: parent.orderSituationText
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
                            text: data || '[ produto sem nome ]'
                        });
                    }
                },
                // Price
                {
                    data: 'price',
                    orderable: false,
                    className: 'text-right text-nowrap',
                    render: (data, type) => {
                        if (type !== 'display') {
                            return data;
                        }

                        return $.brlFormat(data);
                    },
                }
            ],
            order: [
            ],
            stateSave: false
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
            const original = $.objectNormalizer(currentRecord, currentRecord);
            const payload = $.objectNormalizer(buildPayload(), currentRecord, dataConv);

            return !Object.isSimilar(original, payload);
        },
        /**
         * Method called when user submits the main form data.
         */
        formSave: () => {
            const payload = buildPayload();

            mainApp.ajax({
                url: 'products' + (currentRecord.id ? '/' + currentRecord.id : ''),
                method: currentRecord.id ? 'PUT' : 'POST',
                data: Object.assign(
                    {},
                    payload,
                    {
                    }
                ),
                dataType: 'json',
                success: result => {
                    setRecord(result);
                    fillEditForm();

                    // Refresh log table
                    $('#tab-log').find('table.dataTable').DataTable().draw();

                    $.success('Produto salvo com sucesso.');
                }
            });
        },
        /**
         * Method to loads selected data from RESTful API.
         * @param {String|Number} rowId
         * @param {Function} callback
         */
        getRecord: getRecord,
        /**
         * Method to reset current data.
         */
        resetRecord: resetRecord,

        /**
         * Initiates the module.
         */
        init: () => {
            fillEditForm();
        },
    };
}));