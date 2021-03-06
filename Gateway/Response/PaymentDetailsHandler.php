<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Response;

use Magento\Payment\Gateway\Response\HandlerInterface;
use Aqbank\Aqpago\Gateway\Helper\SubjectReader;

class PaymentDetailsHandler implements HandlerInterface
{
    /**
     * @var SubjectReader
     */
    private $subjectReader;
    /**
     * Constructor
     *
     * @param SubjectReader $subjectReader
     */
    public function __construct(SubjectReader $subjectReader)
    {
        $this->subjectReader = $subjectReader;
    }
    /**
     * Handles transaction id
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
        $payment = $paymentDO->getPayment();

        if (isset($response_obj->getPayments()[0])) {
            $payment->setCcTransId(
                str_replace('-', '', $response_obj->getPayments()[0]->getId())
            );
            $payment->setLastTransId(
                str_replace('-', '', $response_obj->getPayments()[0]->getId())
            );
            $payment->setAdditionalInformation(
                "Payment ID",
                $response_obj->getPayments()[0]->getId()
            );
            $payment->setAdditionalInformation(
                "Second Payment ID",
                (isset($response_obj->getPayments()[1])) ? $response_obj->getPayments()[1]->getId() : null
            );
        }

        if ($response_obj->getId()) {
            $payment->setAdditionalInformation("Transaction ID", $response_obj->getId());
            $payment->setAdditionalInformation("Status", $response_obj->getStatus());
            $payment->setAdditionalInformation(
                "Return Message",
                $this->subjectReader->readStatusMessage($response_obj->getStatus())
            );
            $payment->setAdditionalInformation("order_type", $response_obj->getType());
        }
        if (isset($response_obj->getPayments()[0]) &&
            $response_obj->getPayments()[0]->getType() == 'credit'
        ) {
            $payment->setAdditionalInformation(
                "Payment Type",
                $response_obj->getPayments()[0]->getType()
            );
            $payment->setAdditionalInformation(
                "One Payment Status",
                $response_obj->getPayments()[0]->getStatus()
            );
            if ($response_obj->getPayments()[0]->getInstallments()) {
                $payment->setAdditionalInformation(
                    "Installments",
                    $response_obj->getPayments()[0]->getInstallments()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Installments",
                    null
                );
            }

            if ($response_obj->getPayments()[0]->getAmount()) {
                $payment->setAdditionalInformation(
                    "Amount",
                    $response_obj->getPayments()[0]->getAmount()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Amount",
                    null
                );
            }

            if (isset($aqpagoOrder['payments'][0]['credit_card']['flag'])) {
                $payment->setAdditionalInformation(
                    "Flag",
                    $aqpagoOrder['payments'][0]['credit_card']['flag']
                );
            } else {
                $payment->setAdditionalInformation(
                    "Flag",
                    null
                );
            }

            if ($response_obj->getPayments()[0]->getCreditCard()->getFirst4Digits()) {
                $payment->setAdditionalInformation(
                    "First 4",
                    $response_obj->getPayments()[0]->getCreditCard()->getFirst4Digits()
                );
            } else {
                $payment->setAdditionalInformation(
                    "First 4",
                    null
                );
            }

            if ($response_obj->getPayments()[0]->getCreditCard()->getLast4Digits()) {
                $payment->setAdditionalInformation(
                    "Last 4",
                    $response_obj->getPayments()[0]->getCreditCard()->getLast4Digits()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Last 4",
                    null
                );
            }
            
        }

        if (isset($response_obj->getPayments()[1]) &&
            $response_obj->getPayments()[1]->getType() == 'credit'
        ) {
            $payment->setAdditionalInformation(
                "Second Payment Status",
                $response_obj->getPayments()[1]->getStatus()
            );
            $payment->setAdditionalInformation(
                "Second Payment Type",
                $response_obj->getPayments()[1]->getType()
            );
            if ($response_obj->getPayments()[1]->getInstallments()) {
                $payment->setAdditionalInformation(
                    "Second Installments",
                    $response_obj->getPayments()[1]->getInstallments()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Second Installments",
                    $response_obj->getPayments()[1]->getInstallments()
                );
            }

            if ($response_obj->getPayments()[1]->getAmount()) {
                $payment->setAdditionalInformation(
                    "Second Amount",
                    $response_obj->getPayments()[1]->getAmount()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Second Amount",
                    null
                );
            }

            if ($response_obj->getPayments()[1]->getCreditCard()->getFlag()) {
                $payment->setAdditionalInformation(
                    "Second Flag",
                    $response_obj->getPayments()[1]->getCreditCard()->getFlag()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Second Flag",
                    null
                );
            }
            if ($response_obj->getPayments()[1]->getCreditCard()->getFirst4Digits()) {
                $payment->setAdditionalInformation(
                    "Second First 4",
                    $response_obj->getPayments()[1]->getCreditCard()->getFirst4Digits()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Second First 4",
                    null
                );
            }
            if ($response_obj->getPayments()[1]->getCreditCard()->getLast4Digits()) {
            $payment->setAdditionalInformation(
                "Second Last 4",
                $response_obj->getPayments()[1]->getCreditCard()->getLast4Digits()
            );
            } else {
                $payment->setAdditionalInformation(
                    "Second Last 4",
                    null
                );
            }
        }
        if (isset($response_obj->getPayments()[0]) &&
            $response_obj->getPayments()[0]->getType() == 'ticket'
        ) {
            $payment->setAdditionalInformation(
                "Installments",
                $response_obj->getPayments()[0]->getInstallments()
            );
            $payment->setAdditionalInformation(
                "One Payment Status",
                $response_obj->getPayments()[0]->getStatus()
            );
            $payment->setAdditionalInformation(
                "Payment Type",
                $response_obj->getPayments()[0]->getType()
            );
            if ($response_obj->getPayments()[0]->getAmount()) {
                $payment->setAdditionalInformation(
                    "Amount",
                    $response_obj->getPayments()[0]->getAmount()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Amount",
                    null
                );
            }
            if ($response_obj->getPayments()[0]->getBodyInstructions()) {
                $payment->setAdditionalInformation("Body Instructions",
                    $response_obj->getPayments()[0]->getBodyInstructions()
                );
            } else {
                $payment->setAdditionalInformation("Body Instructions",
                    null
                );
            }
            $payment->setIsTransactionPending(true);
        }
        if (isset($response_obj->getPayments()[1]) &&
            $response_obj->getPayments()[1]->getType() == 'ticket'
        ) {
            $payment->setAdditionalInformation(
                "Installments",
                $response_obj->getPayments()[1]->getInstallments()
            );
            $payment->setAdditionalInformation(
                "Second Payment Status",
                $response_obj->getPayments()[1]->getStatus()
            );
            $payment->setAdditionalInformation(
                "Second Payment Type",
                $response_obj->getPayments()[1]->getType()
            );
            if ($response_obj->getPayments()[1]->getAmount()) {
                $payment->setAdditionalInformation(
                    "Second Amount",
                    $response_obj->getPayments()[1]->getAmount()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Second Amount",
                    null
                );
            }
            if ($response_obj->getPayments()[1]->getBodyInstructions()) {
                $payment->setAdditionalInformation(
                    "Second Body Instructions",
                    $response_obj->getPayments()[1]->getBodyInstructions()
                );
            } else {
                $payment->setAdditionalInformation(
                    "Second Body Instructions",
                    null
                );

            }
            $payment->setIsTransactionPending(true);
        }

        $payment->setAdditionalInformation(
            "payments",
            json_encode($response_obj->getPayments())
        );
        $payment->setAdditionalInformation(
            "Reponse",
            $response_obj->jsonSerialize()
        );
        $payment->setAdditionalInformation("Response", $response_obj->jsonSerialize());
        $payment->setTransactionId(
            $response_obj->getTid()  . '-authorize'
        );
        $payment->setParentTransactionId(
            $payment->getTransactionId()  . '-authorize'
        );
        $payment->setIsTransactionClosed(false)
        ->setTransactionAdditionalInfo(
            'Reponse',
            $response_obj->jsonSerialize()
        );

        if ($response_obj->getStatus() == 'ORDER_WAITING' ||
            $response_obj->getStatus() == 'ORDER_PARTIAL_PAID'
        ) {
            $payment->setIsTransactionPending(true);
        }

        if ($response_obj->getStatus() == 'ORDER_CANCELED' ||
            $response_obj->getStatus() == 'ORDER_REVERSED' ||
            $response_obj->getStatus() == 'ORDER_PARTIAL_REVERSED' ||
            $response_obj->getStatus() == 'ORDER_CHARGE_BACK' ||
            $response_obj->getStatus() == 'ORDER_FAILED'
        ) {
            $order = $payment->getOrder();
            $order->setStatus('Canceled');
            $order->setState(Order::STATE_CANCELED);
            $order->cancel();
            $order->save();
        }
    }
}
