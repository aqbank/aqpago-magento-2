<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Observer;

use Magento\Framework\DataObject;
use Magento\Framework\Event\Observer;
use Magento\Framework\Exception\LocalizedException;
use Magento\Payment\Model\InfoInterface;
use Magento\Payment\Observer\AbstractDataAssignObserver;
use Magento\Quote\Api\Data\PaymentInterface;
use Magento\Quote\Model\QuoteFactory;

use Aqbank\Aqpago\Model\CardsFactory;

class DataAssignObserver extends AbstractDataAssignObserver
{
    /**
     * @var QuoteFactory
     */
	protected $quoteFactory;
	
    /**
     * @var CardsFactory
     */
    private $cardsFactory;
	
    /**
     * Constructor
     *
     * @param QuoteFactory $quoteFactory
     * @param CardsFactory $cardsFactory
     */
	public function __construct(
		QuoteFactory $quoteFactory,
		CardsFactory $cardsFactory
	)
	{
		$this->quoteFactory = $quoteFactory;
		$this->cardsFactory = $cardsFactory;
	}
	
    /**
     * @param Observer $observer
     *
     * @return void
     * @throws LocalizedException
     */
    public function execute(Observer $observer)
    {
        $data = $this->readDataArgument($observer);

        $additionalData = $data->getData(PaymentInterface::KEY_ADDITIONAL_DATA);
		
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago.log', \Monolog\Logger::DEBUG));
        $logger->info('Log Aqpago DataAssignObserver');
        $logger->info('getData: ' . json_encode($data->getData()));
        $logger->info('Attributes: ' . json_encode($additionalData));
		
        if (!is_array($additionalData)) {
			if(!$additionalData->getData('type_payment')) {
				return;
			}
        }

        $additionalData = new DataObject($additionalData);
        $paymentMethod = $this->readMethodArgument($observer);

        $payment = $observer->getPaymentModel();
        
        if (!$payment instanceof InfoInterface) {
            $payment = $paymentMethod->getInfoInstance();
        }
		
        if (!$payment instanceof InfoInterface) {
			$logger->info('Payment model does not provided.');
            throw new LocalizedException(__('Payment model does not provided.'));
        }
		
		$quote 				= $this->quoteFactory->create()->load( $payment->getQuoteId() );
		$objectManager 		= \Magento\Framework\App\ObjectManager::getInstance();
		$customerSession 	= $objectManager->get('Magento\Customer\Model\Session');
		if($customerSession->isLoggedIn()) {
			$customerId = $quote->getCustomerId();
			$payment->setAdditionalInformation('customer_id', $customerId);
		}
		
		$amountOne  = 0.00;
		
		if($additionalData->getData('type_payment') == 'credit' || $additionalData->getData('type_payment') == 'ticket'){
			$payment->setAdditionalInformation('type_payment', $additionalData->getData('type_payment'));
		}
		else {
			if($additionalData->getData('type_payment') == 'credit_multiple') {
				$payment->setAdditionalInformation('type_payment', 'multi_credit');
			}
			if($additionalData->getData('type_payment') == 'ticket_multiple') {
				$payment->setAdditionalInformation('type_payment', 'multi_ticket');
			}
		}

		
		//throw new LocalizedException(__('Payment model does not provided.'));
		/** Crédito, Crédito Multiplo, Boleto Multiplo **/
		if(
			$additionalData->getData('type_payment') == 'credit' ||
			$additionalData->getData('type_payment') == 'credit_multiple' ||
			$additionalData->getData('type_payment') == 'ticket_multiple'
		) {
			
			$one_cc_number 	= preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_number') );
			$amountOne 		= number_format($additionalData->getData('one_cc_amount'), 2, '.', '');			
			
			$payment->setCcLast4(substr($one_cc_number, -4));
			$payment->setCcNumberEnc( $payment->encrypt( $one_cc_number ) );
			$payment->setCcNumber( $one_cc_number );
			$payment->setCcCid($additionalData->getData('one_cc_cid'));
			$payment->setCcType($additionalData->getData('one_cc_flag'));
			$payment->setCcExpMonth( preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_exp_month')) );
			$payment->setCcExpYear( preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_exp_year')) );
			$payment->setCcOwner($additionalData->getData('one_cc_owner'));
			
			$payment->setAdditionalInformation('one_cc_document', preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_document')));
			$payment->setAdditionalInformation('one_cc_installments', intval($additionalData->getData('one_cc_installments')));
			$payment->setAdditionalInformation('one_cc_amount', $amountOne);
			$payment->setAdditionalInformation('one_cc_saved', $additionalData->getData('one_cc_saved'));
			$payment->setAdditionalInformation('one_cc_number_id', $additionalData->getData('one_cc_number_id'));
		}
		
		/** Crédito Multiplo **/
		if($additionalData->getData('type_payment') == 'credit_multiple') {
			
			$two_cc_number = preg_replace('/[^\d\-]/', '', $additionalData->getData('two_cc_number') );
			$amountTwo = $quote->getGrandTotal() - $amountOne;
			
			$payment->setAdditionalInformation('two_setCcLast4', substr($two_cc_number, -4));
			$payment->setAdditionalInformation('two_setCcNumberEnc', $payment->encrypt( $two_cc_number ) );
			$payment->setAdditionalInformation('two_cc_number', $two_cc_number );
			$payment->setAdditionalInformation('two_cc_cid', $additionalData->getData('two_cc_cid'));
			$payment->setAdditionalInformation('two_cc_flag', $additionalData->getData('two_cc_flag'));
			$payment->setAdditionalInformation('two_cc_exp_month', preg_replace('/[^\d\-]/', '', $additionalData->getData('two_cc_exp_month')) );
			$payment->setAdditionalInformation('two_cc_exp_year', preg_replace('/[^\d\-]/', '', $additionalData->getData('two_cc_exp_year')) );
			$payment->setAdditionalInformation('two_cc_owner', $additionalData->getData('two_cc_owner'));
			
			$payment->setAdditionalInformation('two_cc_document', preg_replace('/[^\d\-]/', '', $additionalData->getData('two_cc_document')));
			$payment->setAdditionalInformation('two_cc_installments', intval($additionalData->getData('two_cc_installments')));
			$payment->setAdditionalInformation('two_cc_amount', $amountTwo);
			$payment->setAdditionalInformation('two_cc_saved', $additionalData->getData('two_cc_saved'));
			$payment->setAdditionalInformation('two_cc_number_id', $additionalData->getData('two_cc_number_id'));
		}
		
		/** Boleto Multiplo **/
		if($additionalData->getData('type_payment') == 'ticket_multiple') {
			if($additionalData->getData('one_cc_card_saved')){
				
			} 
			else {
				$one_cc_number 	= preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_number') );
				$amountOne 		= number_format($additionalData->getData('one_cc_amount'), 2, '.', '');
				
				$payment->setCcLast4(substr($one_cc_number, -4));
				$payment->setCcNumberEnc( $payment->encrypt( $one_cc_number ) );
				$payment->setCcNumber( $one_cc_number );
				$payment->setCcCid($additionalData->getData('one_cc_cid'));
				$payment->setCcType($additionalData->getData('one_cc_flag'));
				$payment->setCcExpMonth( preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_exp_month')) );
				$payment->setCcExpYear( preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_exp_year')) );
				$payment->setCcOwner($additionalData->getData('one_cc_owner'));
				
				
				$payment->setAdditionalInformation('one_cc_document', preg_replace('/[^\d\-]/', '', $additionalData->getData('one_cc_document')));
				$payment->setAdditionalInformation('one_cc_installments', intval($additionalData->getData('one_cc_installments')));
				$payment->setAdditionalInformation('one_cc_amount', $amountOne);
				
			}
			
			$payment->setAdditionalInformation('ticket_amount', $additionalData->getData('ticket_amount_multiple'));
		}
		
		/** Boleto **/
		if($additionalData->getData('type_payment') == 'ticket') {
			$payment->setAdditionalInformation('ticket_amount', $additionalData->getData('ticket_amount'));
		}
    }
}
