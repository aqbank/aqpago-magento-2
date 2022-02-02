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
     * @inheritdoc
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
                    $errorMessages = array_merge($errorMessages, $validationResult[1]);
                }
            }
        }

        return $this->createResult($isValid, $errorMessages);
    }

    /**
     * @return array
     */
    protected function getResponseValidators()
    {
        return [
            function ($response) {
				
				if(method_exists($response, 'getStatus')){
					$result = true;
					$message = 'Aqpago error response.';
				}
				else {
					//$logger = new \Monolog\Logger('aqpago');
					//$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_erros.log', \Monolog\Logger::DEBUG));
					//$logger->info('Log Aqpago response');
					//$logger->info('response: ' . json_encode($response));
					
					$result 	= false;
					$response 	= json_decode($response, true);
					$message 	= '';
					
					if(isset($response['erro'])) {
						foreach($response['erro'] as $k => $erro){
							if(is_array($erro)) {
								foreach($erro as $k => $msg){
									if(!is_array($msg)) {
										$message .= ' ' . $msg;
									}
								}
							}
							else {
								$message .= ' ' . $erro;
							}
						}
					}
					else {
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
}
