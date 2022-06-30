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

    $('#forgot-form').submit(function (evt) {
        evt.preventDefault();

        let inpEmail = $('#form_email').val();

        if (
            !inpEmail
        ) {
            console.log("ERROR");
            return;
        }

        mainApp.ajax({
            url: 'account/resetPassword',
            method: 'POST',
            data: {
                email: inpEmail,
            },
            dataType: 'json',
            success: () => {
                window.location.assign('/')
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