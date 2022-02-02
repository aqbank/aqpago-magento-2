<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Gateway\Response;

use Aqbank\Aqpago\Gateway\Helper\SubjectReader;
use Magento\Sales\Model\Order\Payment;
use Magento\Sales\Model\Order\Payment\Transaction;

//use Rede\Transaction;

class VoidHandler extends TransactionIdHandler
{
    /**
     * @var SubjectReader
     */
    private $subjectReader;

    /**
     * TransactionIdHandler constructor.
     * @param SubjectReader $subjectReader
     */
    public function __construct(
        SubjectReader $subjectReader
    ) {
        parent::__construct($subjectReader);

        $this->subjectReader = $subjectReader;
    }

    /**
     * Whether transaction should be closed
     *
     * @return bool
     */
    protected function shouldCloseTransaction()
    {
        return true;
    }

    /**
     * Whether parent transaction should be closed
     *
     * @param Payment $orderPayment
     * @return bool
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function shouldCloseParentTransaction(Payment $orderPayment)
    {
        return true;
    }

    public function handle(array $handlingSubject, array $response)
    {
        $paymentDO = $this->subjectReader->readPayment($handlingSubject);
		
		//die('TransactionIdHandler');
		
        /**
         * @var Transaction
         */
        $response_obj = $this->subjectReader->readTransaction($response);

        if (!is_null($response_obj)) {
            $payment = $paymentDO->getPayment();
			/*
            $payment->setAdditionalInformation("Codigo de Retorno", $response_obj->getReturnCode());
            $payment->setAdditionalInformation("Messagem de Retorno", $response_obj->getReturnMessage());

            $payment->setAdditionalInformation("Nsu", $response_obj->getNsu());
            $payment->setAdditionalInformation("Id Refund", $response_obj->getRefundId());
            $payment->setAdditionalInformation("Id Cancel", $response_obj->getCancelId()); */
			
			$payment->setAdditionalInformation("Reponse", $response_obj->jsonSerialize());
			
			$_payments = json_encode($response_obj->getPayments());
			$_payments = json_decode($_payments, true);
			
            $payment->setTransactionId($response_obj->getTid() . '-cancel');
            $payment->setParentTransactionId($payment->getTransactionId());
            $payment->setIsTransactionClosed(false)->setTransactionAdditionalInfo(Transaction::RAW_DETAILS, $_payments);		
		}
		
        parent::handle($handlingSubject, $response);
    }
}
