/**
 * @file      Complementar script for dashboard admin page.
 *
 */
/* global Highcharts, Mustache */
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

    const adminInp = $('#admin-input');

    // Initiates Select2 for consultant filter
    adminInp.setSelectUser(term => {
        return {
            'admin': 0,
            'email': term,
        };
    });

    // Refresh button
    $('a[href="#refresh"]').on('click', () => {
        mainApp.ajax({
            url: `users/${adminInp.val()}/admin`,
            method: 'PUT',
            data: {
                'admin': 1,
            },
            dataType: 'json',
            success: () => {
                location.hash = '';
                $.success('Cliente promovido com sucesso.');
            },
            error: () => {
                $.error('Nenhum usuário encontrado com o email fornecido');
            }
        });
    });

    /**
     * Create the controller.
     * @class
     */
    return {
        /**
         * Starts the module.
         */
        ready: () => {
        }
    };
}));