<?php

namespace Aqbank\Aqpago\Gateway\Request;

class CreditCardPaymentDataBuilder extends AbstractPaymentDataBuilder
{
    /**
     * Method getTypeTransaction
     *
     * @param array $buildSubject
     * @return string
     */
    public function getTypeTransaction(array $buildSubject = [])
    {
        $paymentDO  = $this->subjectReader->readPayment($buildSubject);
        $payment    = $paymentDO->getPayment();
        return $payment->getAdditionalInformation('type_payment');
    }
    /**
     * Retorna o tipo de transação
     *
     * @param array $buildSubject
     * @return bool|mixed
     */
    public function is3DS(array $buildSubject = [])
    {
        $paymentDO = $this->subjectReader->readPayment($buildSubject);
        $payment = $paymentDO->getPayment();
        $auth = false;
        if ($payment->getAdditionalInformation('creditCard3Ds')) {
            $auth = $payment->getAdditionalInformation('creditCard3Ds');
        }
        return $auth;
    }
}
