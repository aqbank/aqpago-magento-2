<?php
/**
 * Copyright © 2013-2017 Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Gateway\Response;

use Magento\Payment\Gateway\Response\HandlerInterface;
use Aqbank\Aqpago\Gateway\Config\Config;
use Aqbank\Aqpago\Gateway\Helper\SubjectReader;
use Aqbank\Aqpago\Model\CardsFactory;

/**
 * Class CardDetailsHandler
 */
class CardDetailsHandler implements HandlerInterface
{
    /**
     * @var SubjectReader
     */
    private $subjectReader;

    /**
     * @var Config
     */
    private $config;
	
    /**
     * @var CardsFactory
     */
    private $cardsFactory;
	
	private $_remoteAddress;
	
    /**
     * Constructor
     *
     * @param SubjectReader $subjectReader
     * @param Config $config
     */
    public function __construct(
		SubjectReader $subjectReader, 
		Config $config,
		CardsFactory $cardsFactory
	)
    {
        $this->subjectReader = $subjectReader;
        $this->config = $config;
		$this->cardsFactory = $cardsFactory;
		
		$objctManager = \Magento\Framework\App\ObjectManager::getInstance();
		$remote = $objctManager->get('Magento\Framework\HTTP\PhpEnvironment\RemoteAddress');
		$this->_remoteAddress = $remote->getRemoteAddress();
    }
	
    /**
     * @inheritdoc
     */
    public function handle(array $handlingSubject, array $response)
    {
        $paymentDO 	= $this->subjectReader->readPayment($handlingSubject);
        $payment 	= $paymentDO->getPayment();
		
        //$logger = new \Monolog\Logger('aqpago');
        //$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago.log', \Monolog\Logger::DEBUG));
        //$logger->info('Log Aqpago CardHan');
        
		
        /**
         * @var Transaction
         */
        $response_obj = $this->subjectReader->readTransaction($response);
		
		//$logger->info('getType: ' . json_encode($response_obj->getType()));
		//$logger->info('payment: ' . json_encode($response_obj->getPayments()));
		$payment->setAdditionalInformation('Environment', $this->config->getEnvironment());
		
		if ($response_obj->getId()) {
			if($response_obj->getType() && 
				(
					$response_obj->getType() == 'credit' ||
					$response_obj->getType() == 'multi_credit' ||
					$response_obj->getType() == 'multi_ticket'
				)
			) {
				$customerId 	= $payment->getAdditionalInformation('customer_id');
				$ncard = 1;
				foreach($response_obj->getPayments() as $key => $pay) {
					if($pay->getType() == 'credit') {
						$first4_digits 		= $pay->getCreditCard()->getFirst4Digits();
						$last4_digits 		= $pay->getCreditCard()->getLast4Digits();
						$expiration_month 	= $pay->getCreditCard()->getExpirationMonth();
						$expiration_year 	= $pay->getCreditCard()->getExpirationYear();
						$holder_name 		= $pay->getCreditCard()->getHolderName();
						$flag 				= $pay->getCreditCard()->getFlag();
						$paymentDate		= $pay->getPaymentDate();
						
						if($ncard == 1 && count($response_obj->getPayments()) > 1) {
							$payment->setAdditionalInformation('id_credit', $pay->getId());
						} 
						
						if($ncard == 2){
							$payment->setAdditionalInformation('id_second_credit', $pay->getId());
						}
						
						$cardsFactory 	= $this->cardsFactory->create();
						$collection 	= $cardsFactory->getCollection()
															->addFieldToFilter('number_card', 
																['eq' => $pay->getCreditCard()->getFirst4Digits()."********".$pay->getCreditCard()->getLast4Digits()]
															)
															->addFieldToFilter('customer_id', ['eq' => $customerId])
															->getFirstItem();
						
						if(!count($collection->getData())) {
							$cardsFactory = $this->cardsFactory->create();
							$cardsFactory->setCustomerId( $customerId );
							$cardsFactory->setAqpagoId( $pay->getCreditCard()->getId() );
							$cardsFactory->setPaymentId( $payment->getId() );
							$cardsFactory->setNumberCard( 
								$pay->getCreditCard()->getFirst4Digits() . "********" . $pay->getCreditCard()->getLast4Digits()
							);
							$cardsFactory->setNameCard( $pay->getCreditCard()->getHolderName() );
							$cardsFactory->setValidMonth( $pay->getCreditCard()->getExpirationMonth() );
							$cardsFactory->setValidYear( $pay->getCreditCard()->getExpirationYear() );
							$cardsFactory->setFlag( $pay->getCreditCard()->getFlag() );
							$cardsFactory->setIsActive(1);
							
							if(date("Y-m-d") > date("Y-m-d", strtotime($pay->getCreditCard()->getExpirationYear() . '-' . $pay->getCreditCard()->getExpirationMonth() . '-' . date('d')))) {
								$cardsFactory->setExpired(1);
							}
							else {
								$cardsFactory->setExpired(0);
							}
							
							$cardsFactory->setIpCreate( $this->_remoteAddress );
							$cardsFactory->save();
						}
						
						$ncard++;
					}
					
				}
			}
			
			$payments = $payment->getAdditionalInformation('payments');
			$payments = json_decode($payments, true);
			
			if(count($payments)){
				$ps = 1;
				foreach($payments as $k => $pay){
					
					$payment->setAdditionalInformation($ps.'_pay_amount', $pay['amount']);
					$payment->setAdditionalInformation($ps.'_pay_type', $pay['type']);
					$payment->setAdditionalInformation($ps.'_pay_status', $pay['status']);
					$payment->setAdditionalInformation($ps.'_pay_message', $pay['message']);
					$payment->setAdditionalInformation($ps.'_pay_date', (isset($pay['payment_date'])) ? $pay['payment_date'] : null);
					$payment->setAdditionalInformation($ps.'_pay_created_at', $pay['created_at']);
					
					if($pay['type'] == 'credit'){
						$payment->setAdditionalInformation($ps.'_pay_installments', $pay['installments']);
						$payment->setAdditionalInformation($ps.'_pay_flag', $pay['credit_card']['flag']);
						$payment->setAdditionalInformation($ps.'_pay_number', $pay['credit_card']['first4_digits'] . ' **** ***** ' .  $pay['credit_card']['last4_digits']);
						$payment->setAdditionalInformation($ps.'_pay_holder_name', $pay['credit_card']['holder_name']);
					}
					if($pay['type'] == 'ticket'){
						$payment->setAdditionalInformation($ps.'_pay_installments', 1);
						$payment->setAdditionalInformation('id_ticket', $pay['id']);
						$payment->setAdditionalInformation('ticket_url', $pay['ticket_url']);
						$payment->setAdditionalInformation('ticket_bar_code', $pay['ticket_bar_code']);
						$payment->setAdditionalInformation('expiration_date', $pay['expiration_date']);
						
					}
					
					$ps++;
				}
			}
			
			/*
			print_r($payments);die();
			
			if($response_obj->getType() && $response_obj->getType() == 'ticket'){
				
				$payment->setCcType('ticket');
				$payment->setAdditionalInformation('id_ticket', $response_obj->getPayments()[0]->getId());
				$payment->setAdditionalInformation('ticket_url', $response_obj->getPayments()[0]->getTicketUrl());
				$payment->setAdditionalInformation('ticket_bar_code', $response_obj->getPayments()[0]->getTicketBarCode());
				$payment->setAdditionalInformation('expiration_date', $response_obj->getPayments()[0]->getExpirationDate());
				$payment->setAdditionalInformation('created_at', $response_obj->getPayments()[0]->getCreatedAt());
				$payment->setAdditionalInformation('payment_date', $response_obj->getPayments()[0]->getPaymentDate());
			}
			
			if($response_obj->getType() && $response_obj->getType() == 'multi_ticket'){
				$first4_digits 		= '';
				$last4_digits 		= '';
				$expiration_month 	= '';
				$expiration_year 	= '';
				$holder_name 		= '';
				$flag 				= '';
				$paymentDate		= '';
				$ncard 				= 1;
				
				
				foreach($response_obj->getPayments() as $key => $pay) {
					if($pay->getType() == 'ticket') {
						$payment->setCcType('ticket');
						$payment->setAdditionalInformation('id_ticket', $pay->getId());
						$payment->setAdditionalInformation('ticket_url', $pay->getTicketUrl());
						$payment->setAdditionalInformation('ticket_bar_code', $pay->getTicketBarCode());
						$payment->setAdditionalInformation('expiration_date', $pay->getExpirationDate());
						$payment->setAdditionalInformation('created_at', $pay->getCreatedAt());
						
						
						$payment->setAdditionalInformation('payment_date', $pay->getPaymentDate());
					}
					
					$ncard++;
				}
				
				
			} */
		}
    }
}
