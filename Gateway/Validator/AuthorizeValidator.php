<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Validator;

class AuthorizeValidator extends GeneralResponseValidator
{
    /**
     * Method getResponseValidators
     *
     * @return array
     */
    protected function getResponseValidators()
    {
        return array_merge(
            parent::getResponseValidators(),
            [
                function ($response) {
                    $message_response = [
                        'ORDER_CREATE'              => 'order created.',
                        'ORDER_WAITING'             => 'order waiting payment.',
                        'ORDER_IN_ANALYSIS'         => 'order in analysis.',
                        'ORDER_NOT_PAID'            => 'order not paid.',
                        'ORDER_PAID'                => 'order paid.',
                        'ORDER_PARTIAL_PAID'        => 'partially paid order.',
                        'ORDER_CANCELED'            => 'order canceled.',
                        'ORDER_REVERSED'            => 'order reversed.',
                        'ORDER_PARTIAL_REVERSED'    => 'order partial reversed.',
                        'ORDER_CHARGE_BACK'         => 'order with charge back.',
                        'ORDER_DISPUTE'             => 'order in dispute.',
                        'ORDER_FAILED'              => 'order failed.',
                    ];
                    
                    if (method_exists($response, 'getStatus')) {
                        $result = true;
                        if (isset($message_response[$response->getStatus()])) {
                            $message = sprintf(
                                '[Aqpago %d] - %s',
                                $response->getStatus(),
                                $message_response[$response->getStatus()]
                            );
                        } else {
                            $result     = false;
                            $message    = 'Houve um errro ao realizar o pagamento.';
                        }
                    } else {
                        $result     = false;
                        $response   = json_decode($response, true);
                        $message    = '';
                        
                        if (isset($response['erro'])) {
                            $message = $this->processResponseError($response);
                        } else {
                            $message = 'Aqpago error response.';
                        }
                    }
                    
                    return [
                        $result,
                        $message
                    ];
                }
            ]
        );
    }

    /**
     * Method processResponseError
     *
     * @param array $response
     * @return array
     */
    public function processResponseError(array $response)
    {
        $message = '';
        
        foreach ($response['erro'] as $k => $erro) {
            if (is_array($erro)) {
                foreach ($erro as $k => $msg) {
                    if (!is_array($msg)) {
                        $message .= ' ' . $msg;
                    }
                }
            } else {
                $message .= ' ' . $erro;
            }
        }
        
        return $message;
    }
}
