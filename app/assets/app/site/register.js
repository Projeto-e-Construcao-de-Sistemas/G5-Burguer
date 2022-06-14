/**
 * @file      Complementar script for register page.
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
    const inpPhone = $('#form_phone');

    /**
     * Marks edit content as selected.
     */
     const autoSelect = function () {
        $(this).select();
    };

    // Phone number
    inpPhone.inputmask({
        mask: ['(99) 9999-9999', '(99) 99999-9999'],
        clearIncomplete: true
    }).on('focus', autoSelect);

    $('#signupForm').submit(function (evt) {
        evt.preventDefault();

        let inpName = $('#form_nome').val();
        let inpEmail = $('#form_email').val();
        let inpPsw = $('#form_password').val();

        if (
            !inpName ||
            !inpEmail ||
            !inpPsw ||
            !inpPhone.val()
        ) {
            console.log("ERROR");
            return;
        }

        mainApp.ajax({
            url: 'account/signin',
            method: 'POST',
            data: {
                name: inpName,
                email: inpEmail,
                password: inpPsw,
                phone: inpPhone.val(),
            },
            dataType: 'json',
            success: () => {
                window.location.assign('/menu')
            },
            error: console.log("teste"),
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
            // console.log('teste');
        }
    };
}));