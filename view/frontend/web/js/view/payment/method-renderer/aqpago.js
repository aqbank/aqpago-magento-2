/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*browser:true*/
/*global define*/
define([
        'underscore',
        'Magento_Checkout/js/view/payment/default',
        'Magento_Ui/js/model/messageList',
        'Magento_Customer/js/model/customer',
        'Magento_Customer/js/model/address-list',
        'Aqbank_Aqpago/js/model/credit-card-validation/credit-card-data',
        'Aqbank_Aqpago/js/model/credit-card-validation/credit-card-number-validator',
        'Magento_Checkout/js/model/quote',
        'mage/translate',
        'jquery',
        'Magento_Ui/js/modal/modal',
        'Magento_Checkout/js/model/payment/additional-validators',
        'Magento_Checkout/js/action/redirect-on-success',
        'jquerymask',
        'Magento_Catalog/js/price-utils',
        'Magento_Checkout/js/model/error-processor'
    ],
    function (_, Component, messageList, customer, addressList, creditCardData, cardNumberValidator, quote, $t, $, modal, additionalValidators, redirectOnSuccessAction, jquerymask, priceUtils) {
        'use strict';
        
        $(document).ready(function(){
            $('#aqpago_cc_cid').mask('0000');
            $('#aqpago_cc_cid_cardOne').mask('0000');
            $('#aqpago_cc_cid_cardTwo').mask('0000');
            $('#aqpago_documento').mask('000.000.000-00');
            $('#aqpago_numbercard_fake').mask('0000 0000 0000 0000');
       });
        
        $(document).on('click', '#not', function(){
            if($(this).is(':checked')) {
                $('.documento-one').slideDown('100');
            } else {
                $('.documento-one').slideUp('100');
            }
        });         
        $(document).on('click', '#not_cardOne', function(){
            if($(this).is(':checked')) {
                $('.documento-one-cardOne').slideUp('100');
            } else {
                $('.documento-one-cardOne').slideDown('100');
            }
        });
        $(document).on('click', '#not_twoCard', function(){
            if($(this).is(':checked')) {
                $('.documento-two-cardTwo').slideUp('100');
            } else {
                $('.documento-two-cardTwo').slideDown('100');
            }
        });
        
        $(document).on('blur change keyup keypress', 'input[name="' + window.checkoutConfig.payment['aqpago'].phone_input + '"]', function(){
            $('.phone-text').html( $(this).val() );
        });
        
        $(document).on('blur change keyup keypress', 'input[name="username"]', function(){
            $('.email-text').html( $(this).val() );
        }); 
        
        $(document).on('click', '#not', function(){
            if($("#not").is(':checked')) {
                $('.documento-one').slideUp();
            } else {
                $('.documento-one').slideDown();
            }
        });     
        $(document).on('click', '#notOne', function(){
            if($("#notOne").is(':checked')) {
                $('.documento-multi-one').slideUp();
            } else {
                $('.documento-multi-one').slideDown();
            }
        });     
        
        $(document).on('change', 'input[name="postcode"]', function(){
            $('.address-cep').html( 'CEP ' + $(this).val() );
        });     
        $(document).on('change', 'input[name="street[0]"]', function(){
            $('.address-street').html( $(this).val() );
        });
        $(document).on('change', 'input[name="street[1]"]', function(){
            $('.address-number').html( ', ' + $(this).val() );
        });
        $(document).on('change', 'input[name="street[2]"]', function(){
            $('.address-complement').html( $(this).val() );
        });         
        
        $(document).ready(function(){
            setTimeout(2000, function(){                
                $('input[name="username"]').focus();
                $('input[name="' + window.checkoutConfig.payment['aqpago'].phone_input + '"]').focus();
                $('input[name="' + window.checkoutConfig.payment['aqpago'].phone_input + '"]').blur();
                
                if($('input[name="' + window.checkoutConfig.payment['aqpago'].phone_input + '"]').val() != ''){
                    $('.phone-text').html( $('input[name="' + window.checkoutConfig.payment['aqpago'].phone_input + '"]').val() );
                }
                /* if($('input[name="username"]').val() != ''){
                    $('.email-text').html( $('input[name="username"]').val() );
                } */
            });
        });
        
        var sumInit = false;
        var subInit = false;
        var typePayment = '';
        
        return Component.extend({
            defaults: {
                template: 'Aqbank_Aqpago/payment/form',
                code: 'aqpago',
                creditCardType: '',
                creditCardExpYear: '',
                creditCardExpMonth: '',
                creditCardNumber: '',
                creditCardOwner: '',
                creditCardSsStartMonth: '',
                creditCardSsStartYear: '',
                creditCardSsIssue: '',
                creditCardVerificationNumber: '',
                
                exist_erro: false,
                use_two_cards: false,
                erro_credit: '',
                erro_multi_credit: '',
                erro_multi_ticket: '',
                
                add_card: false,
                card_saved: false,
                saved_card_one: false,
                saved_card_two: false,
                set_one_card: false,
                set_two_card: false,
                set_credit_one: false,
                set_credit_multi: false,
                
                ticketUrl: '',
                payment_order_id: false,
                card_one_erro: false,
                card_two_erro: false,
                type_payment: '',
                
                amount_total: '',
                amount_one: '',
                amount_two: '',
                amount_ticket: '',
                customer_password: '',
                formkeyenc: window.checkoutConfig.fomrkeyenc,
                savedCards: window.checkoutConfig.savedCards,
                totalSavedCards: window.checkoutConfig.totalSavedCards,
                
                cards: {},
                card_one: false,
                card_two: false,
                select_card: false,
                select_card_two: false,
                show_saved_card: false,
                
                one_cc_flag: '',
                one_cc_number: '',
                one_cc_owner: '',
                one_cc_exp_month: '',
                one_cc_exp_year: '',
                one_cc_cid: '',
                one_cc_document: '',
                one_cc_amount: '',
                one_cc_installments: '',
                one_cc_saved: '',
                one_cc_number_id: '',
                
                two_cc_flag: '',
                two_cc_number: '',
                two_cc_owner: '',
                two_cc_exp_month: '',
                two_cc_exp_year: '',
                two_cc_cid: '',
                two_cc_document: '',
                two_cc_amount: '',
                two_cc_installments: '',
                two_cc_saved: '',
                two_cc_number_id: '',
                
                ticket_amount: '',
                ticket_amount_multiple: '',
                
                creditCard: true,
                creditCard3Ds: false,
                debitCard: false,
                selectedCardType: null,
                installment: '1',
                numberInstallments: '1',
                GrandTotalSubdivide: (quote.totals().grand_total / 2)
            },
            
            initObservable: function () {
                this._super()
                    .observe([
                        'creditCardType',
                        'creditCardExpYear',
                        'creditCardExpMonth',
                        'creditCardNumber',
                        'creditCardOwner',
                        'creditCardVerificationNumber',
                        'creditCardSsStartMonth',
                        'creditCardSsStartYear',
                        'creditCardSsIssue',
                        'creditCard',
                        
                        'exist_erro',
                        'use_two_cards',
                        'erro_credit',
                        'erro_multi_credit',
                        'erro_multi_ticket',
                        'add_card',
                        'card_saved',
                        'saved_card_one',
                        'saved_card_two',
                        'set_one_card',
                        'set_two_card',
                        'set_credit_one',
                        'set_credit_multi',
                        
                        'customer_password',
                        'formkeyenc',
                        'savedCards',
                        'totalSavedCards',
                        
                        'ticketUrl',
                        'payment_order_id',
                        'card_one_erro',
                        'card_two_erro',
                        'type_payment',
                        
                        'amount_total',
                        'amount_one',
                        'amount_two',
                        'amount_ticket',
                        'cards',
                        'card_one',
                        'card_two',
                        'select_card',
                        'select_card_two',
                        'show_saved_card',
                        
                        'one_cc_flag',
                        'one_cc_number',
                        'one_cc_owner',
                        'one_cc_exp_month',
                        'one_cc_exp_year',
                        'one_cc_cid',
                        'one_cc_document',
                        'one_cc_amount',
                        'one_cc_installments',
                        'one_cc_saved',
                        'one_cc_number_id',
                        
                        'two_cc_flag',
                        'two_cc_number',
                        'two_cc_owner',
                        'two_cc_exp_month',
                        'two_cc_exp_year',
                        'two_cc_cid',
                        'two_cc_document',
                        'two_cc_amount',
                        'two_cc_installments',
                        'two_cc_saved',
                        'two_cc_number_id',
                        
                        'ticket_amount',
                        'ticket_amount_multiple',
                        
                        
                        'creditCard3Ds',
                        'debitCard',
                        'selectedCardType',
                        'installment',
                        'numberInstallments',
                        'GrandTotalSubdivide'
                    ]);             
                
                return this;
            },
            
            /**
             * Init component
             */
            initialize: function () {
                var self = this;
                
                this._super();
                
                $('.aqbank-input-valor').mask('000.000.000,00', {reverse: true});
                
                /***********/
                if (!typeof quote.shippingAddress().postcode === "undefined") {
                    if(quote.shippingAddress().postcode){
                        $('.street').slideDown('100');
                        $('.aqbank-cidade').slideDown('100');
                        $('.aqbank-estado').slideDown('100');
                    }
                }
                
                if(customer.isLoggedIn()) {
                    
                    $('.email-text').html( customer.customerData.email );
                    
                    if(this.getPhoneInput() == 'telephone') {
                        $('.phone-text').html( quote.shippingAddress().telephone );
                    }
                    else {
                        $('.phone-text').html( quote.shippingAddress().this.getPhoneInput() );
                    }
                }
                /***********/
                
                quote.shippingMethod.subscribe(function (value) {
                    /** total com frete **/
                    var subtotalVal = quote.totals().base_subtotal_with_discount + value.amount;
                    
                    /** ticket min 10 **/
                    if(subtotalVal < 10) {
                        self.blockTicket(true);
                        // aqbankAqpago.
                    }
                    else {
                        self.blockTicket(false);
                    }
                    
                    /** multi ticket min 11 **/
                    if(subtotalVal < 11) {
                        self.blockMultiTicket(true);
                    }
                    else {
                        self.blockMultiTicket(false);
                    }
                    
                });
                
                this.numberInstallments.subscribe(function (value) {
                    var after  = value;
                    
                    if(after > 12) {
                        after = 12;
                    } 
                    if(after <= 0) {
                        after = 1;
                    } 
                    
                    $('#aqpago_installments').val( after ).change();
                    $('#number_installments').val( after ).change();
                });
                
                /* Set Card number to Card data object */
                this.creditCardNumber.subscribe(function (value) {
                    $('#aqpago_cc_number').mask('0000 0000 0000 0000');
                    value = value.replace(/\s+/g, '');

                    var result;
                    var valCard;
                    
                    var Bandeira    = self.setPaymentFlag(value);
                    var Maxkey      = 19; 
                    var digitos     = value.length;
                    
                    self.selectedCardType(null);
                    
                    if (value === '' || value === null) {
                        $(".card-number").html( '0000 0000 0000 0000' );
                        return false;
                    }
                    
                    if(Bandeira == 'mastercard') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_mastercard );
                        $('.flag-card').show();
                    }
                    else if(Bandeira == 'amex') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_american_express );
                        $('.flag-card').show();
                    }
                    else if(Bandeira == 'hipercard') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_hipercard );
                        $('.flag-card').show();
                    }       
                    else if(Bandeira == 'jcb') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_jcb );
                        $('.flag-card').show();
                    }       
                    else if(Bandeira == 'elo') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_elo );
                        $('.flag-card').show();
                    }
                    else if(Bandeira == 'aura') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_aura );
                        $('.flag-card').show();
                    }       
                    else if(Bandeira == 'hiper') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_hiper );
                        $('.flag-card').show();
                    }       
                    else if(Bandeira == 'banescard') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_banescard );
                        $('.flag-card').show();
                    }
                    else if(Bandeira == 'visa') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_visa );
                        $('.flag-card').show();
                    }   
                    else if(Bandeira == 'diners') {
                        $('#img-flag-card').attr('src', window.checkoutConfig.payment[self.getCode()].flag_diners );
                        $('.flag-card').show();
                    }
                    
                    $('#img-flag-card').show();
                    
                    var cardMask = self.maskcard(value, Bandeira, digitos);
                    $(".card-number").html( cardMask );
                    $('#aqpago_cc_number').mask('0000 0000 0000 0000');
                    result  = cardNumberValidator( value );
                    
                    if (!result.isPotentiallyValid && !result.isValid) {
                        return false;
                    }
                    
                    if (result.card !== null) {
                        self.selectedCardType(result.card.type);
                        creditCardData.creditCard = result.card;
                    }
                    
                    if (result.isValid) {
                        creditCardData.creditCardNumber = valCard;
                        self.creditCardType(result.card.type);
                    }
                    
                    return cardMask;
                });
                
                /* Set creditCardOwner to Card data object */
                this.creditCardOwner.subscribe(function (value) {
                    let owner = value.replace(/[^\w]/gi, '');
                    
                    if(value.length < 20) {
                        $('.card-name').html( value );
                    } else {
                        $('.card-name').html( value.substring(0, 20) + '...');
                    }
                    
                    if(value == '') {
                        $('.card-name').html( 'Nome do proprietário' );
                    }
                    
                    if (owner != value) {
                        return false;
                    }
                    creditCardData.creditCardOwner = owner;
                });

                /* Set expiration year to Card data object */
                this.creditCardExpYear.subscribe(function (value) {
                    var month = $('#' + self.getCode() + '_expiration').val();
                    var year = value;
                    
                    
                    if(month < 10 && month != '') {
                        month = '0' + month ;
                    } 
                    
                    if((typeof year === "undefined") || year == '') {
                        year = 'AAAA' ;
                    }
                    if((typeof month === "undefined") || month == '') {
                        month = 'MM';
                    }
                    
                    $('.card-valid').html( month + '/' + year);
                    creditCardData.expirationYear = value;
                });

                /* Set expiration month to Card data object */
                this.creditCardExpMonth.subscribe(function (value) {
                    var month = '';
                    var year = $('#' + self.getCode() + '_expiration_yr').val();
                    
                    if(value < 10 && value != '') {
                        month = '0' + value ;
                    } 
                    if(value >= 10 && value != '') {
                        month = value ;
                    }
                    
                    if((typeof year === "undefined") || year == '') {
                        year = 'AAAA';
                    }                   
                    if((typeof month === "undefined") || month == '') {
                        month = 'MM';
                    }
                    
                    $('.card-valid').html( month + '/' + year);
                    
                    creditCardData.expirationMonth = value;
                });

                /* Set cvv code to Card data object */
                this.creditCardVerificationNumber.subscribe(function (value) {
                    let cvv = value.replace(/[^\d]/g, '');

                    if (cvv != value) {
                        return false;
                    }

                    creditCardData.cvvCode = value;
                });

                /* Set credit option */
                this.creditCard.subscribe(function (value) {
                    let img = window.checkoutConfig.payment[this.getCode()].aqpago;

                    $('#issuers').attr('src', img);

                    creditCardData.creditCard = value;

                    if (value && self.hasInstallments()) {
                        $('#installments').show();
                    }
                });

                /* Set 3ds option */
                this.creditCard3Ds.subscribe(function (value) {
                    let img = window.checkoutConfig.payment[this.getCode()].aqpago;

                    if (value) {
                        if (self.hasInstallments()) {
                            $('#installments').show();
                        }
                    }

                    $('#issuers').attr('src', img);

                    creditCardData.creditCard3Ds = value;
                });

                /* Set debit card option */
                this.debitCard.subscribe(function (value) {
                    if (self.hasInstallments()) {
                        $('#aqpago_installments_div').toggle();
                    }

                    let img = window.checkoutConfig.payment[this.getCode()].aqpago;

                    $('#issuers').attr('src', img);
                    $('#installments').hide();

                    creditCardData.debitCard = value;
                });
                
                $([
                    window.checkoutConfig.payment[this.getCode()].aqpago,
                ]).each(function () {
                    $('<img/>')[0].src = this;
                });
                
            },
            
            getCustomerEmail: function() {
                
                if(customer.isLoggedIn()) {
                    return customer.customerData.email;
                }
                else {
                    if($('#customer-email').length) {
                        return $('#customer-email').val();
                    }
                    else if($('input[name="email"]').length) {
                        return $('input[name="email"]').val();
                    }
                    else {
                        return '';
                    }
                }
                
            },
            
            getDataCustomerTelephone: function(){
                var addressDf = addressList().filter(function (address) {
                    var isDefaultShipping = address.isDefaultShipping();
                    return isDefaultShipping;
                });
                
                var telephone = addressDf[0].telephone.replace(/[^0-9]/g,'');
                
                return this.masktelephone( telephone );
            },  
            masktelephone: function(v){
                v=v.replace(/\D/g,"");
                v=v.replace(/^(\d{2})(\d)/g,"($1) $2");
                v=v.replace(/(\d)(\d{4})$/,"$1-$2");
                return v;
            },          
            blockTicket: function (disable) {
                if(disable) {
                    $('.aqbank_type_payment_li_box.ticket').addClass("aqbank_disable_method"); 
                    $('.aqbank_set_ticket .ticket-info-tool').show();
                    
                    if(this.type_payment() == 'ticket'){
                        this.setPaymentMethod( this.type_payment() );
                    }
                } else {
                    $('.aqbank_type_payment_li_box.ticket').removeClass("aqbank_disable_method"); 
                    $('.aqbank_set_ticket .ticket-info-tool').hide();
                }
                
            },
            blockMultiTicket: function (disable) {
                if(disable) {
                    $('.aqbank_type_payment_li_box.ticket_multiple').addClass("aqbank_disable_method"); 
                    $('.aqbank_set_multi_ticket .ticket-info-tool').show();
                    
                    if(this.type_payment() == 'ticket_multiple'){
                        this.setPaymentMethod( this.type_payment() );
                    }
                } else {
                    $('.aqbank_type_payment_li_box.ticket_multiple').removeClass("aqbank_disable_method"); 
                    $('.aqbank_set_multi_ticket .ticket-info-tool').hide();
                }
                
            },
            initValidTicketValue: function(){
                /** ticket min 10 **/
                if(quote.totals().grand_total < 10) {
                    $('.aqbank_type_payment_li_box.ticket').addClass("aqbank_disable_method"); 
                    $('.aqbank_set_ticket .ticket-info-tool').show();
                }
                /** multi ticket min 11 **/
                if(quote.totals().grand_total < 11) {
                    $('.aqbank_type_payment_li_box.ticket_multiple').addClass("aqbank_disable_method"); 
                    $('.aqbank_set_multi_ticket .ticket-info-tool').show();
                    
                }
                
            },
            savedCardsDetails: function(){
                var self = this;
                var HtmlCard = "";
                
                /** Existe cartões salvos **/
                if(this.savedCards() != 'false'){
                    var cards = this.cards();
                    var SavedCards = this.savedCards();
                    
                    Object.entries(SavedCards).forEach(([key, value]) => {
                        
                        HtmlCard = "<div id='list-" + key + "' class='box-select-card-li box-select-card-two two-li-form-payment'>"
                                        + "<div class='box-select-card-float box-select-card-li-flag'>"
                                        + "<img class='img-one flag-" + value.flag + "' src='" + self.getFlagImg(value.flag) + "' />"
                                        + "</div>"
                                        + "<div class='box-select-card-float box-select-card-li-number'>"
                                        + value.four_first + " XXXX XXXX " + value.four_last
                                        + "</div>"
                                        + "<div class='box-select-card-float box-select-card-li-arrow'>"
                                        + "<span>" + $t('EDITAR') + "</span>"
                                        + "<div>" + self.getArrowRight() + "</div>"
                                        + "</div>"
                                    + "</div>";
                        
                        $('.box-select-card').append( HtmlCard );
                        
                        var card                    = [];
                        card['installment']         = 1;
                        card['card_id']             = value.card_id;
                        card['number']              = key;
                        card['expiration_month']    = null;
                        card['expiration_year']     = null;
                        card['securityCode']        = null;
                        card['owerName']            = null;
                        card['flag']                = value.flag;
                        card['imOwer']              = null;
                        card['taxvat']              = customer.customerData.taxvat;
                        cards[key]                  = card;
                        
                        $('#list-' + key ).on('click', function() {
                            
                            self.card_saved( key );
                            return self.showSavedCardId( key );
                        });
                    });
                    
                    this.cards( cards );
                    
                    this.add_card(true);
                    $('#list-new').on('click', function() {
                        return self.setNewCard();
                    });
                }
                
                return true;
            },
            setNewCard: function() {
                this.card_saved(false);
                
                $('.card_cvv_img').slideUp(1);
                $('.fieldset.aqbank-checkout').slideDown(1);
                $('.field-name-lastname, .valid_month_checkout, .field-name-name_card, .field-not, .field-name-documento').slideDown(1);
                
                if(this.type_payment() == 'credit_multiple'){
                    
                    if(this.card_one()){
                        $('.box-select-card-title').slideUp();
                        $('.box-select-card-li').slideUp();
                        
                        $('.card-box-all').slideDown('100');
                    }
                    else {
                        
                        $('.box-select-card-title').slideUp();
                        $('.box-select-card-li').slideUp();
                        
                        if(this.type_payment() == 'credit'){
                            $('#one-action').slideDown();
                        }
                        
                        $('.card-box-all').slideDown('100');

                    }
                    
                }
                else {
                    
                    if(this.card_one()){
                        
                    }
                    else {
                        
                        $('.box-select-card-title').slideUp();
                        $('.box-select-card-li').slideUp();
                        
                        if(this.type_payment() == 'credit'){
                            $('#one-action').slideDown();
                        }
                        
                        $('.card-box-all').slideDown('100');

                    }
                }
                
            },
            
            showSavedCardId: function(cardId){
                var self = this;
                this.show_saved_card(true);
                
                $('.box-select-card-li-arrow span').slideUp('100');
                $('.box-select-card-title').slideUp('100');
                $('.aqbank-add-new-card').slideUp('100');
                $('.box-select-card-li').slideUp('100');
                $('.card-box-all').slideUp('100');
                
                $('.box-select-card-li-arrow').removeClass('active-new');
                $('.box-select-card-li-arrow span').slideUp('100');             
                
                if(this.set_one_card() && this.type_payment() != 'credit_multiple' && this.type_payment() != 'ticket_multiple' && !this.set_two_card()) {
                    /** Seleção do 2 cartão **/
                    
                    /** Existe cartão selecionado abrir listagem e remover cartão **/
                    if(this.card_one() && this.set_one_card()) {
                        
                        this.show_saved_card(false);
                        this.select_card(false);
                        this.card_one(false);
                        this.set_one_card(false);
                        
                        $('.box-select-card-li-arrow').removeClass('active-new');
                        $('.box-select-card-li-arrow span').slideUp();
                        
                        setTimeout(function(){ 
                            $('.aqbank-add-new-card').slideDown('100');
                            $('.box-select-card-title').slideDown('100');
                            $('.box-select-card-li').slideDown('100');
                            
                            $('#list-' + self.card_one() ).slideUp('100');
                        }, 500);
                        
                        return false;
                    }
                }
                else if(this.set_one_card() && this.type_payment() == 'credit_multiple' && !this.set_two_card()) {
                    /** Seleção do 2 cartão **/
                    
                    /** Existe cartão selecionado abrir listagem e remover cartão **/
                    if(this.card_one() && this.set_one_card() && !this.set_credit_one() && !this.set_credit_multi()) {

                        this.show_saved_card(false);
                        this.select_card(false);
                        this.card_one(false);
                        this.set_one_card(false);
                        
                        $('.box-select-card-li-arrow').removeClass('active-new');
                        $('.box-select-card-li-arrow span').slideUp();
                        
                        setTimeout(function(){ 
                            $('.aqbank-add-new-card').slideDown('100');
                            $('.box-select-card-title').slideDown('100');
                            $('.box-select-card-li').slideDown('100');
                            
                            $('#list-' + self.card_one() ).slideUp('100');
                        }, 500);
                        
                        return false;
                    }
                }
                else if(this.set_two_card() && this.type_payment() == 'credit_multiple') {
                    /** Seleção do 2 cartão **/
                    
                    if(this.card_two()  && this.set_two_card()) {
                        
                        this.show_saved_card(false);
                        this.select_card(false);
                        this.card_two(false)
                        this.set_two_card(false);
                        
                        $('.box-select-card-li-arrow').removeClass('active-new');
                        $('.box-select-card-li-arrow span').slideUp();
                        
                        setTimeout(function(){ 
                            $('.aqbank-add-new-card').slideDown('100');
                            $('.box-select-card-title').slideDown('100');
                            $('.box-select-card-li').slideDown('100');
                        }, 500);
                        
                        return false;
                    }
                    
                }
                else if(this.type_payment() == 'ticket_multiple') {
                    
                    /** Existe cartão selecionado abrir listagem e remover cartão **/
                    if(this.card_one()) {
                        
                        this.select_card(false);
                        this.card_one(false);
                        this.set_one_card(false);
                        
                        this.set_credit_one(false);
                        
                        $('.li-form-payment').slideUp('100');
                        $('#button-finished').slideUp('100');
                        
                        setTimeout(function(){ 
                            $('.aqbank-add-new-card').slideDown('100');
                            $('.box-select-card-title').slideDown('100');
                            $('.box-select-card-li').slideDown('100');
                        }, 500);
                        
                        return false;
                    }
                }
                else {
                    
                    /** Existe cartão selecionado abrir listagem e remover cartão **/
                    if((this.type_payment() == 'credit' || this.type_payment() == 'ticket_multiple') && this.card_one()) {
                        
                        this.select_card(false);
                        this.card_one(false);
                        this.set_one_card(false);

                        this.set_credit_one(false);

                        setTimeout(function(){ 
                            $('.aqbank-add-new-card').slideDown('100');
                            $('.box-select-card-title').slideDown('100');
                            $('.box-select-card-li').slideDown('100');
                        }, 500);
                        
                        return false;
                    }
                }
                
                if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
                    $('#one-card-bottom span').html(
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat() 
                        )
                    );
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat() 
                        )
                    );
                }
                else {
                    $('#one-card-bottom span').html(
                        priceUtils.formatPrice( 
                            this.amount_total(), 
                            quote.getPriceFormat() 
                        )
                    );
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( 
                            this.amount_total(), 
                            quote.getPriceFormat() 
                        )
                    );
                    
                }
                
                this.select_card( cardId );
                
                $('#list-' + cardId ).slideDown('100');
                
                if(!this.set_one_card() && this.type_payment() != 'credit_multiple' && this.type_payment() != 'ticket_multiple'){
                    $('#one-li-form-payment').slideDown('100');
                }
                
                if(this.type_payment() == 'ticket_multiple') {
                    $('#three-li-form-payment').slideUp(1);
                    $('#one-li-form-payment').slideUp(1);
                    
                }
                
                if(!this.card_one()) {
                    
                    if(this.type_payment() == 'credit' || this.type_payment() == 'ticket_multiple'){
                        this.set_credit_one(true);
                    }
                    if(this.type_payment() == 'credit_multiple') {
                        this.set_credit_multi(true);
                    }
                    
                    this.card_one(cardId)
                    this.set_one_card(true);
                }
                else {
                    
                    $('.box-select-card-li-arrow').removeClass('active-new');
                    $('.box-select-card-li-arrow span').slideUp();
                    $('.box-select-card-title').slideDown();
                    this.card_two(cardId);
                    this.set_two_card(true);
                }
                
                $('.fieldset.aqbank-checkout').slideUp(1);
                $('.field-name-lastname, .valid_month_checkout, .field-name-name_card, .field-not, .field-name-documento').slideUp(1);
                
                $('#list-' + cardId).slideDown();
                $('.box-select-card-li-arrow span').slideDown();
                $('.card_cvv_img').slideDown();
                $('.box-select-card').slideDown();
                
                $('.box-select-card-li-arrow').addClass('active-new');
                $('.box-select-card-li-arrow span').slideDown('100');
                
                if(this.type_payment() == 'credit' || this.type_payment() == 'ticket_multiple') {
                    $('#multi-actions-two').slideUp(1);
                }
                
                var self = this;
                setTimeout(function(){ 
                    $('.card-box-all').slideDown('100');
                    
                    if(self.type_payment() == 'credit') {
                        $('#one-action').slideDown('100');
                    }
                }, 500);
                

            },
            
            /***** set card *******/
            setCardId: function(cardId){
                
                $('.box-select-card-li').slideUp();
                
                var cards       = this.cards();
                var card        = cards[ cardId ];
                
                var oldFisrt    = this.card_one();
                var oldTwo      = this.card_two();
                
                
                if(this.select_card()){
                    
                    $('.box-select-card-li-arrow').removeClass('active-arrow');
                    $('.' + cardId + ' .box-select-card-li-arrow' ).removeClass('active-arrow-custom');
                    $('.' + cardId).slideUp();
                    $('.box-select-card-li-arrow span').slideUp();
                    
                    this.select_card(false);
                    
                    $('.li-form-payment').slideUp('100');
                    
                    $('#button-finished').slideUp('100');
                    $('.box-select-card-title').slideDown('100');
                    $('.box-select-card-li').slideDown('100');
                    
                }
                else {

                        /** Processo normal sem cartão salvo **/
                        $('.box-select-card-li-arrow').addClass('active-arrow');
                        $('.' + cardId + ' .box-select-card-li-arrow').addClass('active-arrow-custom');
                        $('.box-select-card-title').slideUp('100');
                        
                        $('.box-select-card-li-arrow span').slideDown();
                        $('.' + cardId).slideDown();
                        $('#' + cardId).slideDown('100');
                        
                        $('#button-finished').slideDown('100');
                        
                        this.card_one( cardId );
                        
                        /** primeiro cartão passa para a segunda posição se o cartão selecionado for o segundo cartão digitado **/
                        if(oldTwo == cardId){
                            this.card_two( oldFisrt );
                            
                            cards[ oldFisrt ].installment = $('#' + this.getCode() + '_one_installments').val();
                            
                            
                            var cardTwo = cards[ oldFisrt ];
                            
                            
                            
                            /**** Modal two card **/
                            $('#two-middle-number-card').html( cardTwo.number.substr(-4, 4) );
                            this.setBandeiraInfo('#two-li-form-payment .middle-number-card img', cardTwo.flag, 'info');
                            $('#' + this.getCode() + '_cc_number_cardTwo').val( cardTwo.number );
                            $('#' + this.getCode() + '_cc_owner_cardTwo').val( cardTwo.owerName );
                            $('#' + this.getCode() + '_expiration_cardTwo').val( cardTwo.expiration_month );
                            $('#' + this.getCode() + '_expiration_yr_cardTwo').val( cardTwo.expiration_year );
                            $('#' + this.getCode() + '_cc_cid_cardTwo').val( cardTwo.securityCode );
                            $('#' + this.getCode() + '_documento_cardTwo').val( cardTwo.taxvat );
                            $('#' + this.getCode() + '_installments_cardTwo').val( cardTwo.installment ).change();
                            $('#not_cardTwo').prop('checked', cardTwo.imOwer );
                            /***********/
                            
                            $('#two-middle-number-card').html( cardTwo.number.substr(-4, 4) );
                            $('#two-card-bottom span').html( cardTwo.number.substr(-4, 4) );
                            
                            $('#' + this.getCode() + '_two_installments').val( cardTwo.installment ).change();
                            this.setBandeiraInfo('#two-li-form-payment .middle-number-card img', cardTwo.flag, 'info');
                            
                            $('#two-card-bottom strong').html( cardTwo.installment + 'x' );
                            $('#two-card-bottom span').html(
                                priceUtils.formatPrice( 
                                    ( this.amount_two() / cardTwo.installment ), 
                                    quote.getPriceFormat() 
                                )
                            );
                            $('#two-grand-total-view').html(
                                priceUtils.formatPrice( 
                                    this.amount_two(), 
                                    quote.getPriceFormat() 
                                )
                            );
                            
                        }
                        
                        cards[ cardId ].installment = $('#' + this.getCode() + '_one_installments').val();
                        this.cards( cards );
                        
                        /**** Modal one card **/
                        $('#one-middle-number-card').html( card.number.substr(-4, 4) );
                        this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', card.flag, 'info');
                        $('#' + this.getCode() + '_cc_number_cardOne').val( card.number );
                        $('#' + this.getCode() + '_cc_owner_cardOne').val( card.owerName );
                        $('#' + this.getCode() + '_expiration_cardOne').val( card.expiration_month );
                        $('#' + this.getCode() + '_expiration_yr_cardOne').val( card.expiration_year );
                        $('#' + this.getCode() + '_cc_cid_cardOne').val( card.securityCode );
                        $('#' + this.getCode() + '_documento_cardOne').val( card.taxvat );
                        $('#' + this.getCode() + '_installments_cardOne').val( card.installment ).change();
                        $('#not_cardOne').prop('checked', card.imOwer );
                        /***********/
                        
                        $('#one-middle-number-card').html( card.number.substr(-4, 4) );
                        
                        $('#one-card-bottom strong').html( card.number.substr(-4, 4) );
                        $('#one-card-bottom span').html( card.number.substr(-4, 4) );
                        
                        $('#' + this.getCode() + '_two_installments').val( card.installment ).change();
                        this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', card.flag, 'info');
                        
                        $('#one-card-bottom strong').html( card.installment + 'x' );
                        
                        if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
                            $('#one-card-bottom span').html(
                                priceUtils.formatPrice( 
                                    ( this.amount_one() / card.installment ), 
                                    quote.getPriceFormat() 
                                )
                            );
                            $('#one-grand-total-view').html(
                                priceUtils.formatPrice( 
                                    this.amount_one(), 
                                    quote.getPriceFormat() 
                                )
                            );
                        }
                        else {
                            $('#one-card-bottom span').html(
                                priceUtils.formatPrice( 
                                    ( this.amount_total() / card.installment ), 
                                    quote.getPriceFormat() 
                                )
                            );
                            $('#one-grand-total-view').html(
                                priceUtils.formatPrice( 
                                    this.amount_total(), 
                                    quote.getPriceFormat() 
                                )
                            );
                        }
                        
                        this.select_card( cardId );
                        
                        $('#list-' + cardId ).slideDown('100');
                        $('#one-li-form-payment').slideDown('100');
                        
                        if(this.type_payment() == 'ticket_multiple') {
                            $('#three-li-form-payment').slideDown('100');
                        }
                    
                }
            
            },
            /************/
            setPaymentFlag: function(value){
                var Visa        = /^4/;
                var Mastercard  = /^5([1-9]\d{1}|222100|272099)/;
                var Banescard   = /^(60420[1-9]|6042[1-9][0-9]|6043[0-9]{2}|604400)/;
                var Amex        = /^3(4|7)/;
                var Discover    = /^6(011|22[0-9]{1}|4|5)/;
                var HIPERCARD   = /^(3841|60\d{2})/;
                var Diners      = /^(30[0-5]{1}|36(0|[2-9]{1})|3[8-9]{2}|2014|2149|309)\d/;
                var JCB         = /^(2131|1800|35)/;
                var ELO         = /^(4011|438935|451416|4576|504175|5066|5067|50900|50904[0-9]|50905(1|2)|509064|50906[6-9]|509074|627780|636297|636368|636505)/;
                var AURA        = /^50\d{4}/;
                var HIPER       = /^637095/;
                
                if(Mastercard.test(value)) {
                    return 'mastercard';
                }
                else if(Amex.test(value)) {
                    return 'amex';
                }
                else if(Banescard.test(value)) {
                    return 'banescard';
                }
                else if(HIPERCARD.test(value)) {
                    return 'hipercard';
                }       
                else if(JCB.test(value)) {
                    return 'jcb';
                }       
                else if(ELO.test(value)) {
                    return 'elo';
                }
                else if(AURA.test(value)) {
                    return 'aura';
                }       
                else if(HIPER.test(value)) {
                    return 'hiper';
                }       
                else if(Visa.test(value)) {
                    return 'visa';
                }   
                else if(Diners.test(value)) {
                    return 'diners';
                } else {
                    return '';
                }       
            },
            
            openAddressEdit: function() {
                /*** Mobile ***/
                $('.step-3').attr('src', window.mbstep3Off);
                $('.step-2').attr('src', window.mbstep2Off);
                $('.aqbank_mobile_steps_ico div').removeClass('div-step-active');
                $('.aqbank_mobile_steps_line .line-off').removeClass('line-on');
                $('.div-step-1').addClass('div-step-active');
                $('.div-step-2').addClass('div-step-2-off');
                $('.div-step-3').addClass('div-step-3-off');
                /*** Mobile ***/
                
                $('.aqbank_opc_payment').hide();
                $('.custom-shipping-address').show();
                $('.iwd_opc_shipping_column').slideDown('100');
            },
            getAqpagoPostcode: function() {
                if($('input[name="postcode"]').val() != '') {
                    return 'CEP ' + $('input[name="postcode"]').val();
                } else {
                    return '';
                }           
            },          
            getAqpagoStreet: function() {
                
                if($('input[name="street[0]"]').val() != '') {
                    return $('input[name="street[0]"]').val();
                } else {
                    return '';
                }           
            },          
            getAqpagoStreetNumber: function() {
                if($('input[name="street[1]"]').val() != '') {
                    return ', ' + $('input[name="street[1]"]').val();
                } else {
                    return '';
                }
            },
            getAqpagoStreetComplement: function() {
                if($('input[name="street[2]"]').val() != '') {
                    return ' ' + $('input[name="street[2]"]').val();
                } else {
                    return '';
                }
                
                
            },          
            getAqpagoState: function() {
                if($('input[name="region_id"]').val() != '') {
                    
                    return $('input[name="region_id"] option:seleted').text();
                    
                } else {
                    return '';
                }
                
                
            },
            customValValidate: function(valOne) {

                if (valOne.toString().indexOf('.') > -1 && valOne.toString().indexOf(',') > -1)  {
                    valOne = valOne.replace('.', '');
                    valOne = valOne.replace(',', '.');
                }
                else if (!valOne.toString().indexOf('.') > -1 && valOne.toString().indexOf(',') > -1)  {
                    valOne = valOne.replace(',', '.');
                }
                
                if(valOne < 0 || valOne > quote.totals().grand_total) {
                    valOne = (quote.totals().grand_total / 2).toFixed(2);
                }
                
                return valOne;
            },
            changeInstallmentOneCard: function() {
                var cards           = this.cards();
                
                var oneInstallments = $('#' + this.getCode() + '_one_installments').val();
                
                
                $('#' + this.getCode() + '_installments_oneCard').val( oneInstallments );
                
                /** update value **/
                if(this.card_one()) {
                    cards[ this.card_one() ].installment = oneInstallments;     
                    this.cards( cards );
                }
                
                /** INPUT **/
                //$('input[name="payment[one_cc_installments]"]').val( oneInstallments );
                
                $('#one-card-bottom strong').html( oneInstallments + 'x');
                
                if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
                    $('#one-card-bottom span').html( 
                        priceUtils.formatPrice( (this.amount_one() / oneInstallments), quote.getPriceFormat() )
                    );
                }
                else {
                    $('#one-card-bottom span').html( 
                        priceUtils.formatPrice( (this.amount_total() / oneInstallments), quote.getPriceFormat() )
                    );                  
                }
                
            },
            changeInstallmentTwoCard: function() {
                var cards           = this.cards();
                var twoInstallments = $('#' + this.getCode() + '_two_installments').val();
                
                $('#' + this.getCode() + '_installments_cardTwo').val( twoInstallments );
            
                /** update value **/
                if(this.card_two()) {
                    cards[ this.card_two() ].installment = twoInstallments;
                    this.cards( cards );
                }
                /** INPUT **/
                //$('input[name="payment[two_cc_installments]"]').val( twoInstallments );
                
                $('#two-card-bottom strong').html( twoInstallments + 'x');
                
                /** Multiple Payment **/
                if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
                    $('#two-card-bottom span').html( 
                        priceUtils.formatPrice( (this.amount_two() / twoInstallments), quote.getPriceFormat() )
                    );
                }
                else {
                    /** Single Payment **/
                    $('#two-card-bottom span').html( 
                        priceUtils.formatPrice( (this.amount_total() / twoInstallments), quote.getPriceFormat() )
                    );
                }
                
            },
            customChangeShippingMethod: function() {
                if(this.type_payment() == 'ticket' || this.type_payment() == 'ticket_multiple'){
                    return false;
                }
                
                /*** Mobile ***/
                $('.step-3').attr('src', window.mbstep3Off);
                $('.step-2').attr('src', window.mbstep2Off);
                $('.aqbank_mobile_steps_ico div').removeClass('div-step-active');
                $('.aqbank_mobile_steps_line .line-off').removeClass('line-on');
                $('.div-step-1').addClass('div-step-active');
                $('.div-step-2').addClass('div-step-2-off');
                $('.div-step-3').addClass('div-step-3-off');
                /*** Mobile ***/
                
                $('.aqbank_opc_payment').hide();
                $('.iwd_opc_shipping_column').slideDown('100');
            },
            saveCardOneEdit: function(){
                $('#one-li-form-payment').removeClass('aqpago-erro');
                $('#one-li-form-payment .li-position-card img').attr('src', this.getCardOne());
                $('#onecard-button-modal').attr('src', this.getIconEdit());
                $('#one-li-form-payment .text-edit').html('VOCÊ PODE EDITAR O CARTÃO');
                
                var cards               = this.cards();
                var installments        = $('#' + this.getCode() + '_installments_oneCard').val();
                var ccNumber            = $('#' + this.getCode() + '_cc_number_cardOne').val().replace(/[^0-9]/g,'');
                var expiration_month    = $('#' + this.getCode() + '_expiration_cardOne').val();
                var expiration_year     = $('#' + this.getCode() + '_expiration_yr_cardOne').val();
                var securityCode        = $('#' + this.getCode() + '_cc_cid_cardOne').val();
                var owerName            = $('#' + this.getCode() + '_cc_owner_cardOne').val();
                var cardIndex           = ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not_cardOne').is(":checked")) ? true : false;
                var flag                = this.setPaymentFlag(ccNumber);
                var taxvat              = '';
                var currency            = quote.getPriceFormat().pattern.replace('%s','');
                
                var card                    = [];
                card['installment']         = installments;
                card['number']              = ccNumber;
                card['expiration_month']    = expiration_month;
                card['expiration_year']     = expiration_year;
                card['securityCode']        = securityCode;
                card['owerName']            = owerName;
                card['flag']                = flag;
                card['imOwer']              = imOwer;

                if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
                    var valOne  = $('#' + this.getCode() + '_cc_multiple_val_oneCard').val();
                    valOne      = this.customValValidate(valOne);
                    var valTwo  = quote.totals().grand_total - valOne;
                    
                    if(valOne > (this.amount_total() - 1)){
                        alert(
                            $t('O valor não pode ser maior que ') + 
                            priceUtils.formatPrice( 
                                (this.amount_total() - 1), 
                                quote.getPriceFormat()
                            )
                        );
                        return false;
                    }
                    if(valOne < 1){
                        alert(
                            $t('O valor não pode ser menor que ') + 
                            priceUtils.formatPrice( 
                                '1.00', 
                                quote.getPriceFormat()
                            )
                        );
                        return false;
                    }
                    
                    this.amount_one(valOne);
                    this.amount_two( valTwo );
                    this.amount_ticket( valTwo );
                    
                    $('#two-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_two(), quote.getPriceFormat())
                    );              
                    $('#ticket-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat())
                    );              
                    $('#ticket-card-bottom span').html(
                        priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat())
                    );
                    
                    
                    $('#one-grand-total-view').html( 
                        priceUtils.formatPrice( this.amount_one(), quote.getPriceFormat() )
                    );
                    
                    /** Input do modal do segundo cartão **/
                    $('#' + this.getCode() + '_cc_multiple_val_twoCard').val(
                        priceUtils.formatPrice( 
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    /** Input de edição de cartão **/
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice( 
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#one-card-bottom span').html( priceUtils.formatPrice( (this.amount_one() / installments).toFixed(2), quote.getPriceFormat()) );
                    $('#ticket-grand-total-view').html( priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat()) );
                    $('#ticket-card-bottom').html( priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat()) );
                    
                    if(this.card_two()) {
                        
                        $('#two-card-bottom strong').html( cards[ this.card_two() ].installment + 'x' );
                        if(cards[ this.card_two() ].installment > 1){
                            $('#two-card-bottom span').html( priceUtils.formatPrice( (this.amount_two() / cards[ this.card_two() ].installment ).toFixed(2), quote.getPriceFormat()) );
                        }
                        else {
                            $('#two-card-bottom span').html( priceUtils.formatPrice( this.amount_two(), quote.getPriceFormat() ) );
                        }
                    }
                
                }
                else {
                    var valOne = this.amount_total();
                    
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice( 
                            this.amount_total(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_total(), quote.getPriceFormat() )
                    );
                    
                    if(installments > 1) {
                        $('#one-card-bottom span').html( priceUtils.formatPrice( (this.amount_total() / installments).toFixed(2), quote.getPriceFormat() ) );
                    }
                    else {
                        $('#one-card-bottom span').html( priceUtils.formatPrice( this.amount_total(), quote.getPriceFormat() ) );
                    }
                    
                }
                
                var bandeira = this.setPaymentFlag(ccNumber);
                this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', bandeira, 'info');
                
                
                /********** incluir documento ********/
                if(!customer.isLoggedIn()) {
                    if(imOwer  == true) {
                        taxvat = this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() );
                    }
                    else {
                        taxvat = this.removeMask( $('#' + this.getCode() + '_documento_cardOne').val() );
                    }
                }
                else {
                    if(imOwer  == true) {
                        taxvat = this.removeMask( customer.customerData.taxvat );
                    }
                    else {
                        taxvat = this.removeMask( $('#' + this.getCode() + '_documento_cardOne').val() )
                    }
                }
                
                card['taxvat']              = taxvat;
                cards[cardIndex]            = card;
                
                this.card_one(cardIndex);
                this.cards(cards);
                
                $('#' + this.getCode() + '_one_installments').val( installments );
                $('#one-card-bottom strong').html( installments + 'x' );
                $('#one-middle-number-card').html( fourDigits );
                
                return true;
            },
            saveCardTwoEdit: function(){
                
                $('#two-li-form-payment').removeClass('aqpago-erro');
                $('#two-li-form-payment .li-position-card img').attr('src', this.getCardTwo());
                $('#twocard-button-modal').attr('src', this.getIconEdit());
                $('#two-li-form-payment .text-edit').html('VOCÊ PODE EDITAR O CARTÃO');
                
                var cards               = this.cards();
                var installments        = $('#' + this.getCode() + '_installments_cardTwo').val();
                var ccNumber            = $('#' + this.getCode() + '_cc_number_cardTwo').val().replace(/[^0-9]/g,'');
                var expiration_month    = $('#' + this.getCode() + '_expiration_cardTwo').val();
                var expiration_year     = $('#' + this.getCode() + '_expiration_yr_cardTwo').val();
                var securityCode        = $('#' + this.getCode() + '_cc_cid_cardTwo').val();
                var owerName            = $('#' + this.getCode() + '_cc_owner_cardTwo').val();
                var cardIndex           = ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not_cardTwo').is(":checked")) ? true : false;
                var flag                = this.setPaymentFlag(ccNumber);
                var taxvat              = '';
                var currency            = quote.getPriceFormat().pattern.replace('%s','');
                
                
                var card                    = [];
                card['installment']         = installments;
                card['number']              = ccNumber;
                card['expiration_month']    = expiration_month;
                card['expiration_year']     = expiration_year;
                card['securityCode']        = securityCode;
                card['owerName']            = owerName;
                card['flag']                = flag;
                card['imOwer']              = imOwer;
                
                if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
                    var valTwo  = $('#' + this.getCode() + '_cc_multiple_val_twoCard').val();
                    valTwo      = this.customValValidate(valTwo);
                    var valOne  = quote.totals().grand_total - valTwo;
                    
                    if(valTwo > (this.amount_total() - 1)){
                        alert(
                            $t('O valor não pode ser maior que ') + 
                            priceUtils.formatPrice( 
                                (this.amount_total() - 1), 
                                quote.getPriceFormat()
                            )
                        );
                        return false;
                    }
                    if(valOne < 1){
                        alert(
                            $t('O valor não pode ser menor que ') + 
                            priceUtils.formatPrice( 
                                '1.00', 
                                quote.getPriceFormat()
                            )
                        );
                        return false;
                    }
                    
                    this.amount_one( valOne );
                    this.amount_two( valTwo );
                    this.amount_ticket( valTwo );
                    
                    /** Input do modal do primeiro cartão **/
                    $('#' + this.getCode() + '_cc_multiple_val_oneCard').val(
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice( 
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#' + this.getCode() + '_two_installments').val( installments );
                    $('#two-card-bottom strong').html( installments + 'x' );
                        
                    $('#two-middle-number-card').html( fourDigits );
                    $('#two-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_two(), quote.getPriceFormat() )
                    );
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_one(), quote.getPriceFormat() )
                    );
                    
                    /** Cartão dois **/
                    if(installments > 1) {
                        $('#two-card-bottom span').html( priceUtils.formatPrice( (this.amount_two() / installments).toFixed(2), quote.getPriceFormat()) );
                    }
                    else {
                        $('#two-card-bottom span').html( priceUtils.formatPrice( this.amount_two(), quote.getPriceFormat()) );
                    }
                    
                    $('#one-card-bottom span').html( priceUtils.formatPrice( (this.amount_one() / cards[ this.card_one() ].installment ).toFixed(2), quote.getPriceFormat()) );

                    
                } else {
                    /*
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice( 
                            this.amount_total(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_total(), quote.getPriceFormat() )
                    );
                    
                    $('#one-card-bottom span').html( priceUtils.formatPrice( (this.amount_total() / installments).toFixed(2), quote.getPriceFormat()) );
                    */
                }
                
                var bandeira = this.setPaymentFlag(ccNumber);
                this.setBandeiraInfo('#two-li-form-payment .middle-number-card img', bandeira, 'info');

                
                /********** incluir documento ********/
                if(!customer.isLoggedIn()) {
                    if(imOwer == true) {
                        taxvat = this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() )
                    }
                    else {
                        taxvat = this.removeMask( $('#' + this.getCode() + '_documento_cardTwo').val() );
                    }
                }
                else {
                    if(imOwer == true) {
                        taxvat = this.removeMask( customer.customerData.taxvat );
                    }
                    else {
                        taxvat = this.removeMask( $('#' + this.getCode() + '_documento_cardTwo').val() );
                    }
                }
                
                card['taxvat']              = taxvat;
                cards[cardIndex]            = card;
                
                this.card_two(cardIndex);
                this.cards(cards);
                
                return true;
            },
            
            placeCardTicket: function(){
                
                var cards               = this.cards();
                var installments        = $('#' + this.getCode() + '_installments_oneCard').val();
                var ccNumber            = $('#' + this.getCode() + '_cc_number_cardOne').val().replace(/[^0-9]/g,'');
                var expiration_month    = $('#' + this.getCode() + '_expiration_cardOne').val();
                var expiration_year     = $('#' + this.getCode() + '_expiration_yr_cardOne').val();
                var securityCode        = $('#' + this.getCode() + '_cc_cid_cardOne').val();
                var owerName            = $('#' + this.getCode() + '_cc_owner_cardOne').val();
                var cardIndex           = ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not').is(":checked")) ? true : false;
                var flag                = this.setPaymentFlag(ccNumber);
                var taxvat              = '';
                var currency            = quote.getPriceFormat().pattern.replace('%s','');
                var bandeira            = this.setPaymentFlag(ccNumber);        
                
                var card                    = [];
                card['installment']         = installments;
                card['number']              = ccNumber;
                card['expiration_month']    = expiration_month;
                card['expiration_year']     = expiration_year;
                card['securityCode']        = securityCode;
                card['owerName']            = owerName;
                card['flag']                = flag;
                card['imOwer']              = imOwer;
                
                var valOne              = $('#' + this.getCode() + '_cc_multiple_val').val();
                valOne                  = this.customValValidate(valOne);
                var valTwo              = quote.totals().grand_total - valOne;
                
                this.amount_one( valOne );
                this.amount_two( valTwo );
                this.amount_ticket( valTwo );
                this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', bandeira, 'info');
                
                
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat()) 
                );              
                $('#ticket-card-bottom span').html(
                    priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat()) 
                );
                
                $('.card-box-all').slideUp('100');
                
                /********** incluir documento ********/
                if(!customer.isLoggedIn()) {
                    if(imOwer  == true) {
                        taxvat = this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() );
                    }
                    else {
                        taxvat = this.removeMask( $('#' + this.getCode() + '_documento_cardOne').val() );
                    }
                }
                else {
                    if(imOwer  == true) {
                        taxvat = this.removeMask( customer.customerData.taxvat );
                    }
                    else {
                        taxvat = this.removeMask( $('#' + this.getCode() + '_documento_cardOne').val() )
                    }
                }
                
                card['taxvat']              = taxvat;
                cards[cardIndex]            = card;
                
                this.card_one( cardIndex );
                this.cards( cards );
                
                $('#one-card-bottom strong').html( installments + 'x' );
                $('#one-card-bottom span').html( 
                    priceUtils.formatPrice(
                        (this.amount_one() / installments).toFixed(2), 
                        quote.getPriceFormat()
                    ) 
                );
                
                /** Modal **/
                $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( 
                    priceUtils.formatPrice( 
                        this.amount_one(), quote.getPriceFormat()
                    ).toString().replace(currency, '')
                );
                $('#' + this.getCode() + '_cc_number_cardOne').val( card['number'] );
                $('#' + this.getCode() + '_cc_owner_cardOne').val( card['owerName'] );
                $('#' + this.getCode() + '_expiration_cardOne').val( card['expiration_month'] );
                $('#' + this.getCode() + '_expiration_yr_cardOne').val( card['expiration_year'] );
                $('#' + this.getCode() + '_cc_cid_cardOne').val( card['securityCode'] );
                $('#' + this.getCode() + '_documento_cardOne').val( card['taxvat'] );
                $('#' + this.getCode() + '_installments_oneCard').val( installments );
                $('#not_cardOne').prop('checked', imOwer);
                if(imOwer) {
                    $('.documento-one-cardOne').slideUp('100');
                } else {
                    $('.documento-one-cardOne').slideDown('100');
                }
                /***********/
                
                $('#one-middle-number-card').html( fourDigits );
                $('#one-grand-total-view').html( 
                    priceUtils.formatPrice( 
                        this.amount_one(), 
                        quote.getPriceFormat() 
                    ) 
                );
                
                $('#multi-actions').hide();
                $('#one-payment-right-empty').hide();
                $('#img-flag-card').hide();
                $('#multi-actions-two').show();
                $('#one-payment-right-full').show();
                $('#one-li-form-payment').slideDown();
                
                /************/
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                /************/
                
                setTimeout(function(){ 
                    
                    $('#three-li-form-payment').slideDown('100');
                    $('#button-finished').slideDown('100');
                }, 500);
                
                return true;
            },
            capitalizeFirstLetter: function(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            },
            setCardData: function(position, vl = false){
                var cards               = this.cards();
                
                var installments        = $('#' + this.getCode() + '_installments').val();
                var ccNumber            = $('#' + this.getCode() + '_cc_number').val().replace(/[^0-9]/g,'');
                var expiration_month    = $('#' + this.getCode() + '_expiration').val();
                var expiration_year     = $('#' + this.getCode() + '_expiration_yr').val();
                var securityCode        = $('#' + this.getCode() + '_cc_cid').val();
                var owerName            = $('#' + this.getCode() + '_cc_owner').val();
                var cardIndex           = ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not').is(":checked")) ? true : false;
                var flag                = this.setPaymentFlag(ccNumber);
                var taxvat              = '';
                var currency            = quote.getPriceFormat().pattern.replace('%s','');
                
                if (ccNumber == '' && !this.card_saved()){
                    return false;
                }

                if (!customer.isLoggedIn()) {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        taxvat = this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() );
                    }
                    else {
                        taxvat = this.removeMask(  $('input[name="payment[cc_documento]"]').val() );
                    }
                }
                else {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        taxvat = this.removeMask( customer.customerData.taxvat );
                    }
                    else {
                        taxvat = this.removeMask( $('input[name="payment[cc_documento]"]').val() )
                    }
                }
                
                /** Cartão Salvo **/
                if(this.card_saved()){
                    
                    cardIndex = this.card_saved();
                    
                    var card                    = [];
                    card                        = cards[cardIndex];
                    card['card_id']             = cards[cardIndex].card_id;
                    card['installment']         = installments;
                    card['number']              = cards[cardIndex].number;
                    card['expiration_month']    = null;
                    card['expiration_year']     = null;
                    card['securityCode']        = securityCode;
                    card['owerName']            = null;
                    card['flag']                = cards[cardIndex].flag;
                    card['taxvat']              = taxvat;
                    card['imOwer']              = null;
                    card['saved']               = true;
                    cards[cardIndex]            = card;
                    flag                        = cards[cardIndex].flag;
                    
                    if(position == 'one'){
                        this.saved_card_one( card['card_id'] );
                    }
                    if(position == 'two'){
                        this.saved_card_two( card['card_id'] );
                    }
                    
                }
                else {
                    var card                    = [];
                    card['installment']         = installments;
                    card['number']              = ccNumber;
                    card['expiration_month']    = expiration_month;
                    card['expiration_year']     = expiration_year;
                    card['securityCode']        = securityCode;
                    card['owerName']            = owerName;
                    card['flag']                = flag;
                    card['taxvat']              = taxvat;
                    card['imOwer']              = imOwer;
                    card['saved']               = false;
                    cards[cardIndex]            = card;
                    
                }
                
                this.cards(cards);
                this.setBandeiraInfo('#' + position + '-li-form-payment .middle-number-card img', flag, 'info');
                
                if($('.address-line-one').length) {
                    $('.address-cep').html( quote.shippingAddress().postcode );
                    $('.address-line-one').html(
                        '<span>' + quote.shippingAddress().street[0] + '</span>'
                        + '<span>, ' + quote.shippingAddress().street[1] + '</span>'
                        + '<span> ' + quote.shippingAddress().street[2] + '</span>'
                        + '<span> - ' + quote.shippingAddress().street[3] + '</span>'
                        + '<span>, ' + quote.shippingAddress().city + '</span>'
                        + '<span> / ' + quote.shippingAddress().regionCode + '</span>'
                    );      
                }
                
                $('.card-box-all').slideUp('100');                  
                $('#not_card' + this.capitalizeFirstLetter(position)).prop('checked', imOwer);
                if(imOwer) {
                    $('.documento-' + position + '-card' + this.capitalizeFirstLetter(position)).slideUp('100');
                } else {
                    $('.documento-' + position + '-card'  + this.capitalizeFirstLetter(position)).slideDown('100');
                }
                
                /** Alterar quando for one e two valor **/
                var amountOption = this.amount_total();
                
                /** Multi Crédito primeiro cartão **/
                if(this.type_payment() == 'credit' && position == 'one') {
                    this.card_one(cardIndex);
                    amountOption = this.amount_total();
                    
                    $('#' + this.getCode() + '_cc_number').val('').change();
                    $('#' + this.getCode() + '_cc_owner').val('').change();
                    $('#' + this.getCode() + '_expiration').val('').change();
                    $('#' + this.getCode() + '_expiration_yr').val('').change();
                    $('#' + this.getCode() + '_cc_cid').val('').change();
                    $('#' + this.getCode() + '_installments').val('1').change();
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice(
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    $('#' + this.getCode() + '_one_installments').val( installments );
                }
                /** Multi Crédito primeiro cartão **/
                if(this.type_payment() == 'credit_multiple' && position == 'one') {
                    var valOne  = $('#' + this.getCode() + '_cc_multiple_val').val();
                    valOne      = this.customValValidate(valOne);
                    var valTwo  = quote.totals().grand_total - valOne;
                    
                    /** Salva valores um e dois, cartão um ok **/
                    this.amount_one(valOne);
                    this.amount_two(valTwo);
                    this.amount_ticket(valTwo);
                    this.card_one(cardIndex);
                    amountOption = this.amount_one();
                    
                    $('#' + this.getCode() + '_cc_number').val('').change();
                    $('#' + this.getCode() + '_cc_owner').val('').change();
                    $('#' + this.getCode() + '_expiration').val('').change();
                    $('#' + this.getCode() + '_expiration_yr').val('').change();
                    $('#' + this.getCode() + '_cc_cid').val('').change();
                    $('#' + this.getCode() + '_installments').val('1').change();
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice(
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    $('#' + this.getCode() + '_one_installments').val( installments );
                    $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( 
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '') 
                    );
                    
                    
                    
                    if(this.card_two()) {
                        $('#' + this.getCode() + '_cc_multiple_val_twoCard').val(
                            priceUtils.formatPrice( 
                                this.amount_two(), 
                                quote.getPriceFormat()
                            ).toString().replace(currency, '') 
                        );
                        $('#two-card-bottom strong').html( cards[ this.card_two() ].installment + 'x' );
                        $('#two-card-bottom span').html( 
                            priceUtils.formatPrice( 
                                (this.amount_two() / cards[ this.card_two() ].installment).toFixed(2), 
                                quote.getPriceFormat()
                            ) 
                        );
                    }
                }
                /** Multi Crédito segundo cartão **/
                if(this.type_payment() == 'credit_multiple' && position == 'two') {
                    var valTwo  = $('#' + this.getCode() + '_cc_multiple_val').val();
                    valTwo      = this.customValValidate(valTwo);
                    var valOne  = quote.totals().grand_total - valTwo;
                    
                    /** Salva valores um e dois, cartão dois ok **/
                    this.amount_one(valOne);
                    this.amount_two(valTwo);
                    this.amount_ticket(valTwo);
                    this.card_two(cardIndex);
                    amountOption = this.amount_two();
                    
                    $('#' + this.getCode() + '_two_installments').val( installments );
                    $('#' + this.getCode() + '_cc_multiple_val_twoCard').val( 
                        priceUtils.formatPrice( 
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '') 
                    );
                    
                    $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( 
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '') 
                    );
                    $('#one-card-bottom strong').html( cards[ this.card_one() ].installment + 'x' );
                    $('#one-card-bottom span').html( 
                        priceUtils.formatPrice( 
                            (this.amount_one() / cards[ this.card_one() ].installment ).toFixed(2), 
                            quote.getPriceFormat()
                        ) 
                    );
                }
                /** Multi Crédito primeiro cartão **/
                if(this.type_payment() == 'ticket_multiple' && position == 'one') {
                    var valOne  = $('#' + this.getCode() + '_cc_multiple_val').val();
                    valOne      = this.customValValidate(valOne);
                    var valTwo  = quote.totals().grand_total - valOne;
                    
                    if(valTwo < 10) {
                        var totalVal = quote.totals().grand_total;
                        valTwo = 10.00;
                        valOne = Math.round( totalVal - valTwo );
                        messageList.addErrorMessage({ message: $t( 'Boleto não pode ser menor que R$ 10,00.' ) });
                    }
                    
                    /** Salva valores um e dois, cartão um ok **/
                    this.amount_one(valOne);
                    this.amount_two(valTwo);
                    this.amount_ticket(valTwo);
                    this.card_one(cardIndex);
                    amountOption = this.amount_one();
                    
                    $('#' + this.getCode() + '_cc_number').val('').change();
                    $('#' + this.getCode() + '_cc_owner').val('').change();
                    $('#' + this.getCode() + '_expiration').val('').change();
                    $('#' + this.getCode() + '_expiration_yr').val('').change();
                    $('#' + this.getCode() + '_cc_cid').val('').change();
                    $('#' + this.getCode() + '_installments').val('1').change();
                    $('#' + this.getCode() + '_cc_multiple_val').val(
                        priceUtils.formatPrice(
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    $('#' + this.getCode() + '_one_installments').val( installments );
                    $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( 
                        priceUtils.formatPrice(
                            this.amount_one(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '') 
                    );
                    $('#one-card-bottom strong').html( cards[ this.card_one() ].installment + 'x' );
                    $('#one-card-bottom span').html( 
                        priceUtils.formatPrice( 
                            (this.amount_one() / cards[ this.card_one() ].installment ).toFixed(2), 
                            quote.getPriceFormat()
                        ) 
                    );
                    
                    $('#three-card-bottom strong').html( '1x' );
                    $('#three-card-bottom span').html( 
                        priceUtils.formatPrice( 
                            this.amount_ticket(), 
                            quote.getPriceFormat()
                        ) 
                    );
                }
                
                /** Modal one Card **/
                $('#' + this.getCode() + '_cc_multiple_val_' + position + 'Card').val( 
                    priceUtils.formatPrice( 
                        amountOption, 
                        quote.getPriceFormat()
                    ).toString().replace(currency, '') 
                );
                
                /** Não é cartão salvo **/
                if(!this.card_saved()) $('#' + this.getCode() + '_cc_number_card' + this.capitalizeFirstLetter(position)).val( card['number'].replace(/\s+/g, '') );
                $('#' + this.getCode() + '_cc_owner_card' + this.capitalizeFirstLetter(position)).val( card['owerName'] );
                $('#' + this.getCode() + '_expiration_card' + this.capitalizeFirstLetter(position)).val( card['expiration_month'] );
                $('#' + this.getCode() + '_expiration_yr_card' + this.capitalizeFirstLetter(position)).val( card['expiration_year'] );
                $('#' + this.getCode() + '_cc_cid_card' + this.capitalizeFirstLetter(position)).val( card['securityCode'] );
                $('#' + this.getCode() + '_documento_card' + this.capitalizeFirstLetter(position)).val( card['taxvat'] );
                $('#' + this.getCode() + '_installments_' + position + 'Card').val( card['installment'] );
                /***********/
                
                $('#' + position + '-card-bottom strong').html( installments + 'x' );
                $('#' + position + '-card-bottom span').html( 
                    priceUtils.formatPrice( 
                        (amountOption / installments).toFixed(2), 
                        quote.getPriceFormat()
                    ) 
                );              
                $('#ticket-card-bottom strong').html( '1x' );
                $('#ticket-card-bottom span').html( 
                    priceUtils.formatPrice( 
                        this.amount_ticket(), 
                        quote.getPriceFormat()
                    ) 
                );
                
                $('#' + position + '-middle-number-card').html( fourDigits );
                $('#' + position + '-grand-total-view').html( 
                    priceUtils.formatPrice( 
                        amountOption, 
                        quote.getPriceFormat() 
                    ) 
                );
                
                
                if(this.card_saved()){
                    if(position == 'one'){
                        
                        $('#one-middle-number-card').html( cardIndex.substr(-4, 4) );
                        
                        if(this.type_payment() == 'ticket_multiple') {
                            $('#list-new').slideUp('100');
                            $('.box-select-card-li').slideUp('100');
                            $('.box-select-card').slideDown('100');
                            $('#list-' + cardIndex).slideDown('100');
                        }
                    }
                    if(position == 'two'){
                        $('.box-select-card-title').slideUp('100');
                        $('.box-select-card').slideUp('100');
                        
                        $('#two-middle-number-card').html( cardIndex.substr(-4, 4) );
                    }
                }
                
                if(this.type_payment() == 'credit'){
                    /** salva cartão **/
                    this.card_one(cardIndex);
                    this.showPayCard();
                }
                else if(this.type_payment() == 'credit_multiple' && position == 'one'){
                    $('#' + this.getCode() + '_installments_cardTwo').val(1).change();
                    this.showPayOneCard();
                }
                else if(this.type_payment() == 'credit_multiple' && position == 'two'){
                    this.showPayTwoCard();
                }
                else if(this.type_payment() == 'ticket_multiple' && position == 'one') {
                    this.card_one(cardIndex);
                    this.showPayTicketMulti();
                }
                
                /** Abrir e fechar campos do modal **/
                if(this.type_payment() == 'credit' || this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple'){
                    /** Cartão um salvo selecionado **/
                    if(this.saved_card_one()){
                        $('.aqban-modal-one-card .field-name-lastname, .aqban-modal-one-card .valid_month_checkout, .aqban-modal-one-card .field-name-name_card, .aqban-modal-one-card .field-not, .aqban-modal-one-card .field-name-documento, .aqban-modal-one-card').slideUp();
                    }
                    else {
                        $('.aqban-modal-one-card .field-name-lastname, .aqban-modal-one-card .valid_month_checkout, .aqban-modal-one-card .field-name-name_card, .aqban-modal-one-card .field-not, .aqban-modal-one-card .field-name-documento, .aqban-modal-one-card').slideDown();
                    }
                    /** Cartão dois salvo selecionado **/
                    if(this.saved_card_two()){
                        $('.aqban-modal-two-card .field-name-lastname, .aqban-modal-two-card .valid_month_checkout, .aqban-modal-two-card .field-name-name_card, .aqban-modal-two-card .field-not, .aqban-modal-two-card .field-name-documento, .aqban-modal-one-card').slideUp();
                    }
                    else {
                        $('.aqban-modal-two-card .field-name-lastname, .aqban-modal-two-card .valid_month_checkout, .aqban-modal-two-card .field-name-name_card, .aqban-modal-two-card .field-not, .aqban-modal-two-card .field-name-documento, .aqban-modal-one-card').slideDown();
                    }
                }
                
            },
            
            showPayTicketMulti: function(){
                var self = this;
                var cards = this.cards();
                var currency = quote.getPriceFormat().pattern.replace('%s','');
                
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat()) 
                );              
                $('#ticket-card-bottom span').html(
                    priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat()) 
                );
                
                $('.card-box-all').slideUp('100');
                
                $('#' + this.getCode() + '_one_installments').val( cards[this.card_one()].installment );
                $('#one-card-bottom strong').html( cards[this.card_one()].installment + 'x' );
                $('#one-card-bottom span').html( priceUtils.formatPrice( (this.amount_one() / cards[this.card_one()].installment).toFixed(2), quote.getPriceFormat()) );
                
                /** Modal **/
                $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( priceUtils.formatPrice( this.amount_one(), quote.getPriceFormat()).toString().replace(currency, '') );
                $('#' + this.getCode() + '_cc_number_cardOne').val( cards[this.card_one()].number );
                $('#' + this.getCode() + '_cc_owner_cardOne').val( cards[this.card_one()].owerName );
                $('#' + this.getCode() + '_expiration_cardOne').val( cards[this.card_one()].expiration_month );
                $('#' + this.getCode() + '_expiration_yr_cardOne').val( cards[this.card_one()].expiration_year );
                $('#' + this.getCode() + '_cc_cid_cardOne').val( cards[this.card_one()].securityCode );
                $('#' + this.getCode() + '_documento_cardOne').val( cards[this.card_one()].taxvat );
                $('#' + this.getCode() + '_installments_oneCard').val( cards[ this.card_one() ].installment ).change();
                /***********/
                
                $('#one-middle-number-card').html( cards[this.card_one()].number.substr(-4, 4) );
                $('#one-grand-total-view').html( priceUtils.formatPrice( this.amount_one(), quote.getPriceFormat() ) );
                
                $('#multi-actions').hide();
                $('#one-payment-right-empty').hide();
                $('#img-flag-card').hide();
                $('#multi-actions-two').show();
                $('#one-payment-right-full').show();
                $('#one-li-form-payment').slideDown();
                
                /************/
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                /************/
                
                $('.aqbank_custom_informations').slideDown();
                
                setTimeout(function(){ 
                    
                    $('#three-li-form-payment').slideDown('100');
                    $('#button-finished').slideDown('100');
                    
                }, 500);
            },
            
            showPayTwoCard: function(){
                var self = this;
                var cards = this.cards();
                
                /********** Multiple Ticket ********/
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( 
                        this.amount_ticket(), 
                        quote.getPriceFormat()
                    )
                );
                $('#ticket-card-bottom span').html(
                    priceUtils.formatPrice( 
                        this.amount_ticket(), 
                        quote.getPriceFormat()
                    )
                );
                /***********************************/
                
                $('.card-box-all').slideUp('100');
                
                $('#multi-actions').hide();
                $('#two-payment-right-empty').hide();
                $('#img-flag-card').hide();
                
                $('#multi-actions-two').show();
                $('#two-payment-right-full').show();
                
                $('#one-li-form-payment').slideDown('100');
                $('#two-li-form-payment').slideDown('100');
                $('#button-finished').slideDown('100');
                
                /************/
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                /************/
                
                var HtmlCardOne = "";
                HtmlCardOne = "<div id='list-" + this.card_one() + "' class='box-select-card-li box-select-card-one one-li-form-payment'>"
                                    + "<div class='box-select-card-float box-select-card-li-flag'>"
                                    + $('#one-li-form-payment .li-flag-card .middle-number-card').html()
                                    + "</div>"
                                    + "<div class='box-select-card-float box-select-card-li-number'>"
                                    + cards[ this.card_one() ].number.substr(0, 4) + " XXXX XXXX " + cards[ this.card_one() ].number.substr(-4, 4)
                                    + "</div>"
                                    + "<div class='box-select-card-float box-select-card-li-arrow'>"
                                    + "<span>" + $t('EDITAR') + "</span>"
                                    + "<div>" + this.getArrowRight() + "</div>"
                                    + "</div>"
                                + "</div>";
                
                var HtmlCardTwo = "";
                HtmlCardTwo = "<div id='list-" + this.card_two() + "' class='box-select-card-li box-select-card-two two-li-form-payment'>"
                                + "<div class='box-select-card-float box-select-card-li-flag'>"
                                + $('#two-li-form-payment .li-flag-card .middle-number-card').html()
                                + "</div>"
                                + "<div class='box-select-card-float box-select-card-li-number'>"
                                + cards[ this.card_two() ].number.substr(0, 4) + " XXXX XXXX " + cards[ this.card_two() ].number.substr(-4, 4)
                                + "</div>"
                                + "<div class='box-select-card-float box-select-card-li-arrow'>"
                                + "<span>" + $t('EDITAR') + "</span>"
                                + "<div>" + this.getArrowRight() + "</div>"
                                + "</div>"
                            + "</div>";
                
                
                var oneCard = this.card_one();
                var twoCard = this.card_two();
                /*** Select card one *****/
                $('.box-select-card').prepend( HtmlCardOne );
                /** load Click function **/
                $('#list-' + oneCard ).on('click', function() {
                    self.card_saved(false);
                    return self.setCardId( oneCard );
                });
                /*** Select card one *****/
                
                /*** Select card two *****/
                $('.box-select-card').prepend( HtmlCardTwo );
                /** load Click function **/
                $('#list-' + twoCard ).on('click', function() {
                    self.card_saved(false);
                    return self.setCardId( twoCard );
                });
                /*** Select card two *****/
                
            },
            
            showPayOneCard: function(){
                /********** Multiple Ticket Values ********/
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( 
                        this.amount_ticket(), 
                        quote.getPriceFormat()
                    )
                );
                $('#ticket-card-bottom span').html(
                    priceUtils.formatPrice( 
                        this.amount_ticket(), 
                        quote.getPriceFormat()
                    )
                );
                /***********************************/
                
                $('.card-box-all').slideUp('100');
                
                $('#multi-actions').hide();
                $('#one-payment-right-empty').hide();
                $('#img-flag-card').hide();
                $('#multi-actions-two').show();
                $('#one-payment-right-full').show();
                $('#one-li-form-payment').slideDown();
                
                /************/
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                /************/
                
                if(this.show_saved_card() && this.card_one() && !this.card_two()){
                    $('#one-li-form-payment').slideUp();
                    
                    $('.box-select-card-li-arrow').removeClass('active-new');
                    $('.box-select-card-li-arrow span').slideUp();
                    
                    $('#one-li-form-payment').slideUp(1);
                    $('.card-box-all').slideUp(1);
                    
                    if(this.totalSavedCards() == 1) {
                        this.card_saved();
                        this.setNewCard();
                        
                        return false;
                    }
                    else {
                        $('.card_cvv_img').slideDown('100');
                        $('.box-select-card-li').slideDown('100');
                        $('.box-select-card').slideDown('100');
                        $('.box-select-card-title').slideDown('100');
                        $('#list-' + this.card_one() ).slideUp();
                        $('#list-new').slideDown('100');
                    }
                }
                else {
                
                    setTimeout(function(){ 
                        $('.card-box-all').slideDown('100');
                    }, 500);
                }
            },
            
            showPayCard: function(){
                $('#multi-actions').hide();
                $('#one-payment-right-empty').hide();
                $('#img-flag-card').hide();
                
                $('#multi-actions-two').show();
                $('#one-payment-right-full').show();
                $('.aqbank_payment_integral').show();
                
                $('#one-li-form-payment').slideDown('100');
                $('#button-finished').slideDown('100');
                
                /************/
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                /************/
            },
            setPaymentMethod: function(method){
                
                if(method == 'ticket_multiple' || method == 'ticket') {
                    if(quote.totals().grand_total < 10 && method == 'ticket') {
                        this.use_two_cards(false);
                        
                        $('.credit').slideDown('100');
                        $('.ticket').slideDown('100');
                        $('.credit_multiple').slideDown('100');
                        $('.ticket_multiple').slideDown('100');
                        
                        $('.change-text').html('');
                        
                        this.type_payment( '' );
                        
                        return false
                    }
                    if(quote.totals().grand_total < 11 && method == 'ticket_multiple') {
                        this.use_two_cards(false);
                        
                        $('.credit').slideDown('100');
                        $('.ticket').slideDown('100');
                        $('.credit_multiple').slideDown('100');
                        $('.ticket_multiple').slideDown('100');
                
                        $('.change-text').html('');
                        
                        this.type_payment( '' );
                    
                        return false
                    }                   
                }
                
                if($('.aqbank_type_payment .ticket-info-tool').length){
                    $('.aqbank_type_payment .ticket-info-tool').hide();
                }
                
                this.amount_total(quote.totals().grand_total);
                
                if(this.amount_one() == ''){
                    this.amount_one(quote.totals().grand_total / 2);
                }
                if(this.amount_two() == ''){
                    this.amount_two(quote.totals().grand_total / 2);
                }
                if(this.amount_ticket() == ''){
                    this.amount_ticket(quote.totals().grand_total / 2);
                }
                
                $('.fieldset.aqbank-checkout').slideDown();
                $('.field-name-lastname, .valid_month_checkout, .field-name-name_card, .field-not, .field-name-documento').slideDown();
                
                $('.box-select-card').slideUp();
                $('.box-select-card-li').slideUp();
                
                /** verifica se o input de documento aparece **/
                if(!customer.isLoggedIn()) {
                    var VatId = this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() );
                    if(VatId.length == 11) {
                        $('.field-not').show();
                    }
                    else {
                        $('.field-not').hide();
                    }
                    
                }
                else {
                    var VatId = this.removeMask( customer.customerData.taxvat );
                    if(VatId.length == 11) {
                        $('.field-not').show();
                    }
                    else {
                        $('.field-not').hide();
                    }
                    
                }
                
                if($('.active-arrow').length && this.type_payment() != '') {
                    this.use_two_cards(false);
                    
                    $('.aqbank_type_payment_li .change-text').html();
                    
                    $('.'+method).removeClass('no-border');
                    $('.aqbank-arrow-right').removeClass('active-arrow');
                    $('.aqbank_type_payment').removeClass('aqbank_payment_active');
                    $('.ticket').addClass('no-border');
                    
                    $('.credit').slideDown('100');
                    $('.ticket').slideDown('100');
                    $('.credit_multiple').slideDown('100');
                    $('.ticket_multiple').slideDown('100');
                    
                    $('#aqbank-valor-intergal').hide(); 
                    $('#aqbank-multi-pagamento-valor').hide();
                    
                    if(method == 'credit'){
                        $('.card_one').slideUp('100'); 
                    }                   
                    if(method == 'ticket'){
                        $('.aqpago-box-boleto-checkout .actions-toolbar').slideUp();
                        $('.aqpago-box-boleto-checkout .button-finished').slideUp();
                        $('.aqbank_payment_boleto').slideUp('100'); 
                    }                   
                    if(method == 'credit_multiple'){
                        $('.aqbank_payment_integral').slideUp('100'); 
                        $('.card_one').slideUp('100'); 
                    }
                    if(method == 'ticket_multiple'){
                        $('.aqbank_payment_integral').slideUp('100'); 
                        $('.card_one').slideUp('100'); 
                    }
                    
                    if(this.add_card()){
                        $('#list-new').slideUp();
                    }
                
                    $('.change-text').html('');
                    
                    this.type_payment( '' );
                    
                    return false;
                }
                
                this.type_payment( method );
                
                $('#one-action').hide();
                $('#multi-actions').hide();
                $('.aqbank-infos').hide();
                
                $('#aqbank-valor-intergal').show();
                $('#aqbank-multi-pagamento-valor').show();
                
                $('.aqbank-payment-description').slideUp('100');
                $('.li-form-payment').slideUp();
                $('.payment-method-aqbank .actions-toolbar').slideUp();
                $('.box-select-card-title').slideUp();
                
                if(method != 'credit') $('.credit').slideUp('100');
                if(method != 'ticket') $('.ticket').slideUp('100');
                if(method != 'credit_multiple') $('.credit_multiple').slideUp('100');
                if(method != 'ticket_multiple') $('.ticket_multiple').slideUp('100');
                
                $('.aqbank_type_payment').addClass('aqbank_payment_active');
                $('.aqbank-arrow-right').addClass('active-arrow');
                $('.' + method).addClass('no-border');
                
                $('.aqbank_type_payment_li .change-text').html('ALTERAR');
                $('.aqbank_custom_informations').slideDown(); 
                
                if(this.add_card()){
                    $('#list-new').slideDown('100');
                }
                
                if(method == 'credit'){
                    this.setCreditMethod();
                }
                else if(method == 'credit_multiple'){
                    this.setCreditMultipleMethod();
                }
                else if(method == 'ticket_multiple'){
                    this.setTicketMultipleMethod();
                }               
                else if(method == 'ticket'){
                    this.setTicketMethod();
                }
                

            },
            
            setTicketMethod: function(){
                this.use_two_cards(false);
                
                $('.box-select-card').hide();
                $('.box-select-card-li').hide();
                $('.aqbank-add-new-card').hide();
                
                typePayment = this.type_payment();
                
                $('#one-action').hide();
                $('#multi-actions').hide();
                $('#aqbank-valor-intergal').show();
                $('#aqbank-multi-pagamento-valor').show();
                
                $('.aqbank_custom_informations').slideDown(); 
                
                    
                    
                    $('#multi-actions-one-ticket').hide();
                    $('.payment-method-content-cc').hide();
                    $('.payment-method-content-pix').hide();
                    $('.payment-method-content-ticket').show();
                    $('.aqbank-infos').show();
                    
                    if($('input[name="' + this.getPhoneInput() + '"]').length) {
                        $('.phone-text').html( $('input[name="' + this.getPhoneInput() + '"]').val() ); 
                    }
                    if($('.form-login input[name="username"]').length) {
                        $('.email-text').html( $('.form-login input[name="username"]').val() );
                    }
                    
                    
                    if(customer.isLoggedIn()) {
                        if(this.getPhoneInput() == 'telephone') {
                            $('.phone-text').html( quote.shippingAddress().telephone );
                        }
                        else {
                            $('.phone-text').html( quote.shippingAddress().this.getPhoneInput() );
                        }
                        $('.email-text').html( customer.customerData.email );
                    }
                    
                    $('.aqpago-box-boleto-checkout .actions-toolbar').slideDown();
                    $('.aqpago-box-boleto-checkout .button-finished').slideDown();
                    
                    setTimeout(function(){ 
                        $('.aqbank_payment_boleto').slideDown('100'); 
                    }, 500);
            },
            
            setTicketMultipleMethod: function(){
                this.use_two_cards(false);
                var cards = this.cards();
                var currency = quote.getPriceFormat().pattern.replace('%s','');
                
                $('.modal-credit-amount').hide();
                $('.payment-method-content-ticket').hide();
                $('.payment-method-content-pix').hide();
                
                $('.payment-method-content-cc').show();
                $('.modal-edit-amount').show();
                $('.modal-edit-amount').show();
                $('#multi-actions-one-ticket').show();
                $('#aqbank-valor-intergal').hide();
                
                if(this.amount_ticket()) {
                    
                    $('#' + this.getCode() + '_cc_multiple_val_twoCard').val(
                        priceUtils.formatPrice( 
                            this.amount_ticket(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    $('#' + this.getCode() + '_cc_multiple_val_twoCard').val(
                        priceUtils.formatPrice( 
                            this.amount_ticket(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#ticket-grand-total-view').html(
                        priceUtils.formatPrice(this.amount_ticket(), quote.getPriceFormat())
                    );
                    $('#ticket-card-bottom span').html(
                        priceUtils.formatPrice(
                            this.amount_ticket(), 
                            quote.getPriceFormat()
                        )
                    );
                } 
                
                if(this.card_one()) {
                    $('.aqbank_custom_informations').slideDown('100');
                    
                    $('.card-box-all').hide();
                    $('#ticket-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat())
                    );
                    
                    $('#ticket-card-bottom').html(
                        priceUtils.formatPrice( this.amount_ticket(), quote.getPriceFormat())
                    );
                    
                    $('.box-select-card').slideDown();
                    $('#three-li-form-payment').slideDown('100');
                    
                    var oneValue = this.amount_one();
                    
                    $('#' + this.getCode() + '_cc_multiple_val_oneCard').val(
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice(this.amount_one(), quote.getPriceFormat())
                    );
                    $('#ticket-card-bottom span').html(
                        priceUtils.formatPrice( 
                            (this.amount_one() / cards[ this.card_one() ].installment ), 
                            quote.getPriceFormat()
                        )
                    );                      
                    
                    $('#' + this.getCode() + '_cc_multiple_val_twoCard').val(
                        priceUtils.formatPrice( 
                            this.amount_ticket(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '')
                    );
                    
                    $('#ticket-grand-total-view').html(
                        priceUtils.formatPrice(this.amount_ticket(), quote.getPriceFormat())
                    );
                    $('#ticket-card-bottom span').html(
                        priceUtils.formatPrice(
                            this.amount_ticket(), 
                            quote.getPriceFormat()
                        )
                    );
                    $('#one-li-form-payment').slideDown('100');
                    $('.box-select-card').slideDown('100');
                    $('#button-finished').slideDown('100');
                    
                    $('#two-li-form-payment').hide();
                    $('#three-li-form-payment').slideDown();
                }
                else {
                    $('#button-finished').slideUp(1);
                    $('.aqbank_custom_informations').slideUp(1);
                    
                    
                    /** existe cartão salvo **/
                    if(this.savedCards() != 'false'){
                        
                        $('.card-box-all').hide();
                        $('.box-select-card-title').show();
                        $('.box-select-card').show();
                        $('.box-select-card-li').show();
                        
                    }
                }
                
                
                /** só digitou o primeiro cartão **/
                if(this.card_one() && !this.card_two()){
                    $('.box-select-card').slideDown();
                    $('#three-li-form-payment').slideDown('100');
                }
                
                /** dois cartões digitados **/
                if(this.card_one() && this.card_two()) {
                    /** cartão já foi selecionado **/
                    if(this.select_card()) {
                        
                        /******* select com dois cartões ********/
                        $('#one-li-form-payment').slideUp(1);
                        $('.box-select-card-li').slideUp(1);
                        $('.box-select-card-title').slideUp(1);
                        $('#button-finished').hide();
                        
                        $('.box-select-card').slideDown('100');
                        /***************/

                        $('#list-' + this.select_card() ).slideDown('100');
                        $('#one-li-form-payment').slideDown('100');
                        $('#button-finished').slideDown('100');
                        
                    }
                    else {
                        /** cartão ainda não selecionado **/
                        $('#one-li-form-payment').slideUp(1);
                        $('#two-li-form-payment').slideUp(1);
                        $('#button-finished').slideUp(1);
                        
                        $('#ticket-li-form-payment').slideDown('100');
                        $('.box-select-card').slideDown('100');
                        $('.box-select-card-title').slideDown('100');
                        $('.box-select-card-li').slideDown('100');
                        /**********/
                    }
                }
                
                
                /** existe 1 cartão aprovado **/
                if(this.card_one_erro() || this.card_two_erro()){
                    $('.box-select-card-title').slideUp();
                    $('.box-select-card-custom').slideUp();
                    
                    $('.aqbank_custom_informations').slideDown('100');
                    
                    //card-view-address
                    if(!this.card_one_erro()){

                        $('#one-li-form-payment').slideDown();
                        $('#button-finished').slideDown();
                    }
                    
                    if(!this.card_two_erro()){
                        $('#two-li-form-payment').slideDown();
                        $('#button-finished').slideDown();
                    }                       
                }


                /** Cartão salvo selecionado **/
                if(this.saved_card_one() || this.select_card()) {
                    
                    /** Não digitou o código de segurança **/
                    if(!cards[ this.card_one() ].securityCode) {
                        
                        this.select_card(false);
                        this.card_one(false);
                    
                        $('.box-select-card-li-arrow').removeClass('active-new');
                        $('.box-select-card-li-arrow span').slideUp();
                        
                        $('.aqbank_custom_informations').slideUp();
                        $('.aqbank_payment_integral').slideUp();
                        $('.li-form-payment').slideUp();
                        $('#button-finished').slideUp();
                        
                        $('#multi-actions-one-ticket').slideDown('100');
                        $('#list-new').slideDown('100');
                        $('.box-select-card-title').slideDown('100');
                        $('.box-select-card').slideDown('100');
                        $('.box-select-card-li').slideDown('100');
                        
                    }
                    else {
                        
                    }
                }
                
                setTimeout(function(){ 
                    $('.aqbank_payment_integral').slideDown('100'); 
                    $('.card_one').slideDown('100'); 
                }, 500);
            },
            
            setCreditMultipleMethod: function(){
                this.use_two_cards(true);
                var cards = this.cards();
                var currency = quote.getPriceFormat().pattern.replace('%s','');
                
                $('#three-li-form-payment').slideUp(1);
                $('#multi-actions-one-ticket').hide();
                $('.modal-credit-amount').hide();
                $('.modal-edit-amount').show();
                
                $('.payment-method-content-ticket').hide();
                $('.payment-method-content-pix').hide();
                $('.payment-method-content-cc').show();
                
                /** Não digitou ou escolheu os dois cartões **/
                if(!this.card_two()) {
                    $('#multi-actions').hide();
                    $('#button-finished').hide();
                    $('.card-box-all').slideDown('100');
                } 

                /** primeiro cartão negativo **/
                if(!this.card_one()) {
                    $('#multi-actions').slideDown();
                }
                
                /** primeiro cartão ok **/
                if(this.card_one()) {
                    $('#' + this.getCode() + '_cc_multiple_val_oneCard').val(
                        priceUtils.formatPrice( 
                            this.amount_one(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '') 
                    );
                    
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_one(), quote.getPriceFormat() )
                    );
                    
                    $('#one-card-bottom span').html(
                        priceUtils.formatPrice(
                            ( this.amount_one() / cards[this.card_one()].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    $('#one-li-form-payment').slideDown();
                }
                else {
                    
                    if(!this.card_two()) {
                        
                        /** existe cartão salvo **/
                        if(this.savedCards() != 'false'){
                            
                            $('.one-li-form-payment').slideUp();
                            $('.card-box-all').hide();
                            $('.box-select-card-title').show();
                            $('.box-select-card').show();
                            $('.box-select-card-li').show();
                            
                        }
                        
                    }                   
                    
                }
                
                /** segundo cartão ok **/
                if(this.card_two()) {
                    $('#' + this.getCode() + '_cc_multiple_val_twoCard').val(
                        priceUtils.formatPrice( 
                            this.amount_two(), 
                            quote.getPriceFormat()
                        ).toString().replace(currency, '') 
                    );
                    
                    $('#two-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_two(), quote.getPriceFormat() )
                    );
                    
                    $('#two-card-bottom span').html(
                        priceUtils.formatPrice(
                            ( this.amount_two() / cards[this.card_two()].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    $('#two-li-form-payment').slideDown();
                }
                
                
                $('.modal-edit-amount').show();
                $('#aqbank-valor-intergal').hide();
                
                /** Show two cards for pay **/
                if(this.type_payment() == 'credit_multiple' && this.card_one() && this.card_two()) {
                    this.showPayTwoCard();
                }
                
                if(this.card_one() && !this.card_two()) {
                    $('#multi-actions-two').slideDown();
                }
                
                
                if(this.saved_card_one() && !this.saved_card_two()){
                    if(!this.card_two()) {
                        $('.box-select-card-li-arrow').removeClass('active-new');
                        $('.box-select-card-li-arrow span').slideUp();
                        
                        $('#one-li-form-payment').slideUp(1);
                        $('.card-box-all').slideUp(1);
                        $('.card_cvv_img').slideUp(1);
                        $('.box-select-card-li').slideDown('100');
                        $('.box-select-card').slideDown('100');
                        $('.box-select-card-title').slideDown('100');
                        
                        $('#list-' + this.card_one() ).slideUp();
                    }
                    
                }
                else if(this.saved_card_one() && this.saved_card_two()){
                    
                }
                
                setTimeout(function(){ 
                    $('.aqbank_payment_integral').slideDown('100'); 
                    $('.card_one').slideDown('100'); 
                }, 500);
                
            },
            
            setCreditMethod: function(){
                this.use_two_cards(false);
                var cards = this.cards();
                
                $('#three-li-form-payment').slideUp(1);
                $('#multi-actions-one-ticket').hide();
                $('.payment-method-content-ticket').hide();
                $('.payment-method-content-pix').hide();
                $('.payment-method-content-cc').show();
                
                $('.modal-edit-amount').hide();
                $('.modal-credit-amount').show();
                
                $('.aqbank-card-grand-total').html(
                    priceUtils.formatPrice( quote.totals().grand_total, quote.getPriceFormat())
                );
                
                if(this.card_one()) {
                    $('#two-li-form-payment').hide();
                    $('.card-box-all').hide();
                    
                    $('.aqbank_payment_integral').show();
                    $('#one-li-form-payment').slideDown();
                    
                    $('#button-finished').show();
                    
                    $('#one-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_total(), quote.getPriceFormat() )
                    );
                    
                    $('#one-card-bottom span').html(
                        priceUtils.formatPrice(
                            ( this.amount_total() / cards[this.card_one()].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    $('#one-li-form-payment').slideDown();
                    $('#button-finished').slideDown('100');
                } else {
                    
                    /** existe cartão salvo **/
                    if(this.savedCards() != 'false'){
                        
                        $('.card-box-all').hide();
                        $('.box-select-card-title').show();
                        $('.box-select-card').show();
                        $('.box-select-card-li').show();
                        
                    }
                    else {
                        
                        /** não tem cartão **/
                        $('#one-action').show();
                        $('.card-box-all').show();

                    }
                    
                }
                
                if(this.card_two()){
                    
                    $('#two-grand-total-view').html(
                        priceUtils.formatPrice( this.amount_total(), quote.getPriceFormat())
                    );
                    $('#two-card-bottom span').html(
                        priceUtils.formatPrice( (this.amount_total() / cards[this.card_two()].installment ), quote.getPriceFormat() )
                    );
                    
                    /** exite cartão selecionado **/
                    if(this.select_card()) {
                        /******* select com dois cartões ********/
                        $('#one-li-form-payment').slideUp(1);
                        $('.box-select-card-li').slideUp(1);
                        $('.box-select-card-title').slideUp(1);
                        
                        $('#button-finished').hide();
                        
                        $('.box-select-card').slideDown('100');
                        /***************/
                        
                        $('#list-' + this.select_card() ).slideDown('100');
                        $('#one-li-form-payment').slideDown('100');
                        $('#button-finished').slideDown('100');
                    }
                    else {
                        /******* select com dois cartões ********/
                        $('#one-li-form-payment').slideUp(1);
                        $('#button-finished').hide();
                        
                        $('.box-select-card').slideDown('100');
                        $('.box-select-card-title').slideDown('100');
                        $('.box-select-card-li').slideDown('100');
                        /***************/
                    }
                    
                } else {
                    
                }
                
                /** Cartão salvo selecionado **/
                if(this.saved_card_one() || this.select_card()) {
                    
                    /** Não digitou o código de segurança **/
                    if(!cards[ this.card_one() ].securityCode) {
                        
                        this.select_card(false);
                        this.card_one(false);
                    
                        $('.box-select-card-li-arrow').removeClass('active-new');
                        $('.box-select-card-li-arrow span').slideUp();
                        
                        $('.aqbank_custom_informations').slideUp();
                        $('.aqbank_payment_integral').slideUp();
                        $('#button-finished').slideUp();
                        
                        $('#list-new').slideDown('100');
                        $('.box-select-card-title').slideDown('100');
                        $('.box-select-card').slideDown('100');
                        $('.box-select-card-li').slideDown('100');
                        
                    }
                    else {
                        $('#list-new').slideUp();
                        
                        $('.box-select-card-li-arrow').addClass('active-new');
                        $('.box-select-card-li-arrow span').slideDown();
                        
                        $('.box-select-card').slideDown();
                        $('#list-' + this.saved_card_one()).slideDown();
                    }
                }
                
                $('.modal-credit-amount').show();
                $('#aqbank-multi-pagamento-valor').hide();
                
                setTimeout(function(){  
                    $('.card_one').slideDown('100'); 
                }, 500);
                
            },
            
            placeCard: function(){
                
                var currency = quote.getPriceFormat().pattern;
                currency = currency.replace('%s','');
                
                var ccNumber            = $('#' + this.getCode() + '_cc_number').val();
                ccNumber                = ccNumber.replace(/[^0-9]/g,'');
                
                if(typePayment == 'credit_multiple') {
                    var valOne = $('#' + this.getCode() + '_cc_multiple_val_oneCard').val();
                } else {
                    var valOne = quote.totals().grand_total;
                }
                
                var totalInstallments   = $('#' + this.getCode() + '_installments').val()
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not').is(":checked")) ? true : false;
                
                valOne = this.customValValidate(valOne);
                var valTwo = quote.totals().grand_total - valOne;
                
                /********** Multiple Ticket ********/
                
                $('input[name="payment[ticket_amount]"]').val(
                    (quote.totals().grand_total / 2)
                );
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( (quote.totals().grand_total / 2).toFixed(2), quote.getPriceFormat())
                );
                $('#ticket-card-bottom').html(
                    priceUtils.formatPrice( (quote.totals().grand_total / 2).toFixed(2), quote.getPriceFormat())
                );
                
                /***********************************/
                
                if(
                    $('input[name="payment[type_payment]"]').val() != 'credit_multiple' &&
                    $('input[name="payment[type_payment]"]').val() != 'ticket_multiple'
                ) {
                    valTwo = (quote.totals().grand_total / 2);
                }
                
                var bandeira = this.setPaymentFlag(ccNumber);
                this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', bandeira, 'info');
                
                if($('.address-line-one').length) {
                    $('.address-cep').html( quote.shippingAddress().postcode );
                    $('.address-line-one').html(
                        '<span>' + quote.shippingAddress().street[0] + '</span>'
                        + '<span>, ' + quote.shippingAddress().street[1] + '</span>'
                        + '<span> ' + quote.shippingAddress().street[2] + '</span>'
                        + '<span> - ' + quote.shippingAddress().street[3] + '</span>'
                        + '<span>, ' + quote.shippingAddress().city + '</span>'
                        + '<span> / ' + quote.shippingAddress().regionCode + '</span>'
                    );      
                }
                
                
                $('.card-box-all').slideUp('100');
                
                $('input[name="payment[one_cc_number]"]').val( 
                    $('#' + this.getCode() + '_cc_number').val()
                );              
                $('input[name="payment[one_cc_owner]"]').val( 
                    $('#' + this.getCode() + '_cc_owner').val()
                );
                $('input[name="payment[one_cc_exp_month]"]').val( 
                    $('#' + this.getCode() + '_expiration').val()
                );
                $('input[name="payment[one_cc_exp_year]"]').val( 
                    $('#' + this.getCode() + '_expiration_yr').val()
                );
                $('input[name="payment[one_cc_cid]"]').val( 
                    $('#' + this.getCode() + '_cc_cid').val()
                );
                
                if(!customer.isLoggedIn()) {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() )
                        );
                    }
                    else {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask(  $('input[name="payment[cc_documento]"]').val() )
                        );
                    }
                }
                else {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( customer.customerData.taxvat )
                        );
                    }
                    else {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( $('input[name="payment[cc_documento]"]').val() )
                        );
                    }
                }
                
                $('input[name="payment[one_cc_amount]"]').val( 
                    valOne
                );
                
                $('input[name="payment[one_cc_installments]"]').val( totalInstallments );
                $('#' + this.getCode() + '_one_installments').val( totalInstallments );
                
                $('#one-card-bottom strong').html( totalInstallments + 'X' );
                
                if(totalInstallments > 1) {
                    $('#one-card-bottom span').html( priceUtils.formatPrice( (valOne / totalInstallments).toFixed(2), quote.getPriceFormat()) );
                } else {
                    $('#one-card-bottom span').html( priceUtils.formatPrice( valOne, quote.getPriceFormat()) );
                }
                
                /** Modal **/
                $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( priceUtils.formatPrice( valOne, quote.getPriceFormat()).toString().replace(currency, '') );
                $('#' + this.getCode() + '_cc_number_cardOne').val( $('#' + this.getCode() + '_cc_number').val().replace(/\s+/g, '') );
                $('#' + this.getCode() + '_cc_owner_cardOne').val( $('#' + this.getCode() + '_cc_owner').val() );
                $('#' + this.getCode() + '_expiration_cardOne').val( $('#' + this.getCode() + '_expiration').val() );
                $('#' + this.getCode() + '_expiration_yr_cardOne').val( $('#' + this.getCode() + '_expiration_yr').val() );
                $('#' + this.getCode() + '_cc_cid_cardOne').val( $('#' + this.getCode() + '_cc_cid').val() );
                $('#' + this.getCode() + '_documento_cardOne').val( $('#' + this.getCode() + '_documento').val() );
                $('#' + this.getCode() + '_installments_oneCard').val( totalInstallments );
                $('#not_cardOne').prop('checked', imOwer);
                if(imOwer) {
                    $('.documento-one-cardOne').slideUp('100');
                } else {
                    $('.documento-one-cardOne').slideDown('100');
                }
                /***********/
                
                $('#' + this.getCode() + '_cc_number').val('').change();
                $('#' + this.getCode() + '_cc_owner').val('').change();
                $('#' + this.getCode() + '_expiration').val('').change();
                $('#' + this.getCode() + '_expiration_yr').val('').change();
                $('#' + this.getCode() + '_cc_cid').val('').change();
                $('#' + this.getCode() + '_installments').val('1').change();
                $('#' + this.getCode() + '_cc_multiple_val').val(
                    priceUtils.formatPrice(valTwo, quote.getPriceFormat()).toString().replace(currency, '')
                );
                
                $('#one-middle-number-card').html( fourDigits );
                $('#one-grand-total-view').html( priceUtils.formatPrice( valOne, quote.getPriceFormat() ) );
                
                $('#multi-actions').hide();
                $('#one-payment-right-empty').hide();
                $('#img-flag-card').hide();
                
                $('#multi-actions-two').show();
                $('#one-payment-right-full').show();
                $('.aqbank_payment_integral').show();
                
                $('#one-li-form-payment').slideDown();
                $('#button-finished').slideDown('100');
                
                /************/
                
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                
                /************/
                
                
                
            },
            placeCardOne: function() {
                
                var currency = quote.getPriceFormat().pattern;
                currency = currency.replace('%s','');
                
                var ccNumber            = $('#' + this.getCode() + '_cc_number').val();
                ccNumber                = ccNumber.replace(/[^0-9]/g,'');
                var valOne              = $('#' + this.getCode() + '_cc_multiple_val').val();
                var totalInstallments   = $('#' + this.getCode() + '_installments').val()
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not').is(":checked")) ? true : false;
                
                valOne = this.customValValidate(valOne);
                var valTwo = quote.totals().grand_total - valOne;
                
                this.amount_one( valOne );
                this.amount_two( valTwo );
                this.amount_ticket( valTwo );
                
                var bandeira = this.setPaymentFlag(ccNumber);
                this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', bandeira, 'info');
                
                if($('.address-line-one').length) {
                    $('.address-cep').html( quote.shippingAddress().postcode );
                    $('.address-line-one').html(
                        '<span>' + quote.shippingAddress().street[0] + '</span>'
                        + '<span>, ' + quote.shippingAddress().street[1] + '</span>'
                        + '<span> ' + quote.shippingAddress().street[2] + '</span>'
                        + '<span> - ' + quote.shippingAddress().street[3] + '</span>'
                        + '<span>, ' + quote.shippingAddress().city + '</span>'
                        + '<span> / ' + quote.shippingAddress().regionCode + '</span>'
                    );          
                }
                
                /********** Multiple Ticket ********/
                
                $('input[name="payment[ticket_amount]"]').val(
                    valTwo
                );
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( valTwo, quote.getPriceFormat())
                );
                $('#ticket-card-bottom').html(
                    priceUtils.formatPrice( valTwo, quote.getPriceFormat())
                );
                
                /***********************************/
                
                $('.card-box-all').slideUp('100');
                
                $('input[name="payment[one_cc_number]"]').val( 
                    $('#' + this.getCode() + '_cc_number').val()
                );              
                $('input[name="payment[one_cc_owner]"]').val( 
                    $('#' + this.getCode() + '_cc_owner').val()
                );
                $('input[name="payment[one_cc_exp_month]"]').val( 
                    $('#' + this.getCode() + '_expiration').val()
                );
                $('input[name="payment[one_cc_exp_year]"]').val( 
                    $('#' + this.getCode() + '_expiration_yr').val()
                );
                $('input[name="payment[one_cc_cid]"]').val( 
                    $('#' + this.getCode() + '_cc_cid').val()
                );
                
                
                if(!customer.isLoggedIn()) {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() )
                        );
                    }
                    else {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( $('input[name="payment[cc_documento]"]').val() )
                        );
                    }
                }
                else {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( customer.customerData.taxvat )
                        );
                    }
                    else {
                        $('input[name="payment[one_cc_document]"]').val(
                            this.removeMask( $('input[name="payment[cc_documento]"]').val() )
                        );
                    }
                }
                
                $('input[name="payment[one_cc_amount]"]').val( 
                    valOne
                );
                
                $('input[name="payment[one_cc_installments]"]').val( totalInstallments );
                $('#' + this.getCode() + '_one_installments').val( totalInstallments );
                
                $('#one-card-bottom strong').html( totalInstallments + 'X' );
                
                if(totalInstallments > 1) {
                    $('#one-card-bottom span').html( priceUtils.formatPrice( (valOne / totalInstallments).toFixed(2), quote.getPriceFormat()) );
                } else {
                    $('#one-card-bottom span').html( priceUtils.formatPrice( valOne, quote.getPriceFormat()) );
                }
                
                $('input[name="payment[one_modal_amount]"]').val( valOne );
                $('input[name="payment[two_modal_amount]"]').val( valTwo );
                $('input[name="payment[ticket_amount]"]').val( valTwo );
                
                /** Modal **/
                $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( priceUtils.formatPrice( valOne, quote.getPriceFormat()).toString().replace(currency, '') );
                $('#' + this.getCode() + '_cc_number_cardOne').val( $('#' + this.getCode() + '_cc_number').val().replace(/\s+/g, '') );
                $('#' + this.getCode() + '_cc_owner_cardOne').val( $('#' + this.getCode() + '_cc_owner').val() );
                $('#' + this.getCode() + '_expiration_cardOne').val( $('#' + this.getCode() + '_expiration').val() );
                $('#' + this.getCode() + '_expiration_yr_cardOne').val( $('#' + this.getCode() + '_expiration_yr').val() );
                $('#' + this.getCode() + '_cc_cid_cardOne').val( $('#' + this.getCode() + '_cc_cid').val() );
                $('#' + this.getCode() + '_documento_cardOne').val( $('#' + this.getCode() + '_documento').val() );
                $('#' + this.getCode() + '_installments_oneCard').val( totalInstallments );
                $('#not_cardOne').prop('checked', imOwer);
                if(imOwer) {
                    $('.documento-one-cardOne').slideUp('100');
                } else {
                    $('.documento-one-cardOne').slideDown('100');
                }
                /***********/
                
                $('#' + this.getCode() + '_cc_number').val('').change();
                $('#' + this.getCode() + '_cc_owner').val('').change();
                $('#' + this.getCode() + '_expiration').val('').change();
                $('#' + this.getCode() + '_expiration_yr').val('').change();
                $('#' + this.getCode() + '_cc_cid').val('').change();
                $('#' + this.getCode() + '_installments').val('1').change();
                $('#' + this.getCode() + '_cc_multiple_val').val(
                    priceUtils.formatPrice(valTwo, quote.getPriceFormat()).toString().replace(currency, '')
                );
                
                $('#one-middle-number-card').html( fourDigits );
                $('#one-grand-total-view').html( priceUtils.formatPrice( valOne, quote.getPriceFormat() ) );
                
                $('#multi-actions').hide();
                $('#one-payment-right-empty').hide();
                $('#img-flag-card').hide();
                $('#multi-actions-two').show();
                $('#one-payment-right-full').show();
                $('#one-li-form-payment').slideDown();
                
                /************/
                
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                
                /************/
                
                setTimeout(function(){ 
                    $('.card-box-all').slideDown('100');
                }, 500);
                
            },
            placeCardTwo: function() {
                
                var currency = quote.getPriceFormat().pattern;
                currency = currency.replace('%s','');
                
                var ccNumber            = $('#' + this.getCode() + '_cc_number').val();
                ccNumber                = ccNumber.replace(/[^0-9]/g,'');
                var valTwo              = $('#' + this.getCode() + '_cc_multiple_val').val();
                var totalInstallments   = $('#' + this.getCode() + '_installments').val()
                var fourDigits          = ccNumber.substr(-4, 4);
                var imOwer              = ($('#not').is(":checked")) ? true : false;
                
                valTwo = this.customValValidate(valTwo);
                var valOne = quote.totals().grand_total - valTwo;
                
                this.amount_two( valTwo );
                this.amount_one( valOne );
                
                var bandeira = this.setPaymentFlag(ccNumber);
                this.setBandeiraInfo('#two-li-form-payment .middle-number-card img', bandeira, 'info');
                
                if($('.address-line-one').length) {
                    $('.address-cep').html( quote.shippingAddress().postcode );
                    $('.address-line-one').html(
                        '<span>' + quote.shippingAddress().street[0] + '</span>'
                        + '<span>, ' + quote.shippingAddress().street[1] + '</span>'
                        + '<span> ' + quote.shippingAddress().street[2] + '</span>'
                        + '<span> - ' + quote.shippingAddress().street[3] + '</span>'
                        + '<span>, ' + quote.shippingAddress().city + '</span>'
                        + '<span> / ' + quote.shippingAddress().regionCode + '</span>'
                    );  
                }
                
                /********** Multiple Ticket ********/
                
                $('input[name="payment[ticket_amount]"]').val(
                    valTwo
                );
                $('#ticket-grand-total-view').html(
                    priceUtils.formatPrice( valTwo, quote.getPriceFormat())
                );
                $('#ticket-card-bottom').html(
                    priceUtils.formatPrice( valTwo, quote.getPriceFormat())
                );
                
                /***********************************/
                
                $('.card-box-all').slideUp('100');
                
                $('input[name="payment[two_cc_number]"]').val( 
                    $('#' + this.getCode() + '_cc_number').val()
                );              
                $('input[name="payment[two_cc_owner]"]').val( 
                    $('#' + this.getCode() + '_cc_owner').val()
                );
                $('input[name="payment[two_cc_exp_month]"]').val( 
                    $('#' + this.getCode() + '_expiration').val()
                );
                $('input[name="payment[two_cc_exp_year]"]').val( 
                    $('#' + this.getCode() + '_expiration_yr').val()
                );
                $('input[name="payment[two_cc_cid]"]').val( 
                    $('#' + this.getCode() + '_cc_cid').val()
                );
                
                
                if(!customer.isLoggedIn()) {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        $('input[name="payment[two_cc_document]"]').val(
                            this.removeMask( $('input[name="' + this.getDocumentInput() + '"]').val() )
                        );
                    }
                    else {
                        $('input[name="payment[two_cc_document]"]').val(
                            this.removeMask( $('input[name="payment[cc_documento]"]').val() )
                        );
                    }
                }
                else {
                    if($('input[name="payment[not]"]').is(":checked")  == true) {
                        $('input[name="payment[two_cc_document]"]').val(
                            this.removeMask( customer.customerData.taxvat )
                        );
                    }
                    else {
                        $('input[name="payment[two_cc_document]"]').val(
                            this.removeMask( $('input[name="payment[cc_documento]"]').val() )
                        );
                    }
                }       
                
                $('input[name="payment[two_cc_amount]"]').val( 
                    valTwo
                );
                
                $('input[name="payment[two_cc_installments]"]').val( totalInstallments );
                $('#' + this.getCode() + '_two_installments').val( totalInstallments );
                
                $('#two-card-bottom strong').html( totalInstallments + 'X' );
                
                if(totalInstallments > 1) {
                    $('#one-card-bottom span').html( priceUtils.formatPrice( (valOne / $('#' + this.getCode() + '_one_installments').val() ).toFixed(2), quote.getPriceFormat()) );
                    $('#two-card-bottom span').html( priceUtils.formatPrice( (valTwo / totalInstallments).toFixed(2), quote.getPriceFormat()) );
                } else {
                    $('#one-card-bottom span').html( priceUtils.formatPrice( valOne, quote.getPriceFormat()) );
                    $('#two-card-bottom span').html( priceUtils.formatPrice( valTwo, quote.getPriceFormat() ) );
                }
                
                $('input[name="payment[one_modal_amount]"]').val( valOne );
                $('input[name="payment[two_modal_amount]"]').val( valTwo );
                $('input[name="payment[ticket_amount]"]').val( valTwo );
                
                /** Modal **/
                $('#' + this.getCode() + '_cc_multiple_val_oneCard').val( priceUtils.formatPrice( valOne, quote.getPriceFormat()).toString().replace(currency, '') );
                $('#' + this.getCode() + '_cc_multiple_val_twoCard').val( priceUtils.formatPrice( valTwo, quote.getPriceFormat()).toString().replace(currency, '') );
                $('#' + this.getCode() + '_cc_number_twoCard').val( $('#' + this.getCode() + '_cc_number').val().replace(/\s+/g, '') );
                $('#' + this.getCode() + '_cc_owner_twoCard').val( $('#' + this.getCode() + '_cc_owner').val() );
                $('#' + this.getCode() + '_expiration_twoCard').val( $('#' + this.getCode() + '_expiration').val() );
                $('#' + this.getCode() + '_expiration_yr_twoCard').val( $('#' + this.getCode() + '_expiration_yr').val() );
                $('#' + this.getCode() + '_cc_cid_twoCard').val( $('#' + this.getCode() + '_cc_cid').val() );
                $('#' + this.getCode() + '_documento_twoCard').val( $('#' + this.getCode() + '_documento').val() );
                $('#' + this.getCode() + '_installments_twoCard').val( totalInstallments );
                $('#not_twoCard').prop('checked', imOwer);
                
                if(imOwer) {
                    $('.documento-two-cardTwo').slideUp('100');
                } else {
                    $('.documento-two-cardTwo').slideDown('100');
                }
                /***********/
                
                $('#two-middle-number-card').html( fourDigits );
                $('#one-grand-total-view').html( priceUtils.formatPrice( valOne, quote.getPriceFormat() ) );
                $('#two-grand-total-view').html( priceUtils.formatPrice( valTwo, quote.getPriceFormat() ) );
                
                $('#multi-actions').hide();
                $('#two-payment-right-empty').hide();
                $('#img-flag-card').hide();
                
                $('#multi-actions-two').show();
                $('#two-payment-right-full').show();
                
                $('#two-li-form-payment').slideDown('100');
                $('#button-finished').slideDown('100');
                
                /************/
                
                $('.grandtotal-box').html(
                    $('#iwd_opc_review_totals').html()
                );
                
                /************/
                
                
                /*** Select card one *****/
                $('.box-select-card-one .box-select-card-li-flag').html(
                    $('#one-li-form-payment .li-flag-card').html()
                );
                $('.box-select-card-one .box-select-card-li-number').html(
                    'XXXX XXXX XXXX ' + $('#one-li-form-payment .middle-number-card').html()
                );
                /*** Select card one *****/
                
                /*** Select card two *****/
                $('.box-select-card-two .box-select-card-li-flag').html(
                    $('#two-li-form-payment .li-flag-card').html()
                );
                $('.box-select-card-two .box-select-card-li-number').html(
                    'XXXX XXXX XXXX ' + $('#two-li-form-payment .middle-number-card').html()
                );
                /*** Select card two *****/
                
                
            },
            getFlagImg: function(flag) {
                if(flag == 'mastercard') {
                    return window.checkoutConfig.payment[this.getCode()].flag_mastercard;
                }
                else if(flag == 'amex') {
                    return window.checkoutConfig.payment[this.getCode()].flag_american_express;
                }
                else if(flag == 'hipercard') {
                    return window.checkoutConfig.payment[this.getCode()].flag_hipercard;
                }       
                else if(flag == 'jcb') {
                    return window.checkoutConfig.payment[this.getCode()].flag_jcb;
                }       
                else if(flag == 'elo') {
                    return window.checkoutConfig.payment[this.getCode()].flag_elo;
                }
                else if(flag == 'aura') {
                    return window.checkoutConfig.payment[this.getCode()].flag_aura;
                }       
                else if(flag == 'hiper') {
                    return window.checkoutConfig.payment[this.getCode()].flag_hiper;
                }       
                else if(flag == 'banescard') {
                    return window.checkoutConfig.payment[this.getCode()].flag_banescard;
                }
                else if(flag == 'visa') {
                    return window.checkoutConfig.payment[this.getCode()].flag_visa_default;
                }
                else if(flag == 'diners') {
                    return window.checkoutConfig.payment[this.getCode()].flag_diners;
                }
            },
            setBandeiraInfo: function(el, flag, type = 'card') {
                $(el).removeClass('flag-visa');
                $(el).removeClass('flag-mastercard');
                $(el).removeClass('flag-elo');
                $(el).removeClass('flag-diners');
                $(el).removeClass('flag-amex');
                $(el).removeClass('flag-aura');
                $(el).removeClass('flag-jcb');
                $(el).removeClass('flag-hiper');
                $(el).removeClass('flag-hipercard');
                $(el).removeClass('flag-banescard');
                
                
                if(flag == 'mastercard') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_mastercard );
                    $(el).addClass('flag-mastercard');
                }
                else if(flag == 'amex') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_american_express );
                    $(el).addClass('flag-amex');
                }
                else if(flag == 'hipercard') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_hipercard );
                    $(el).addClass('flag-hipercard');
                }       
                else if(flag == 'jcb') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_jcb );
                    $(el).addClass('flag-jcb');
                }       
                else if(flag == 'elo') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_elo );
                    $(el).addClass('flag-elo');
                }
                else if(flag == 'aura') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_aura );
                    $(el).addClass('flag-aura');
                }       
                else if(flag == 'hiper') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_hiper );
                    $(el).addClass('flag-hiper');
                }       
                else if(flag == 'banescard') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_banescard );
                    $(el).addClass('flag-banescard');
                }
                else if(flag == 'visa') {
                    if(type == 'card') {
                        $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_visa );
                    }   
                    if(type == 'info') {
                        $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_visa_default );
                    }   
                    $(el).addClass('flag-visa');
                }
                else if(flag == 'diners') {
                    $(el).attr('src', window.checkoutConfig.payment[this.getCode()].flag_diners );
                    $(el).addClass('flag-diners');
                }
                
            },
            
            setOrderSub: function(selectClass) {
                if(!subInit) {
                    subInit = true;
                    return false;
                }
                
                var after = 1;
                if($('.' + selectClass).length) {
                    var before = $('.' + selectClass).val();
                    before = parseInt( before );
                    after = before - 1;

                    if(after > 12) {
                        after = 12;
                    } 
                    if(after <= 0) {
                        after = 1;
                    } 
                    
                    $('.' + selectClass).val( after );
                }
            },
            setOrderSum: function(selectClass) {
                if(!sumInit) {
                    sumInit = true;
                    return false;
                }
                
                var after = 1;
                if($('.' + selectClass).length) {
                    var before = $('.' + selectClass).val();
                    before = parseInt( before );
                    after = before + 1;
                    
                    if(after > 12) {
                        after = 12;
                    } 
                    if(after <= 0) {
                        after = 1;
                    } 
                    
                    $('.' + selectClass).val( after );
                }
            },
            onCodekeypress: function() {
                $("#card-code").val( $("#aqpago_cc_cid").val() );
                return true;
            },              
            onCodehasFocus: function() {
                $(".card-box").removeClass("card-front");
                $(".card-box").addClass("card-back");
                return true;
            },          
            onCodeFocusOut: function() {
                $(".card-box").removeClass("card-back");
                $(".card-box").addClass("card-front");
                return true;
            },
            getCreditCardText: function() {
                var CreditCardText = $t('<strong>CREDIT</strong> <span class="text-light">CARD</span>');
                return CreditCardText;
            },
            getTwoCreditCardText: function() {
                var TwoCreditCardText = $t('<strong>2 CREDIT</strong> <span class="text-light">CARDS</span>');
                return TwoCreditCardText;
            },
            getCreditCardAndTicketText: function() {
                var CreditCardAndTicketText = $t('<strong>CREDIT CARD</strong> <span class="text-light">& TICKET</span>');
                return CreditCardAndTicketText;
            },
            getTicketText: function() {
                var TicketText = $t('<strong>TICKET</strong>');
                return TicketText;
            },
            getToolTipCreditAndTicketText: function() {
                var minimum = this.getFormattedPrice(11.00);
                var ToolTipCreditAndTicketText = $t('The minimum value to use this form is') + ' ' + minimum;
                return ToolTipCreditAndTicketText;
            },          
            getToolTipTicketText: function() {
                var ToolTipTicketText = $t('Escolha a <strong>melhor</strong> forma de <strong>pagamento</strong>');
                return ToolTipTicketText;
            },
            getTitlePaymentForm: function() {
                var TitlePaymentForm = $t('Choose the <strong>best</strong> way of <strong>payment</strong>');
                return TitlePaymentForm;
            },
            getMyOrdersUrl: function() {
                return window.checkoutConfig.payment[this.getCode()].myOrders;
            },
            getDocumentInput: function() {
                return window.checkoutConfig.payment[this.getCode()].document_input;
            },          
            getPhoneInput: function() {
                return window.checkoutConfig.payment[this.getCode()].phone_input;
            },
            getIconEditErro: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_edit_erro;
            },            
            getCardOneErro: function() {
                return window.checkoutConfig.payment[this.getCode()].card_one_erro;
            },
            getCardTwoErro: function() {
                return window.checkoutConfig.payment[this.getCode()].card_two_erro;
            },
            getCardOneSuccess: function() {
                return window.checkoutConfig.payment[this.getCode()].card_one_success;
            },
            getCardTwoSuccess: function() {
                return window.checkoutConfig.payment[this.getCode()].card_two_success;
            },
            getIconAlert: function() {
                return window.checkoutConfig.payment[this.getCode()].alert_erro;
            },
            getIconToolTip: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_tooltip;
            },          
            getIconOrderButton: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_card_white;
            },          
            getIconCvvImage: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="116.901" height="74.425" viewBox="0 0 116.901 74.425"><defs><filter id="Retângulo_906" x="0" y="0" width="116.901" height="74.425" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-opacity="0.439"/><feComposite operator="in" in2="blur"/><feComposite in="SourceGraphic"/></filter></defs><g id="Grupo_5025" data-name="Grupo 5025" transform="translate(-52.5 -1237.492)"><g id="Grupo_4139" data-name="Grupo 4139" transform="translate(61.5 1243.492)"><g transform="matrix(1, 0, 0, 1, -9, -6)" filter="url(#Retângulo_906)"><rect class="card-background-svg" id="Retângulo_906-2" data-name="Retângulo 906" width="98.901" height="56.425" rx="7" transform="translate(9 6)" fill="#561271"/></g><rect id="Retângulo_1107" data-name="Retângulo 1107" width="99" height="12" transform="translate(0 7.871)" fill="#434343"/><rect id="Retângulo_1108" data-name="Retângulo 1108" width="28" height="12" rx="3" transform="translate(64 26.871)" fill="#fff"/></g></g></svg>';
            },
            getDefaultIssuers: function() {
                return window.checkoutConfig.payment[this.getCode()].aqpago;
            },      
            getIconPix: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_pix;
            },           
            getIconPixWhite: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_pix_white;
            },
            getIconNewCard: function() {
                return '<svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"viewBox="0 0 159.5 58.9" style="enable-background:new 0 0 159.5 58.9;" xml:space="preserve"><style type="text/css">.st0{fill:#4F076B;}.st1{fill:#FFFFFF;}.st2{enable-background:new    ;}</style><path class="st0" d="M6.4,0h146.7c3.5,0,6.4,2.6,6.4,5.8v47.4c0,3.2-2.9,5.8-6.4,5.8H6.4c-3.5,0-6.4-2.6-6.4-5.8V5.8C0,2.6,2.9,0,6.4,0z"/><g transform="translate(14.523 11.959)"><g transform="translate(0 14.275)"><path class="st1" d="M30.4,0H1.9C0.5,0,0,1,0,2.3v1.4h32.3V2.3C32.3,1,31.8,0,30.4,0z"/><path class="st1" d="M0,17.7C0,19,0.5,20,1.9,20h28.5c1.4,0,1.9-1,1.9-2.3V7.5H0V17.7z M16,10.1h14.2c0.2,0,0.4,0.2,0.4,0.5c0,0.2-0.2,0.3-0.4,0.4H16c-0.2,0-0.4-0.2-0.4-0.5C15.7,10.3,15.8,10.1,16,10.1L16,10.1z M16,12.3h14.2c0.2,0,0.4,0.2,0.4,0.5c0,0.2-0.2,0.4-0.4,0.4H16c-0.2,0-0.4-0.2-0.4-0.5C15.6,12.4,15.8,12.3,16,12.3L16,12.3z M16,14.4h14.2c0.2,0,0.4,0.2,0.4,0.5c0,0.2-0.2,0.3-0.4,0.4H16c-0.2,0-0.4-0.2-0.4-0.5C15.7,14.6,15.8,14.4,16,14.4L16,14.4z M16,16.6h14.2c0.2,0,0.4,0.2,0.4,0.5c0,0.2-0.2,0.3-0.4,0.4H16c-0.2,0-0.4-0.2-0.4-0.5C15.7,16.7,15.8,16.6,16,16.6L16,16.6z M1.9,10.9C2,10.4,2.4,10,2.9,10h9.4c0.5,0,0.9,0.4,0.9,0.8v4.4c0,0.5-0.4,0.9-0.9,0.9H2.9c-0.5,0-0.9-0.4-0.9-0.9V10.9z"/></g><path class="st1" d="M36.8,16.4V11h-6.1c-1,0-1.8-0.8-1.8-1.8s0.8-1.8,1.8-1.8h6.1V2c0-1.1,0.9-2,2-2c1.1,0,2,0.9,2,2v5.4h6.1c1,0,1.8,0.8,1.8,1.8c0,1-0.8,1.8-1.8,1.8h-6.1v5.4c0,1.1-0.9,2-2,2C37.7,18.3,36.8,17.5,36.8,16.4C36.8,16.4,36.8,16.4,36.8,16.4L36.8,16.4z"/><g transform="translate(65.673 7.175)"><g class="st2"><path class="st1" d="M3.2,0.5h0.3l3,6.4l0,0.1H5.8L5.1,5.5H1.5L0.9,7H0.2l0-0.1L3.2,0.5z M3.3,1.7L1.8,4.9h2.9L3.3,1.7z"/><path class="st1" d="M7.6,0.5h2.5c1,0,1.8,0.3,2.5,0.9c0.6,0.6,0.9,1.4,0.9,2.3c0,1-0.3,1.8-0.9,2.4C11.9,6.7,11.1,7,10.1,7H7.6V0.5z M8.3,6.4h1.8c0.8,0,1.4-0.2,1.9-0.7c0.5-0.5,0.7-1.1,0.7-1.9c0-0.8-0.2-1.4-0.7-1.9c-0.5-0.5-1.1-0.7-1.9-0.7H8.3V6.4z"/><path class="st1" d="M14.9,7V0.5h0.7V7H14.9z"/><path class="st1" d="M20.3,7.1c-0.9,0-1.7-0.3-2.4-1c-0.7-0.6-1-1.4-1-2.4s0.3-1.8,1-2.4c0.7-0.6,1.4-1,2.4-1c0.5,0,1,0.1,1.5,0.3c0.5,0.2,0.9,0.5,1.2,1v0.1l-0.5,0.4h-0.1c-0.2-0.3-0.6-0.6-0.9-0.8S20.8,1,20.4,1c-0.8,0-1.4,0.3-1.9,0.8C18,2.3,17.7,3,17.7,3.7c0,0.8,0.3,1.4,0.8,1.9c0.5,0.5,1.1,0.8,1.9,0.8c0.4,0,0.8-0.1,1.2-0.3c0.4-0.2,0.7-0.4,0.9-0.8h0.1L23,5.8v0.1c-0.3,0.4-0.7,0.7-1.2,1C21.4,7,20.9,7.1,20.3,7.1z"/><path class="st1" d="M24.3,7V0.5H25V7H24.3z"/><path class="st1" d="M32.3,6.2c-0.7,0.6-1.5,1-2.4,1c-1,0-1.8-0.3-2.4-1c-0.7-0.6-1-1.4-1-2.4s0.3-1.8,1-2.4c0.7-0.6,1.5-1,2.4-1c1,0,1.8,0.3,2.4,1c0.7,0.6,1,1.4,1,2.4S32.9,5.5,32.3,6.2z M27.9,5.7c0.5,0.5,1.2,0.8,1.9,0.8c0.8,0,1.4-0.3,1.9-0.8c0.5-0.5,0.8-1.2,0.8-1.9c0-0.8-0.3-1.4-0.8-1.9C31.2,1.3,30.6,1,29.8,1c-0.8,0-1.4,0.3-1.9,0.8c-0.5,0.5-0.8,1.2-0.8,1.9C27.1,4.5,27.4,5.2,27.9,5.7z"/><path class="st1" d="M39.2,5.7V0.5h0.7v6.6h-0.3l-4.2-5.2V7h-0.7V0.5H35L39.2,5.7z"/><path class="st1" d="M44,0.5h0.3l3,6.4l0,0.1h-0.7l-0.7-1.5h-3.5L41.7,7H41l0-0.1L44,0.5z M44.1,1.7l-1.5,3.2h2.9L44.1,1.7z"/><path class="st1" d="M53.1,2.4c0,0.5-0.1,0.9-0.4,1.2c-0.2,0.3-0.6,0.5-1.1,0.6l1.5,2.8l0,0.1h-0.7L51,4.3h-0.1h-1.7V7h-0.7V0.5h2.4c0.7,0,1.3,0.2,1.7,0.5S53.1,1.8,53.1,2.4z M51,1.1h-1.9v2.5H51c0.4,0,0.8-0.1,1-0.4c0.2-0.2,0.4-0.5,0.4-0.9c0-0.4-0.1-0.7-0.4-0.9C51.8,1.3,51.5,1.1,51,1.1z"/></g><g class="st2"><path class="st1" d="M5.4,22.1c-1.4,0-2.5-0.5-3.5-1.4c-0.9-0.9-1.4-2-1.4-3.4S1,14.9,1.9,14c0.9-0.9,2.1-1.3,3.5-1.3c0.8,0,1.5,0.2,2.1,0.5c0.7,0.3,1.2,0.8,1.7,1.3v0.2l-1.3,1.1H7.8c-0.6-0.7-1.4-1.1-2.3-1.1c-0.8,0-1.4,0.3-1.9,0.8c-0.5,0.5-0.8,1.2-0.8,2s0.3,1.4,0.8,2c0.5,0.5,1.2,0.8,1.9,0.8c0.9,0,1.7-0.4,2.3-1.1h0.2l1.3,1.1v0.2c-0.5,0.6-1,1-1.7,1.3C6.9,22,6.2,22.1,5.4,22.1z"/><path class="st1" d="M13.7,12.9H15l4.2,8.9L19.1,22h-2.2l-0.7-1.6h-3.8L11.7,22H9.6l-0.1-0.2L13.7,12.9z M14.3,15.8L13,18.8h2.6L14.3,15.8z"/><path class="st1" d="M25.9,18.3l1.9,3.5L27.7,22h-2.2l-1.8-3.4h-1.3V22h-2.2v-9.1h3.9c1.1,0,2,0.3,2.6,0.8c0.6,0.5,0.9,1.2,0.9,2.1c0,0.6-0.2,1.1-0.5,1.5C26.9,17.7,26.5,18,25.9,18.3z M24.2,14.7h-1.8V17h1.8c0.4,0,0.7-0.1,0.9-0.3c0.2-0.2,0.4-0.5,0.4-0.9c0-0.4-0.1-0.7-0.4-0.9C24.9,14.8,24.6,14.7,24.2,14.7z"/><path class="st1" d="M36.3,14.7h-2.9V22h-2.2v-7.3h-2.9v-1.8h7.9V14.7z"/><path class="st1" d="M39.6,12.9h1.3l4.2,8.9L45,22h-2.2l-0.7-1.6h-3.8L37.6,22h-2.1l-0.1-0.2L39.6,12.9z M37.9,11.7h-0.1l-0.1-0.1v-1.4C38,9.7,38.4,9.5,39,9.5c0.3,0,0.7,0.1,1.4,0.3s1,0.3,1.2,0.3c0.5,0,0.8-0.2,1-0.5h0.1l0.1,0.1V11c-0.3,0.4-0.7,0.6-1.3,0.6c-0.3,0-0.8-0.1-1.4-0.3s-1-0.3-1.2-0.3C38.4,11.1,38.1,11.3,37.9,11.7z M40.3,15.8l-1.3,3.1h2.6L40.3,15.8z"/><path class="st1" d="M50.3,22.1c-1.4,0-2.6-0.4-3.6-1.3c-1-0.9-1.4-2-1.4-3.4s0.5-2.5,1.4-3.4c0.9-0.9,2.1-1.3,3.6-1.3c1.4,0,2.6,0.4,3.6,1.3c1,0.9,1.4,2,1.4,3.4s-0.5,2.5-1.4,3.4C52.9,21.7,51.7,22.1,50.3,22.1z M47.5,17.4c0,0.8,0.3,1.4,0.8,2s1.2,0.8,2,0.8c0.8,0,1.4-0.3,2-0.8c0.5-0.5,0.8-1.2,0.8-2s-0.3-1.4-0.8-2c-0.5-0.5-1.2-0.8-2-0.8c-0.8,0-1.4,0.3-2,0.8C47.8,16,47.5,16.6,47.5,17.4z"/></g></g></g></svg>';
            },
            getImagePaymentSuccess: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="309" height="309" viewBox="0 0 309 309"><defs><filter id="Caminho_9631-3"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-opacity="0.161" result="color"/><feComposite operator="out" in="SourceGraphic" in2="blur"/><feComposite operator="in" in="color"/><feComposite operator="in" in2="SourceGraphic"/></filter></defs><g id="pagamento-realizado" transform="translate(-1479 -457)"><g id="Grupo_6738" data-name="Grupo 6738" transform="translate(910.024 -537.238)"><g id="Grupo_6611" data-name="Grupo 6611"><circle id="Elipse_128" data-name="Elipse 128" cx="154.5" cy="154.5" r="154.5" transform="translate(568.976 994.238)" fill="#fff"/><g id="Grupo_6610" data-name="Grupo 6610"><g id="Pagamento_" data-name="Pagamento " style="isolation: isolate"><g id="Grupo_6733" data-name="Grupo 6733" style="isolation: isolate"><path id="Caminho_9632" data-name="Caminho 9632" d="M645.856,1067.99h7.068a6.926,6.926,0,0,1,4.663,1.405,5.509,5.509,0,0,1,.012,7.824,6.94,6.94,0,0,1-4.675,1.416H649.75v5.6h-3.894Zm3.894,7.617h3.223a2.3,2.3,0,0,0,1.648-.58,2.125,2.125,0,0,0,.61-1.617,2.168,2.168,0,0,0-.61-1.629,2.272,2.272,0,0,0-1.648-.592H649.75Z" fill="#561271"/><path id="Caminho_9633" data-name="Caminho 9633" d="M665.875,1067.99h2.369l7.47,15.944-.171.3H671.6l-1.184-2.843h-6.873l-1.2,2.843h-3.809l-.171-.3Zm1.172,5.176-2.356,5.518h4.627Z" fill="#561271"/><path id="Caminho_9634" data-name="Caminho 9634" d="M692.719,1074.863l.293.244a10.086,10.086,0,0,1,.049,1.209,7.786,7.786,0,0,1-2.417,5.823,8.92,8.92,0,0,1-12.183,0,8.623,8.623,0,0,1,.037-12.061,8.4,8.4,0,0,1,6.091-2.392,9,9,0,0,1,3.833.83,8.247,8.247,0,0,1,2.942,2.3v.3l-2.393,2.028h-.3a4.9,4.9,0,0,0-3.979-1.93,4.486,4.486,0,0,0-3.333,1.379,5.239,5.239,0,0,0-.012,7.045,4.609,4.609,0,0,0,3.43,1.379,4.415,4.415,0,0,0,3.088-1.123,3.867,3.867,0,0,0,1.209-2.149h-4.358v-2.881Z" fill="#561271"/><path id="Caminho_9635" data-name="Caminho 9635" d="M700.812,1067.99h2.368l7.471,15.944-.171.3h-3.943l-1.184-2.843H698.48l-1.2,2.843h-3.808l-.171-.3Zm1.172,5.176-2.356,5.518h4.626Z" fill="#561271"/><path id="Caminho_9636" data-name="Caminho 9636" d="M728.754,1067.99,731,1084.238h-3.6l-1-8.777-3.87,8.777h-2.185l-3.8-8.777-1.026,8.777h-3.845l2.271-16.248h2.282l5.2,11.194,5.066-11.194Z" fill="#561271"/><path id="Caminho_9637" data-name="Caminho 9637" d="M745.661,1067.99v3.2h-7.947v3.37h6.152v3.05h-6.152v3.43h7.995v3.2H733.82V1067.99Z" fill="#561271"/><path id="Caminho_9638" data-name="Caminho 9638" d="M759.284,1077.658v-9.668h3.906v16.321h-2.429l-8.252-9.668v9.6h-3.87V1067.99h2.417Z" fill="#561271"/><path id="Caminho_9639" data-name="Caminho 9639" d="M779.486,1071.189h-5.1v13.049h-3.931v-13.049h-5.09v-3.2h14.123Z" fill="#561271"/><path id="Caminho_9640" data-name="Caminho 9640" d="M788.983,1084.543a8.929,8.929,0,0,1-6.372-2.4,8.4,8.4,0,0,1,0-12.061,9.633,9.633,0,0,1,12.72.012,8.375,8.375,0,0,1,0,12.037A8.873,8.873,0,0,1,788.983,1084.543Zm-4.931-8.436a4.7,4.7,0,0,0,1.428,3.516,5.1,5.1,0,0,0,7.007,0,5.072,5.072,0,0,0,0-7.031,5.14,5.14,0,0,0-7.007,0A4.7,4.7,0,0,0,784.052,1076.107Z" fill="#561271"/></g></g><g id="realizado" style="isolation: isolate"><g id="Grupo_6734" data-name="Grupo 6734" style="isolation: isolate"><path id="Caminho_9641" data-name="Caminho 9641" d="M640.707,1115.992l4.8,8.819-.256.427h-5.418l-4.6-8.545H632.06v8.545h-5.452v-22.746H636.4q4.239,0,6.512,1.914a6.592,6.592,0,0,1,2.273,5.332,6.328,6.328,0,0,1-1.171,3.828A7.125,7.125,0,0,1,640.707,1115.992Zm-4.272-9.023H632.06v5.982h4.375a3.266,3.266,0,0,0,2.29-.812,2.746,2.746,0,0,0,.888-2.127,2.889,2.889,0,0,0-.888-2.2A3.2,3.2,0,0,0,636.435,1106.969Z" fill="#561271"/><path id="Caminho_9642" data-name="Caminho 9642" d="M665.932,1102.492v4.477H654.806v4.717h8.613v4.273h-8.613v4.8H666v4.478H649.354v-22.746Z" fill="#561271"/><path id="Caminho_9643" data-name="Caminho 9643" d="M678.083,1102.492H681.4l10.459,22.319-.239.427H686.1l-1.658-3.982h-9.622l-1.674,3.982h-5.332l-.24-.427Zm1.64,7.246-3.3,7.725H682.9Z" fill="#561271"/><path id="Caminho_9644" data-name="Caminho 9644" d="M700.043,1120.76H709.6v4.478H694.591v-22.746h5.452Z" fill="#561271"/><path id="Caminho_9645" data-name="Caminho 9645" d="M712.638,1125.238v-22.746h5.452v22.746Z" fill="#561271"/><path id="Caminho_9646" data-name="Caminho 9646" d="M740.375,1106.131l-11.519,14.7h12.083v4.41H721.833v-3.64l11.569-14.7H722.311v-4.408h18.064Z" fill="#561271"/><path id="Caminho_9647" data-name="Caminho 9647" d="M752.56,1102.492h3.315l10.459,22.319-.239.427h-5.52l-1.658-3.982H749.3l-1.675,3.982h-5.332l-.239-.427Zm1.641,7.246-3.3,7.725h6.477Z" fill="#561271"/><path id="Caminho_9648" data-name="Caminho 9648" d="M769.069,1102.492H779a12.152,12.152,0,0,1,8.75,3.11,12.162,12.162,0,0,1,0,16.509,12.123,12.123,0,0,1-8.75,3.127h-9.929Zm5.452,18.268h4.306a6.373,6.373,0,0,0,4.785-1.862,7.979,7.979,0,0,0,0-10.084,6.439,6.439,0,0,0-4.785-1.845h-4.306Z" fill="#561271"/><path id="Caminho_9649" data-name="Caminho 9649" d="M805.983,1125.666a12.5,12.5,0,0,1-8.921-3.367,11.763,11.763,0,0,1,0-16.885,13.481,13.481,0,0,1,17.808.018,11.723,11.723,0,0,1,0,16.849A12.423,12.423,0,0,1,805.983,1125.666Zm-6.9-11.811a6.58,6.58,0,0,0,2,4.922,7.144,7.144,0,0,0,9.81,0,7.1,7.1,0,0,0,0-9.843,7.2,7.2,0,0,0-9.81,0A6.579,6.579,0,0,0,799.079,1113.855Z" fill="#561271"/></g></g></g></g><g id="Grupo_6612" data-name="Grupo 6612"><g id="Grupo_6736" data-name="Grupo 6736"><path id="Caminho_9631-2" data-name="Caminho 9631-2" d="M723.476,1144.238a54.5,54.5,0,1,1-54.5,54.5A54.5,54.5,0,0,1,723.476,1144.238Z" fill="#fcfcfc"/><g id="Grupo_6735" data-name="Grupo 6735"><g data-type="innerShadowGroup"><path id="Caminho_9631-3-2" data-name="Caminho 9631-3" d="M723.476,1144.24a54.5,54.5,0,1,1-54.5,54.5A54.5,54.5,0,0,1,723.476,1144.24Z" fill="#fff"/><g transform="matrix(1, 0, 0, 1, 568.98, 994.24)" filter="url(#Caminho_9631-3)"><path id="Caminho_9631-3-3" data-name="Caminho 9631-3" d="M723.476,1144.24a54.5,54.5,0,1,1-54.5,54.5A54.5,54.5,0,0,1,723.476,1144.24Z" transform="translate(-568.98 -994.24)" fill="#fff"/></g></g></g></g><g id="Grupo_6737" data-name="Grupo 6737"><path id="Caminho_9612-2" data-name="Caminho 9612-2" d="M705.026,1223.524c3.409,7.3,9.735,13.742,16.512,13.777h.064c12.828,0,13.626-6.783,26.067-33.365,7.756-16.577,16.226-30.618,29.927-45.632l.035-.035a146.681,146.681,0,0,1,13.83-12.746,10.679,10.679,0,0,0,1.775-1.582,2.05,2.05,0,0,0,.275-1.1l.012-.111-.035-.111c-.621-1.962-2.009-2.806-4.634-2.806-4.106,0-11.6,3.11-21.023,8.88-18.364,11.264-33.319,27.924-46.147,55.525l-.691,1.488-.855-1.406c-12.915-21.441-23.782-23.1-27.872-23.1a11.366,11.366,0,0,0-3.872.58c-1.646.627-5.548,2.431-6.291,5.629-.492,2.121.5,4.528,2.947,7.17C693.99,1204.217,700.076,1212.933,705.026,1223.524Z" fill="#561271"/></g></g></g></g></svg>';
            },
            getIconPostCode: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="12.746" height="20.183" viewBox="0 0 12.746 20.183"><g id="Grupo_6409" data-name="Grupo 6409" transform="translate(-0.001 0.001)"><path id="Caminho_9514" data-name="Caminho 9514" d="M399.267,231.171c-.037.056-.073.112-.109.168,1.273.388,2.1,1.026,2.1,1.746,0,1.184-2.243,2.144-5.01,2.144s-5.01-.96-5.01-2.144c0-.713.813-1.344,2.064-1.734l-.111-.172c-2.185.331-3.412,1.6-3.308,2.879.126,1.544,2.285,3.007,6.365,3.007s6.211-1.361,6.365-3.007C402.736,232.777,401.721,231.63,399.267,231.171Z" transform="translate(-389.879 -216.883)" fill="#520a6d"/><path id="Caminho_9515" data-name="Caminho 9515" d="M396.251,233.915s5.8-5.78,5.8-11.214a5.806,5.806,0,1,0-11.611,0C390.445,228.33,396.251,233.915,396.251,233.915ZM391.639,222.7a4.612,4.612,0,1,1,4.612,4.622A4.618,4.618,0,0,1,391.639,222.7Z" transform="translate(-389.879 -216.883)" fill="#520a6d"/></g></svg>';
            },
            getIconBoleto: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="41.77" height="27.569" viewBox="0 0 41.77 27.569"><defs><clipPath id="clip-path"/></defs><g id="Grupo_4161" data-name="Grupo 4161" transform="translate(-4.177 -5.012)"><rect id="Retângulo_55" data-name="Retângulo 55" width="1.67" height="27.569" transform="translate(4.177 5.012)" fill="#4f076b"/><rect id="Retângulo_56" data-name="Retângulo 56" width="2.506" height="23.392" transform="translate(8.354 5.012)" fill="#4f076b"/><rect id="Retângulo_57" data-name="Retângulo 57" width="1.671" height="23.392" transform="translate(13.367 5.012)" fill="#4f076b"/><rect id="Retângulo_58" data-name="Retângulo 58" width="2.506" height="23.392" transform="translate(16.709 5.012)" fill="#4f076b"/><rect id="Retângulo_59" data-name="Retângulo 59" width="1.671" height="23.392" transform="translate(20.885 5.012)" fill="#4f076b"/><rect id="Retângulo_60" data-name="Retângulo 60" width="1.67" height="27.569" transform="translate(24.227 5.012)" fill="#4f076b"/><rect id="Retângulo_61" data-name="Retângulo 61" width="2.506" height="23.392" transform="translate(31.745 5.012)" fill="#4f076b"/><rect id="Retângulo_62" data-name="Retângulo 62" width="1.67" height="23.392" transform="translate(36.758 5.012)" fill="#4f076b"/><rect id="Retângulo_63" data-name="Retângulo 63" width="2.506" height="23.392" transform="translate(40.1 5.012)" fill="#4f076b"/><rect id="Retângulo_64" data-name="Retângulo 64" width="1.67" height="27.569" transform="translate(44.277 5.012)" fill="#4f076b"/><rect id="Retângulo_65" data-name="Retângulo 65" width="1.671" height="2.506" transform="translate(7.519 30.074)" fill="#4f076b"/><rect id="Retângulo_66" data-name="Retângulo 66" width="1.671" height="2.506" transform="translate(10.86 30.074)" fill="#4f076b"/><rect id="Retângulo_67" data-name="Retângulo 67" width="1.671" height="2.506" transform="translate(14.202 30.074)" fill="#4f076b"/><rect id="Retângulo_68" data-name="Retângulo 68" width="1.671" height="2.506" transform="translate(17.543 30.074)" fill="#4f076b"/><rect id="Retângulo_69" data-name="Retângulo 69" width="1.671" height="2.506" transform="translate(20.885 30.074)" fill="#4f076b"/><rect id="Retângulo_70" data-name="Retângulo 70" width="1.67" height="2.506" transform="translate(27.569 30.074)" fill="#4f076b"/><rect id="Retângulo_71" data-name="Retângulo 71" width="1.671" height="2.506" transform="translate(30.91 30.074)" fill="#4f076b"/><rect id="Retângulo_72" data-name="Retângulo 72" width="1.671" height="2.506" transform="translate(34.252 30.074)" fill="#4f076b"/><rect id="Retângulo_73" data-name="Retângulo 73" width="1.671" height="2.506" transform="translate(37.593 30.074)" fill="#4f076b"/><rect id="Retângulo_74" data-name="Retângulo 74" width="1.671" height="2.506" transform="translate(40.935 30.074)" fill="#4f076b"/><rect id="Retângulo_75" data-name="Retângulo 75" width="1.671" height="23.392" transform="translate(28.404 5.012)" fill="#4f076b"/></g></svg>';
            },          
            getIconCardFront: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="284" height="203.508" viewBox="0 0 284 203.508"><defs><filter id="a" x="0" y="0" width="284" height="184" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="b"/><feFlood flood-opacity="0.439"/><feComposite operator="in" in2="b"/><feComposite in="SourceGraphic"/></filter><linearGradient id="c" x1="0.957" y1="0.357" x2="-0.157" y2="0.705" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fad07b"/><stop offset="1" stop-color="#fbb039"/></linearGradient><linearGradient id="d" x1="-1.93" y1="1.956" x2="0.264" y2="0.641" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#825523"/><stop offset="1" stop-color="#d0b371"/></linearGradient><linearGradient id="e" x1="-0.807" y1="3.217" x2="0.067" y2="1.4" xlink:href="#d"/><linearGradient id="f" x1="-1.336" y1="3.036" x2="-0.133" y2="1.18" xlink:href="#d"/><linearGradient id="g" x1="-0.13" y1="1.533" x2="0.745" y2="0.099" xlink:href="#d"/><linearGradient id="h" x1="-0.332" y1="2.45" x2="0.813" y2="0.071" xlink:href="#d"/><linearGradient id="i" x1="-2.002" y1="36.516" x2="-0.385" y2="13.236" xlink:href="#d"/><linearGradient id="j" x1="-1.868" y1="34.588" x2="-0.251" y2="11.308" xlink:href="#d"/><linearGradient id="k" x1="-0.734" y1="18.317" x2="0.883" y2="-5.026" xlink:href="#d"/><linearGradient id="l" x1="-0.601" y1="16.372" x2="1.017" y2="-6.95" xlink:href="#d"/><linearGradient id="m" x1="0.019" y1="0.769" x2="1.024" y2="0.207" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#666"/></linearGradient><radialGradient id="n" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#d8d8d8"/><stop offset="1" stop-color="#fff"/></radialGradient></defs><g transform="translate(-1531 -320.492)"><g transform="translate(20 80.492)"><g transform="matrix(1, 0, 0, 1, 1511, 240)" filter="url(#a)"><rect class="back-card-custom" width="266" height="166" rx="7" transform="translate(9 6)" fill="#561271"/></g><g transform="translate(1548.743 272.646)"><g transform="translate(71.16 72.75)"><path d="M93.735,39.307,92.7,36.141h.442l.493,1.562c.139.423.256.809.339,1.181h.009c.088-.367.223-.767.363-1.181l.535-1.562h.437l-1.134,3.166Z" transform="translate(-92.698 -36.118)" fill="#fff"/><path d="M93.974,38.312l-.33.995h-.418L94.3,36.141h.493l1.079,3.166h-.437l-.335-.995Zm1.037-.321L94.7,37.08c-.07-.2-.121-.4-.167-.576h-.009c-.046.186-.1.381-.158.572l-.311.916Z" transform="translate(-90.771 -36.118)" fill="#fff"/><path d="M93.895,36.141H94.3v2.822h1.353v.344H93.895Z" transform="translate(-88.33 -36.118)" fill="#fff"/><path d="M94.781,36.141v3.166h-.409V36.141Z" transform="translate(-86.59 -36.118)" fill="#fff"/><path d="M94.613,36.2a5.876,5.876,0,0,1,.869-.065,1.812,1.812,0,0,1,1.278.4,1.457,1.457,0,0,1,.451,1.139,1.682,1.682,0,0,1-.456,1.227,1.952,1.952,0,0,1-1.4.456,6.614,6.614,0,0,1-.739-.037Zm.409,2.8a2.58,2.58,0,0,0,.414.023,1.217,1.217,0,0,0,1.348-1.344A1.129,1.129,0,0,0,95.5,36.461a2.316,2.316,0,0,0-.479.042Z" transform="translate(-85.71 -36.136)" fill="#fff"/><path d="M93.734,37.7h-.962v-.349h2.343V37.7h-.967v2.817h-.414Z" transform="translate(-92.428 -31.695)" fill="#fff"/><path d="M93.761,37.353v1.325h1.529V37.353H95.7v3.166h-.414V39.036H93.761v1.483h-.409V37.353Z" transform="translate(-90.312 -31.695)" fill="#fff"/><path d="M94.01,37.413a4.321,4.321,0,0,1,.786-.065,1.285,1.285,0,0,1,.916.26.783.783,0,0,1,.246.6.833.833,0,0,1-.6.809v.009a.792.792,0,0,1,.465.642,5.183,5.183,0,0,0,.242.869h-.418a3.987,3.987,0,0,1-.214-.758c-.093-.437-.26-.6-.632-.614h-.386v1.371H94.01Zm.409,1.441h.418c.437,0,.711-.237.711-.6,0-.409-.293-.586-.725-.59a1.681,1.681,0,0,0-.4.037Z" transform="translate(-87.911 -31.714)" fill="#fff"/><path d="M94.966,37.353v1.873c0,.707.316,1.009.739,1.009.47,0,.767-.307.767-1.009V37.353h.414V39.2c0,.972-.511,1.371-1.195,1.371-.651,0-1.139-.372-1.139-1.353V37.353Z" transform="translate(-85.933 -31.695)" fill="#fff"/></g><path class="chip-card" d="M111.853,55.608H82.426a4.994,4.994,0,0,1-4.993-4.993V25.521a4.994,4.994,0,0,1,4.993-4.993h29.427a4.956,4.956,0,0,1,3.528,1.464,5.118,5.118,0,0,1,1.209,1.948,5,5,0,0,1,.256,1.581V50.615A4.994,4.994,0,0,1,111.853,55.608Z" transform="translate(-77.238 -20.337)" fill="url(#c) !important;"/><g transform="translate(193.217 7.899)"><g transform="translate(0 5.207)"><path d="M119.068,24.747a7.08,7.08,0,0,1,0,5.727,1,1,0,0,0,.344,1.32.969.969,0,0,0,1.32-.344,9.166,9.166,0,0,0,0-7.675.969.969,0,0,0-1.32-.344.984.984,0,0,0-.344,1.316Z" transform="translate(-118.953 -23.306)" fill="#fff"/></g><g transform="translate(4.031 3.359)"><path d="M119.944,24.449a11.414,11.414,0,0,1,.916,5.355,12.1,12.1,0,0,1-.446,2.543c-.088.293-.181.586-.288.879-.047.126-.093.246-.144.372.1-.237-.014.033-.037.079a1.065,1.065,0,0,0,.367,1.409,1.038,1.038,0,0,0,1.409-.372,13.775,13.775,0,0,0,0-11.306,1.039,1.039,0,0,0-1.409-.367,1.056,1.056,0,0,0-.367,1.409Z" transform="translate(-119.821 -22.909)" fill="#fff"/></g><g transform="translate(8.574 1.292)"><path d="M120.855,23.724a23.1,23.1,0,0,1,0,13.923c-.4,1.264,1.581,1.808,1.985.544a25,25,0,0,0,0-15.016c-.414-1.251-2.4-.716-1.985.549Z" transform="translate(-120.798 -22.464)" fill="#fff"/></g><g transform="translate(13.012)"><path d="M121.807,23.529a27.3,27.3,0,0,1,0,16.266c-.418,1.348,1.692,1.925,2.111.581a29.431,29.431,0,0,0,0-17.429c-.418-1.339-2.529-.767-2.111.581Z" transform="translate(-121.752 -22.186)" fill="#fff"/></g></g><g transform="translate(0.195 6.034)" style="mix-blend-mode:multiply;isolation:isolate"><g transform="translate(12.027 5.016)"><path d="M91.084,22.864H84.311a4.3,4.3,0,0,0-4.291,4.3v6.769a4.3,4.3,0,0,0,4.291,4.3h6.773a4.3,4.3,0,0,0,4.3-4.3V27.16A4.3,4.3,0,0,0,91.084,22.864Zm3.784,11.064a3.787,3.787,0,0,1-3.784,3.784H84.311a3.787,3.787,0,0,1-3.78-3.784V27.16a3.787,3.787,0,0,1,3.78-3.784h6.773a3.787,3.787,0,0,1,3.784,3.784Z" transform="translate(-80.02 -22.864)" fill="url(#d)"/></g><g transform="translate(24.527)"><path d="M87,29.785A3.786,3.786,0,0,1,83.22,26h-.511A4.3,4.3,0,0,0,87,30.3h10.59v-.511Z" transform="translate(-82.709 -6.387)" fill="url(#e)"/><path d="M83.969,23.045a4.415,4.415,0,0,0-1.26,3.036v1.492h.511V26.081a3.871,3.871,0,0,1,1.111-2.673A3.748,3.748,0,0,1,87,22.3h10.59v-.511H87A4.25,4.25,0,0,0,83.969,23.045Z" transform="translate(-82.709 -21.785)" fill="url(#f)"/></g><path d="M88.023,22.3a3.791,3.791,0,0,1,3.784,3.784v1.144h.507V26.081a4.3,4.3,0,0,0-4.291-4.3H77.433V22.3Z" transform="translate(-77.433 -21.785)" fill="url(#g)"/><path d="M91.059,29.044a4.49,4.49,0,0,0,.7-.916,4.37,4.37,0,0,0,.558-2.12l-.507,0a3.926,3.926,0,0,1-.5,1.873,3.721,3.721,0,0,1-.614.8,4.187,4.187,0,0,1-2.673,1.106H77.433V30.3h10.6A4.736,4.736,0,0,0,91.059,29.044Z" transform="translate(-77.433 -6.391)" fill="url(#h)"/><g transform="translate(27.131 8.8)"><path d="M83.269,23.678v.511H95.551v-.511Z" transform="translate(-83.269 -23.678)" fill="url(#i)"/></g><g transform="translate(27.131 15.123)"><path d="M83.269,25.038v.511H95.551v-.511Z" transform="translate(-83.269 -25.038)" fill="url(#j)"/></g><g transform="translate(0 8.801)"><rect width="12.281" height="0.51" fill="url(#k)"/></g><g transform="translate(0 15.122)"><rect width="12.281" height="0.51" fill="url(#l)"/></g></g><g transform="translate(0)"><path d="M112.006,55.948H82.579a5.192,5.192,0,0,1-5.188-5.183V25.67a5.192,5.192,0,0,1,5.188-5.183h29.427A5.167,5.167,0,0,1,115.674,22a5.4,5.4,0,0,1,1.251,2.027,5.163,5.163,0,0,1,.265,1.641V50.765A5.188,5.188,0,0,1,112.006,55.948ZM82.579,20.873a4.807,4.807,0,0,0-4.8,4.8V50.765a4.807,4.807,0,0,0,4.8,4.8h29.427a4.8,4.8,0,0,0,4.8-4.8V25.67a4.667,4.667,0,0,0-.242-1.52,5.05,5.05,0,0,0-1.162-1.873,4.764,4.764,0,0,0-3.394-1.4Z" transform="translate(-77.391 -20.487)" fill="url(#m)"/></g></g></g><ellipse cx="131" cy="8" rx="131" ry="8" transform="translate(1544 508)" fill="url(#n)"/></g></svg>';
            },          
            getIconCardBack: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="269.748" height="161.627" viewBox="0 0 269.748 161.627"><defs><filter id="a" x="0" y="0" width="269.748" height="161.627" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="b"/><feFlood flood-opacity="0.439"/><feComposite operator="in" in2="b"/><feComposite in="SourceGraphic"/></filter></defs><g transform="translate(8737 17519.508)"><g transform="matrix(1, 0, 0, 1, -8737, -17519.51)" filter="url(#a)"><rect class="back-card-custom" width="251.748" height="143.627" rx="7" transform="translate(9 6)" fill="#561271"/></g><rect width="252" height="32" transform="translate(-8728 -17496)" fill="#363636"/><rect width="224" height="24" transform="translate(-8715 -17459)" fill="#fff"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17455.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17455.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17453.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17450.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17448.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17445.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17441.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17438.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17436.5)" fill="#f1f1f1"/><path d="M140,.5H0v-1H140Z" transform="translate(-8712.5 -17443.5)" fill="#f1f1f1"/><g transform="translate(-5.908 -115.126)"><path d="M-466.225,314.84a2.32,2.32,0,0,0-1.642.683l-.537.543.792,1.68a1.536,1.536,0,0,0,2.038.728.805.805,0,0,0,.128-.07l-.173-.166a.353.353,0,0,1-.013-.5.355.355,0,0,1,.5-.016l0,0,.192.185a1.527,1.527,0,0,0,.236-.818v-.728a1.527,1.527,0,0,0-1.527-1.527Z" transform="translate(-8088.653 -17646.525)" fill="#747474"/><path d="M-476.292,318.425l1.341-1.354-.326-.677Z" transform="translate(-8082.872 -17647.664)" fill="#747474"/><path d="M-476.521,292.809h-.888V291.62a4.155,4.155,0,0,0-4.151-4.158h-.007a4.153,4.153,0,0,0-4.152,4.154v1.192h-.894a.294.294,0,0,0-.294.294h0v7.423a1.186,1.186,0,0,0,1.184,1.188h8.313a1.186,1.186,0,0,0,1.188-1.184V293.1a.294.294,0,0,0-.294-.294Zm-7.416-1.189a2.37,2.37,0,0,1,2.4-2.338h.006a2.372,2.372,0,0,1,2.338,2.338v1.188h-4.746Zm6.285,7.525a.373.373,0,0,1-.262.108.353.353,0,0,1-.243-.1l-.377-.364a2.137,2.137,0,0,1-1.252.4,2.169,2.169,0,0,1-1.961-1.239l-.7-1.469-2.587,2.614a.3.3,0,0,1-.223.1.321.321,0,0,1-.326-.315v-.005a.256.256,0,0,1,.039-.141l2.21-4.42a.318.318,0,0,1,.281-.179h.006a.315.315,0,0,1,.287.185l.5,1.06.364-.371a2.973,2.973,0,0,1,2.1-.875,2.167,2.167,0,0,1,2.164,2.165v.728a2.169,2.169,0,0,1-.409,1.265l.364.351a.353.353,0,0,1,.014.5h0Z" transform="translate(-8075.092 -17626.463)" fill="#747474"/></g></g></svg>';
            },
            getIconSub: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="47.856" height="47.856" viewBox="0 0 47.856 47.856"><defs><filter id="Elipse_109" x="0" y="0" width="47.856" height="47.856" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-opacity="0.161"/><feComposite operator="in" in2="blur"/><feComposite in="SourceGraphic"/></filter></defs><g id="Grupo_4193" data-name="Grupo 4193" transform="translate(9 6)"><g transform="matrix(1, 0, 0, 1, -9, -6)" filter="url(#Elipse_109)"><circle id="Elipse_109-2" data-name="Elipse 109" cx="14.928" cy="14.928" r="14.928" transform="translate(9 6)" fill="#68118a"/></g><line id="Linha_15" data-name="Linha 15" x2="12.796" transform="translate(8.104 14.928)" fill="none" stroke="#fff" stroke-width="2"/></g></svg>';
            },
            getIconSum: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="47.856" height="47.856" viewBox="0 0 47.856 47.856"><defs><filter id="Elipse_110" x="0" y="0" width="47.856" height="47.856" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-opacity="0.161"/><feComposite operator="in" in2="blur"/><feComposite in="SourceGraphic"/></filter></defs><g id="Grupo_4194" data-name="Grupo 4194" transform="translate(9 6)"><g transform="matrix(1, 0, 0, 1, -9, -6)" filter="url(#Elipse_110)"><circle id="Elipse_110-2" data-name="Elipse 110" cx="14.928" cy="14.928" r="14.928" transform="translate(9 6)" fill="#68118a"/></g><g id="Grupo_4192" data-name="Grupo 4192" transform="translate(8.53 8.53)"><line id="Linha_17" data-name="Linha 17" x2="12.796" transform="translate(0 6.398)" fill="none" stroke="#fff" stroke-width="2"/><line id="Linha_18" data-name="Linha 18" x2="12.796" transform="translate(6.398 0) rotate(90)" fill="none" stroke="#fff" stroke-width="2"/></g></g></svg>';
            },
            getIconBarCode: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_barcode_white;
            },
            getIconCard: function() {
                return '<svg id="Grupo_5018" data-name="Grupo 5018" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="62.933" height="48.025" viewBox="0 0 62.933 48.025"><defs><radialGradient id="radial-gradient" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#ac73c2"/><stop offset="1" stop-color="#a564bf"/></radialGradient></defs><g id="Grupo_2557" data-name="Grupo 2557" transform="translate(0 10.459)"><g id="Grupo_2553" data-name="Grupo 2553"><path id="Caminho_1645" data-name="Caminho 1645" d="M582.409,327.693H532.864c-2.359,0-3.3,1.932-3.3,4.3v2.63H585.7v-2.63C585.7,329.625,584.773,327.693,582.409,327.693Z" transform="translate(-529.561 -327.693)" fill="#4f076b"/><path id="Caminho_1646" data-name="Caminho 1646" d="M529.561,352.482c0,2.364.943,4.3,3.3,4.3h49.545c2.364,0,3.295-1.937,3.295-4.3V333.238H529.561Zm27.816-14.3h24.609a.787.787,0,0,1,0,1.547H557.377a.787.787,0,0,1,0-1.547Zm0,4.025h24.609a.787.787,0,0,1,0,1.548H557.377a.787.787,0,0,1,0-1.548Zm0,4.023h24.609a.787.787,0,0,1,0,1.547H557.377a.786.786,0,0,1,0-1.547Zm0,4.025h24.609a.787.787,0,0,1,0,1.547H557.377a.787.787,0,0,1,0-1.547Zm-24.45-10.662a1.589,1.589,0,0,1,1.588-1.59h16.339a1.589,1.589,0,0,1,1.588,1.59v8.187a1.59,1.59,0,0,1-1.588,1.593H534.515a1.59,1.59,0,0,1-1.588-1.593Z" transform="translate(-529.561 -319.217)" fill="#4f076b"/></g></g><g id="Grupo_5015" data-name="Grupo 5015" transform="translate(33.267)"><circle id="Elipse_1" data-name="Elipse 1" cx="14.833" cy="14.833" r="14.833" fill="url(#radial-gradient)"/><text id="_12x" data-name="12x" transform="translate(3.584 18.646)" fill="#fff" font-size="14" font-family="SegoeUI-Bold, Segoe UI" font-weight="700"><tspan x="0" y="0">12x</tspan></text></g></svg>';
            },             
            getIconTwoCards: function() {
                return '<svg id="Grupo_6489" data-name="Grupo 6489" xmlns="http://www.w3.org/2000/svg" width="27.73" height="26.612" viewBox="0 0 27.73 26.612"><path id="Caminho_9528" data-name="Caminho 9528" d="M43.09,423.214a1.848,1.848,0,0,0-2.5-.8l-17.929,9.252a1.849,1.849,0,0,0-.8,2.5l.571,1.113,21.223-10.954Z" transform="translate(-21.66 -422.209)" fill="#561271"/><path id="Caminho_9529" data-name="Caminho 9529" d="M24.83,435.686c0-4.605,0-4.482,0-4.6l-1.877.968Z" transform="translate(-20.799 -416.317)" fill="#561271"/><path id="Caminho_9530" data-name="Caminho 9530" d="M44.523,432.641a1.858,1.858,0,0,0-.083-1.506l-3.123-6.051-14.046,7.249C44.741,432.333,43.752,432.217,44.523,432.641Z" transform="translate(-17.935 -420.301)" fill="#561271"/><path id="Caminho_9531" data-name="Caminho 9531" d="M45.327,429.63H26.6a2.464,2.464,0,0,0-2.328,2.572v9.124A2.46,2.46,0,0,0,26.6,443.9H45.327a2.46,2.46,0,0,0,2.329-2.569V432.2A2.464,2.464,0,0,0,45.327,429.63Zm-12,10.6.29-.276-.28-.288a.17.17,0,1,1,.243-.238l.283.286.283-.279a.173.173,0,0,1,.245,0,.176.176,0,0,1,0,.245l-.286.278.28.289a.171.171,0,0,1-.245.238l-.285-.286-.283.278a.173.173,0,0,1-.243,0A.176.176,0,0,1,33.331,440.225Zm1.449,0,.285-.276-.275-.288a.171.171,0,1,1,.245-.238l.28.286.286-.279a.169.169,0,0,1,.241,0,.16.16,0,0,1,.047.107c0,.116-.018.106-.334.416l.28.289a.148.148,0,0,1,.043.1.249.249,0,0,0,0,.035.155.155,0,0,1-.052.1.173.173,0,0,1-.243,0l-.278-.286-.286.278a.171.171,0,0,1-.241,0A.173.173,0,0,1,34.78,440.225Zm1.256.1c.013-.088.068-.113.338-.373l-.28-.288a.172.172,0,0,1,.007-.244.168.168,0,0,1,.236.007l.28.286.288-.279c.166-.165.4.091.24.245l-.288.278.283.289a.173.173,0,0,1-.25.238l-.278-.286-.288.278a.171.171,0,0,1-.241,0,.135.135,0,0,1-.043-.1A.473.473,0,0,0,36.037,440.322Zm2.557-.647-.288.278.281.289c.16.16-.088.394-.246.238l-.281-.286-.283.278a.172.172,0,0,1-.241-.246l.285-.276-.28-.288a.172.172,0,0,1,.25-.238l.278.286.288-.279a.165.165,0,0,1,.238,0A.175.175,0,0,1,38.594,439.674Zm-9.895.707c0-.033,0,0,0-.052.01-.1.067-.12.336-.381-.288-.3-.326-.311-.324-.411a.169.169,0,0,1,.291-.115l.278.286.289-.279c.158-.165.4.09.236.245l-.285.278.278.289c.161.156-.08.394-.245.238l-.28-.286-.288.278A.171.171,0,0,1,28.7,440.382Zm-2.705-.156.29-.276c-.022-.021-.281-.281-.3-.3a.171.171,0,0,1,.26-.221l.281.286.286-.279a.171.171,0,1,1,.238.245c-.255.248-.188.185-.283.278,0,0,.178.181.281.289.156.16-.092.394-.25.238l-.278-.286-.286.278a.173.173,0,0,1-.243,0A.17.17,0,0,1,25.994,440.225Zm1.451,0,.286-.276-.062-.062-.138-.143-.082-.083a.176.176,0,0,1,0-.244.174.174,0,0,1,.241.007c.1.1.273.276.281.286l.181-.178.1-.1a.173.173,0,0,1,.243,0,.18.18,0,0,1,0,.245l-.288.278c.336.346.314.293.326.424a.173.173,0,0,1-.293.1l-.276-.286-.289.278a.171.171,0,1,1-.238-.246Zm3.807-.551-.281.278.275.289c.161.155-.078.4-.246.238l-.276-.286-.288.278a.171.171,0,0,1-.238-.246l.286-.276-.281-.288a.171.171,0,0,1,.246-.238l.281.286.285-.279a.171.171,0,1,1,.238.245Zm14.307,0-.29.278.28.289c.163.16-.093.394-.241.238l-.283-.286-.283.278a.174.174,0,0,1-.245-.246l.288-.276-.278-.288a.17.17,0,1,1,.243-.238l.28.286.288-.279a.169.169,0,0,1,.241,0A.175.175,0,0,1,45.558,439.674Zm-2.507.551.285-.276-.278-.288a.17.17,0,0,1,.243-.238l.281.286.286-.279a.172.172,0,0,1,.241.245l-.288.278.28.289c.161.16-.092.394-.243.238l-.285-.286-.281.278A.172.172,0,0,1,43.051,440.225Zm-1.306,0,.288-.276-.28-.288a.171.171,0,1,1,.245-.238l.28.286.285-.279a.171.171,0,0,1,.289.09c-.013.141.048.062-.336.433.265.271.318.3.328.386a.173.173,0,0,1-.293.141l-.278-.286-.288.278A.172.172,0,0,1,41.745,440.225Zm-1.447,0,.288-.276-.28-.288a.17.17,0,1,1,.243-.238l.28.286.286-.279a.172.172,0,0,1,.241.245l-.288.278.278.289c.16.153-.083.4-.243.238l-.281-.286-.285.278a.172.172,0,1,1-.24-.246Zm4.015-2.862H41.539a1.335,1.335,0,0,1-1.336-1.333v-1.258a1.335,1.335,0,0,1,1.336-1.331h2.774a1.335,1.335,0,0,1,1.334,1.331v1.258A1.335,1.335,0,0,1,44.312,437.363Z" transform="translate(-19.926 -417.283)" fill="#45364b"/></svg>';
            },              
            getIconCreditTicket: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="27.936" height="28.588" viewBox="0 0 27.936 28.588"><defs><clipPath id="clip-path"><rect id="Retângulo_76" data-name="Retângulo 76" width="21.362" height="17.089" fill="#561271"/></clipPath></defs><g id="Grupo_6497" data-name="Grupo 6497" transform="translate(-49.551 -517.359)"><g id="Grupo_6491" data-name="Grupo 6491" transform="translate(49.551 522.164) rotate(-13)"><rect id="Retângulo_55" data-name="Retângulo 55" width="0.712" height="11.749" transform="translate(1.78 2.136)" fill="#561271"/><rect id="Retângulo_56" data-name="Retângulo 56" width="1.068" height="9.969" transform="translate(3.56 2.136)" fill="#561271"/><rect id="Retângulo_57" data-name="Retângulo 57" width="0.712" height="9.969" transform="translate(5.696 2.136)" fill="#561271"/><rect id="Retângulo_58" data-name="Retângulo 58" width="1.068" height="9.969" transform="translate(7.121 2.136)" fill="#561271"/><rect id="Retângulo_59" data-name="Retângulo 59" width="0.712" height="9.969" transform="translate(8.901 2.136)" fill="#561271"/><g id="Grupo_112" data-name="Grupo 112" transform="translate(0 0)"><g id="Grupo_111" data-name="Grupo 111" clip-path="url(#clip-path)"><path id="Caminho_68" data-name="Caminho 68" d="M.357,0A.336.336,0,0,0,0,.356v1.78H.713V.712H2.137V0Z" transform="translate(-0.001 0)" fill="#561271"/><rect id="Retângulo_60" data-name="Retângulo 60" width="0.712" height="11.749" transform="translate(10.325 2.136)" fill="#561271"/><rect id="Retângulo_61" data-name="Retângulo 61" width="1.068" height="9.969" transform="translate(13.529 2.136)" fill="#561271"/><rect id="Retângulo_62" data-name="Retângulo 62" width="0.712" height="9.969" transform="translate(15.665 2.136)" fill="#561271"/><rect id="Retângulo_63" data-name="Retângulo 63" width="1.068" height="9.969" transform="translate(17.089 2.136)" fill="#561271"/><rect id="Retângulo_64" data-name="Retângulo 64" width="0.712" height="11.749" transform="translate(18.869 2.136)" fill="#561271"/><path id="Caminho_69" data-name="Caminho 69" d="M.713,53.078V51.654H0v1.78a.336.336,0,0,0,.356.356h1.78v-.712Z" transform="translate(-0.001 -36.701)" fill="#561271"/><path id="Caminho_70" data-name="Caminho 70" d="M67.838,51.654v1.424H66.414v.712h1.78a.336.336,0,0,0,.356-.356v-1.78Z" transform="translate(-47.189 -36.701)" fill="#561271"/><path id="Caminho_71" data-name="Caminho 71" d="M68.194,0h-1.78V.712h1.424V2.136h.712V.356A.336.336,0,0,0,68.194,0" transform="translate(-47.189 0)" fill="#561271"/><rect id="Retângulo_65" data-name="Retângulo 65" width="0.712" height="1.068" transform="translate(3.204 12.817)" fill="#561271"/><rect id="Retângulo_66" data-name="Retângulo 66" width="0.712" height="1.068" transform="translate(4.628 12.817)" fill="#561271"/><rect id="Retângulo_67" data-name="Retângulo 67" width="0.712" height="1.068" transform="translate(6.052 12.817)" fill="#561271"/><rect id="Retângulo_68" data-name="Retângulo 68" width="0.712" height="1.068" transform="translate(7.476 12.817)" fill="#561271"/><rect id="Retângulo_69" data-name="Retângulo 69" width="0.712" height="1.068" transform="translate(8.901 12.817)" fill="#561271"/><rect id="Retângulo_70" data-name="Retângulo 70" width="0.712" height="1.068" transform="translate(11.749 12.817)" fill="#561271"/><rect id="Retângulo_71" data-name="Retângulo 71" width="0.712" height="1.068" transform="translate(13.173 12.817)" fill="#561271"/><rect id="Retângulo_72" data-name="Retângulo 72" width="0.712" height="1.068" transform="translate(14.597 12.817)" fill="#561271"/><rect id="Retângulo_73" data-name="Retângulo 73" width="0.712" height="1.068" transform="translate(16.021 12.817)" fill="#561271"/><rect id="Retângulo_74" data-name="Retângulo 74" width="0.712" height="1.068" transform="translate(17.445 12.817)" fill="#561271"/><rect id="Retângulo_75" data-name="Retângulo 75" width="0.712" height="9.969" transform="translate(12.105 2.136)" fill="#561271"/></g></g></g><g id="Grupo_6490" data-name="Grupo 6490" transform="translate(49.756 519.334)"><path id="Caminho_9531" data-name="Caminho 9531" d="M45.327,429.63H26.6a2.464,2.464,0,0,0-2.328,2.572v9.124A2.46,2.46,0,0,0,26.6,443.9H45.327a2.46,2.46,0,0,0,2.329-2.569V432.2A2.464,2.464,0,0,0,45.327,429.63Zm-12,10.6.29-.276-.28-.288a.17.17,0,1,1,.243-.238l.283.286.283-.279a.173.173,0,0,1,.245,0,.176.176,0,0,1,0,.245l-.286.278.28.289a.171.171,0,0,1-.245.238l-.285-.286-.283.278a.173.173,0,0,1-.243,0A.176.176,0,0,1,33.331,440.225Zm1.449,0,.285-.276-.275-.288a.171.171,0,1,1,.245-.238l.28.286.286-.279a.169.169,0,0,1,.241,0,.16.16,0,0,1,.047.107c0,.116-.018.106-.334.416l.28.289a.148.148,0,0,1,.043.1.249.249,0,0,0,0,.035.155.155,0,0,1-.052.1.173.173,0,0,1-.243,0l-.278-.286-.286.278a.171.171,0,0,1-.241,0A.173.173,0,0,1,34.78,440.225Zm1.256.1c.013-.088.068-.113.338-.373l-.28-.288a.172.172,0,0,1,.007-.244.168.168,0,0,1,.236.007l.28.286.288-.279c.166-.165.4.091.24.245l-.288.278.283.289a.173.173,0,0,1-.25.238l-.278-.286-.288.278a.171.171,0,0,1-.241,0,.135.135,0,0,1-.043-.1A.473.473,0,0,0,36.037,440.322Zm2.557-.647-.288.278.281.289c.16.16-.088.394-.246.238l-.281-.286-.283.278a.172.172,0,0,1-.241-.246l.285-.276-.28-.288a.172.172,0,0,1,.25-.238l.278.286.288-.279a.165.165,0,0,1,.238,0A.175.175,0,0,1,38.594,439.674Zm-9.895.707c0-.033,0,0,0-.052.01-.1.067-.12.336-.381-.288-.3-.326-.311-.324-.411a.169.169,0,0,1,.291-.115l.278.286.289-.279c.158-.165.4.09.236.245l-.285.278.278.289c.161.156-.08.394-.245.238l-.28-.286-.288.278A.171.171,0,0,1,28.7,440.382Zm-2.705-.156.29-.276c-.022-.021-.281-.281-.3-.3a.171.171,0,0,1,.26-.221l.281.286.286-.279a.171.171,0,1,1,.238.245c-.255.248-.188.185-.283.278,0,0,.178.181.281.289.156.16-.092.394-.25.238l-.278-.286-.286.278a.173.173,0,0,1-.243,0A.17.17,0,0,1,25.994,440.225Zm1.451,0,.286-.276-.062-.062-.138-.143-.082-.083a.176.176,0,0,1,0-.244.174.174,0,0,1,.241.007c.1.1.273.276.281.286l.181-.178.1-.1a.173.173,0,0,1,.243,0,.18.18,0,0,1,0,.245l-.288.278c.336.346.314.293.326.424a.173.173,0,0,1-.293.1l-.276-.286-.289.278a.171.171,0,1,1-.238-.246Zm3.807-.551-.281.278.275.289c.161.155-.078.4-.246.238l-.276-.286-.288.278a.171.171,0,0,1-.238-.246l.286-.276-.281-.288a.171.171,0,0,1,.246-.238l.281.286.285-.279a.171.171,0,1,1,.238.245Zm14.307,0-.29.278.28.289c.163.16-.093.394-.241.238l-.283-.286-.283.278a.174.174,0,0,1-.245-.246l.288-.276-.278-.288a.17.17,0,1,1,.243-.238l.28.286.288-.279a.169.169,0,0,1,.241,0A.175.175,0,0,1,45.558,439.674Zm-2.507.551.285-.276-.278-.288a.17.17,0,0,1,.243-.238l.281.286.286-.279a.172.172,0,0,1,.241.245l-.288.278.28.289c.161.16-.092.394-.243.238l-.285-.286-.281.278A.172.172,0,0,1,43.051,440.225Zm-1.306,0,.288-.276-.28-.288a.171.171,0,1,1,.245-.238l.28.286.285-.279a.171.171,0,0,1,.289.09c-.013.141.048.062-.336.433.265.271.318.3.328.386a.173.173,0,0,1-.293.141l-.278-.286-.288.278A.172.172,0,0,1,41.745,440.225Zm-1.447,0,.288-.276-.28-.288a.17.17,0,1,1,.243-.238l.28.286.286-.279a.172.172,0,0,1,.241.245l-.288.278.278.289c.16.153-.083.4-.243.238l-.281-.286-.285.278a.172.172,0,1,1-.24-.246Zm4.015-2.862H41.539a1.335,1.335,0,0,1-1.336-1.333v-1.258a1.335,1.335,0,0,1,1.336-1.331h2.774a1.335,1.335,0,0,1,1.334,1.331v1.258A1.335,1.335,0,0,1,44.312,437.363Z" transform="translate(-19.926 -417.283)" fill="#45364b"/></g></g></svg>';
            },  
            getArrowRight: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="15.991" viewBox="0 0 8 15.991"><path id="arrow-right" d="M12.5,6l8,8-8,8,0-2,6-6-6-6Z" transform="translate(-12.5 -6)" fill="#b7b7b7" fill-rule="evenodd"/></svg>';
            },                  
            getCardOne: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40.439" height="55" viewBox="0 0 40.439 55"><defs><filter id="Caminho_9599" x="0" y="0" width="40.439" height="55" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-opacity="0.161"/><feComposite operator="in" in2="blur"/><feComposite in="SourceGraphic"/></filter></defs><g id="Grupo_6541" data-name="Grupo 6541" transform="translate(-70.951 -387)"><g transform="matrix(1, 0, 0, 1, 70.95, 387)" filter="url(#Caminho_9599)"><path id="Caminho_9599-2" data-name="Caminho 9599" d="M18.5,0C30.893,0,40.939,8.283,40.939,18.5S30.893,37,18.5,37Z" transform="translate(-9.5 6)" fill="#561271"/></g><text id="_1_" data-name="1ยบ" transform="translate(83 416)" fill="#fff" font-size="15" font-family="SegoeUI-Bold, Segoe UI" font-weight="700"><tspan x="0" y="0">1&ordm;</tspan></text></g></svg>';
            },          
            getCardTwo: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="39.368" height="53.233" viewBox="0 0 39.368 53.233"><defs><filter id="Caminho_9599" x="0" y="0" width="39.368" height="53.233" filterUnits="userSpaceOnUse"><feOffset dy="3" input="SourceAlpha"/><feGaussianBlur stdDeviation="3" result="blur"/><feFlood flood-opacity="0.161"/><feComposite operator="in" in2="blur"/><feComposite in="SourceGraphic"/></filter></defs><g id="Grupo_6541" data-name="Grupo 6541" transform="translate(9 6)"><g transform="matrix(1, 0, 0, 1, -9, -6)" filter="url(#Caminho_9599)"><path id="Caminho_9599-2" data-name="Caminho 9599" d="M18.5,0C30.3,0,39.868,7.887,39.868,17.617S30.3,35.233,18.5,35.233Z" transform="translate(-9.5 6)" fill="#561271"/></g><text id="_2_" data-name="2ยบ" transform="translate(3.172 21.612)" fill="#fff" font-size="13" font-family="SegoeUI-Bold, Segoe UI" font-weight="700"><tspan x="0" y="0">2&ordm;</tspan></text></g></svg>';
            },
            getIconAddressAqpago: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="12.746" height="20.183" viewBox="0 0 12.746 20.183"><g id="Grupo_6409" data-name="Grupo 6409" transform="translate(-0.001 0.001)"><path id="Caminho_9514" data-name="Caminho 9514" d="M399.267,231.171c-.037.056-.073.112-.109.168,1.273.388,2.1,1.026,2.1,1.746,0,1.184-2.243,2.144-5.01,2.144s-5.01-.96-5.01-2.144c0-.713.813-1.344,2.064-1.734l-.111-.172c-2.185.331-3.412,1.6-3.308,2.879.126,1.544,2.285,3.007,6.365,3.007s6.211-1.361,6.365-3.007C402.736,232.777,401.721,231.63,399.267,231.171Z" transform="translate(-389.879 -216.883)" fill="#520a6d"/><path id="Caminho_9515" data-name="Caminho 9515" d="M396.251,233.915s5.8-5.78,5.8-11.214a5.806,5.806,0,1,0-11.611,0C390.445,228.33,396.251,233.915,396.251,233.915ZM391.639,222.7a4.612,4.612,0,1,1,4.612,4.622A4.618,4.618,0,0,1,391.639,222.7Z" transform="translate(-389.879 -216.883)" fill="#520a6d"/></g></svg>';
            },          
            getIconCheck: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_check;
            },          
            getIconArrowDown: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_arrow_down;
            },          
            getLineDashed: function() {
                return window.checkoutConfig.payment[this.getCode()].line_dashed;
            },          
            getMinCc: function() {
                return window.checkoutConfig.payment[this.getCode()].min_cc;
            },          
            getIconRelogio: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="61.068" height="61.209" viewBox="0 0 61.068 61.209"><g id="Grupo_5097" data-name="Grupo 5097" transform="translate(-406.185 -600.67)" opacity="0.2"><path id="Caminho_8424" data-name="Caminho 8424" d="M434.95,643.495a1.946,1.946,0,0,0-1.942,1.949v6.908a1.942,1.942,0,1,0,3.885,0v-6.908A1.946,1.946,0,0,0,434.95,643.495Z" transform="translate(1.897 3.029)" fill="#561271"/><path id="Caminho_8425" data-name="Caminho 8425" d="M436.719,661.879a30.6,30.6,0,1,0-30.534-30.6A30.6,30.6,0,0,0,436.719,661.879Zm0-57.4a26.794,26.794,0,1,1-26.733,26.795A26.795,26.795,0,0,1,436.719,604.481Z" transform="translate(0 0)" fill="#561271"/><path id="Caminho_8426" data-name="Caminho 8426" d="M421.707,629.765a1.946,1.946,0,0,0-1.944-1.947H412.87a1.947,1.947,0,0,0,0,3.893h6.892A1.945,1.945,0,0,0,421.707,629.765Z" transform="translate(0.335 1.92)" fill="#561271"/><path id="Caminho_8427" data-name="Caminho 8427" d="M435.1,635.334a4.764,4.764,0,0,0,4.468-6.371l12.863-12.893a1.548,1.548,0,0,0-2.186-2.192l-12.631,12.659a4.755,4.755,0,1,0-2.513,8.8Z" transform="translate(1.709 0.902)" fill="#561271"/><path id="Caminho_8428" data-name="Caminho 8428" d="M434.95,616.491a1.945,1.945,0,0,0,1.942-1.948v-6.908a1.942,1.942,0,1,0-3.885,0v6.908A1.945,1.945,0,0,0,434.95,616.491Z" transform="translate(1.897 0.355)" fill="#561271"/><path id="Caminho_8429" data-name="Caminho 8429" d="M448.648,629.765a1.945,1.945,0,0,0,1.944,1.947h6.892a1.947,1.947,0,0,0,0-3.893h-6.892A1.946,1.946,0,0,0,448.648,629.765Z" transform="translate(3.003 1.92)" fill="#561271"/></g></svg>';
            },          
            getIconEmail: function() {
                return '<svg id="Grupo_4189" data-name="Grupo 4189" xmlns="http://www.w3.org/2000/svg" width="23.437" height="18.939" viewBox="0 0 23.437 18.939"><path id="Caminho_8372" data-name="Caminho 8372" d="M231.36,225.138a5.276,5.276,0,0,1-.845-.072V232.9l-5.385-4.334a5.114,5.114,0,0,0-1.447-.817,5.086,5.086,0,0,0,1.447-.816l3.4-2.737a4.217,4.217,0,0,1-1.06-1.3l-3.392,2.729a3.355,3.355,0,0,1-4.232,0l-4.634-3.729h11.866a5.286,5.286,0,0,1-.169-1.682H214.095a2.367,2.367,0,0,0-2.362,2.367v10.8a2.368,2.368,0,0,0,2.362,2.368h15.736a2.369,2.369,0,0,0,2.363-2.368v-8.308A5.135,5.135,0,0,1,231.36,225.138ZM213.411,232.9V222.6l5.386,4.334a5.067,5.067,0,0,0,1.446.816,5.1,5.1,0,0,0-1.446.817Zm1.239,1.161,5.2-4.183a3.352,3.352,0,0,1,4.232,0l5.2,4.183Z" transform="translate(-211.733 -216.803)" fill="#561271"/><path id="Caminho_8373" data-name="Caminho 8373" d="M230.982,216.9a3.737,3.737,0,1,0,3.728,3.736A3.732,3.732,0,0,0,230.982,216.9Zm-.027,6.477-.39-2.31-2.281-.43,4.659-1.879Z" transform="translate(-211.274 -216.901)" fill="#561271"/></svg>';
            },          
            getIconAlert: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="35" height="41" viewBox="0 0 35 41"><g id="Grupo_6521" data-name="Grupo 6521" transform="translate(0 6)"><circle id="Elipse_124" data-name="Elipse 124" cx="17.5" cy="17.5" r="17.5" fill="#561271" opacity="0.5"/><text id="_" data-name="!" transform="translate(18 27)" fill="#fff" font-size="31" font-family="SegoeUI-Bold, Segoe UI" font-weight="700"><tspan x="-5.071" y="0">!</tspan></text></g></svg>';
            },          
            getIconCopy: function() {
                return '<svg id="Grupo_5099" data-name="Grupo 5099" xmlns="http://www.w3.org/2000/svg" width="23" height="21" viewBox="0 0 23 21"><g id="Retângulo_769" data-name="Retângulo 769" transform="translate(5)" fill="#561271" stroke="#fff" stroke-width="2"><rect width="18" height="18" rx="3" stroke="none"/><rect x="1" y="1" width="16" height="16" rx="2" fill="none"/></g><g id="Retângulo_770" data-name="Retângulo 770" transform="translate(0 3)" fill="#561271" stroke="#fff" stroke-width="2"><rect width="18" height="18" rx="3" stroke="none"/><rect x="1" y="1" width="16" height="16" rx="2" fill="none"/></g></svg>';
            },              
            getIconScanner: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="15.43" height="11.572" viewBox="0 0 15.43 11.572"><g id="scanner__barcode" transform="translate(0 -3)"><path id="Caminho_10509" data-name="Caminho 10509" d="M21.286,3h-.964a.321.321,0,0,0,0,.643h.964a.644.644,0,0,1,.643.643V5.25a.321.321,0,0,0,.643,0V4.286A1.287,1.287,0,0,0,21.286,3Z" transform="translate(-7.142)" fill="#fff"/><path id="Caminho_10510" data-name="Caminho 10510" d="M.321,5.572A.321.321,0,0,0,.643,5.25V4.286a.644.644,0,0,1,.643-.643H2.25A.321.321,0,1,0,2.25,3H1.286A1.287,1.287,0,0,0,0,4.286V5.25A.321.321,0,0,0,.321,5.572Z" fill="#fff"/><path id="Caminho_10511" data-name="Caminho 10511" d="M22.25,17a.321.321,0,0,0-.321.321v.964a.644.644,0,0,1-.643.643h-.964a.321.321,0,0,0,0,.643h.964a1.287,1.287,0,0,0,1.286-1.286v-.964A.321.321,0,0,0,22.25,17Z" transform="translate(-7.142 -4.999)" fill="#fff"/><path id="Caminho_10512" data-name="Caminho 10512" d="M2.25,18.929H1.286a.644.644,0,0,1-.643-.643v-.964a.321.321,0,0,0-.643,0v.964a1.287,1.287,0,0,0,1.286,1.286H2.25a.321.321,0,0,0,0-.643Z" transform="translate(0 -4.999)" fill="#fff"/><path id="Caminho_10513" data-name="Caminho 10513" d="M3.321,6A.321.321,0,0,0,3,6.321v7.072a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,3.321,6Z" transform="translate(-1.071 -1.071)" fill="#fff"/><path id="Caminho_10514" data-name="Caminho 10514" d="M13.321,6A.321.321,0,0,0,13,6.321v7.072a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,13.321,6Z" transform="translate(-4.642 -1.071)" fill="#fff"/><path id="Caminho_10515" data-name="Caminho 10515" d="M20.321,6A.321.321,0,0,0,20,6.321v7.072a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,20.321,6Z" transform="translate(-7.142 -1.071)" fill="#fff"/><path id="Caminho_10516" data-name="Caminho 10516" d="M6.321,6A.321.321,0,0,0,6,6.321v5.143a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,6.321,6Z" transform="translate(-2.143 -1.071)" fill="#fff"/><path id="Caminho_10517" data-name="Caminho 10517" d="M8.321,6A.321.321,0,0,0,8,6.321v5.143a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,8.321,6Z" transform="translate(-2.857 -1.071)" fill="#fff"/><path id="Caminho_10518" data-name="Caminho 10518" d="M10.321,6A.321.321,0,0,0,10,6.321v5.143a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,10.321,6Z" transform="translate(-3.571 -1.071)" fill="#fff"/><path id="Caminho_10519" data-name="Caminho 10519" d="M15.321,6A.321.321,0,0,0,15,6.321v5.143a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,15.321,6Z" transform="translate(-5.356 -1.071)" fill="#fff"/><path id="Caminho_10520" data-name="Caminho 10520" d="M18.321,6A.321.321,0,0,0,18,6.321v5.143a.321.321,0,1,0,.643,0V6.321A.321.321,0,0,0,18.321,6Z" transform="translate(-6.428 -1.071)" fill="#fff"/><path id="Caminho_10521" data-name="Caminho 10521" d="M18.321,16a.321.321,0,0,0-.321.321v.643a.321.321,0,0,0,.643,0v-.643A.321.321,0,0,0,18.321,16Z" transform="translate(-6.428 -4.642)" fill="#fff"/><path id="Caminho_10522" data-name="Caminho 10522" d="M15.321,16a.321.321,0,0,0-.321.321v.643a.321.321,0,0,0,.643,0v-.643A.321.321,0,0,0,15.321,16Z" transform="translate(-5.356 -4.642)" fill="#fff"/><path id="Caminho_10523" data-name="Caminho 10523" d="M10.321,16a.321.321,0,0,0-.321.321v.643a.321.321,0,0,0,.643,0v-.643A.321.321,0,0,0,10.321,16Z" transform="translate(-3.571 -4.642)" fill="#fff"/><path id="Caminho_10524" data-name="Caminho 10524" d="M8.321,16A.321.321,0,0,0,8,16.321v.643a.321.321,0,0,0,.643,0v-.643A.321.321,0,0,0,8.321,16Z" transform="translate(-2.857 -4.642)" fill="#fff"/><path id="Caminho_10525" data-name="Caminho 10525" d="M6.321,16A.321.321,0,0,0,6,16.321v.643a.321.321,0,0,0,.643,0v-.643A.321.321,0,0,0,6.321,16Z" transform="translate(-2.143 -4.642)" fill="#fff"/><path id="Caminho_10526" data-name="Caminho 10526" d="M15.108,11H.321a.321.321,0,1,0,0,.643H15.108a.321.321,0,1,0,0-.643Z" transform="translate(0 -2.857)" fill="#fff"/><path id="Caminho_10527" data-name="Caminho 10527" d="M4.179,11.358a.321.321,0,0,0-.321.321v.643a.321.321,0,1,0,.643,0v-.643A.321.321,0,0,0,4.179,11.358Zm1.286,0a.321.321,0,0,0-.321.321v.643a.321.321,0,1,0,.643,0v-.643A.321.321,0,0,0,5.465,11.358Zm1.286,0a.321.321,0,0,0-.321.321v.643a.321.321,0,1,0,.643,0v-.643A.321.321,0,0,0,6.75,11.358Zm-4.5,2.572H1.286a.644.644,0,0,1-.643-.643v-.964a.321.321,0,1,0-.643,0v.964a1.287,1.287,0,0,0,1.286,1.286H2.25a.321.321,0,0,0,0-.643ZM.321,5.572A.321.321,0,0,0,.643,5.25V4.286a.644.644,0,0,1,.643-.643H2.25A.321.321,0,1,0,2.25,3H1.286A1.287,1.287,0,0,0,0,4.286V5.25A.321.321,0,0,0,.321,5.572ZM15.108,8.143H13.5V5.25a.321.321,0,0,0-.643,0V8.143h-.643V5.25a.321.321,0,1,0-.643,0V8.143H10.286V5.25a.321.321,0,1,0-.643,0V8.143H9V5.25a.321.321,0,1,0-.643,0V8.143H7.072V5.25a.321.321,0,0,0-.643,0V8.143H5.786V5.25a.321.321,0,0,0-.643,0V8.143H4.5V5.25a.321.321,0,1,0-.643,0V8.143H2.572V5.25a.321.321,0,0,0-.643,0V8.143H.321a.321.321,0,0,0,0,.643H1.929v3.536a.321.321,0,1,0,.643,0V8.786H3.857v1.607a.321.321,0,1,0,.643,0V8.786h.643v1.607a.321.321,0,1,0,.643,0V8.786h.643v1.607a.321.321,0,1,0,.643,0V8.786H8.358v3.536a.321.321,0,1,0,.643,0V8.786h.643v1.607a.321.321,0,1,0,.643,0V8.786h1.286v1.607a.321.321,0,1,0,.643,0V8.786h.643v3.536a.321.321,0,1,0,.643,0V8.786h1.607a.321.321,0,0,0,0-.643ZM14.144,3H13.18a.321.321,0,1,0,0,.643h.964a.644.644,0,0,1,.643.643V5.25a.321.321,0,0,0,.643,0V4.286A1.287,1.287,0,0,0,14.144,3ZM9.965,11.358a.321.321,0,0,0-.321.321v.643a.321.321,0,1,0,.643,0v-.643A.321.321,0,0,0,9.965,11.358ZM15.108,12a.321.321,0,0,0-.321.321v.964a.644.644,0,0,1-.643.643H13.18a.321.321,0,0,0,0,.643h.964a1.287,1.287,0,0,0,1.286-1.286v-.964A.321.321,0,0,0,15.108,12Zm-3.215-.643a.321.321,0,0,0-.321.321v.643a.321.321,0,1,0,.643,0v-.643A.321.321,0,0,0,11.894,11.358Z" fill="#fff"/></g></svg>';
            },
            getIconPhone: function() {
                return '<svg id="Grupo_4190" data-name="Grupo 4190" xmlns="http://www.w3.org/2000/svg" width="16.957" height="27.318" viewBox="0 0 16.957 27.318"><path id="Caminho_8374" data-name="Caminho 8374" d="M368.939,215.851c-.232-.015-.423.121-.42.284a.37.37,0,0,0,.382.311,5.913,5.913,0,0,1,5.512,5.526c.014.207.146.381.31.382s.3-.188.284-.421A6.51,6.51,0,0,0,368.939,215.851Z" transform="translate(-358.051 -215.85)" fill="#561271"/><path id="Caminho_8375" data-name="Caminho 8375" d="M368.907,217.489a.332.332,0,0,0-.4.279.353.353,0,0,0,.344.313,3.858,3.858,0,0,1,3.491,3.5.353.353,0,0,0,.312.345.332.332,0,0,0,.279-.4A4.448,4.448,0,0,0,368.907,217.489Z" transform="translate(-358.053 -215.41)" fill="#561271"/><path id="Caminho_8376" data-name="Caminho 8376" d="M370.4,219.218l-7.536.005a2.609,2.609,0,0,0-2.6,2.606l.015,17.831a2.609,2.609,0,0,0,2.6,2.6l7.536-.005a2.61,2.61,0,0,0,2.6-2.608L373,221.821A2.608,2.608,0,0,0,370.4,219.218Zm-5.793,1.246,4.049,0a.2.2,0,0,1,.2.2h0a.2.2,0,0,1-.2.2l-4.05,0a.2.2,0,0,1,0-.4Zm-.528,20.058-1.985,0a.206.206,0,0,1,0-.411l1.986,0a.206.206,0,0,1,0,.412Zm2.571.9a1.108,1.108,0,1,1,1.1-1.109A1.107,1.107,0,0,1,366.652,241.425Zm4.539-.9-1.986,0a.206.206,0,0,1,0-.411l1.986,0a.206.206,0,0,1,0,.412Zm.675-1.939H361.41V222.054h10.456Z" transform="translate(-360.269 -214.944)" fill="#561271"/></svg>';
            },          
            getIconEdit: function() {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="21.711" height="20.482" viewBox="0 0 21.711 20.482"><g id="Edit_icon-icons.com_71853" transform="translate(-110.9 -133.444)"><g id="Grupo_6545" data-name="Grupo 6545" transform="translate(110.9 133.626)"><path id="Caminho_9602" data-name="Caminho 9602" d="M128.454,156.3H114.5a3.535,3.535,0,0,1-3.6-3.456V139.456A3.535,3.535,0,0,1,114.5,136h8.511a1.547,1.547,0,1,1,0,3.092H114.5a.371.371,0,0,0-.379.363v13.382a.371.371,0,0,0,.379.363h13.951a.371.371,0,0,0,.379-.363v-7.932a1.613,1.613,0,0,1,3.224,0v7.939A3.535,3.535,0,0,1,128.454,156.3Z" transform="translate(-110.9 -136)" fill="#561271"/></g><g id="Grupo_6549" data-name="Grupo 6549" transform="translate(120.509 133.444)"><g id="Grupo_6546" data-name="Grupo 6546" transform="translate(1.454 2.003)"><rect id="Retângulo_1078" data-name="Retângulo 1078" width="3.617" height="8.243" transform="translate(2.475 8.279) rotate(-133.189)" fill="#561271"/></g><g id="Grupo_6547" data-name="Grupo 6547" transform="translate(7.895 0)"><path id="Caminho_9603" data-name="Caminho 9603" d="M324.331,133.619l1.727,1.84a.549.549,0,0,1-.021.775l-1.549,1.457L322,135.047l1.549-1.457A.558.558,0,0,1,324.331,133.619Z" transform="translate(-322 -133.444)" fill="#561271"/></g><g id="Grupo_6548" data-name="Grupo 6548" transform="translate(0 8.055)"><path id="Caminho_9604" data-name="Caminho 9604" d="M211.923,246.8l2.473,2.636-3.5.8Z" transform="translate(-210.9 -246.8)" fill="#561271"/></g></g></g></svg>';
            },          
            getMoneySvg: function() {
                return window.checkoutConfig.payment[this.getCode()].aqpago_money;
            },
            getFrontCardSvg: function() {
                return window.checkoutConfig.payment[this.getCode()].aqpago_card_front;
            },
            
            getBackCardSvg: function() {
                return window.checkoutConfig.payment[this.getCode()].aqpago_card_back;
            },
            
            getCreditCard: function () {
                return window.checkoutConfig.payment[this.getCode()].creditCard;
            },

            getCreditCard3Ds: function () {
                return window.checkoutConfig.payment[this.getCode()].creditCard3Ds;
            },

            getDebitCard: function () {
                return window.checkoutConfig.payment[this.getCode()].debitCard;
            },
            getVisaCard: function () {
                return window.checkoutConfig.payment[this.getCode()].flag_visa_default;
            },           
            getFlagMasterCard: function () {
                return window.checkoutConfig.payment[this.getCode()].flag_mastercard;
            },
            getIconCardClean: function () {
                return '<svg xmlns="http://www.w3.org/2000/svg" width="25.826" height="15.755" viewBox="0 0 25.826 15.755"><path id="Caminho_9540" data-name="Caminho 9540" d="M47.526,429.63H26.843a2.722,2.722,0,0,0-2.571,2.841v10.077a2.717,2.717,0,0,0,2.571,2.837H47.526a2.717,2.717,0,0,0,2.573-2.837V432.471A2.721,2.721,0,0,0,47.526,429.63Zm-13.249,11.7.32-.305-.309-.318a.188.188,0,1,1,.268-.263l.312.316.312-.309a.191.191,0,0,1,.27,0,.2.2,0,0,1,0,.27l-.316.307.309.32a.189.189,0,0,1-.27.263l-.314-.316-.312.307a.191.191,0,0,1-.268,0A.194.194,0,0,1,34.277,441.331Zm1.6,0,.314-.305-.3-.318a.188.188,0,1,1,.27-.263l.309.316.316-.309a.187.187,0,0,1,.266,0,.177.177,0,0,1,.051.118c0,.129-.02.118-.369.459l.309.32a.164.164,0,0,1,.048.109.275.275,0,0,0,0,.039.171.171,0,0,1-.057.116.191.191,0,0,1-.268,0l-.307-.316-.316.307a.188.188,0,0,1-.266,0A.191.191,0,0,1,35.878,441.331Zm1.387.107c.015-.1.075-.125.373-.412l-.309-.318a.19.19,0,0,1,.007-.27.185.185,0,0,1,.261.007l.309.316.318-.309c.184-.182.437.1.265.27l-.318.307.312.32a.191.191,0,0,1-.276.263L37.9,441.3l-.318.307a.189.189,0,0,1-.266,0,.149.149,0,0,1-.048-.109A.523.523,0,0,0,37.265,441.438Zm2.824-.715-.318.307.311.32c.176.176-.1.436-.272.263L39.5,441.3l-.312.307a.19.19,0,0,1-.266-.272l.314-.305-.309-.318a.19.19,0,0,1,.276-.263l.307.316.318-.309a.183.183,0,0,1,.263,0A.193.193,0,0,1,40.089,440.723Zm-10.928.781c0-.037,0,0,0-.057.011-.107.074-.132.371-.421-.318-.327-.36-.344-.358-.454a.186.186,0,0,1,.322-.127l.307.316.32-.309c.175-.182.443.1.261.27l-.314.307.307.32c.178.173-.088.436-.27.263L29.8,441.3l-.318.307A.189.189,0,0,1,29.162,441.5Zm-2.988-.173.32-.305c-.024-.024-.311-.31-.329-.336a.189.189,0,0,1,.287-.244l.311.316.316-.309a.188.188,0,1,1,.263.27c-.281.274-.208.2-.312.307,0,0,.2.2.311.32.173.176-.1.436-.276.263l-.307-.316-.316.307a.191.191,0,0,1-.268,0A.188.188,0,0,1,26.174,441.331Zm1.6,0,.316-.305-.068-.068-.153-.158-.09-.092a.2.2,0,0,1,.006-.27.192.192,0,0,1,.266.007c.108.11.3.305.311.316l.2-.2.114-.112a.191.191,0,0,1,.268,0,.2.2,0,0,1,0,.27l-.318.307c.371.382.347.323.36.468a.191.191,0,0,1-.323.114l-.305-.316-.32.307a.189.189,0,1,1-.263-.272Zm4.2-.608-.311.307.3.32c.178.171-.086.439-.272.263L31.4,441.3l-.318.307a.189.189,0,0,1-.263-.272l.316-.305-.311-.318a.189.189,0,0,1,.272-.263l.311.316.314-.309a.188.188,0,1,1,.263.27Zm15.8,0-.32.307.309.32c.18.176-.1.436-.266.263l-.312-.316-.312.307a.192.192,0,0,1-.27-.272l.318-.305-.307-.318a.188.188,0,1,1,.268-.263l.309.316.318-.309a.187.187,0,0,1,.266,0A.193.193,0,0,1,47.781,440.723Zm-2.769.608.314-.305-.307-.318a.188.188,0,0,1,.268-.263l.311.316.316-.309a.19.19,0,0,1,.266.27l-.318.307.309.32c.178.176-.1.436-.268.263l-.314-.316-.311.307A.19.19,0,0,1,45.012,441.331Zm-1.442,0,.318-.305-.309-.318a.188.188,0,1,1,.27-.263l.309.316.314-.309a.189.189,0,0,1,.32.1c-.015.156.053.068-.371.478.292.3.351.331.362.426a.191.191,0,0,1-.323.156l-.307-.316-.318.307A.19.19,0,0,1,43.57,441.331Zm-1.6,0,.318-.305-.309-.318a.188.188,0,1,1,.268-.263l.309.316.316-.309a.19.19,0,0,1,.266.27l-.318.307.307.32c.176.169-.092.439-.268.263l-.311-.316-.314.307a.19.19,0,1,1-.265-.272Zm4.434-3.16H43.342a1.475,1.475,0,0,1-1.476-1.472V435.31a1.474,1.474,0,0,1,1.476-1.47H46.4a1.474,1.474,0,0,1,1.474,1.47V436.7A1.474,1.474,0,0,1,46.4,438.171Z" transform="translate(-24.272 -429.63)" fill="#561271"/></svg>';
            },
            openFirstCard: function () {
                
                $('.aqbank_multi_cc_set').hide();
                $('.aqbank_multi_cc_data').slideDown(500);
                
            },
            openMultiOptions: function () {
                $('.aqbank_multi_cc_data').hide();
                $('.aqbank_multi_cc_set').slideDown(500);
                
                $([document.documentElement, document.body]).animate({
                    scrollTop: $(".aqbank-box-multipagamentos").offset().top
                }, 500);
    
            },
            setIntegralPayment: function (method) {
                $('.li-form-payment .active').hide();
                $('.li-form-payment').removeClass('active');
                
                if(method == 'card') {
                    $('.aqbank_payment_boleto').hide();
                    $('.aqbank_payment_pix').hide();
                    $('.aqbank_payment_card').slideDown(900);
                    $('.li-card').addClass('active');
                }
                else if(method == 'pix') {
                    $('.aqbank_payment_boleto').hide();
                    $('.aqbank_payment_card').hide();
                    $('.aqbank_payment_pix').slideDown(900);
                    $('.li-pix').addClass('active');
                }
                else if(method == 'boleto') {
                    $('.aqbank_payment_card').hide();
                    $('.aqbank_payment_pix').hide();
                    $('.aqbank_payment_boleto').slideDown(900);
                    $('.li-boleto').addClass('active');
                }
            },
            removeMask: function(value) {
                return value.replace(/\D/g, '');
            },
            maskcard: function (v, b, d) {
                if(b == 'amex' && d == 15) {
                    v=v.replace(/\D/g,"");
                    v=v.replace(/^(\d{4})(\d)/g,"$1 $2");
                    v=v.replace(/^(\d{4})\s(\d{6})(\d)/g,"$1 $2 $3");
                    v=v.replace(/^(\d{4})\s(\d{6})\s(\d{6})(\d)/g,"$1 $2 $3 $4");
                } 
                else if(b == 'hipercard' && d <= 13) {
                    v=v.replace(/\D/g,"");
                    v=v.replace(/^(\d{4})(\d)/g,"$1 $2");
                    v=v.replace(/^(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3");
                    v=v.replace(/^(\d{4})\s(\d{4})\s(\d{2})(\d)/g,"$1 $2 $3 $4");
                }
                else if(b == 'hipercard' && d > 16 && d <= 19) {
                    v=v.replace(/\D/g,"");
                    v=v.replace(/^(\d{4})(\d)/g,"$1 $2");
                    v=v.replace(/^(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3");
                    v=v.replace(/^(\d{4})\s(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3 $4");
                    v=v.replace(/^(\d{4})\s(\d{4})\s(\d{4})\s(\d{3})(\d)/g,"$1 $2 $3 $4 $5");
                }
                else {  
                    v=v.replace(/\D/g,"");
                    v=v.replace(/^(\d{4})(\d)/g,"$1 $2");
                    v=v.replace(/^(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3");
                    v=v.replace(/^(\d{4})\s(\d{4})\s(\d{4})(\d)/g,"$1 $2 $3 $4");
                }
                return v;
            },
            
            getFormattedPrice: function (price) {
                return priceUtils.formatPrice(price, quote.getPriceFormat());
            },
            getPriceFormat: function () {
                var priceFormat = {
                    decimalSymbol: ',',
                    groupLength: 3,
                    groupSymbol: ".",
                    integerRequired: false,
                    pattern: "%s",
                    precision: 2,
                    requiredPrecision: 2
                };
                
                return priceFormat;
            },
            getGrandTotalSubdivide: function () {
                var maskValue = priceUtils.formatPrice('0.00', this.getPriceFormat());
                maskValue = '00000000' + maskValue;
                $('.aqbank-input-valor').mask(maskValue, {reverse: true});
                return priceUtils.formatPrice( (quote.totals().grand_total / 2).toFixed(2), this.getPriceFormat());
            },
            getGrandTotalCheckout: function () {
                return this.getFormattedPrice( quote.totals().grand_total );
            },
            getNewInstallments: function () {
                var installments = 0;
                var grandTotal = quote.totals().grand_total;
                var number_installments = window.checkoutConfig.payment[this.getCode()].number_installments;
                var min_total_installments = window.checkoutConfig.payment[this.getCode()].min_total_installments;

                if (Math.round(grandTotal / min_total_installments) >= number_installments) {
                    installments = number_installments
                } else {
                    installments = Math.round(grandTotal / min_total_installments)
                }
                
                if(installments <= 0){
                    installments = 1;
                }
                
                function roundNumber(num, scale) {
                    if (!("" + num).includes("e")) {
                        return +(Math.round(num + "e+" + scale) + "e-" + scale);
                    } else {
                        var arr = ("" + num).split("e");
                        var sig = "";
                        if (+arr[1] + scale > 0) {
                            sig = "+";
                        }
                        return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
                    }
                }

                function numberWithCommas(x) {
                    return x.toFixed(2);
                }

                var array_installments = [];
                var installment_total = null;
                
                for (var i = 0; i < installments; i++) {
                    installment_total = roundNumber(grandTotal / (i + 1), 2);
                    array_installments.push({
                        value: i + 1,
                        key: i + 1 + 'x'
                    })
                }
                
                return array_installments;
            },
            getInstallments: function () {
                var installments = 0;
                var grandTotal = quote.totals().grand_total;
                var number_installments = window.checkoutConfig.payment[this.getCode()].number_installments;
                var min_total_installments = window.checkoutConfig.payment[this.getCode()].min_total_installments;

                if (Math.round(grandTotal / min_total_installments) >= number_installments) {
                    installments = number_installments
                } else {
                    installments = Math.round(grandTotal / min_total_installments)
                }

                function roundNumber(num, scale) {
                    if (!("" + num).includes("e")) {
                        return +(Math.round(num + "e+" + scale) + "e-" + scale);
                    } else {
                        var arr = ("" + num).split("e");
                        var sig = "";
                        if (+arr[1] + scale > 0) {
                            sig = "+";
                        }
                        return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
                    }
                }

                function numberWithCommas(x) {
                    return x.toFixed(2);
                }

                var array_installments = [];
                var installment_total = null;
                
                for (var i = 0; i < installments; i++) {
                    installment_total = roundNumber(grandTotal / (i + 1), 2);
                    array_installments.push({
                        value: i + 1,
                        key: i + 1 + 'x de R$ ' + numberWithCommas(installment_total)
                    })
                }
                return array_installments;
            },
            
            hasInstallments: function () {
                return this.debitCard && window.checkoutConfig.payment[this.getCode()].number_installments > 0;
            },

            is3DsEnabled: function () {
                let amount = quote.totals().grand_total;
                let enabled = window.checkoutConfig.payment[this.getCode()]["3ds_enabled"];
                let threshold = window.checkoutConfig.payment[this.getCode()]["3ds_threshold"];

                return enabled && amount >= threshold;
            },

            isDebitEnabled: function () {
                return window.checkoutConfig.payment[this.getCode()].debit_enabled;
            },

            /**
             * Get data
             * @returns {Object}
             */
            getData: function () {
                return {
                    'method': this.item.method,
                    'additional_data': {
                        'ticketUrl': this.ticketUrl(),
                        'payment_order_id': this.payment_order_id(),
                        'exist_erro': this.exist_erro(),
                        'use_two_cards': this.use_two_cards(),
                        'erro_credit': this.erro_credit(),
                        'erro_multi_credit': this.erro_multi_credit(),
                        'erro_multi_ticket': this.erro_multi_ticket(),
                        'card_one_erro': this.card_one_erro(),
                        'card_two_erro': this.card_two_erro(),
                        'type_payment': this.type_payment(),
                        
                        'customer_password': this.customer_password(),
                        'formkeyenc': this.formkeyenc(),
                        
                        'cards': this.cards(),
                        'card_one': this.card_one(),
                        'card_two': this.card_two(),
                        'saved_card_one': this.saved_card_one(),
                        'saved_card_two': this.saved_card_two(),
                        'select_card': this.select_card(),
                        'amount_total': this.amount_total(),
                        'amount_one': this.amount_one(),
                        'amount_two': this.amount_two(),
                        'amount_ticket': this.amount_ticket(),                  
                        
                        'one_cc_flag': this.one_cc_flag(),
                        'one_cc_number': this.one_cc_number(),
                        'one_cc_owner': this.one_cc_owner(),
                        'one_cc_exp_month': this.one_cc_exp_month(),
                        'one_cc_exp_year': this.one_cc_exp_year(),
                        'one_cc_cid': this.one_cc_cid(),
                        'one_cc_document': this.one_cc_document(),
                        'one_cc_amount': this.one_cc_amount(),
                        'one_cc_installments': this.one_cc_installments(),
                        'one_cc_saved': this.one_cc_saved(),
                        'one_cc_number_id': this.one_cc_number_id(),
                        
                        'two_cc_flag': this.two_cc_flag(),
                        'two_cc_number': this.two_cc_number(),
                        'two_cc_owner': this.two_cc_owner(),
                        'two_cc_exp_month': this.two_cc_exp_month(),
                        'two_cc_exp_year': this.two_cc_exp_year(),
                        'two_cc_cid': this.two_cc_cid(),
                        'two_cc_document': this.two_cc_document(),
                        'two_cc_amount': this.two_cc_amount(),
                        'two_cc_installments': this.two_cc_installments(),
                        'two_cc_saved': this.two_cc_saved(),
                        'two_cc_number_id': this.two_cc_number_id(),
                        
                        'ticket_amount': this.ticket_amount(),
                        'ticket_amount_multiple': this.ticket_amount_multiple()
                    }
                };
            },

            /**
             * Get list of available Card types
             * @returns {Object}
             */
            getCcAvailableTypes: function () {
                return window.checkoutConfig.payment.ccform.availableTypes[this.getCode()];
            },

            /**
             * Get payment icons
             * @param {String} type
             * @returns {Boolean}
             */
            getIcons: function (type) {
                return window.checkoutConfig.payment.ccform.icons.hasOwnProperty(type) ?
                    window.checkoutConfig.payment.ccform.icons[type]
                    : false;
            },

            /**
             * Get list of months
             * @returns {Object}
             */
            getCcMonths: function () {
                return window.checkoutConfig.payment.ccform.months[this.getCode()];
            },

            /**
             * Get list of years
             * @returns {Object}
             */
            getCcYears: function () {
                return window.checkoutConfig.payment.ccform.years[this.getCode()];
            },

            /**
             * Check if current payment has verification
             * @returns {Boolean}
             */
            hasVerification: function () {
                return window.checkoutConfig.payment.ccform.hasVerification[this.getCode()];
            },

            /**
             * @deprecated
             * @returns {Boolean}
             */
            hasSsCardType: function () {
                return window.checkoutConfig.payment.ccform.hasSsCardType[this.getCode()];
            },

            /**
             * Get image url for CVV
             * @returns {String}
             */
            getCvvImageUrl: function () {
                return window.checkoutConfig.payment.ccform.cvvImageUrl[this.getCode()];
            },

            /**
             * Get image for CVV
             * @returns {String}
             */
            getCvvImageHtml: function () {
                return '<img src="' + this.getCvvImageUrl() +
                    '" alt="' + $t('Card Verification Number Visual Reference') +
                    '" title="' + $t('Card Verification Number Visual Reference') +
                    '" />';
            },

            /**
             * @deprecated
             * @returns {Object}
             */
            getSsStartYears: function () {
                return window.checkoutConfig.payment.ccform.ssStartYears[this.getCode()];
            },

            /**
             * Get list of available Card types values
             * @returns {Object}
             */
            getCcAvailableTypesValues: function () {
                return _.map(this.getCcAvailableTypes(), function (value, key) {
                    return {
                        'value': key,
                        'type': value
                    };
                });
            },

            /**
             * Get list of available month values
             * @returns {Object}
             */
            getCcMonthsValues: function () {
                return _.map(this.getCcMonths(), function (value, key) {
                    
                    /*
                    value = value.replace('01 - ', '');
                    value = value.replace('02 - ', '');
                    value = value.replace('03 - ', '');
                    value = value.replace('04 - ', '');
                    value = value.replace('05 - ', '');
                    value = value.replace('06 - ', '');
                    value = value.replace('07 - ', '');
                    value = value.replace('08 - ', '');
                    value = value.replace('09 - ', '');
                    value = value.replace('10 - ', '');
                    value = value.replace('11 - ', '');
                    value = value.replace('12 - ', '');
                    value = value.charAt(0).toUpperCase() + value.slice(1);
                    */
                    
                    return {
                        'value': key,
                        'month': value
                    };
                });
            },

            /**
             * Get list of available year values
             * @returns {Object}
             */
            getCcYearsValues: function () {
                return _.map(this.getCcYears(), function (value, key) {
                    return {
                        'value': key,
                        'year': value
                    };
                });
            },

            /**
             * @deprecated
             * @returns {Object}
             */
            getSsStartYearsValues: function () {
                return _.map(this.getSsStartYears(), function (value, key) {
                    return {
                        'value': key,
                        'year': value
                    };
                });
            },

            /**
             * Is legend available to display
             * @returns {Boolean}
             */
            isShowLegend: function () {
                return false;
            },

            /**
             * Get available Card type by code
             * @param {String} code
             * @returns {String}
             */
            getCcTypeTitleByCode: function (code) {
                var title = '',
                    keyValue = 'value',
                    keyType = 'type';

                _.each(this.getCcAvailableTypesValues(), function (value) {
                    if (value[keyValue] === code) {
                        title = value[keyType];
                    }
                });

                return title;
            },

            /**
             * Prepare Card number to output
             * @param {String} number
             * @returns {String}
             */
            formatDisplayCcNumber: function (number) {
                return 'xxxx-' + number.substr(-4);
            },

            /**
             * Get Card details
             * @returns {Array}
             */
            getInfo: function () {
                return [
                    {
                        'name': 'Card Type', value: this.getCcTypeTitleByCode(this.creditCardType())
                    },
                    {
                        'name': 'Card Number', value: this.formatDisplayCcNumber(this.creditCardNumber())
                    }
                ];
            },
            
            _validateHandler: function () {
                return $('#aqpago-form').validation && $('#aqpago-form').validation('isValid');
            },

            /**
             * @returns {Object}
             */
            context: function () {
                return this;
            },     
            
            setAqbankInputValor: function () {
                $('.aqbank-input-valor').focus();
                $('.aqbank-input-valor').select();
                return;
            },
            
            /**
             * @returns {String}
             */
            getCode: function () {
                return 'aqpago';
            },

            /**
             * @returns {Boolean}
             */
            isActive: function () {
                return true;
            },

            cleanValues: function () {
                this.creditCardVerificationNumber('');
                this.creditCardSsStartMonth('');
                this.creditCardSsStartYear('');
                this.creditCardSsIssue('');
                this.creditCardType('');
                this.creditCardExpYear('');
                this.creditCardExpMonth('');
                this.creditCardNumber('');
                this.creditCardOwner('');
                
                this.type_payment('');

                this.one_cc_flag('');
                this.one_cc_number('');
                this.one_cc_owner('');
                this.one_cc_exp_month('');
                this.one_cc_exp_year('');
                this.one_cc_cid('');
                this.one_cc_document('');
                this.one_cc_amount('');
                this.one_cc_installments('');
                this.one_cc_saved('');
                this.one_cc_number_id('');
                
                this.two_cc_flag('');
                this.two_cc_number('');
                this.two_cc_owner('');
                this.two_cc_exp_month('');
                this.two_cc_exp_year('');
                this.two_cc_cid('');
                this.two_cc_document('');
                this.two_cc_amount('');
                this.two_cc_installments('');
                this.two_cc_saved('');
                this.two_cc_number_id('');
                
                this.ticket_amount('');
                this.ticket_amount_multiple('');
                
                this.installment(1);
                this.numberInstallments(1);
                this.GrandTotalSubdivide( quote.totals().grand_total / 2 );
                this.creditCard(true);
                this.creditCard3Ds(false);
                this.debitCard(false);
            },
            finisheOrder: function() {
                var cards = this.cards();
                messageList.clear();
                
                if(this.type_payment() == 'credit' || this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple')  {
                    var fourDigitsOne = cards[ this.card_one() ].number.substr(-4, 4);
                    this.one_cc_flag( cards[ this.card_one() ].flag );
                    this.one_cc_number( cards[ this.card_one() ].number );
                    this.one_cc_owner( cards[ this.card_one() ].owerName );
                    this.one_cc_exp_month( cards[ this.card_one() ].expiration_month );
                    this.one_cc_exp_year( cards[ this.card_one() ].expiration_year );
                    this.one_cc_cid( cards[ this.card_one() ].securityCode );
                    this.one_cc_document( cards[ this.card_one() ].taxvat );
                    this.one_cc_amount( this.amount_one() );
                    this.one_cc_installments( cards[ this.card_one() ].installment );
                    this.one_cc_saved( cards[ this.card_one() ].saved );
                    
                    if(this.saved_card_one()){
                        this.one_cc_number_id( this.saved_card_one() );
                    }
                    
                }
                
                if(this.type_payment() == 'credit_multiple') {
                    var fourDigitsTwo = cards[ this.card_two() ].number.substr(-4, 4);
                    this.two_cc_flag( cards[ this.card_two() ].flag );
                    this.two_cc_number( cards[ this.card_two() ].number );
                    this.two_cc_owner( cards[ this.card_two() ].owerName );
                    this.two_cc_exp_month( cards[ this.card_two() ].expiration_month );
                    this.two_cc_exp_year( cards[ this.card_two() ].expiration_year );
                    this.two_cc_cid( cards[ this.card_two() ].securityCode );
                    this.two_cc_document( cards[ this.card_two() ].taxvat );
                    this.two_cc_amount( this.amount_two() );
                    this.two_cc_installments( cards[ this.card_two() ].installment );
                    this.two_cc_saved( cards[ this.card_two() ].saved );
                    
                    if(this.saved_card_two()){
                        this.two_cc_number_id( this.saved_card_two() );
                    }
                }
                
                this.ticket_amount( this.amount_total() );
                this.ticket_amount_multiple( this.amount_ticket() );
                
                if(!customer.isLoggedIn()) {
                    if($('#password').length) {
                        this.customer_password( $('#password').val() );
                    }
                    
                    if($('input[name="username"]').length) {
                        $('.email-text').html( $('input[name="username"]').val() );
                    }
                }
                else {
                    $('.email-text').html( customer.customerData.email);
                }
                
                $('.page-wrapper').addClass('background-image-none');
                
                $('.iwd_opc_wrapper.iwd_main_wrapper').slideUp();
                $('.aqbank_mobile_steps').slideUp();
                $('.aqbank_opc_payment').slideUp();
                $('.iwd_summary_custom').slideUp();
                $('.iwd_opc_shipping_column').slideUp();
                
                $('.payment-method-aqbank').hide();
                $('.finish-animation-box-two .circle-img').hide();
                $('#iwd_opc_discount').hide();
                
                $('.finish-animation-box-one').fadeIn('100');
                $('.finish-animation-box-two').fadeIn('100');
                
                
                var imgOne = $('#one-li-form-payment .li-flag-card .middle-number-card').html();
                var imgTwo = $('#two-li-form-payment .li-flag-card .middle-number-card').html();
                
                
                $('.resume-address .resume-address-text').html(
                    '<div>'
                    + quote.shippingAddress().street[0]
                    + ', '
                    + quote.shippingAddress().street[1]
                    + ' '
                    + quote.shippingAddress().street[2]
                    + '</div>'
                );
                
                $('.resume-address .resume-address-text').append(
                    '<div>'
                    + quote.shippingAddress().street[3]
                    + ', '
                    + quote.shippingAddress().city
                    + ' / '
                    + quote.shippingAddress().regionCode
                    + '</div>'
                );
                $('.resume-address .resume-address-text').append(
                    '<div><strong>'
                    + quote.shippingAddress().postcode
                    +'</strong></div>'
                );
                
                
                if(this.type_payment() == 'credit'){
                    $('.li-form-payment-ticket-alert').hide();
                    $('.li-form-payment-one').show();
                    $('.li-form-payment-one .li-number-card .middle-number-card').html(
                        fourDigitsOne
                    );
                    $('.li-form-payment-one .li-amount-card span').html(
                        cards[ this.card_one() ].installment + 'x'
                    );
                    $('.li-form-payment-one .li-amount-card .amount-card').html(
                        priceUtils.formatPrice( 
                            ( this.amount_total() / cards[ this.card_one() ].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    
                    $('.li-form-payment-one .li-flag-card .middle-number-card').html( imgOne );
                }
                else if(this.type_payment() == 'credit_multiple'){
                    $('.li-form-payment-ticket-alert').hide();
                    /***** One *******/
                    $('.li-form-payment-one').show();
                    $('.li-form-payment-one .li-number-card .middle-number-card').html(
                        fourDigitsOne
                    );
                    $('.li-form-payment-one .li-amount-card span').html(
                        cards[ this.card_one() ].installment + 'x'
                    );
                    $('.li-form-payment-one .li-amount-card .amount-card').html(
                        priceUtils.formatPrice( 
                            ( this.amount_one() / cards[ this.card_one() ].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    
                    $('.li-form-payment-one .li-flag-card .middle-number-card').html( imgOne );
                    
                    /*** Two ***/
                    $('.li-form-payment-two').show();
                    $('.li-form-payment-two .li-number-card .middle-number-card').html(
                        fourDigitsTwo
                    );
                    $('.li-form-payment-two .li-amount-card span').html(
                        cards[ this.card_two() ].installment + 'x'
                    );
                    $('.li-form-payment-two .li-amount-card .amount-card').html(
                        priceUtils.formatPrice( 
                            ( this.amount_two() / cards[ this.card_two() ].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    
                    $('.li-form-payment-two .li-flag-card .middle-number-card').html( imgTwo );
                }
                else if(this.type_payment() == 'ticket') {
                    $('.li-form-payment-ticket-alert').hide();
                    $('.li-form-payment-ticket').show();
                    $('.li-form-payment-ticket .li-amount-card .amount-card').html(
                        priceUtils.formatPrice( 
                            this.amount_total(),
                            quote.getPriceFormat() 
                        )
                    );
                }
                else if(this.type_payment() == 'ticket_multiple'){
                    $('.li-form-payment-one').show();
                    $('.li-form-payment-ticket-alert').show();
                    $('.li-form-payment-one .li-number-card .middle-number-card').html(
                        fourDigitsOne
                    );
                    $('.li-form-payment-one .li-amount-card span').html(
                        cards[ this.card_one() ].installment + 'x'
                    );
                    $('.li-form-payment-one .li-amount-card .amount-card').html(
                        priceUtils.formatPrice( 
                            ( this.amount_one() / cards[ this.card_one() ].installment ), 
                            quote.getPriceFormat() 
                        )
                    );
                    
                    $('.li-form-payment-one .li-flag-card .middle-number-card').html( imgOne );
                }
                
                
                var self = this;

                if (event) {
                    event.preventDefault();
                }
                
                
                if (this.validate() && additionalValidators.validate()) {
                    this.isPlaceOrderActionAllowed(false);
                    
                    var orderUrlResponse = window.checkoutConfig.payment[self.getCode()].orderUrlResponse;
                    var orderUpdateUrlResponse = window.checkoutConfig.payment[self.getCode()].orderUpdateUrlResponse;
                    var orderBarcode = window.checkoutConfig.payment[self.getCode()].orderBarcode;
                    
                    
                    $('.opc-progress-bar').hide();
                    $('.payment-method').hide();
                    $('.shipping-information .action-edit').hide();
                    
                    
                    $('.opc-payment-additional.discount-code').hide();
                    $('.payment-method payment-method-aqbank').show();
                    
                    
                    if(self.payment_order_id()){
                        
                        $('.aqban-modal-one-card .field-name-lastname, .aqban-modal-one-card .valid_month_checkout, .aqban-modal-one-card .field-name-name_card, .aqban-modal-one-card .field-not, .aqban-modal-one-card .field-name-documento, .aqban-modal-one-card').slideDown();
                        $('.aqban-modal-two-card .field-name-lastname, .aqban-modal-two-card .valid_month_checkout, .aqban-modal-two-card .field-name-name_card, .aqban-modal-two-card .field-not, .aqban-modal-two-card .field-name-documento, .aqban-modal-one-card').slideDown();
                        
                        $.ajax({
                            showLoader: true,
                            url: orderUpdateUrlResponse,
                            data: {
                                orderId: self.payment_order_id(),
                                paymentData: self.getData()
                            },
                            type: "POST"
                        }).done(function(result) {
                            $('.page-wrapper').removeClass('background-image-none');
                            
                            if(result.success) {
                                if(result.response.pay){
                                    /** Pago continuar **/
                                    $('.order-number').html( '#' + result.response.order_increment );
                                    $('.order-status').html( result.response.order_status );
                                    
                                    self.afterPlaceOrder();
                                    

                                        /** Success Return **/
                                        $('.iwd_opc_wrapper.iwd_main_wrapper').show();
                                        $('.aqbank_resume_order').show();
                                     
                                    if(result.response.type == 'ticket' || result.response.type == 'multi_ticket') {
                                        
                                        $.ajax({
                                            showLoader: false,
                                            url: orderBarcode, 
                                            data: {orderId: result.response.orderId},
                                            type: "POST"
                                        }).done(function(codeResult) {
                                            
                                            if(codeResult.success == 'true') {
                                                $('.img-barcode').html( codeResult.response );
                                            }
                                            else {
                                                
                                            }
                                        }).fail(function (jqXHR, exception) {
                                            
                                        });
                                        
                                        result.response.payments.forEach(function(value, i){
                                            if(value.type == 'ticket') {
                                                $('.li-ticket-code').html( value.ticket_bar_code );
                                                self.ticketUrl( value.ticket_url );
                                            }
                                        });
                                        
                                        messageList.clear();
                                        $('.li-form-payment-ticket-infos').show();
                                    }
                                    
                                    if($(window).width() > 767){
                                        $('.iwd_summary_custom').fadeIn('100');
                                    }
                                    $('.aqbank_opc_payment').fadeIn('100');
                                    /** Success Return **/
                                    messageList.clear();
                                    if (self.redirectAfterPlaceOrder) {
                                        /* redirectOnSuccessAction.execute(); */
                                    }                                   
                                }
                                else {
                                    $('.payment-method-aqbank').show();
                                    
                                    if(self.type_payment() == "ticket_multiple" || self.type_payment() == "credit_multiple") {
                                        $('.aqbank_type_payment_li .credit').hide();
                                    }
                                    
                                    self.erro_credit(false);
                                    self.erro_multi_credit(false);
                                    self.erro_multi_ticket(false);
                                    
                                    if(self.type_payment() == "credit"){
                                        self.erro_credit(true);
                                    }
                                    if(self.type_payment() == "credit_multiple"){
                                        self.erro_multi_credit(true);
                                    }
                                    if(self.type_payment() == "ticket_multiple"){
                                        self.erro_multi_ticket(true);
                                    }
                                    
                                
                                    if($('input[name="one_cc_number_id"]').val() == result.response.payment.credit_card.id){
                                        
                                    }
                                    else if($('input[name="two_cc_number_id"]').val() == result.response.payment.credit_card.id){
                                        
                                    }
                                    else {
                                        
                                        if(result.response.card_erro == 'one') {
                                            self.card_one_erro(true);
                                            $('#one-li-form-payment').addClass('aqpago-erro');
                                            $('#one-li-form-payment .text-edit').html( $t( result.response.payment.message ) );
                                            $('#one-li-form-payment .li-position-card img').attr('src', self.getCardOneErro() );
                                            $('#onecard-button-modal').attr('src', self.getIconEditErro() );
                                            if(self.type_payment() != "credit") {
                                                $('#onecard-button-modal').click();
                                            }                                           
                                            messageList.addErrorMessage({ message: $t( result.response.payment.message ) });
                                        }
                                        
                                        if(result.response.card_erro == 'two') {
                                            self.card_two_erro(true);
                                            $('#two-li-form-payment').addClass('aqpago-erro');
                                            $('#two-li-form-payment .text-edit').html( $t( result.response.payment.message ) );
                                            $('#two-li-form-payment .li-position-card img').attr('src', self.getCardTwoErro() );
                                            $('#twocard-button-modal').attr('src', self.getIconEditErro() );
                                            if(self.type_payment() != "credit") {
                                                $('#twocard-button-modal').click();
                                            }                                           
                                            messageList.addErrorMessage({ message: $t( result.response.payment.message ) });
                                        }
                                    }
                                    
                                }
                                
                            }
                            else {
                                if(result.hasOwnProperty("error")) {
                                    messageList.addErrorMessage({ message: $t( result.error ) });
                                }
                                else {
                                    messageList.addErrorMessage({ message: $t( result.message ) });
                                }
                            }
                            
                        }).fail(function (xhr, status, error) {
                            var err = eval("(" + xhr.responseText + ")");
                            messageList.addErrorMessage({ message: $t( err ) });
                        });
                        return false;
                    } 
                    else {
                        /** do not send array no additional information **/
                        this.cards('');
                        
                        $('.aqban-modal-one-card .field-name-lastname, .aqban-modal-one-card .valid_month_checkout, .aqban-modal-one-card .field-name-name_card, .aqban-modal-one-card .field-not, .aqban-modal-one-card .field-name-documento, .aqban-modal-one-card').slideDown();
                        $('.aqban-modal-two-card .field-name-lastname, .aqban-modal-two-card .valid_month_checkout, .aqban-modal-two-card .field-name-name_card, .aqban-modal-two-card .field-not, .aqban-modal-two-card .field-name-documento, .aqban-modal-one-card').slideDown();
                        
                        
                        this.getPlaceOrderDeferredObject()
                            .fail(
                                function (data, status, code) {
                                    
                                    $('.page-wrapper').removeClass('background-image-none');
                                    
                                    $('.finish-animation-box').hide();
                                    
                                    $('.iwd_opc_wrapper.iwd_main_wrapper').show();
                                    $('.aqbank_mobile_steps').show();
                                    $('.aqbank_opc_payment').show();
                                    if($(window).width() > 767) {
                                        $('.iwd_summary_custom').show();
                                    }
                                    $('.payment-method-aqbank').show();
                                    
                                    
                                    messageList.addErrorMessage({ message: $t( data.responseText ) });
        
                                    /** rewrite card information **/
                                    self.cards( cards );
                                    self.isPlaceOrderActionAllowed(true);
                                }
                            ).done(
                            function (data) {
                                
                                
                                /** rewrite card information **/
                                self.cards( cards );
                                if(!isNaN(data)){
                                    self.payment_order_id( data );
                                }
                                else {
                                    $('.page-wrapper').removeClass('background-image-none');
                                    $('.finish-animation-box').hide();
                                    
                                    $('.iwd_opc_wrapper.iwd_main_wrapper').show();
                                    $('.aqbank_mobile_steps').show();
                                    $('.aqbank_opc_payment').show();
                                    
                                    if($(window).width() > 767) {
                                        $('.iwd_summary_custom').show();
                                    } else {
                                        
                                    }
                                    
                                    $('.payment-method-aqbank').show();
                                    
                                    messageList.addErrorMessage({ message: $t( data.message ) });
                                    
                                    /** Erro **/
                                    self.isPlaceOrderActionAllowed(true);
                                    return false;
                                }
                                
                                $.ajax({
                                    showLoader: true,
                                    url: orderUrlResponse,
                                    data: {orderId: data},
                                    type: "POST"
                                }).done(function(result) {
                                    
                                    $('.page-wrapper').removeClass('background-image-none');
                                    $('.aqbank_itens_edit').hide();
                                    
                                    /** resultado **/
                                    if(result.success == 'true'){
                                        $('.aqbank_type_payment_li .ticket').hide();
                                        var payments = result.response.payments;
                                        var cardFails = null;
                                        
                                        /** pagamento ok **/
                                        if(result.response.pay){
                                            
                                            $('.order-number').html( '#' + result.response.order_increment );
                                            $('.order-status').html( result.response.order_status );
                                            
                                            self.afterPlaceOrder();
                                            
                                                /** Success Return **/
                                                $('.iwd_opc_wrapper.iwd_main_wrapper').show();
                                                $('.aqbank_resume_order').show();
                                             
                                            if(result.response.type == 'ticket' || result.response.type == 'multi_ticket') {
                                                
                                                $.ajax({
                                                    showLoader: false,
                                                    url: orderBarcode, 
                                                    data: {orderId: data},
                                                    type: "POST"
                                                }).done(function(result) {
                                                    if(result.success == 'true') {
                                                        $('.img-barcode').html( result.response );
                                                    }
                                                    else {
                                                        
                                                    }
                                                    messageList.clear();
                                                }).fail(function (jqXHR, exception) {
                                                    messageList.clear();
                                                });
                                                
                                                result.response.payments.forEach(function(value, i){
                                                    if(value.type == 'ticket') {
                                                        $('.li-ticket-code').html( value.ticket_bar_code );
                                                        self.ticketUrl( value.ticket_url );
                                                    }
                                                });
                                                
                                                $('.li-form-payment-ticket-infos').show();
                                            }
                                            
                                            if($(window).width() > 767){
                                                $('.iwd_summary_custom').fadeIn('100');
                                            }
                                            $('.aqbank_opc_payment').fadeIn('100');
                                            /** Success Return **/
                                            messageList.clear();
                                            if (self.redirectAfterPlaceOrder) {
                                                /* redirectOnSuccessAction.execute(); */
                                            }   
                                            
                                        }
                                        else {
                                            $('.payment-method-aqbank').show();
                                            
                                            self.erro_credit(false);
                                            self.erro_multi_credit(false);
                                            self.erro_multi_ticket(false);
                                    
                                            if(self.type_payment() == "credit"){
                                                self.erro_credit(true);
                                            }
                                            if(self.type_payment() == "credit_multiple"){
                                                self.erro_multi_credit(true);
                                            }
                                            if(self.type_payment() == "ticket_multiple"){
                                                self.erro_multi_ticket(true);
                                            }
                                            
                                            
                                            /** Falha no pagamento **/
                                            payments.forEach(function(value, i){
                                                
                                                /** Não pagou **/
                                                if(
                                                    value.type == 'credit' && 
                                                    value.status != 'succeeded' &&
                                                    value.status != 'pre_authorized'
                                                ) {
                                                    
                                                    $('.aqbank_type_payment_li .ticket').hide();
                                                    $('.address-link').hide();
                                                    $('.modal-edit-amount .img-edit').hide();
                                                    $('#aqpago_cc_multiple_val_oneCard').prop('readonly', true);
                                                    $('#aqpago_cc_multiple_val_twoCard').prop('readonly', true);

                                                    
                                                    if($('input[name="one_cc_number_id"]').val() == value.credit_card.id){
                                                        
                                                    }
                                                    else if($('input[name="two_cc_number_id"]').val() == value.credit_card.id){
                                                        
                                                    }
                                                    else {
                                                        
                                                        if(
                                                            self.one_cc_number().substr(0, 4) == value.credit_card.first4_digits &&
                                                            self.one_cc_number().substr(-4) == value.credit_card.last4_digits
                                                        ) {
                                                            
                                                            self.card_one_erro(true);
                                                            $('#one-li-form-payment').addClass('aqpago-erro');
                                                            $('#one-li-form-payment .text-edit').html( $t( value.message ) );
                                                            $('.modal-one-erro').html( $t( value.message ) );
                                                            $('#one-li-form-payment .li-position-card img').attr('src', self.getCardOneErro() );
                                                            $('#onecard-button-modal').attr('src', self.getIconEditErro() );
                                                            if(self.type_payment() != "credit") {
                                                                $('#onecard-button-modal').click();
                                                            }
                                                        }
                                                        
                                                        if(
                                                            self.two_cc_number().substr(0, 4) == value.credit_card.first4_digits &&
                                                            self.two_cc_number().substr(-4) == value.credit_card.last4_digits
                                                        ) {
                                                            self.card_two_erro(true);
                                                            $('#two-li-form-payment').addClass('aqpago-erro');
                                                            $('#two-li-form-payment .text-edit').html( $t( value.message ) );
                                                            $('.modal-two-erro').html( $t( value.message ) );
                                                            $('#two-li-form-payment .li-position-card img').attr('src', self.getCardTwoErro() );
                                                            $('#twocard-button-modal').attr('src', self.getIconEditErro() );
                                                            if(self.type_payment() != "credit") {
                                                                $('#twocard-button-modal').click();
                                                            }
                                                        }
                                                    }
                                                    
                                                }
                                                
                                                /** **/
                                                if(
                                                    value.type == 'credit' && 
                                                    (
                                                        value.status == 'succeeded' ||
                                                        value.status == 'pre_authorized'
                                                    )
                                                ) {
                                                    if($('input[name="one_cc_number_id"]').val() == value.credit_card.id){
                                                        
                                                    }
                                                    else if($('input[name="two_cc_number_id"]').val() == value.credit_card.id){
                                                        
                                                    }
                                                    else {
                                                        
                                                        if(
                                                            self.one_cc_number().substr(0, 4) == value.credit_card.first4_digits &&
                                                            self.one_cc_number().substr(-4) == value.credit_card.last4_digits
                                                        ) {
                                                            $('#one-li-form-payment').addClass('aqpago-success');
                                                            $('#onecard-button-modal').hide();
                                                            $('#one-li-form-payment .li-position-card img').attr('src', self.getCardOneSuccess() );
                                                            $('#one-li-form-payment .text-edit').html( $t('success!') );
                                                            $('#one-li-form-payment .parcelas').prop('disabled', true);
                                                        }
                                                        
                                                        if(
                                                            self.two_cc_number().substr(0, 4) == value.credit_card.first4_digits &&
                                                            self.two_cc_number().substr(-4) == value.credit_card.last4_digits
                                                        ) {
                                                            $('#two-li-form-payment').addClass('aqpago-success');
                                                            $('#twocard-button-modal').hide();
                                                            $('#two-li-form-payment .li-position-card img').attr('src', self.getCardTwoSuccess() );
                                                            $('#two-li-form-payment .text-edit').html( $t('success!') );
                                                            $('#two-li-form-payment .parcelas').prop('disabled', true);
                                                        }
                                                    }
                                                    
                                                }
                                            });
                                            
                                            
                                            /** tratar erro por tipo **/
                                            if(self.type_payment() == "credit_multiple") {
                                                /** 1 cartão aprovado **/
                                                if(self.card_one_erro() || self.card_two_erro()){
                                                    $('.aqbank_type_payment_li .credit').remove();
                                                    $('.aqbank_type_payment_li .ticket ').remove();                                         
                                                }
                                            }
                                            
                                            $('.finish-animation-box').hide();
                                            
                                            $('.iwd_opc_wrapper.iwd_main_wrapper').show();
                                            $('.aqbank_mobile_steps').show();
                                            $('.aqbank_opc_payment').show();
                                            $('.iwd_summary_custom').show();
                                            $('.payment-method-aqbank').show();
                                        }
                                    }
                                    else {
                                        $('.page-wrapper').removeClass('background-image-none');
                                        
                                        $('.finish-animation-box').hide();
                                        
                                        $('.iwd_opc_wrapper.iwd_main_wrapper').show();
                                        $('.aqbank_mobile_steps').show();
                                        $('.aqbank_opc_payment').show();
                                        $('.iwd_summary_custom').show();
                                        $('.payment-method-aqbank').show();
                                        
                                        if($(window).width() > 767){
                                            $('.iwd_summary_custom').hide();
                                        }
                                    
                                        messageList.addErrorMessage({ message: $t( result.message ) });
                                        
                                        /** Erro **/
                                        self.isPlaceOrderActionAllowed(true);
                                    }
                                    
                                }).fail(function (jqXHR, exception) {
                                    self.isPlaceOrderActionAllowed(true);
                                });
                                
                            }
                        );
                        
                        return true;
                    
                    }
                }

                return false;               
            },
            
            openTicket: function() {
                window.open(this.ticketUrl(), 'boleto');
            },
            copyTicketCode: function() {
                var copyText = $('.li-ticket-code').text();
                navigator.clipboard.writeText(copyText);
                
                var Old = $('.li-ticket-code').html();
                $('.li-ticket-code').html('Copiado!');
                $('.li-ticket-code').css('border-color','#76cd5a');
                
                setTimeout(function(){
                    $('.li-ticket-code').html( Old );
                }, 2000);
                
                return true;
            },
            /**
             * @override
             */
            /**
             * Place order.
             */
            placeOrder: function (data, event) {
                var self = this;

                if (event) {
                    event.preventDefault();
                }

                if (this.validate() && additionalValidators.validate()) {
                    this.isPlaceOrderActionAllowed(false);

                    this.getPlaceOrderDeferredObject()
                        .fail(
                            function () {
                                self.isPlaceOrderActionAllowed(true);
                                self.cleanValues();
                            }
                        ).done(
                        function () {
                            self.afterPlaceOrder();

                            if (self.redirectAfterPlaceOrder) {
                                redirectOnSuccessAction.execute();
                            }
                        }
                    );
                    
                    return true;
                }

                return false;
            }
        });
    }
);
