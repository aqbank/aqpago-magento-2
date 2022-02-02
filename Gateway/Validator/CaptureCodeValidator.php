<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Validator;

/**
 * Class AuthorizeValidator
 */
class CaptureCodeValidator extends GeneralResponseValidator
{
    /**
     * @return array
     */
    protected function getResponseValidators()
    {
        return array_merge(
            parent::getResponseValidators(),
            [
                function ($response) {
					
					print_r($response);
					die('capture');
					
					$message_response = [
						'ORDER_CREATE' 				=> 'order created.',
						'ORDER_WAITING' 			=> 'order waiting payment.',
						'ORDER_IN_ANALYSIS' 		=> 'order in analysis.',
						'ORDER_NOT_PAID' 			=> 'order not paid.',
						'ORDER_PAID' 				=> 'order paid.',
						'ORDER_PARTIAL_PAID'		=> 'partially paid order.',
						'ORDER_CANCELED'			=> 'order canceled.',
						'ORDER_REVERSED'			=> 'order reversed.',
						'ORDER_PARTIAL_REVERSED'	=> 'order partial reversed.',
						'ORDER_CHARGE_BACK'			=> 'order with charge back.',
						'ORDER_DISPUTE'				=> 'order in dispute.',
						'ORDER_FAILED'				=> 'order failed.',
					];
					
                    return [
                        in_array(
                            $response->getStatus(),
                            [
								'ORDER_PAID',
                            ]
                        ),
						sprintf('[Aqpago %d] - %s', $response->getStatus(), $message_response[ $response->getStatus() ])
                    ];
                }
            ]
        );
    }
}
