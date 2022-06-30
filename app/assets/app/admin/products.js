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

    const edtName = $('#edit-name');
    const edtType = $('#edit-type');
    const edtSituation = $('#edit-situation');
    const edtPrice = $('#edit-price');
    const edtDesc = $('#edit-description');
    const productImg = $('#product-image');


    // Data model
    const dataModel = {
        'id': 0,
        'type': 0,
        'situation': 0,
        'name': '',
        'description': '',
        'price': 0,
        'name': '',
        'path': '',
    };
    const dataConv = {
        'price': val => val === null ? 0 : parseFloat(val),
        'type': val => parseInt(val, 10),
        'situation': val => parseInt(val, 10),
        'description': val => val || '',
        'name': val => val || '',
        'path': val => val || '',
    };

    // Form fields
    const inpId = $('#record-id');


    // Current record data
    let currentRecord = $.objectNormalizer(dataModel, dataModel);

    /**
     * Builds the payload Json.
     * @returns {Object}
     */
    const buildPayload = () => {
        return {
            // Columns
            'name': edtName.val().trim(),
            'price': edtPrice.val() ? edtPrice.val() : null,
            'situation': edtSituation.val() ? edtSituation.val() : null,
            'description': edtDesc.val().trim(),
            'type': edtType.val(),
            'path': productImg.attr('src') ? productImg.attr('src') : null
        };
    };

    // Avatar upload
    $('#input-file-upload').fileupload({
        url: restfulUrl('products/saveImage'),
        dataType: 'json',
        singleFileUploads: true,
        autoUpload: true,
        acceptFileTypes: /(\.|\/)(jpe?g|png)$/i,
        maxFileSize: 5000000, // 5 MB
        downloadTemplateId: null,
        uploadTemplateId: null,
        maxNumberOfFiles: 1
    }).on('fileuploadprocessalways', (e, data) => {
        const index = data.index;
        const file = data.files[index];

        if (file.error) {
            switch (file.error) {
            case 'File type not allowed':
                mainApp.showError('Este tipo de arquivo não é permitido');

                return;
            case 'File is too large':
                mainApp.showError('Arquivo muito grande. O limite é de 5MB.');

                return;
            case 'File is too small':
                mainApp.showError('Arquivo muito pequeno.');

                return;
            case 'Maximum number of files exceeded':
                mainApp.showError('Máximo de 1 arquivo.');

                return;
            }

            mainApp.showError(file.error);
        }
    }).on('fileuploaddone', (e, data) => {
        data.result.files.forEach(file => {
            if (file.path) {
                productImg.attr('src', 'http://burguer.devlocal.com.br/assets/productImages/'+ file.path);
            } else if (file.error) {
                var error = $('<span class="text-danger"/>').text(file.error);

                // $(data.context.children()[index])
                // .append('<br>')
                // .append(error);
                imagePanel.children().append('<br>').append(error);
                btnUploadAvatar.text('ERRO!').prop('disabled', true);
                // btnUploadAvatar.prepend('<i class="fa fa-exclamation-triangle"></i>');
            }
        });
    }).on('fileuploadfail', (e, data) => {
        // XHR Error?
        if (typeof data.jqXHR === 'object' && data.jqXHR.status >= 400) {
            mainApp.ajaxError(data.jqXHR, 'error', data.errorThrown);

            return;
        }

        // Other error?
        if (data.errorThrown) {
            mainApp.showError(data.errorThrown);

            return;
        }
    }).prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? '' : 'disabled');

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
     * Returns an object with list of confirmations for $.confirmAction extension.
     * @returns {Object}
     */
     const confirmations = () => {
        return {
            delete: {
                title: 'Exclusão',
                content: `Confirma a exclusão definitiva do produto<br><strong>${currentRecord.name}</strong>?`,
                action: () => {
                    mainApp.ajax({
                        url: `products/${currentRecord.id}`,
                        method: 'DELETE',
                        success: () => {
                            location.hash = '';
                        },
                        error: () => history.back()
                    });
                }
            },
        };
    };

    /**
     * Fills the fields.
     */
    const fillEditForm = () => {
        productImg.attr('src', currentRecord.path);
        inpId.text(currentRecord.id || '0');

        edtName.val(currentRecord.name);
        edtType.val(currentRecord.type);
        edtSituation.val(currentRecord.situation);
        edtPrice[0].value = parseFloat(currentRecord.price);
        edtDesc.val(currentRecord.description);
        if (currentRecord.path !== '') {
            productImg.attr('src', 'http://burguer.devlocal.com.br/assets/productImages/'+ currentRecord.path);
        }
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
                console.log(result);
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
        // List of actions for the current record
        actions: {
            'delete': () => $.confirmAction(confirmations(), 'delete'),
        },
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
                [1, 'asc']
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
            let filePath = payload.path.split('/');
            payload.path = filePath[5];

            return !Object.isSimilar(original, payload);
        },
        /**
         * Method called when user submits the main form data.
         */
        formSave: () => {
            const payload = buildPayload();
            let filePath = payload.path.split('/');
            payload.path = filePath[5];

            mainApp.ajax({
                url: 'products' + (currentRecord.id ? '/' + currentRecord.id : ''),
                method: currentRecord.id ? 'PUT' : 'POST',
                data: payload,
                dataType: 'json',
                success: result => {
                    setRecord(result);
                    console.log(result);
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
        },
    };
}));