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
    function (_, Component, messageList, customer, creditCardData, cardNumberValidator, quote, $t, $, modal, additionalValidators, redirectOnSuccessAction, jquerymask, priceUtils) {
        'use strict';
		
		$(document).ready(function(){
			$('#aqpago_cc_cid').mask('0000');
			$('#aqpago_cc_cid_cardOne').mask('0000');
			$('#aqpago_cc_cid_cardTwo').mask('0000');
			$('#aqpago_documento').mask('000.000.000-00');
			$('#aqpago_numbercard_fake').mask('0000 0000 0000 0000');
			$('#aqpago_cc_number').mask('0000 0000 0000 0000');
			$('.aqbank-input-valor').mask('000.000.000,00', {reverse: true});
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
		
		$(document).on('blur change keyup keypress', 'input[name="telephone"]', function(){
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
				$('input[name="telephone"]').focus();
				$('input[name="telephone"]').blur();
				
				if($('input[name="telephone"]').val() != ''){
					$('.phone-text').html( $('input[name="telephone"]').val() );
				}
				if($('input[name="username"]').val() != ''){
					$('.email-text').html( $('input[name="username"]').val() );
				}
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
				
				/***********/
				if (!typeof quote.shippingAddress().postcode === "undefined") {
					if(quote.shippingAddress().postcode){
						$('.street').slideDown('100');
						$('.aqbank-cidade').slideDown('100');
						$('.aqbank-estado').slideDown('100');
					}
				}
				
				if(customer.isLoggedIn()) {
					
					$('.phone-text').html( customer.customerData.email);
					$('.email-text').html( quote.shippingAddress().telephone);
				}
				/***********/
				
                this.GrandTotalSubdivide.subscribe(function (value) {
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
                    value = value.replace(/\s+/g, '');


					var result;
                    var valCard;
					
					var Bandeira	= self.setPaymentFlag(value);
					var Maxkey		= 19; 
					var digitos		= value.length;
					
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
					
					result 	= cardNumberValidator( value );
					
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
										+ "<img src='" + self.getArrowRight() + "' />"
										+ "</div>"
									+ "</div>";
						
						$('.box-select-card').append( HtmlCard );
						
						var card 					= [];
						card['installment'] 		= 1;
						card['card_id'] 			= value.card_id;
						card['number'] 				= key;
						card['expiration_month'] 	= null;
						card['expiration_year'] 	= null;
						card['securityCode'] 		= null;
						card['owerName'] 			= null;
						card['flag'] 				= value.flag;
						card['imOwer'] 				= null;
						card['taxvat'] 				= customer.customerData.taxvat;
						cards[key] 					= card;
						
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
						
						$('.card-view-address').slideUp('100');
						$('.shipping-option').slideUp('100');
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
				
				var cards 		= this.cards();
				var card 		= cards[ cardId ];
				
				var oldFisrt 	= this.card_one();
				var oldTwo 		= this.card_two();
				
				
				if(this.select_card()){
					
					$('.box-select-card-li-arrow').removeClass('active-arrow');
					$('.' + cardId + ' .box-select-card-li-arrow' ).removeClass('active-arrow-custom');
					$('.' + cardId).slideUp();
					$('.box-select-card-li-arrow span').slideUp();
					
					this.select_card(false);
					
					$('.li-form-payment').slideUp('100');
					$('.card-view-address').slideUp('100');
					$('.shipping-option').slideUp('100');
					
					if($(window).width() <= 767){
						$('.grandtotal-resume').slideUp('100');
					}
					
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
						
						
						$('.card-view-address').slideDown('100');
						$('.shipping-option').slideDown('100');
						
						if($(window).width() <= 767){
							$('.grandtotal-resume').slideDown('100');
						}
						
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
				var Visa 		= /^4/;
				var Mastercard 	= /^5([1-9]\d{1}|222100|272099)/;
				var Banescard 	= /^(60420[1-9]|6042[1-9][0-9]|6043[0-9]{2}|604400)/;
				var Amex 		= /^3(4|7)/;
				var Discover 	= /^6(011|22[0-9]{1}|4|5)/;
				var HIPERCARD	= /^(3841|60\d{2})/;
				var Diners 		= /^(30[0-5]{1}|36(0|[2-9]{1})|3[8-9]{2}|2014|2149|309)\d/;
				var JCB 		= /^(2131|1800|35)/;
				var ELO 		= /^(4011|438935|451416|4576|504175|5066|5067|50900|50904[0-9]|50905(1|2)|509064|50906[6-9]|509074|627780|636297|636368|636505)/;
				var AURA		= /^50\d{4}/;
				var HIPER		= /^637095/;
				
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
				var cards 			= this.cards();
				
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
				var cards 			= this.cards();
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
				
				var cards 				= this.cards();
				var installments 		= $('#' + this.getCode() + '_installments_oneCard').val();
				var ccNumber 			= $('#' + this.getCode() + '_cc_number_cardOne').val().replace(/[^0-9]/g,'');
				var expiration_month 	= $('#' + this.getCode() + '_expiration_cardOne').val();
				var expiration_year 	= $('#' + this.getCode() + '_expiration_yr_cardOne').val();
				var securityCode	 	= $('#' + this.getCode() + '_cc_cid_cardOne').val();
				var owerName		 	= $('#' + this.getCode() + '_cc_owner_cardOne').val();
				var cardIndex			= ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
				var fourDigits			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not_cardOne').is(":checked")) ? true : false;
				var flag	 			= this.setPaymentFlag(ccNumber);
				var taxvat 				= '';
				var currency 			= quote.getPriceFormat().pattern.replace('%s','');				
				
				var card 					= [];
				card['installment'] 		= installments;
				card['number'] 				= ccNumber;
				card['expiration_month'] 	= expiration_month;
				card['expiration_year'] 	= expiration_year;
				card['securityCode'] 		= securityCode;
				card['owerName'] 			= owerName;
				card['flag'] 				= flag;
				card['imOwer'] 				= imOwer;

				if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
					var valOne 	= $('#' + this.getCode() + '_cc_multiple_val_oneCard').val();
					valOne 		= this.customValValidate(valOne);
					var valTwo 	= quote.totals().grand_total - valOne;
					
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
				/********** incluir documento ********/
				if(!customer.isLoggedIn()) {
					if(imOwer  == true) {
						taxvat = this.removeMask( $('input[name="vat_id"]').val() );
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
				
				card['taxvat'] 				= taxvat;
				cards[cardIndex] 			= card;
				
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
				
				var cards 				= this.cards();
				var installments 		= $('#' + this.getCode() + '_installments_cardTwo').val();
				var ccNumber 			= $('#' + this.getCode() + '_cc_number_cardTwo').val().replace(/[^0-9]/g,'');
				var expiration_month 	= $('#' + this.getCode() + '_expiration_cardTwo').val();
				var expiration_year 	= $('#' + this.getCode() + '_expiration_yr_cardTwo').val();
				var securityCode	 	= $('#' + this.getCode() + '_cc_cid_cardTwo').val();
				var owerName		 	= $('#' + this.getCode() + '_cc_owner_cardTwo').val();
				var cardIndex			= ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
				var fourDigits			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not_cardTwo').is(":checked")) ? true : false;
				var flag	 			= this.setPaymentFlag(ccNumber);
				var taxvat 				= '';
				var currency 			= quote.getPriceFormat().pattern.replace('%s','');
				
				
				var card 					= [];
				card['installment'] 		= installments;
				card['number'] 				= ccNumber;
				card['expiration_month'] 	= expiration_month;
				card['expiration_year'] 	= expiration_year;
				card['securityCode'] 		= securityCode;
				card['owerName'] 			= owerName;
				card['flag'] 				= flag;
				card['imOwer'] 				= imOwer;
				
				if(this.type_payment() == 'credit_multiple' || this.type_payment() == 'ticket_multiple') {
					var valTwo 	= $('#' + this.getCode() + '_cc_multiple_val_twoCard').val();
					valTwo 		= this.customValValidate(valTwo);
					var valOne 	= quote.totals().grand_total - valTwo;
					
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
				/********** incluir documento ********/
				if(!customer.isLoggedIn()) {
					if(imOwer == true) {
						taxvat = this.removeMask( $('input[name="vat_id"]').val() )
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
				
				card['taxvat'] 				= taxvat;
				cards[cardIndex] 			= card;
				
				this.card_two(cardIndex);
				this.cards(cards);
				
				return true;
			},
			placeCardTicket: function(){
				
				var cards 				= this.cards();
				var installments 		= $('#' + this.getCode() + '_installments_oneCard').val();
				var ccNumber 			= $('#' + this.getCode() + '_cc_number_cardOne').val().replace(/[^0-9]/g,'');
				var expiration_month 	= $('#' + this.getCode() + '_expiration_cardOne').val();
				var expiration_year 	= $('#' + this.getCode() + '_expiration_yr_cardOne').val();
				var securityCode	 	= $('#' + this.getCode() + '_cc_cid_cardOne').val();
				var owerName		 	= $('#' + this.getCode() + '_cc_owner_cardOne').val();
				var cardIndex			= ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
				var fourDigits			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not').is(":checked")) ? true : false;
				var flag	 			= this.setPaymentFlag(ccNumber);
				var taxvat 				= '';
				var currency 			= quote.getPriceFormat().pattern.replace('%s','');
				var bandeira 			= this.setPaymentFlag(ccNumber);		
				
				var card 					= [];
				card['installment'] 		= installments;
				card['number'] 				= ccNumber;
				card['expiration_month'] 	= expiration_month;
				card['expiration_year'] 	= expiration_year;
				card['securityCode'] 		= securityCode;
				card['owerName'] 			= owerName;
				card['flag'] 				= flag;
				card['imOwer'] 				= imOwer;
				
				var valOne 	 			= $('#' + this.getCode() + '_cc_multiple_val').val();
				valOne 					= this.customValValidate(valOne);
				var valTwo 				= quote.totals().grand_total - valOne;
				
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
				$('.card-box-all').slideUp('100');
				
				/********** incluir documento ********/
				if(!customer.isLoggedIn()) {
					if(imOwer  == true) {
						taxvat = this.removeMask( $('input[name="vat_id"]').val() );
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
				
				card['taxvat'] 				= taxvat;
				cards[cardIndex] 			= card;
				
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
					$('.card-view-address').slideDown('100');
					$('.shipping-option').slideDown('100');
					
					if($(window).width() <= 767){
						$('.grandtotal-resume').slideDown('100');
					}
					
					$('#three-li-form-payment').slideDown('100');
					$('#button-finished').slideDown('100');
				}, 500);
				
				return true;
			},
			capitalizeFirstLetter: function(string) {
				return string.charAt(0).toUpperCase() + string.slice(1);
			},
			setCardData: function(position){
				var cards 				= this.cards();
				
				var installments 		= $('#' + this.getCode() + '_installments').val();
				var ccNumber 			= $('#' + this.getCode() + '_cc_number').val().replace(/[^0-9]/g,'');
				var expiration_month 	= $('#' + this.getCode() + '_expiration').val();
				var expiration_year 	= $('#' + this.getCode() + '_expiration_yr').val();
				var securityCode	 	= $('#' + this.getCode() + '_cc_cid').val();
				var owerName		 	= $('#' + this.getCode() + '_cc_owner').val();
				var cardIndex			= ccNumber.substr(0, 4) + '' + ccNumber.substr(-4, 4);
				var fourDigits			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not').is(":checked")) ? true : false;
				var flag	 			= this.setPaymentFlag(ccNumber);
				var taxvat 				= '';
				var currency 			= quote.getPriceFormat().pattern.replace('%s','');
				
				if(ccNumber == '' && !this.card_saved()){
					return false;
				}
				
				if(!customer.isLoggedIn()) {
					if($('input[name="payment[not]"]').is(":checked")  == true) {
						taxvat = this.removeMask( $('input[name="vat_id"]').val() );
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
					
					var card 					= [];
					card 						= cards[cardIndex];
					card['card_id'] 			= cards[cardIndex].card_id;
					card['installment'] 		= installments;
					card['number'] 				= cards[cardIndex].number;
					card['expiration_month'] 	= null;
					card['expiration_year'] 	= null;
					card['securityCode'] 		= securityCode;
					card['owerName'] 			= null;
					card['flag'] 				= cards[cardIndex].flag;
					card['taxvat'] 				= taxvat;
					card['imOwer'] 				= null;
					card['saved'] 				= true;
					cards[cardIndex] 			= card;
					flag 						= cards[cardIndex].flag;
					
					if(position == 'one'){
						this.saved_card_one( card['card_id'] );
					}
					if(position == 'two'){
						this.saved_card_two( card['card_id'] );
					}
					
				}
				else {
					var card 					= [];
					card['installment'] 		= installments;
					card['number'] 				= ccNumber;
					card['expiration_month'] 	= expiration_month;
					card['expiration_year'] 	= expiration_year;
					card['securityCode'] 		= securityCode;
					card['owerName'] 			= owerName;
					card['flag'] 				= flag;
					card['taxvat'] 				= taxvat;
					card['imOwer'] 				= imOwer;
					card['saved'] 				= false;
					cards[cardIndex] 			= card;
					
				}
				
				this.cards(cards);
				this.setBandeiraInfo('#' + position + '-li-form-payment .middle-number-card img', flag, 'info');
				
				if($('.address-line-one').lenght) {
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
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
					var valOne 	= $('#' + this.getCode() + '_cc_multiple_val').val();
					valOne 		= this.customValValidate(valOne);
					var valTwo 	= quote.totals().grand_total - valOne;
					
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
					var valTwo 	= $('#' + this.getCode() + '_cc_multiple_val').val();
					valTwo 		= this.customValValidate(valTwo);
					var valOne 	= quote.totals().grand_total - valTwo;
					
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
					var valOne 	= $('#' + this.getCode() + '_cc_multiple_val').val();
					valOne 		= this.customValValidate(valOne);
					var valTwo 	= quote.totals().grand_total - valOne;
					
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
						$('.aqban-modal-one-card .field-name-lastname, .aqban-modal-one-card .valid_month_checkout, .aqban-modal-one-card .field-name-name_card, .aqban-modal-one-card .field-not, .aqban-modal-one-card .field-name-documento, .aqban-modal-one-card .field-name-code-checkout').slideUp();
					}
					else {
						$('.aqban-modal-one-card .field-name-lastname, .aqban-modal-one-card .valid_month_checkout, .aqban-modal-one-card .field-name-name_card, .aqban-modal-one-card .field-not, .aqban-modal-one-card .field-name-documento, .aqban-modal-one-card .field-name-code-checkout').slideDown();
					}
					/** Cartão dois salvo selecionado **/
					if(this.saved_card_two()){
						$('.aqban-modal-two-card .field-name-lastname, .aqban-modal-two-card .valid_month_checkout, .aqban-modal-two-card .field-name-name_card, .aqban-modal-two-card .field-not, .aqban-modal-two-card .field-name-documento, .aqban-modal-one-card .field-name-code-checkout').slideUp();
					}
					else {
						$('.aqban-modal-two-card .field-name-lastname, .aqban-modal-two-card .valid_month_checkout, .aqban-modal-two-card .field-name-name_card, .aqban-modal-two-card .field-not, .aqban-modal-two-card .field-name-documento, .aqban-modal-one-card .field-name-code-checkout').slideDown();
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
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
					$('.card-view-address').slideDown('100');
					$('.shipping-option').slideDown('100');
					
					if($(window).width() <= 767){
						$('.grandtotal-resume').slideDown('100');
					}
					
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
				$('.card-box-all').slideUp('100');
				
				$('#multi-actions').hide();
				$('#two-payment-right-empty').hide();
				$('#img-flag-card').hide();
				
				$('#multi-actions-two').show();
				$('#two-payment-right-full').show();
				
				$('.card-view-address').slideDown('100');
				$('.shipping-option').slideDown('100');
				if($(window).width() <= 767){
					$('.grandtotal-resume').slideDown('100');
				}
				
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
									+ "<img src='" + this.getArrowRight() + "' />"
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
								+ "<img src='" + this.getArrowRight() + "' />"
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
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
				
				$('.card-view-address').slideDown('100');
				$('.shipping-option').slideDown('100');
				if($(window).width() <= 767){
					$('.grandtotal-resume').slideDown('100');
				}
				
				$('#one-li-form-payment').slideDown('100');
				$('#button-finished').slideDown('100');
				
				/************/
				$('.grandtotal-box').html(
					$('#iwd_opc_review_totals').html()
				);
				/************/
			},
			setPaymentMethod: function(method){
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
					var VatId = this.removeMask( $('input[name="vat_id"]').val() );
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
						$('.card-view-address').slideUp('100');
						$('.shipping-option').slideUp('100');
						$('.grandtotal-resume').slideUp('100');
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
				$('.actions-toolbar').slideUp();
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
					
					if($('input[name="telephone"]').length) {
						$('.phone-text').html( $('input[name="telephone"]').val() );	
					}
					if($('input[name="username"]').length) {
						$('.email-text').html( $('input[name="username"]').val() );	
					}
					
					
					if(customer.isLoggedIn()) {
						$('.phone-text').html( quote.shippingAddress().telephone );
						$('.email-text').html( customer.customerData.email );
					}
					
					$('.card-view-address').show();
					$('.shipping-option').show();
					$('.aqpago-box-boleto-checkout .actions-toolbar').slideDown();
					$('.aqpago-box-boleto-checkout .button-finished').slideDown();
					if($(window).width() <= 767){
						$('.grandtotal-resume').show();
					}
					
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
					$('.card-view-address').show();
					$('.shipping-option').show();
					if($(window).width() <= 767){
						$('.grandtotal-resume').slideDown();
					}
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
						$('.card-view-address').hide();
						$('.shipping-option').hide();
						$('.grandtotal-resume').hide();
						$('#button-finished').hide();
						
						$('.box-select-card').slideDown('100');
						/***************/
						
						$('.card-view-address').slideDown('100');
						$('.shipping-option').slideDown('100');
						
						if($(window).width() <= 767){
							$('.grandtotal-resume').slideDown('100');
						}
						
						$('#list-' + this.select_card() ).slideDown('100');
						$('#one-li-form-payment').slideDown('100');
						$('#button-finished').slideDown('100');
						
					}
					else {
						/** cartão ainda não selecionado **/
						$('#one-li-form-payment').slideUp(1);
						$('#two-li-form-payment').slideUp(1);
						$('.card-view-address').slideUp(1);
						$('.shipping-option').slideUp(1);
						$('.grandtotal-resume').slideUp(1);
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
					
					if($(window).width() < 767){
						$('.grandtotal-resume').slideDown('100');
					}
					
					$('.card-view-address').slideDown('100');
					$('.shipping-option').slideDown('100');
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
					$('.card-view-address').hide();
					$('.shipping-option').hide();
					$('.grandtotal-resume').hide();
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
				
				/** Primeiro e segundo cartão negativo **/
				if(!this.card_one() || !this.card_two()) {
					$('.card-view-address').hide();
					$('.shipping-option').hide();
					$('.grandtotal-resume').hide();
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
					$('.card-view-address').show();
					$('.shipping-option').show();
					
					if($(window).width() <= 767){
						$('.grandtotal-resume').show();
					}
					
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
						$('.card-view-address').hide();
						$('.shipping-option').hide();
						$('.grandtotal-resume').hide();
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
						$('.card-view-address').hide();
						$('.shipping-option').hide();
						$('.grandtotal-resume').hide();
						
						$('#button-finished').hide();
						
						$('.box-select-card').slideDown('100');
						/***************/
						
						$('.card-view-address').slideDown('100');
						$('.shipping-option').slideDown('100');
						
						if($(window).width() <= 767){
							$('.grandtotal-resume').slideDown('100');
						}
						
						$('#list-' + this.select_card() ).slideDown('100');
						$('#one-li-form-payment').slideDown('100');
						$('#button-finished').slideDown('100');
					}
					else {
						/******* select com dois cartões ********/
						$('#one-li-form-payment').slideUp(1);
						$('.card-view-address').hide();
						$('.shipping-option').hide();
						$('.grandtotal-resume').hide();
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
				
				var ccNumber 			= $('#' + this.getCode() + '_cc_number').val();
				ccNumber 				= ccNumber.replace(/[^0-9]/g,'');
				
				if(typePayment == 'credit_multiple') {
					var valOne = $('#' + this.getCode() + '_cc_multiple_val_oneCard').val();
				} else {
					var valOne = quote.totals().grand_total;
				}
				
				var totalInstallments 	= $('#' + this.getCode() + '_installments').val()
				var fourDigits 			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not').is(":checked")) ? true : false;
				
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
				
				if($('.address-line-one').lenght) {
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
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
							this.removeMask( $('input[name="vat_id"]').val() )
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
				
				$('.card-view-address').slideDown('100');
				$('.shipping-option').slideDown('100');
				if($(window).width() <= 767){
					$('.grandtotal-resume').slideDown('100');
				}
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
				
				var ccNumber 			= $('#' + this.getCode() + '_cc_number').val();
				ccNumber 				= ccNumber.replace(/[^0-9]/g,'');
				var valOne 	 			= $('#' + this.getCode() + '_cc_multiple_val').val();
				var totalInstallments 	= $('#' + this.getCode() + '_installments').val()
				var fourDigits 			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not').is(":checked")) ? true : false;
				
				valOne = this.customValValidate(valOne);
				var valTwo = quote.totals().grand_total - valOne;
				
				this.amount_one( valOne );
				this.amount_two( valTwo );
				this.amount_ticket( valTwo );
				
				var bandeira = this.setPaymentFlag(ccNumber);
				this.setBandeiraInfo('#one-li-form-payment .middle-number-card img', bandeira, 'info');
				
				if($('.address-line-one').lenght) {
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
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
							this.removeMask( $('input[name="vat_id"]').val() )
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
				
				var ccNumber 			= $('#' + this.getCode() + '_cc_number').val();
				ccNumber 				= ccNumber.replace(/[^0-9]/g,'');
				var valTwo 	 			= $('#' + this.getCode() + '_cc_multiple_val').val();
				var totalInstallments 	= $('#' + this.getCode() + '_installments').val()
				var fourDigits 			= ccNumber.substr(-4, 4);
				var imOwer 				= ($('#not').is(":checked")) ? true : false;
				
				valTwo = this.customValValidate(valTwo);
				var valOne = quote.totals().grand_total - valTwo;
				
				this.amount_two( valTwo );
				this.amount_one( valOne );
				
				var bandeira = this.setPaymentFlag(ccNumber);
				this.setBandeiraInfo('#two-li-form-payment .middle-number-card img', bandeira, 'info');
				
				if($('.address-line-one').lenght) {
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
				
				$('.shipping-option .shipping-option-li').html(
					$('#checkout-shipping-method-load .iwd_opc_select_option.selected').html()
				);
				$('.shipping-option .shipping-option-li').append(
					'<div class="shipping-arrow"></div>'
				);
				
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
							this.removeMask( $('input[name="vat_id"]').val() )
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
				
				$('.card-view-address').slideDown('100');
				$('.shipping-option').slideDown('100');
				if($(window).width() <= 767){
					$('.grandtotal-resume').slideDown('100');
				}
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
			
            getMyOrdersUrl: function() {
				return window.checkoutConfig.payment[this.getCode()].myOrders;
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
				return window.checkoutConfig.payment[this.getCode()].icon_cvv;
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
            getIconBoleto: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_barcode;
            },           
			getIconBarCode: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_barcode_white;
            },
            getIconCard: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_credcard;
            },             
			getIconTwoCards: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_twocards;
            },  			
			getIconCreditTicket: function() {
                return window.checkoutConfig.payment[this.getCode()].credit_ticket;
            },  
            getArrowRight: function() {
                return window.checkoutConfig.payment[this.getCode()].arrow_right;
            }, 			
			getCardOne: function() {
                return window.checkoutConfig.payment[this.getCode()].card_one;
            },			
			getCardTwo: function() {
                return window.checkoutConfig.payment[this.getCode()].card_two;
            },			
			getIconAddressAqpago: function() {
                return window.checkoutConfig.payment[this.getCode()].address_postcode;
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
                return window.checkoutConfig.payment[this.getCode()].icon_relogio;
            },			
			getIconEmail: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_email;
            },			
			getIconAlert: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_alert;
            },			
			getIconCopy: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_copy;
            },			
			getIconPhone: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_phone;
            },			
			getIconEdit: function() {
                return window.checkoutConfig.payment[this.getCode()].icon_edit;
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
                return window.checkoutConfig.payment[this.getCode()].card_icon_clean;
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
				}
				
				$('.iwd_opc_wrapper.iwd_main_wrapper').slideUp();
				$('.aqbank_mobile_steps').slideUp();
				$('.aqbank_opc_payment').slideUp();
				$('.iwd_summary_custom').slideUp();
				$('.iwd_opc_shipping_column').slideUp();
				
				$('.payment-method-aqbank').hide();
				$('.finish-animation-box-two .circle-img').hide();
				
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
					
					if(self.payment_order_id()){
						
						$.ajax({
							showLoader: true,
							url: orderUpdateUrlResponse,
							data: {
								orderId: self.payment_order_id(),
								paymentData: self.getData()
							},
							type: "POST"
						}).done(function(result) {
							
							if(result.success) {
								if(result.response.pay){
									/** Pago continuar **/
									$('.order-number').html( '#' + result.response.order_increment );
									
									self.afterPlaceOrder();
									
									$('.finish-animation-box-two .circle-img').fadeIn('100');
									
									setTimeout(function(){ 
										/** Success Return **/
										$('.iwd_opc_wrapper.iwd_main_wrapper').show();
										$('.aqbank_resume_order').show();
										$('.finish-animation-box').fadeOut('100');
									 }, 1000);
									 
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
										
										$('.li-form-payment-ticket-infos').show();
									}
									
									if($(window).width() > 767){
										$('.iwd_summary_custom').fadeIn('100');
									}
									$('.aqbank_opc_payment').fadeIn('100');
									/** Success Return **/
									
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
						
						this.getPlaceOrderDeferredObject()
							.fail(
								function (data, status, code) {
									$('.finish-animation-box').hide();
									
									$('.iwd_opc_wrapper.iwd_main_wrapper').show();
									$('.aqbank_mobile_steps').show();
									$('.aqbank_opc_payment').show();
									$('.iwd_summary_custom').show();
									$('.payment-method-aqbank').show();
									
									messageList.addErrorMessage({ message: $t( data.responseText ) });
		
									/** rewrite card information **/
									self.cards( cards );
									self.isPlaceOrderActionAllowed(true);
								}
							).done(
							function (data) {
								/** console.log( data ); **/
								
								/** rewrite card information **/
								self.cards( cards );
								if(Number.isInteger(data)) {
									self.payment_order_id( data );
								}
								
								$.ajax({
									showLoader: true,
									url: orderUrlResponse,
									data: {orderId: data},
									type: "POST"
								}).done(function(result) {
									
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
											
											$('.finish-animation-box-two .circle-img').fadeIn('100');
											
											setTimeout(function(){ 
												/** Success Return **/
												$('.iwd_opc_wrapper.iwd_main_wrapper').show();
												$('.aqbank_resume_order').show();
												$('.finish-animation-box').fadeOut('100');
											 }, 1000);
											 
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
												}).fail(function (jqXHR, exception) {
													
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
													$('.card-view-address').css('opacity','0.4');
													$('.shipping-option').css('opacity','0.4');
													$('.shipping-option-li').removeAttr('data-bind');
													$('#aqpago_cc_multiple_val_oneCard').prop('readonly', true);
													$('#aqpago_cc_multiple_val_twoCard').prop('readonly', true);
													
													
													var shippingHtml = $('.shipping-option-li').html();
													$('.shipping-option-li').remove();
													$('.shipping-option').append( 
														'<div class="shipping-option-li" style="cursor: inherit;">' + 
														shippingHtml + 
														'</div>'
													);
													
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
										$('.finish-animation-box').hide();
										
										$('.iwd_opc_wrapper.iwd_main_wrapper').show();
										$('.aqbank_mobile_steps').show();
										$('.aqbank_opc_payment').show();
										$('.iwd_summary_custom').show();
										$('.payment-method-aqbank').show();
											
											
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
			
			animationFinished: function() {
				
			},
            /**
             * @override
             */
            /**
             * Place order.
             */
            placeOrder: function (data, event) {
				this.animationFinished();
				return false;
				
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
