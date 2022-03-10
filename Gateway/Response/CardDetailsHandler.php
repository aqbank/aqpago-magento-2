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
    /**
     * @var _remoteAddress
     */
    private $_remoteAddress;
    
    /**
     * Constructor
     *
     * @param SubjectReader $subjectReader
     * @param Config $config
     * @param CardsFactory $cardsFactory
     */
    public function __construct(
        SubjectReader $subjectReader,
        Config $config,
        CardsFactory $cardsFactory
    ) {
        $this->subjectReader = $subjectReader;
        $this->config = $config;
        $this->cardsFactory = $cardsFactory;
        $objctManager = \Magento\Framework\App\ObjectManager::getInstance();
        $remote = $objctManager->get(Magento\Framework\HTTP\PhpEnvironment\RemoteAddress::class);
        $this->_remoteAddress = $remote->getRemoteAddress();
    }

    /**
     * Method handle
     *
     * @param array $handlingSubject
     * @param array $response
     */
    public function handle(array $handlingSubject, array $response)
    {
        $paymentDO  = $this->subjectReader->readPayment($handlingSubject);
        $payment    = $paymentDO->getPayment();
        $response_obj = $this->subjectReader->readTransaction($response);
        $payment->setAdditionalInformation('Environment', $this->config->getEnvironment());
        if ($response_obj->getId() &&
            $response_obj->getType() &&
            ($response_obj->getType() == 'credit' ||
            $response_obj->getType() == 'multi_credit' ||
            $response_obj->getType() == 'multi_ticket')
        ) {
            $customerId     = $payment->getAdditionalInformation('customer_id');
            $ncard = 1;
            foreach ($response_obj->getPayments() as $key => $pay) {
                if ($pay->getType() == 'credit') {
                    $first4_digits      = $pay->getCreditCard()->getFirst4Digits();
                    $last4_digits       = $pay->getCreditCard()->getLast4Digits();
                    $expiration_month   = $pay->getCreditCard()->getExpirationMonth();
                    $expiration_year    = $pay->getCreditCard()->getExpirationYear();
                    $holder_name        = $pay->getCreditCard()->getHolderName();
                    $flag               = $pay->getCreditCard()->getFlag();
                    $paymentDate        = $pay->getPaymentDate();
                    
                    if ($ncard == 1 && count($response_obj->getPayments()) > 1) {
                        $payment->setAdditionalInformation('id_credit', $pay->getId());
                    }
                    if ($ncard == 2) {
                        $payment->setAdditionalInformation('id_second_credit', $pay->getId());
                    }
                    $cardDigits  = $pay->getCreditCard()->getFirst4Digits();
                    $cardDigits .= "********";
                    $cardDigits .= $pay->getCreditCard()->getLast4Digits();
                    $cardsFactory   = $this->cardsFactory->create();
                    $collection     = $cardsFactory->getCollection()
                                        ->addFieldToFilter(
                                            'number_card',
                                            ['eq' => $cardDigits]
                                        )->addFieldToFilter(
                                            'customer_id',
                                            ['eq' => $customerId]
                                        )->getFirstItem();

                    if (!count($collection->getData())) {
                        $cardsFactory = $this->cardsFactory->create();
                        $cardsFactory->setCustomerId($customerId);
                        $cardsFactory->setAqpagoId($pay->getCreditCard()->getId());
                        $cardsFactory->setPaymentId($payment->getId());
                        $cardsFactory->setNumberCard(
                            $cardDigits
                        );
                        $cardsFactory->setNameCard($pay->getCreditCard()->getHolderName());
                        $cardsFactory->setValidMonth($pay->getCreditCard()->getExpirationMonth());
                        $cardsFactory->setValidYear($pay->getCreditCard()->getExpirationYear());
                        $cardsFactory->setFlag($pay->getCreditCard()->getFlag());
                        $cardsFactory->setIsActive(1);

                        $dateComp = $pay->getCreditCard()->getExpirationYear();
                        $dateComp .= '-' . $pay->getCreditCard()->getExpirationMonth();
                        $dateComp .= '-' . date('d');
                        if (date("Y-m-d") > date("Y-m-d", strtotime($dateComp))) {
                            $cardsFactory->setExpired(1);
                        } else {
                            $cardsFactory->setExpired(0);
                        }
                        $cardsFactory->setIpCreate($this->_remoteAddress);
                        $cardsFactory->save();
                    }
                    $ncard++;
                }
            }
        }
        if ($response_obj->getId()) {
            $payments = $payment->getAdditionalInformation('payments');
            $payments = json_decode($payments, true);
        }
        if ($response_obj->getId() && count($payments)) {
            $ps = 1;
            foreach ($payments as $k => $pay) {
                $payment->setAdditionalInformation(
                    $ps.'_pay_amount',
                    $pay['amount']
                );
                $payment->setAdditionalInformation(
                    $ps.'_pay_type',
                    $pay['type']
                );
                $payment->setAdditionalInformation(
                    $ps.'_pay_status',
                    $pay['status']
                );
                $payment->setAdditionalInformation(
                    $ps.'_pay_message',
                    $pay['message']
                );
                $payment->setAdditionalInformation(
                    $ps.'_pay_date',
                    (isset($pay['payment_date'])) ? $pay['payment_date'] : null
                );
                $payment->setAdditionalInformation(
                    $ps.'_pay_created_at',
                    $pay['created_at']
                );

                if ($pay['type'] == 'credit') {
                    $payment->setAdditionalInformation(
                        $ps.'_pay_installments',
                        $pay['installments']
                    );
                    $payment->setAdditionalInformation(
                        $ps.'_pay_flag',
                        $pay['credit_card']['flag']
                    );
                    $payment->setAdditionalInformation(
                        $ps.'_pay_number',
                        $pay['credit_card']['first4_digits'] . ' **** ***** ' .  $pay['credit_card']['last4_digits']
                    );
                    $payment->setAdditionalInformation(
                        $ps.'_pay_holder_name',
                        $pay['credit_card']['holder_name']
                    );
                }
                if ($pay['type'] == 'ticket') {
                    $payment->setAdditionalInformation(
                        $ps.'_pay_installments',
                        1
                    );
                    $payment->setAdditionalInformation(
                        'id_ticket',
                        $pay['id']
                    );
                    $payment->setAdditionalInformation(
                        'ticket_url',
                        $pay['ticket_url']
                    );
                    $payment->setAdditionalInformation(
                        'ticket_bar_code',
                        $pay['ticket_bar_code']
                    );
                    $payment->setAdditionalInformation(
                        'expiration_date',
                        $pay['expiration_date']
                    );
                }
                $ps++;
            }
        }
    }
}
