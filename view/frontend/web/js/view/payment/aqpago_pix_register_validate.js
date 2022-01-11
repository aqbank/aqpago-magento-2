/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*browser:true*/
/*global define*/

define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/alert',
    'jquery/ui',
    'Magento_Payment/js/model/credit-card-validation/validator'
], function ($, mageTemplate, alert) {
    'use strict';

    $.widget('mage.aqpago_pix_register_validate', {
        options: {
            context: null,
            placeOrderSelector: '[data-role="review-save"]',
            code: null
        },
		
        /**
         * {Function}
         * @private
         */
        _create: function () {
            this.element.validation();
		},
    });
	
    return $.mage.aqpago_pix_register_validate;
});
