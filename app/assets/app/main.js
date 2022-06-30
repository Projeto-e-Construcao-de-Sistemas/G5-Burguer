/**
 * @file      The main application script.
 *
 * Based upon UMD template https://github.com/umdjs/umd/blob/master/templates/amdWebGlobal.js
 *
 */
/* global _dcq, dataLayer, FB, fbq, pintrk, uid */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        root.mainApp = factory(root, window.jQuery || window.$);
    }
}(typeof self !== 'undefined' ? self : this, function (root, $) {
    'use strict';

    /** @constant {string} sefURI The URI of this script */
    const selfURI = $(document.currentScript).attr('src')
        .substring(
            0,
            $(document.currentScript).attr('src').search('main.js') - 1
        );
    /** @type {Number} Ajax counter control */
    let ajaxCount = 0;
    /** @type {Array} Ajax execution queue  */
    let ajaxQueue = [];
    /** @type {Number} The default timeout to alerts */
    let alertTimeout = 3000;
    /** @type {Object} On close function callback for error alerts */
    let dialogOnClose = null;
    /** @type {String} The default classes for the icon of error alerts */
    let dialogTheme = 'modern';
    /** @type {Boolean} hashMaches was disabled */
    let hashsDisabled = false;
    /** @type {Object} The array of objects with regular expressions and correspodent function to be executed by hashes match */
    let hashsMatch = [];
    let isGoingBack = false;
    /** @type {String} The default classes for the icon to close modal */
    let iconClose = 'fa fa-times';
    /** @type {String} The default classes for the icon of error alerts */
    let iconError = 'fa fa-2x fa-times text-danger';
    /** @type {String} The default classes for the icon of success alerts */
    let iconSuccess = 'fa fa-2x fa-check text-success';
    /** @type {Boolean} User notifications loading control */
    let loadingNotifications = false;
    /** @type {Number} User notifications page counter */
    let notificationsPage = 0;
    /** @type {Number} User notifications unseen counter */
    let unseenNotifications = 0;

    /** @type {Object} For listeners */
    const mainBodyEvt = $('#main-body');

    /**
     * Adds a loading overlay to the target element
     * @param {(Object|String)} target - Target to include modal
     * @param {Object} configModal - Config of modal
     * @param {string} configModal.bgOpacity - Opacity of background
     * @param {string} configModal.modalContent - Content of modal
     * @param {string} configModal.modalClassCustom - Class to customize something specific of modal
     */
    const addOverlay = function (target, configModal = {}) {
        // Variables of arguments
        const element = $(target);
        let { bgOpacity, modalContent, modalClassCustom } = configModal;

        if (element.prop('data-overlay') === '1') {
            return;
        }

        const divElm = document.createElement('div');
        const iElm = document.createElement('i');
        const nodeName = element.prop('nodeName');
        const setOpacity = (bgOpacity !== undefined) ? bgOpacity : .6;
        const setContent =
            (modalContent !== undefined)
                ? `<div class="dyn-overlay_content">${modalContent}</div>`
                : '';

        if (nodeName === 'BODY') {
            $('body').css({'overflow': 'hidden'});
        }

        $(divElm).addClass([
            'dyn-overlay',
            modalClassCustom
        ]).css({
            'position': nodeName === 'BODY' ? 'fixed' : 'absolute',
            'top': '0',
            'right': '0',
            'bottom': '0',
            'left': '0',
            'display': 'flex',
            'justify-content': 'center',
            'align-items': 'center',
            'flex-direction': 'column',
            'z-index': nodeName === 'BODY' ? '6000' : '',
            'background': `rgba(255, 255, 255,${setOpacity})`,
        }).append(iElm).append(setContent);

        $(iElm).css({
            'display': 'inline-block',
            'width': '30px',
            'height': '30px',
            'border': '3px solid #dedede',
            'border-top-color': '#333',
            'border-radius': '100%',
            'animation': 'spin 1s infinite linear',
        });

        element.append(divElm).prop('data-overlay', '1');
    };

    /**
     * Ajax function.
     * @param {Object} settings
     */
    const ajax = (settings, noErrorMsg = false) => {
        const successCallback = settings.success ?
            settings.success :
            () => {};
        const errorCallback = settings.error ?
            settings.error :
            () => {};
        const completeCallback = settings.complete ?
            settings.complete :
            () => {};

        if (!settings.url) {
            return false;
        }
        if (!settings.method && !settings.type) {
            settings.method = 'GET';
        }

        // Add Ajax to the queue?
        if (settings.queue && ajaxCount > 0) {
            ajaxQueue.push(settings);

            return;
        }

        // Set on success callbeck method
        settings.success = (data, textStatus, jqXHR) => {
            if (data && data.error) {
                showError(
                    (data.message !== null && data.message) ?
                        data.message :
                        'Opa! Algo não saiu como esperado.'
                );
            }

            successCallback(data, textStatus, jqXHR);
        };

        // Set on error callback method
        settings.error = (jqXHR, textStatus, errorThrown) => {
            // There is a modal for loading state?
            if (settings.modalLoading) {
                $(settings.modalLoading).modal('hide');
            }

            if (!noErrorMsg) {
                ajaxError(jqXHR, textStatus, errorThrown);
            }

            errorCallback(jqXHR, textStatus, errorThrown);
        };

        // Set on complete callback method
        settings.complete = () => {
            ajaxCount -= 1;

            if (ajaxQueue.length) {
                ajax(ajaxQueue.shift());
            }

            completeCallback();
        };

        // Stringify the json object if needed
        if (settings.dataType === 'json' || settings.dataType === 'jsonp') {
            settings.data = JSON.stringify(settings.data);
            settings.contentType = 'application/json';
        }

        // Set the correct URL
        settings.url = restfulUrl(settings.url);
        settings.jsonp = false;

        ajaxCount += 1;

        // Show a modal for loading state?
        if (settings.modalLoading) {
            $(settings.modalLoading).modal('show');
        }

        $.ajax(settings);
    };

    /**
     * Event error for Ajax.
     * @param {jQuery.jqXHR} jqXHR the jqXHR object.
     * @param {string} textStatus the text status.
     * @param {string} errorThrwon the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    const ajaxError = (jqXHR, textStatus, errorThrown) => {
        showError(
            ajaxErrorMessage(jqXHR, textStatus, errorThrown)
        );
    };

    /**
     * Returns the Ajax error message string.
     * @param {jQuery.jqXHR} jqXHR the jqXHR object.
     * @param {string} textStatus the text status.
     * @param {string} errorThrwon the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    const ajaxErrorMessage = function (jqXHR, textStatus, errorThrown) {
        let obj;
        const defaultMessages = {
            'abort': 'Ação interrompida pelo usuário.',
            'parsererror': 'Não foi possível processar sua requisição.',
            'timeout': 'O servidor não respondeu à requisição.<br>Tente novamente e se o problema persistor, entre em contato com nosso suporte.'
        };

        if (defaultMessages[textStatus]) {
            return defaultMessages[textStatus];
        }

        if (textStatus !== 'error') {
            return 'Ocorreu algum erro não previsto.<br>Tente novamente e se o problema persistor, entre em contato com nosso suporte.';
        }

        if (jqXHR.status === 0) {
            return 'Falha na conexão com o servidor.<br>Por favor, verifique sua conexão de rede.';
        }

        // if (errorThrown === 'Forbidden') {
        // showError('Você não tem acesso a esse recurso.');
        // return;
        // }

        try {
            obj = jqXHR.responseJSON;

            if (obj && obj.message) {
                return obj.message;
            }

            return `${textStatus} : ${errorThrown}<br>${jqXHR.responseText}`;
        } catch (e) {
            return `${errorThrown}<br>${jqXHR.responseText}`;
        }
    };

    /**
     * Checks the anchor in URI.
     */
    const checkAnchor = () => {
        if (isGoingBack) {
            isGoingBack = false;

            return;
        }

        const hash = location.hash;
        const res = hashsMatch.find(elm => {
            const isExp = (typeof elm.expression === 'object');
            const match = isExp ?
                hash.match(elm.expression) :
                (hash === elm.expression);

            return elm.enabled &&
                match &&
                typeof elm.callBack === 'function';
        });

        if (res) {
            res.callBack(hash.match(res.expression));
        }
    };

    /**
     * Creates a cookie.
     * @param {String} name The name for the cookie.
     * @param {*} value The value for the cookie.
     * @param {Number} days The expiration in days.
     * @param {Number} seconts The expiration in seconds.
     */
    const createCookie = function (name, value, days, seconds) {
        let expires = '';
        let date = new Date();

        if (seconds) {
            date.setTime(date.getTime() + (seconds * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        if (days) {
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }

        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + expires + '; path=/';
    };

    /**
     * Converts a string in ISO 8601 to Date object.
     * @param {String} date
     * @returns {Date}
     */
    const dateFromISO = date => {
        const vdt = date === null ?
            [] :
            date.split(/[- T:]/);
        const dateObj = (date === null) ?
            new Date() :
            new Date(
                vdt[0] || 0,
                (vdt[1] || 1) - 1,
                vdt[2] || 0,
                vdt[3] || 0,
                vdt[4] || 0,
                vdt[5] || 0
            );
        const currOfs = (new Date()).getTimezoneOffset();

        // // Only date and wrong timezone?
        // if (date !== null && vdt.length === 3 && dateObj.getTimezoneOffset() !== currOfs) {
        //     dateObj.setTime(dateObj.getTime() + (currOfs - dateObj.getTimezoneOffset()) * 60000);
        // }

        // Not in same timezone?
        if (dateObj.getTimezoneOffset() !== currOfs && vdt.length > 3) {
            dateObj.setTime(dateObj.getTime() + (dateObj.getTimezoneOffset() - currOfs) * 60000);
        }

        return dateObj;
    };

    /**
     * Deletes a cookie.
     * @param {String} name The name for the cookie.
     */
    const deleteCookie = function (name) {
        let expires = 'Thu, 01 Jan 1970 00:00:00 UTC';

        document.cookie = encodeURIComponent(name) + '=; expires=' + expires + '; path=/';
    };

    /**
     * Removes the dynamic loading overlay from element.
     * @param {(Object|String)} element
     */
    const deleteOverlay = function (element) {
        if (element === 'body') {
            $('body').removeAttr('style');
        }

        $(element).prop('data-overlay', '').find('.dyn-overlay').remove();
    };

    /**
     * Disables all regular expression hash bind.
     */
    const disableHashs = function () {
        if (hashsDisabled) {
            return;
        }

        $.each(hashsMatch, idx => {
            hashsMatch[idx].enabled = false;
        });

        hashsDisabled = true;
    };

    /**
     * Enables all regular expression hash bind.
     * @param {String|Object|Null} hash
     */
    const enableHashs = hash => {
        hashsMatch.forEach((elm, idx) => {
            if (hash) {
                if (String(hash) === String(elm.expression)) {
                    hashsMatch[idx].enabled = true;
                }

                return;
            }

            hashsMatch[idx].enabled = true;
        });

        hashsDisabled = false;
    };

    /**
     * Returns a formated date-time.
     *
     * @function formatDateTime
     * @param {Object|string} dateTime A Date object or a string in ISO 8601 or databese format.
     * @returns {String} A string in brazilian date format with hour and minutes (dd/mm/yyyy hh:ii).
     */
    const formatDateTime = (format, dateTime) => {
        if (typeof dateTime === 'object') {
            return $.formatDateTime(format, dateTime);
        }

        if (typeof dateTime !== 'undefined' && dateTime !== null && dateTime !== '') {
            return $.formatDateTime(format, dateFromISO(dateTime));
        }

        return '';
    };

    /**
     * Returns a date in brazilian format in another format.
     * @function formatDateTimeBR
     * @param {Object|String} dateTime A Date object or a string in BR format.
     * @returns {String}
     */
    const formatDateTimeBR = (format, dateTime) => {
        let vdt;

        if (typeof dateTime === 'object') {
            return $.formatDateTime(format, dateTime);
        }

        if (
            typeof dateTime !== 'undefined' &&
            dateTime !== null &&
            dateTime !== ''
        ) {
            vdt = dateTime.split(/[-/ :]/);

            return $.formatDateTime(
                format,
                new Date(
                    vdt[2],
                    vdt[1] - 1,
                    vdt[0],
                    vdt[3] || 0,
                    vdt[4] || 0,
                    vdt[5] || 0
                )
            );
        }

        return '';
    };

    /**
     * Reads the values of a cookie.
     * @param {string} name The name for the cookie.
     * @returns {*} the value of the cookie.
     */
    const readCookie = function (name) {
        const nameEQ = encodeURIComponent(name) + '=';
        let cookieValue = null;

        $.each(document.cookie.split(';'), (index, cookie) => {
            const chr = $.trim(cookie);

            if (chr.indexOf(nameEQ) === 0) {
                cookieValue = decodeURIComponent(chr.substring(nameEQ.length, chr.length));
            }
        });

        return cookieValue;
    };

    /**
     * Registers a hash callback function.
     * @param {(Object|string)} hash an regex expression (object) or a string for a single hash.
     * @param {Object} callback the function to execute when hash were bind.
     */
    const registerHash = function (hash, callback) {
        hashsMatch.push({
            expression: hash,
            callBack: callback,
            enabled: true,
        });
    };

    /**
     * Returns the URL for a RESTful API link.
     * @param {String} link
     */
    const restfulUrl = link => {
        const fullUrl = new RegExp('^http(s)?://.+');
        const shortUrl = new RegExp('^/api/.+');
        const baseUrl = new URL(`/api/${link}`, selfURI);

        if (fullUrl.test(link) || shortUrl.test(link))  {
            return link;
        }

        return baseUrl.href;
    };

    /**
     * Unregisters a hash callback function.
     * @param {(Object|string)} hash an regex expression (object) or a string for a single hash.
     */
    const unregisterHash = function (hash) {
        hashsMatch.forEach((elm, idx) => {
            if (String(hash) === String(elm.expression)) {
                hashsMatch.splice(idx, 1);

                return;
            }
        });
    };

    /**
     * Closes the current modal visible and save it to show back in future.
     *
     * @function closeCurrentModal
     */
    const closeCurrentModal = function () {
        $.each($('.modal'), function (ids, modal) {
            if (($(modal).data('bs.modal') || {}).isShown) {
                $(modal).modal('hide');

                return;
            }
        });
    };

    /**
     * Changes the srcset attribute of the images by its realsrcset attribute.
     *
     * @function loadImages
     */
    const loadImages = function () {
        // setTimeout(function () {
        $('[data-js="urlRealSrc"]').each(function (idx, item) {
            var obj = $(item);

            if (obj.attr('realsrcset')) {
                // obj.one('appear', function() {
                obj.attr('srcset', obj.attr('realsrcset'));
                obj.removeAttr('realsrcset');
                // });
            }
        });
        // }, 1);
    };

    /**
     * Callback method after successfull login.
     *
     * @function successfullIn
     */
    const successfullIn = function (result) {
        if (result.ccid) {
            createCookie('ccid', result.ccid, 90);
        }

        // Comes with a redirect URI?
        if (result.redirect) {
            location.href = result.redirect;

            return false;
        }

        // There is a sign in callback defined?
        if (typeof mainApp.signinCallback === 'function') {
            deleteOverlay('body');
            mainApp.signinCallback();

            return false;
        }

        location.reload();
    };

    /**
     * Sets the cursor position at the end of the field.
     * @param {Object} ctrl
     */
    const setCursorEnd = ctrl => {
        const pos = ctrl.value.length;

        // Modern browsers
        if (ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);

            return;
        }

        // IE8 and below
        if (ctrl.createTextRange) {
            const range = ctrl.createTextRange();

            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    };

    /**
     * Puts the focus in an element.
     *
     * Nothing happens if the element is not visible.
     *
     * @function setFocus
     * @param {(HTMLElement|string)} selector the DOM element or string for jQuery selection.
     */
    const setFocus = function (selector) {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            return;
        }

        if ($(selector).is(':visible')) {
            $(selector).focus();
        }
    };

    /**
     * Checks the options object.
     *
     * @function checkAlertOptions
     * @param {Object} options the options for the alert box.
     * @returns {Object} The options.
     */
    const checkAlertOptions = function (options) {
        if (typeof options !== 'object') {
            options = {
                message: options,
                iconClass: iconSuccess,
                className: 'alert-info',
                timeout: 3000,
                onClose: null
            };
        }

        if (typeof options.className === 'undefined') {
            options.className = 'alert-info';
        }

        if (typeof options.timeout === 'undefined') {
            options.timeout = 3000;
        }

        if (typeof options.onClose === 'undefined') {
            options.onClose = null;
        }

        return options;
    };

    /**
     * Show an alert box at the top of the content area.
     *
     * @function showAlert
     * @param {Object} options the options of the alert box.
     */
    const showAlert = function (options) {
        var alertBox = document.createElement('div');
        var button = document.createElement('button');
        var times = document.createElement('span');

        options = checkAlertOptions(options);

        $(times).attr('aria-hidden', 'true').html('&times');

        $(button).attr({
            'type': 'button',
            'data-dismiss': 'alert',
            'aria-label': 'Fechar'
        }).addClass('close').append(times);

        $(button).on('click', function () {
            $(this).parent().remove();
        });

        $(alertBox).addClass('alert alert-dismissible ' + options.className)
            .attr('role', 'alert')
            .css({
                opacity: 0
            })
            .html(options.message).prepend(button);

        $('.content-wrapper > .content').prepend(alertBox);
        // TODO: Verficar quebra de layout
        $('.bof-container.l-wrap').prepend(alertBox);

        $(alertBox).animate({
            opacity: 1
        }, 500, 'swing', function () {
            timeoutRemoveAlert(alertBox, options.timeout, options.onClose);
        });
    };

    /**
     * Dismiss the alert box after the timeout.
     *
     * @function timeoutRemoveAlert
     * @param {(HTMLElement|string)} alertObj DOM element or a jQuery selector of the alert box.
     * @param {number} timeout The timeout in seconds. If zero, will not dismissed automatically.
     * @param {Object=} onClose A function that will be executed after the alert dismissed.
     */
    const timeoutRemoveAlert = function (alertObj, timeout, onClose) {
        if (!timeout) {
            return;
        }

        setTimeout(function () {
            $(alertObj).animate({
                opacity: 0,
            }, 500, 'swing', function () {
                if (typeof onClose === 'function') {
                    onClose();
                }

                $(alertObj).remove();
            });
        }, timeout);
    };

    /**
     * Shows an auto close notification box.
     *
     * @function showUpperAlertBox
     * @param {Object} options the options of the notification box.
     */
    const showUpperAlertBox = function (options) {
        var obj = document.createElement('div');

        if (typeof options === 'undefined' || options === null) {
            return;
        }

        if (typeof options !== 'object') {
            options = {
                message: options,
                type: 'success',
                iconClass: iconSuccess,
                timeout: alertTimeout,
                onClose: null
            };
        }

        if (typeof options.onClose === 'undefined') {
            options.onClose = null;
        }

        // Inserts the icon
        if (typeof options.iconClass !== 'undefined' && options.iconClass) {
            $(obj).prepend(
                $('<i>').addClass(options.iconClass)
            );
        }

        $(obj).appendTo(document.body);
        // .animate({
        //     opacity: 1,
        //     bottom: '20px'
        // }, 500, 'swing', function () {
        //     timeoutRemoveAlertBox(obj, options.timeout, options.onClose);
        // });
        setTimeout(function () {
            $(obj).addClass('visible');
            timeoutRemoveAlertBox(obj, options.timeout, options.onClose);
        }, 50);
    };

    /**
     * Removes the box notification after the timeout.
     *
     * @function timeoutRemoveAlertBox
     * @param {(HTMLElement|string)} alertObj DOM element or a jQuery selector of the alert box.
     * @param {number} timeout The timeout in seconds.
     * @param {Object=} onClose A function that will be executed after the alert dismissed.
     */
    const timeoutRemoveAlertBox = function (alertObj, timeout, onClose) {
        if (typeof timeout === 'undefined' || timeout === null) {
            timeout = alertTimeout;
        }

        setTimeout(function () {
            // $(alertObj).animate({
            //     opacity: 0,
            //     bottom: '-50px'
            // }, 500, 'swing', function () {
            //     if (typeof onClose === 'function') {
            //         onClose();
            //     }

            //     $(alertObj).remove();
            // });

            $(alertObj).removeClass('visible');
            setTimeout(function () {
                $(alertObj).remove();
                if (typeof onClose === 'function') {
                    onClose();
                }
            }, 500);
        }, timeout);
    };

    /**
     * Open a popup dialog with jQuery Confirm plugin.
     *
     * @function showDialogMessage
     * @param {Object} options
     * @returns {Boolean}
     */
    const showDialogMessage = function (options) {
        if (typeof $.dialog === 'undefined') {
            return false;
        }

        $.confirm(options);

        return true;
    };

    /**
     * Opens the error modal with the given message.
     *
     * @function showError
     * @param {String|Array} message
     * @param {Object|null} options
     */
    const showError = function (message, options) {
        const buildMessage = (message) => {
            if (Array.isArray(message)) {
                return '<ul style="list-style:none;padding:0;"><li>' +
                    message.join('</li><li>') +
                    '</li></ul>';
            }

            return message;
        };
        let dialogOptions = {
            backgroundDismissAnimation: 'glow',
            icon: iconError,
            title: '',
            closeIcon: true,
            closeIconClass: iconClose,
            columnClass: 'medium',
            content: buildMessage(message),
            theme: dialogTheme,
            onClose: dialogOnClose,
            buttons: {
                ok: {
                    btnClass: 'hidden'
                }
            }
        };

        for (var attr in options) {
            dialogOptions[attr] = options[attr];
        }

        if (showDialogMessage(dialogOptions)) {
            return;
        }

        showAlert({
            message: message,
            className: 'alert-danger text-center',
            timeout: 60000,
            onClose: null
        });
    };

    /**
     * Opens the succes modal with the given message.
     *
     * @function showSuccess
     * @param {String} message
     * @param {Object|null} options
     */
    const showSuccess = function (message, options) {
        var dialogOptions = {
            backgroundDismissAnimation: 'glow',
            icon: iconSuccess,
            title: '',
            closeIcon: true,
            closeIconClass: iconClose,
            columnClass: 'medium',
            content: message,
            theme: dialogTheme,
            onClose: dialogOnClose,
            buttons: {
                ok: {
                    btnClass: 'hidden'
                }
            }
        };

        for (var attr in options) {
            dialogOptions[attr] = options[attr];
        }

        if (showDialogMessage(dialogOptions)) {
            return;
        }

        showAlert({
            message: message,
            className: 'alert-success text-center',
            timeout: 60000,
            onClose: null
        });
    };

    /**
     * Generates a slug from given string.
     * @param {String} str
     * @returns {String}
     */
    const slugGenerator = str => {
        const from = 'àáâãåäªèéëêÆæìíïîòóöôõºðŒØøœùúüûµÑñç¢Ð£ßŠ§šýÿ¥ž¹²³·/_,:;';
        const to   = 'aaaaaaaeeeeeeiiiiooooooooooouuuuunnccdlssssyyyz123------';

        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        from.split('').forEach((char, index) => {
            str = str.replace(
                new RegExp(char, 'g'),
                to.charAt(index)
            );
        });

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    };

    /**
     * Creates a jQuery method to load scripts with cache.
     * @param {String} url
     * @param {Object} options
     */
    $.cachedScript = function (url, options) {
        // Allow user to set any option except for dataType, cache, and url
        options = $.extend(options || {}, {
            dataType: 'script',
            cache: true,
            url: url
        });

        // Use $.ajax() since it is more flexible than $.getScript
        // Return the jqXHR object so we can chain callbacks
        return $.ajax(options);
    };

    // Registers a change listener for the URI hash
    // $(window).on('hashchange', checkAnchor);
    window.addEventListener('hashchange', checkAnchor);

    // Extends jQuery
    $.fn.extend({
        inputNumber: function (options = {}) {
            this.each(function () {
                const elm = $(this);
                const min = elm.attr('min') || 0;

                elm.inputmask('decimal',
                    $.objectNormalizer(options, {
                        allowMinus: min < 0,
                        allowPlus: false,
                        autoUnmask: true,
                        digits: elm.attr('data-decimals') || 2,
                        digitsOptional: false,
                        groupSeparator: '.',
                        radixPoint: ',',
                        inputtype: 'decimal',
                        min: min,
                        max: elm.attr('max'),
                        prefix: elm.attr('data-prefix'),
                        suffix: elm.attr('data-suffix'),
                        unmaskAsNumber: true,
                    })
                ).on('focus', () => {
                    elm.select();
                }).on('blur', () => {
                    if (elm.attr('min') && typeof elm[0].value == 'string') {
                        elm[0].value = parseFloat(elm.attr('min'));
                    }
                });
            });
        },
        zipEdit: function (successCallback = () => {}) {
            return $(this).inputmask('99999-999', {
                placeholder: '00000-000',
                clearIncomplete: true,
                autoUnmask: true,
                inputmodel: 'numeric',
                onBeforeMask: value => {
                    return value.replace(/\D/g, '');
                },
                onBeforePaste: pastedValue => {
                    return pastedValue.replace(/\D/g, '');
                },
                onUnMask: (maskedValue, unmaskedValue) => {
                    return unmaskedValue.replace(/\D/g, '');
                },
            }).on('input paste', evt => {
                const elm = $(evt.target);
                const zip = elm.inputmask('unmaskedvalue').replace(/\D/g, '');

                if (!elm.inputmask('isComplete')) {
                    return;
                }

                mainApp.ajax({
                    url: `addresses/findZipCode/${zip}`,
                    method: 'GET',
                    success: successCallback,
                    error: () => {
                        elm.val('');
                    }
                });
            }).on('focus', function () {
                $(this).select();
            });
        },
    });

    // Creates a trigger for jQuery's addClass, toggleClass and removeClass methods
    $.map(['addClass', 'toggleClass', 'removeClass'], function (method) {
        // Store the original handler
        var originalMethod = $.fn[method];

        $.fn[method] = function () {
            if (this.length === 0) {
                return originalMethod.apply(this, arguments);
            }

            // Execute the original hanlder.
            var oldClass = this[0].className;
            var result = originalMethod.apply(this, arguments);
            var newClass = this[0].className;

            // trigger a custom event
            this.trigger(method, [oldClass, newClass]);

            // return the original result
            return result;
        };
    });

    /**
     * Formats a date in brazilian format to another format.
     * @param {Object|String} value
     * @returns {String}
     */
    $.brDateFormat = (value, format = 'yy-mm-dd') => {
        return formatDateTimeBR(format, value);
    };

    /**
     * Formats a number as BRL.
     * @param {String|Number} value
     */
    $.brlFormat = value => {
        return 'R$' + $.number(value, 2, ',', '.');
    };

    /**
     * Formats a brazilian zip code.
     * @function $.formatZIP
     * @param {String} value the zip code without the minus character.
     * @returns {String} The zip code in brazilian format (#####-###).
     */
    $.formatZIP = value => {
        const zipnumber = value ?
            value.replace(/\D/g, '') :
            '';

        if (zipnumber.length !== 8) {
            return value;
        }

        return zipnumber.replace(
            /(\d{5})(\d{3})/g,
            '$1-$2'
        );
    };

    /**
     * Convert an integer to a decimal number by dividing it by 10**n.
     * @param {Number} value
     * @param {Number} decimalPlaces
     * @returns {Number}
     */
    $.int2dec = (value, decimalPlaces) => {
        if (value === null) {
            return '';
        }

        return parseFloat(parseInt(value, 10) / (10 ** decimalPlaces));
    };

    /**
     * Compares data with model and add missing attributes.
     * @param {Object} model
     * @param {Object} data
     * @returns {Object}
     */
    $.normalizeData = (model, data) => {
        const newObj = Object.assign({}, data);

        for (var name in model) {
            if (!Object.prototype.hasOwnProperty.call(newObj, name)) {
                if (Array.isArray(model[name])) {
                    newObj[name] = [...model[name]];
                    continue;
                } else if (model[name] === null) {
                    newObj[name] = model[name];
                    continue;
                } else if (typeof model[name] === 'object') {
                    newObj[name] = Object.assign({}, model[name]);
                    continue;
                }

                newObj[name] = model[name];
                continue;
            } else if (
                typeof model[name] === 'object' &&
                model[name] !== null &&
                !Array.isArray(model[name])
            ) {
                newObj[name] = $.normalizeData(model[name], newObj[name]);
            }
        }

        return newObj;
    };

    /**
     * Normalizes an object using a model and a data conversor.
     * @param {Object} data
     * @param {Object} model
     * @param {Object|null} conversor
     */
    $.objectNormalizer = (data, model, conversor) => {
        const newdata = $.normalizeData(model, data);
        const keys = (typeof conversor === 'object') ?
            Object.keys(conversor) :
            [];

        keys.forEach(key => {
            newdata[key] = conversor[key](newdata[key]);
        });

        return newdata;
    };

    /**
     * Initiates inputMask plugin for numeric input by using
     * $.fn.inputNumber() extension.
     */
    $.inputNumber = () => {
        $('[data-input="number"]').inputNumber();
    };

    /**
     * Returns a random string with up to 16 length.
     * @returns {String}
     */
    $.randomId = () => {
        return Math.random().toString(36).substring(2, 18);
    };

    // Registers global functions
    root.addOverlay = addOverlay;
    root.checkAnchor = checkAnchor;
    root.dateFromISO = dateFromISO;
    root.deleteOverlay = deleteOverlay;
    root.restfulUrl = restfulUrl;
    root.setCursorEnd = setCursorEnd;
    root.slugGenerator = slugGenerator;

    /**
     * Create the mainApp.
     * @class
     */
    return {
        urlControllers: selfURI,
        dependencies: [],
        plugins: {},
        signinCallback: null,
        alertTimeout: alertTimeout,

        /**
         * DataTables language translation.
         *
         * @function
         * @param {String} i18n
         * @returns {Object}
         */
        dataTablesTranslation: function (i18n) {
            var translations = {
                'pt-BR': {
                    'sEmptyTable': 'Nenhum registro encontrado',
                    'sInfo': 'Mostrando de _START_ até _END_ de _TOTAL_ registros',
                    'sInfoEmpty': 'Mostrando 0 até 0 de 0 registros',
                    'sInfoFiltered': '(Filtrados de _MAX_ registros)',
                    'sInfoPostFix': '',
                    'sInfoThousands': '.',
                    'sLengthMenu': '_MENU_ resultados por página',
                    'sLoadingRecords': 'Carregando...',
                    'sProcessing': 'Processando...',
                    'sZeroRecords': 'Nenhum registro encontrado',
                    'sSearch': 'Pesquisar',
                    'oPaginate': {
                        'sNext': 'Próximo',
                        'sPrevious': 'Anterior',
                        'sFirst': 'Primeiro',
                        'sLast': 'Último'
                    },
                    'oAria': {
                        'sSortAscending': ': Ordenar colunas de forma ascendente',
                        'sSortDescending': ': Ordenar colunas de forma descendente'
                    }
                }
            };

            if (translations[i18n] === undefined) {
                return {
                    'sEmptyTable': 'No data available in table',
                    'sInfo': 'Showing _START_ to _END_ of _TOTAL_ entries',
                    'sInfoEmpty': 'Showing 0 to 0 of 0 entries',
                    'sInfoFiltered': '(filtered from _MAX_ total entries)',
                    'sInfoPostFix': '',
                    'sInfoThousands': ',',
                    'sLengthMenu': 'Show _MENU_ entries',
                    'sLoadingRecords': 'Loading...',
                    'sProcessing': 'Processing...',
                    'sSearch': 'Search:',
                    'sZeroRecords': 'No matching records found',
                    'oPaginate': {
                        'sFirst': 'First',
                        'sLast': 'Last',
                        'sNext': 'Next',
                        'sPrevious': 'Previous'
                    },
                    'oAria': {
                        'sSortAscending': ': activate to sort column ascending',
                        'sSortDescending': ': activate to sort column descending'
                    }
                };
            }

            return translations[i18n];
        },

        /**
         * Defines the onClose callback action for jQuery Confirm dialogs.
         *
         * @function setCloseDialogCallback
         * @param {Object} callback
         */
        setCloseDialogCallback: function (callback) {
            dialogOnClose = callback;
        },

        /**
         * Returns the theme for jQuery Confirm dialogs.
         *
         * @function getDialogTheme
         * @return {String}
         */
        getDialogTheme: function () {
            return dialogTheme;
        },

        /**
         * Defines the theme for jQuery Confirm dialogs.
         *
         * @function setDialogTheme
         * @param {String} theme
         */
        setDialogTheme: function (theme) {
            dialogTheme = theme;
        },

        /**
         * Returns the class for error icon.
         *
         * @function getIconError
         * @return {String}
         */
        getIconError: function () {
            return iconError;
        },

        /**
         * Defines the class for icon to close.
         *
         * @function setIconError
         * @param {String} icon
         */
        setIconClose: function (icon) {
            iconClose = icon;
        },

        /**
         * Defines the class for error icon.
         *
         * @function setIconError
         * @param {String} icon
         */
        setIconError: function (icon) {
            iconError = icon;
        },

        /**
         * Returns the class for success icon.
         *
         * @function getIconSuccess
         * @return {String}
         */
        getIconSuccess: function () {
            return iconSuccess;
        },

        /**
         * Defines the class for success icon.
         *
         * @function setIconSuccess
         * @param {String} icon
         */
        setIconSuccess: function (icon) {
            iconSuccess = icon;
        },

        /**
         * Creates cookie method.
         *
         * @function createCookie
         * @alias createCookie
         */
        createCookie: createCookie,

        /**
         * Deletes a cookie.
         *
         * @function deleteCookie
         * @alias deleteCookie
         */
        deleteCookie: deleteCookie,

        /**
         * Reads the values of a cookie.
         *
         * @function readCookie
         * @alias readCookie
         */
        readCookie: readCookie,

        /**
         * Puts the focus in an element.
         *
         * Nothing happens if the element is not visible.
         *
         * @function setFocus
         * @alias setFocus
         */
        setFocus: setFocus,

        /**
         * Transforms given date into a string in brazilian format dd/mm/yyyy.
         *
         * @function formatDate
         * @param {(Object|string)} date A Date object or a string in ISO 8601 or databese format.
         * @returns {string} A string in brazilian date format (dd/mm/yyyy).
         */
        formatDate: date => {
            return formatDateTime('dd/mm/yy', date);
        },

        /**
         * Transform given date and time into a string in brazilian format dd/mm/yyyy hh:ii.
         *
         * @function formatDateTime
         * @param {(Object|string)} date A Date object or a string in ISO 8601 or databese format.
         * @returns {string} A string in brazilian date format with hour and minutes (dd/mm/yyyy hh:ii).
         */
        formatDateTime: date => {
            return formatDateTime('dd/mm/yy hh:ii', date);
        },

        /**
         * Transforms given date and time into a string in brazilian format dd/mm/yyyy hh:ii:ss.
         *
         * @function formatDateTimeSecs
         * @param {(Object|string)} date A Date object or a string in ISO 8601 or databese format.
         * @returns {string} A string in brazilian date format with hour, minutes and seconds (dd/mm/yyyy hh:ii:ss).
         */
        formatDateTimeSecs: date => {
            return formatDateTime('dd/mm/yy hh:ii:ss', date);
        },

        /**
         * Closes the current opened modal.
         *
         * @function closeOpenedModal
         * @alias closeCurrentModal
         */
        closeOpenedModal: closeCurrentModal,

        /**
         * Changes the srcset attribute of the images by its realsrcset attribute.
         *
         * @function loadImages
         */
        loadImages: loadImages,

        /**
         * Checks if device is an iPad, iPhone or iPod.
         *
         * @function appleCheck
         */
        appleCheck: function () {
            return (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
        },

        /**
         * Opens the error modal with the given message.
         *
         * @function showError
         * @alias showError
         */
        showError: showError,

        /**
         * Opens the success modal with the given message.
         *
         * @function showSuccess
         * @alias showSuccess
         */
        showSuccess: showSuccess,

        /**
         * Ajax method.
         *
         * @function ajax
         * @param {Object} settings
         */
        ajax: ajax,

        /**
         * Opens the error modal with the given error result.
         * @alias ajaxError
         */
        ajaxError: ajaxError,
        ajaxErrorMessage: ajaxErrorMessage,

        /**
         * Registers a hash callback function.
         *
         * @function registerHash
         * @alias registerHash
         */
        registerHash: registerHash,

        /**
         * Register slide to top of the page resource.
         *
         * @function slideToTop
         */
        slideToTop: function () {
            var slideToTop = $('<div />');

            slideToTop.html('<i class="fa fa-chevron-up"></i>');
            slideToTop.css({
                'position': 'fixed',
                'bottom': '20px',
                'right': '25px',
                'width': '40px',
                'height': '40px',
                'color': '#eee',
                'font-size': '',
                'line-height': '40px',
                'text-align': 'center',
                'background-color': '#222d32',
                'cursor': 'pointer',
                'border-radius': '5px',
                'z-index': '99999',
                'opacity': '.7',
                'display': 'none'
            });
            slideToTop.on('mouseenter', function () {
                $(this).css('opacity', '1');
            });
            slideToTop.on('mouseout', function () {
                $(this).css('opacity', '.7');
            });
            $('.wrapper').append(slideToTop);

            $(window).scroll(function () {
                if ($(window).scrollTop() >= 150) {
                    if (!$(slideToTop).is(':visible')) {
                        $(slideToTop).fadeIn(500);
                    }
                } else {
                    $(slideToTop).fadeOut(500);
                }
            });
            $(slideToTop).click(function () {
                $('html, body').animate({
                    scrollTop: 0
                }, 500);
            });
        },

        /**
         * Shows an auto close notification box.
         *
         * @function showAlert
         * @alias showUpperAlertBox
         */
        showAlert: showUpperAlertBox,

        /**
         * Shows an auto close notification box for error alerts.
         *
         * @function showErrorAlert
         * @method showErrorAlert
         * @param {string} text the message to show.
         */
        showErrorAlert: function (text) {
            if (typeof text === 'undefined' || text === null) {
                return;
            }

            showUpperAlertBox({
                message: text,
                type: 'danger',
                iconClass: iconError,
                timeout: alertTimeout,
                onClose: null
            });
        },

        /**
         * Shows an auto close notification box for success alerts.
         *
         * @function showSuccessAlert
         * @param {string} text the message to show.
         */
        showSuccessAlert: function (text) {
            if (typeof text === 'undefined' || text === null) {
                return;
            }

            showUpperAlertBox({
                message: text,
                type: 'success',
                iconClass: iconSuccess,
                timeout: alertTimeout,
                onClose: null
            });
        },

        /**
         * Tests the received string is like an email address.
         *
         * @function testEmail
         * @param {string} email
         * @returns {boolean}
         */
        testEmail: function (email) {
            return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
        },

        /**
         * Loads an application plugin.
         *
         * @function loadPlugin
         * @param {String} name
         * @param {String} url
         */
        loadPlugin: function (name, url) {
            $.cachedScript(url).done(() => {
                if (!Object.prototype.hasOwnProperty.call(this.plugins, name)) {
                    console.warn(`Plugin ${name} not loaded`); // eslint-disable-line

                    return;
                }

                try {
                    if (typeof this.plugins[name] === 'function') {
                        this.plugins[name]();

                        return;
                    }

                    if (typeof this.plugins[name] === 'object') {
                        this.plugins[name].init();

                        return;
                    }

                    console.warn(`Invalid plugin ${name} struct`); // eslint-disable-line
                } catch (error) {
                    console.error(error); // eslint-disable-line
                }
            });
        },

        /**
         * Waits until a mainApp plugin is loaded and call a function when done.
         *
         * @function waitPluginLoad
         * @param {string} pluginName the name of the plugin.
         * @param {Object} callback the callback function that is called when plugin is loaded.
         */
        waitPluginLoad: function (pluginName, callBack) {
            if (typeof mainApp[pluginName] !== 'undefined') {
                callBack();

                return;
            }

            setTimeout(function () {
                mainApp.waitPluginLoad(pluginName, callBack);
            }, 500);
        },

        /**
         * Loads the controller.
         * @param {String} controllerName
         * @param {(Object|null)} parameters
         */
        loadController: function (controllerName, parameters) {
            if (!controllerName) {
                return;
            }

            $.cachedScript(controllerName).done(() => {
                if (typeof this.controller === 'function') {
                    this.controller(parameters);
                    checkAnchor();

                    return;
                }

                if (typeof this.controller !== 'object') {
                    return;
                }

                this.controller.init(parameters);
                checkAnchor();
            });
        },

        /**
         * Initiation method.
         *
         * @function init
         * @param {Object} options the options of the controller.
         */
        init: function (options) {
            const style = document.createElement('style');

            // Dynamicly creates keyframes to loading overlay object
            style.innerHTML = '@keyframes spin {from {transform: rotate(0deg);} to {transform: rotate(360deg);}}';
            document.getElementsByTagName('head')[0].appendChild(style);

            // Load the controller
            this.loadController(options.controller, options.options);

            checkAnchor();
            loadImages();
        }
    };
}));