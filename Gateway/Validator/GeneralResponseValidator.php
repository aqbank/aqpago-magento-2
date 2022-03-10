<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Validator;

use Magento\Payment\Gateway\Validator\AbstractValidator;
use Aqbank\Aqpago\Gateway\Helper\SubjectReader;
use Magento\Payment\Gateway\Validator\ResultInterfaceFactory;

class GeneralResponseValidator extends AbstractValidator
{
    /**
     * @var SubjectReader
     */
    protected $subjectReader;

    /**
     * Constructor
     *
     * @param ResultInterfaceFactory $resultFactory
     * @param SubjectReader $subjectReader
     */
    public function __construct(ResultInterfaceFactory $resultFactory, SubjectReader $subjectReader)
    {
        parent::__construct($resultFactory);
        $this->subjectReader = $subjectReader;
    }

    /**
     * Method validate
     *
     * @param array $validationSubject
     */
    public function validate(array $validationSubject)
    {
        $response = $this->subjectReader->readResponseObject($validationSubject);
        $isValid = true;
        $errorMessages = [];
        foreach ($this->getResponseValidators() as $validator) {
            $validationResult = $validator($response);

            if (!$validationResult[0]) {
                $isValid = $validationResult[0];

                if (is_array($validationResult[1])) {
                    $errorMessages[] = $validationResult[1];
                }
            }
        }

        $errorMessages = array_merge([], ...$errorMessages);

        return $this->createResult($isValid, $errorMessages);
    }

    /**
     * Method getResponseValidators
     *
     * @return array
     */
    protected function getResponseValidators()
    {
        return [
            function ($response) {
                
                if (method_exists($response, 'getStatus')) {
                    $result = true;
                    $message = 'Aqpago error response.';
                } else {
                    $result     = false;
                    $response   = json_decode($response, true);
                    $message    = '';
                    
                    if (isset($response['erro'])) {
                        $message .= $this->processResponseArr($response);
                    } else {
                        $message = 'Aqpago error response.';
                    }
                }

                return [
                    $result,
                    __($message)
                ];
            }
        ];
    }

    /**
     * Method processResponseArr
     *
     * @param array $response
     * @return string
     */
    public function processResponseArr(array $response)
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
