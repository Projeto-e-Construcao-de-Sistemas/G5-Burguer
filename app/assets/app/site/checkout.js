/**
 * @file      Complementar script for anding page.
 *
 */
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
}(typeof self !== 'undefined' ? self : this, function (root) {
    'use strict';

    const zip = $('#cep');

    /**
     * Marks edit content as selected.
     */
     const autoSelect = function () {
        $(this).select();
    };

    // Phone number
    zip.inputmask({
        mask: ['99999-999'],
        clearIncomplete: true
    }).on('focus', autoSelect);

    $('#cep').on('blur', evt => {
        let zip = $('#cep').val();

        if (!zip) {
            return;
        }

        mainApp.ajax({
            url: 'checkout/getZip',
            method: 'POST',
            data: {
                'zip': zip,
            },
            dataType: 'json',
            success: (result) => {
                console.log(result.bairro);
                $('#address').val(result.rua);
                $('#address2').val(result.bairro);
            },
            // error: console.log("Outro teste"),
        });
    });

    $('#remove').on('click', () => {
        mainApp.ajax({
            url: 'cart/deleteCart',
            method: 'DELETE',
            data: {},
            dataType: 'json',
            success: () => {
                history.back();
            },
            error: console.log("Outro teste"),
        });
    });

    $('#buy-form').submit(function (evt) {
        evt.preventDefault();

        mainApp.ajax({
            url: 'orders/create',
            method: 'POST',
            data: {
                'rua': $('#address').val(),
                'bairro': $('#address2').val(),
                'numero': $('#number').val(),
                'comp': $('#comp').val(),
                'cep': $('#cep').val(),
                'pagamento': $('#payment').val()
            },
            dataType: 'json',
            success: () => {
                history.back();
            },
            error: console.log("Outro teste"),
        });
    });

    /**
     * Returns the controller object.
     * @class
     */
    return {
        /**
         * Initiates the controller
         */
        init: function () {

        }
    };
}));