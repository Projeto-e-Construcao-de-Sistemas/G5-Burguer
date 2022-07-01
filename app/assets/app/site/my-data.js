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

    const myDataForm = $('#my-data-form');
    const inpName = $('#name');
    const inpEmail = $('#email');
    const inpZip_code = $('#zip-code');
    const inpPassword = $('#password');
    const inpPhone = $('#phone');

    function fillInput() {
        mainApp.ajax({
            url: `users/${$('#my-data').attr('data-id')}`,
            method: 'GET',
            data: {},
            dataType: 'json',
            success: result => {
                inpName.val(result.name);
                inpEmail.val(result.email);
                inpZip_code.val(result.zip_code);
                inpPhone.val(result.phone);
            }
        });
    }

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

    // Phone number
    inpZip_code.inputmask({
        mask: ['99999-999'],
        clearIncomplete: true
    }).on('focus', autoSelect);

    myDataForm.submit(function (evt) {
        evt.preventDefault();

        let data = {};

        if (inpName.val()) {
            data.name = inpName.val();
        }
        if (inpEmail.val()) {
            data.email = inpEmail.val();
        }
        if (inpPassword[0].value) {
            data.password = inpPassword.val();
        }
        if (inpPhone) {
            data.phone = inpPhone.val();
        }

        mainApp.ajax({
            url: `perfil/save`,
            method: 'PUT',
            data: {
                data
            },
            dataType: 'json',
            success: reload,
        });

        console.log(data);
    });

    $('#eye').mousedown(function (evt) {
        inpPassword.attr('type', 'text');
        $('#eye').addClass('fa-eye-slash');
        $('#eye').removeClass('fa-eye');
    });
    $('#eye').mouseup(function (evt) {
        inpPassword.attr('type', 'password');
        $('#eye').removeClass('fa-eye-slash');
        $('#eye').addClass('fa-eye');
    });

    /**
     * Reloads the page.
     */
     const reload = () => {
        addOverlay('body');
        location.reload();
    };

    /**
     * Returns the controller object.
     * @class
     */
    return {
        /**
         * Initiates the controller
         */
        init: function () {
            fillInput();
            $('#avatar-upload').val('teste');
        }
    };
}));