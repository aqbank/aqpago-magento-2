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

    /**
     * Method handle
     *
     * @param array $handlingSubject
     * @param array $response
     *
     * @return void
     */
    public function handle(array $handlingSubject, array $response)
    {
        $paymentDO = $this->subjectReader->readPayment($handlingSubject);
        /**
         * @var Transaction
         */
        $response_obj = $this->subjectReader->readTransaction($response);

        if (!$response_obj === null) {
            $payment = $paymentDO->getPayment();
            $payment->setAdditionalInformation(
                "Reponse",
                $response_obj->jsonSerialize()
            );
            $_payments = json_encode($response_obj->getPayments());
            $_payments = json_decode($_payments, true);
            $payment->setTransactionId($response_obj->getTid() . '-cancel');
            $payment->setParentTransactionId($payment->getTransactionId());
            $payment->setIsTransactionClosed(false)
                ->setTransactionAdditionalInfo(Transaction::RAW_DETAILS, $_payments);
        }

        parent::handle($handlingSubject, $response);
    }
}
