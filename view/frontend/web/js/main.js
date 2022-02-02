define([
'jquery',
'jquerymask',
'Magento_Customer/js/customer-data',
'domReady!'
], function($, mask, customerData) {
	"use strict";
	
	$(document).ready(function(){
		$('#documento').mask('000.000.000-00');
		$('#card-number').mask('0000 0000 0000 0000000');
		$('#number_card').mask('0000 0000 0000 0000000');
	});
	
	function main(config, element) {
        var $element = $(element);
        var AjaxUrl = config.AjaxUrl;
		
		/*
		$("#postcode").change(function() {
			var param = 'postcode=' + $(this).val();
			$('.img-load-aqpago').show();
			$.ajax({
				showLoader: false,
				url: AjaxUrl,
				data: param,
				type: "POST"
			}).done(function (data) {
				$('.img-load-aqpago').hide();
				if (data.hasOwnProperty('response')) {
					
					if ( $( ".address" ).length ) $('.address').val( data.response.logradouro );
					if ( $( ".complement" ).length ) $('.complement').val( data.response.complemento );
					if ( $( ".district" ).length ) $('.district').val( data.response.bairro );
					if ( $( ".city" ).length ) $('.city').val( data.response.localidade );
					if ( $( ".state" ).length ) $('.state').val( data.response.uf ).change();
					
					$('#number').focus();
					
				} else {
					return false;
				}
			}).fail(function (jqXHR, exception) {
				$('.img-load-aqpago').hide();
			});
		});
		
		*/
		
		if ( $( "#number_card" ).length ) {
			$("#number_card").keyup(function() {
				if($(this).val()) {
					$("#card-number").html( $(this).val() );
				} else {
					$("#card-number").html( '0000 0000 0000 0000' );
				}
				
				return setFlag($(this).val(), config);
			});
		}
		if ( $( "#name_card" ).length ) {	
			$("#name_card").keyup(function() {
				if($(this).val()) {
					
					if($(this).val().length < 20) {
						$("#card-firstname").html( $(this).val() );
					} else {
						$('#card-firstname').html( $(this).val().substring(0, 20) );
					}
				} else {
					$("#card-firstname").html( 'Nome do proprietário' );
				}
			});
		}
			
		if ( $( "#code" ).length ) {	
			$("#code").focusin(function() {
				$(".card-box").removeClass("card-front");
				$(".card-box").addClass("card-back");
			});
			$("#code").focusout(function() {
				$(".card-box").removeClass("card-back");
				$(".card-box").addClass("card-front");
			});
			$("#code").keyup(function() {
				if($(this).val()) {
					$("#card-code").html( $(this).val() );
				} else {
					$("#card-code").html( '***' );
				}
			});
		}
		
		if ( $( "#valid_month" ).length ) {	
			$("#valid_month").change(function() {
				if($(this).val()) {
					$("#card-month").html( $(this).val() );
				} else {
					$("#card-month").html( 'MM' );
				}
			});
			
			$("#valid_year").change(function() {
				if($(this).val()) {
					$("#card-year").html( $(this).val() );
				} else {
					$("#card-month").html( 'AAAA' );
				}
			});
		}
		
    };
	
	function setFlag(digiCard, config) {
		var numberCard = digiCard.replace(" ", "");
		
		var Bandeira	= ''; 
		var Maxkey		= 19; 
		var digitos		= numberCard.length;
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
		
		if(numberCard == '') {
			return false;
		}
		else if(Mastercard.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_mastercard);
			
			$('.flag-card').show();
			
			$('#number_card').mask('0000 0000 0000 0000000');
		}
		else if(Amex.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_american_express);
			$('.flag-card').show();
			
			$('#number_card').mask('0000 0000 0000 0000000');
		}
		else if(HIPERCARD.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_hipercard);
			$('.flag-card').show();
			
			if(digitos <= 13) {
				$('#number_card').mask("0000 0000 00 000000000");
			} 
			else if(digitos > 13 && digitos <= 16) {
				$('#number_card').mask("0000 0000 0000 0000000");
			} 
			else if(digitos > 16 && digitos <= 19) {
				$('#number_card').mask("0000 0000 0000 0000 000");
			}
		}		
		else if(JCB.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_jcb);
			$('.flag-card').show();
			
			$('#number_card').mask("0000 0000 0000 0000000");
		}		
		else if(ELO.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_elo);
			$('.flag-card').show();
			
			$('#number_card').mask("0000 0000 0000 0000000");
		}
		else if(AURA.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_aura);
			$('.flag-card').show();
			
			$('#number_card').mask("0000 0000 0000 0000000");
		}		
		else if(HIPER.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_hiper);
			$('.flag-card').show();
			
			$('#number_card').mask("0000 0000 0000 0000000");
		}		
		else if(Banescard.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_banescard);
			$('.flag-card').show();
			
			$('#number_card').mask("0000 0000 0000 0000000");
		}
		else if(Visa.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_visa);
			$('.flag-card').show();
			
			$('#number_card').mask('0000 0000 0000 0000000');
		}
		/* else if(Diners.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_diners);
			$('.flag-card').show();
			
			if(digitos <= 14) {
				$('#number_card').mask("0000 000000 0000000");
			} 
			else {
				$('#number_card').mask("0000 0000 0000 0000000");
			}
		}	 */	
		/* else if(Discover.test(numberCard)) {
			$('#img-flag-card').attr('src', config.flag_discover);
			$('.flag-card').show();
			
			$('#number_card').mask('0000 0000 0000 0000000');
		}	*/	
		
		return true;
	};
	
	return main;		
});
