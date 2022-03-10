<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Gateway\Helper;

use Magento\Payment\Gateway\Data\PaymentDataObjectInterface;
use Magento\Payment\Gateway\Helper;
use Magento\Vault\Api\Data\PaymentTokenInterface;

class SubjectReader
{
    /**
     * Reads response object from subject
     *
     * @param array $subject
     *
     * @return object
     */
    public function readResponseObject(array $subject)
    {
        $response = Helper\SubjectReader::readResponse($subject);

        return $response['object'];
    }

    /**
     * Reads transaction from subject
     *
     * @param array $subject
     *
     * @return \Rede\Transaction
     */
    public function readTransaction(array $subject)
    {
        if (!isset($subject['object']) || !is_object($subject['object'])) {
            throw new \InvalidArgumentException('Response object does not exist');
        }

        if (!isset($subject['object'])
            && !$subject['object'] instanceof Transaction
        ) {
            throw new \InvalidArgumentException('The object is not a \Rede\Transaction');
        }

        return $subject['object'];
    }

    /**
     * Reads payment from subject
     *
     * @param array $subject
     *
     * @return PaymentDataObjectInterface
     */
    public function readPayment(array $subject)
    {
        return Helper\SubjectReader::readPayment($subject);
    }

    /**
     * Reads amount from subject
     *
     * @param array $subject
     *
     * @return mixed
     */
    public function readAmount(array $subject)
    {
        return Helper\SubjectReader::readAmount($subject);
    }

    /**
     * Reads customer id from subject
     *
     * @param array $subject
     *
     * @return int
     */
    public function readCustomerId(array $subject)
    {
        if (empty($subject['customer_id'])) {
            throw new \InvalidArgumentException('The "customerId" field does not exists');
        }

        return (int)$subject['customer_id'];
    }

    /**
     * Reads public hash from subject
     *
     * @param array $subject
     *
     * @return string
     */
    public function readPublicHash(array $subject)
    {
        if (empty($subject[PaymentTokenInterface::PUBLIC_HASH])) {
            throw new \InvalidArgumentException('The "public_hash" field does not exists');
        }

        return $subject[PaymentTokenInterface::PUBLIC_HASH];
    }

    /**
     * Reads PayPal details from transaction object
     *
     * @param Transaction $transaction
     *
     * @return array
     */
    public function readPayPal(Transaction $transaction)
    {
        if (!isset($transaction->paypal)) {
            throw new \InvalidArgumentException('Transaction has\'t paypal attribute');
        }

        return $transaction->paypal;
    }

    /**
     * Method readStatusMessage
     *
     * @param string $status
     *
     * @return string
     */
    public function readStatusMessage($status)
    {
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

        return $message_response[ $status ];
    }
}
