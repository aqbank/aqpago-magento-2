<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Request;

use Magento\Payment\Gateway\Request\BuilderInterface;
use Magento\Payment\Helper\Formatter;
use Aqbank\Aqpago\Gateway\Config\Config;
use Aqbank\Aqpago\Gateway\Helper\SubjectReader;

abstract class AbstractPaymentDataBuilder implements BuilderInterface
{
    use Formatter;

    public const COUTRY_VALUE = "BRA";
    public const INTEREST_BY_MERCHANT = 'ByMerchant';
    public const INTEREST_BY_ISSUER = 'ByIssuer';
    public const PAYMENTTYPE_CREDITCARD = 'CreditCard';
    public const PAYMENTTYPE_DEBITCARD = 'DebitCard';
    public const PAYMENTTYPE_ELECTRONIC_TRANSFER = 'ElectronicTransfer';
    public const PAYMENTTYPE_BOLETO = 'Boleto';
    public const PROVIDER_BRADESCO = 'Bradesco';
    public const PROVIDER_BANCO_DO_BRASIL = 'BancoDoBrasil';
    public const PROVIDER_SIMULADO = 'Simulado';
    public const PAYMENT = 'Payment';
    public const SERVICETAXAMOUNT = 'ServiceTaxAmount';
    public const INSTALLMENTS = 'Installments';
    public const INTEREST = 'Interest';
    public const CAPTURE = 'Capture';
    public const AUTHENTICATE = 'Authenticate';
    public const RECURRENT = 'Recurrent';
    public const TID = 'Tid';
    public const PROOFOFSALE = 'ProofOfSale';
    public const AUTHORIZATIONCODE = 'AuthorizationCode';
    public const SOFTDESCRIPTOR = 'SoftDescriptor';
    public const PROVIDER = 'Provider';
    public const PAYMENTID = 'PaymentId';
    public const TYPE = 'Type';
    public const AMOUNT = 'Amount';
    public const RECEIVEDDATE = 'ReceivedDate';
    public const CURRENCY = 'Currency';
    public const COUNTRY = 'Country';
    public const RETURNCODE = 'ReturnCode';
    public const RETURNMESSAGE = 'ReturnMessage';
    public const STATUS = 'Status';
    public const LINKS = 'Links';
    public const TICKET = 'Ticket';
    public const TYPE_PAYMENT = 'type_payment';
    /**
     * One-time-use token that references a payment method provided by your customer,
     * such as a Card or PayPal account.
     * The nonce serves as proof that the user has authorized payment (e.g. Card number or PayPal details).
     * This should be sent to your server and used with any of Braintree's server-side client libraries
     * that accept new or saved payment details.
     * This can be passed instead of a payment_method_token parameter.
     */
    public const PAYMENT_METHOD_NONCE = 'paymentMethodNonce';
    /**
     * The merchant account ID used to create a transaction.
     * Currency is also determined by merchant account ID.
     * If no merchant account ID is specified, Braintree will use your default merchant account.
     */
    public const MERCHANT_ACCOUNT_ID = 'merchantAccountId';
    /**
     * Order ID
     */
    public const ORDER_ID = 'orderId';
    /**
     * @var Config
     */
    protected $config;
    /**
     * @var SubjectReader
     */
    protected $subjectReader;
    /**
     * Constructor
     *
     * @param Config $config
     * @param SubjectReader $subjectReader
     */
    public function __construct(Config $config, SubjectReader $subjectReader)
    {
        $this->config = $config;
        $this->subjectReader = $subjectReader;
    }
    /**
     * Method getInterest
     *
     * @return string
     */
    public function getInterest()
    {
        //TODO: Colocar essa opção nas configurações
        return self::INTEREST_BY_MERCHANT;
    }
    /**
     * Method forceCapture
     *
     * @return void
     */
    public function forceCapture()
    {
        return false;
    }
    /**
     * Method build
     *
     * @param array $buildSubject
     * @return void
     */
    public function build(array $buildSubject)
    {
        $paymentDO = $this->subjectReader->readPayment($buildSubject);
        $payment    = $paymentDO->getPayment();
        $order      = $paymentDO->getOrder();
        $result     = [];
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(
            new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago.log', \Monolog\Logger::DEBUG)
        );
        $logger->info('Log Aqpago AbstractPaymentDataBuilder');
        $logger->info('type_payment: ' . $payment->getAdditionalInformation('type_payment'));
        $result[SaleDataBuilder::SALE] = [
            self::PAYMENT => [
                self::SERVICETAXAMOUNT  => 0,
                //self::INSTALLMENTS        => $installments,
                self::SOFTDESCRIPTOR    => $this->config->getSoftDescriptor(),
                self::TYPE              => $this->getTypeTransaction($buildSubject),
                self::AMOUNT            => $order->getGrandTotalAmount(),
                self::TYPE_PAYMENT      => $payment->getAdditionalInformation('type_payment'),
                self::TICKET            => [
                    'amount' => $payment->getAdditionalInformation('ticket_amount')
                ]
            ]
        ];
        return $result;
    }
    /**
     * Retorna o tipo de transação
     *
     * @param array $buildSubject
     */
    abstract public function getTypeTransaction(array $buildSubject = []);
}
