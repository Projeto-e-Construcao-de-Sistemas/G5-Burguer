/**
 * @file      Complementar script for menu page.
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

    const prodForm = $('#prod-form');

    $('#qttyInp').on('change', () => {
        const qtty = $('#qttyInp').val();
        const price = qtty * parseFloat($('#box-price').attr('price'));
        $('#box-price').html($.brlFormat(price));
    });

    $('#prod-form').on('submit', (evt) => {
        evt.preventDefault();
        const id = parseInt(prodForm.attr('data-id'));
        const qtty = parseInt($('#qttyInp').val(), 10);
        const obs = $('#floatingTextarea2').val();

        if (!id || !qtty) {
            $('#exampleModal').modal('hide');
        }

        mainApp.ajax({
            url: `cart`,
            method: 'POST',
            data: {
                'id': id,
                'qtty': qtty,
                'observations': obs,
            },
            dataType: 'json',
            success: $('#exampleModal').modal('hide'),
        });
    })

    /**
     * Returns the controller object.
     * @class
     */
    return {
        /**
         * Initiates the controller
         */
        init: function () {
            $.inputNumber();

            $('#exampleModal').on('show.bs.modal', function (evt) {
                const detail = $(evt.relatedTarget);

                $('#exampleModalLabel').html(detail.attr('data-name'));
                $('.card-img-top').attr('src', detail.attr('data-img'));
                $('.card-text').html(detail.attr('data-desc'));
                $('#box-price').html($.brlFormat(detail.attr('data-price')));
                $('#box-price').attr('price', detail.attr('data-price'));
                $('#floatingTextarea2').val('');
                $('#qttyInp').val('1');
                prodForm.attr('data-id', detail.attr('data-id'));
            });
        }
    };
}));