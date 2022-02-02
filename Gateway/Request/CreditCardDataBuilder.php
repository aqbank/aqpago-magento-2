<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Gateway\Request;

use Magento\Payment\Gateway\Request\BuilderInterface;
use Aqbank\Aqpago\Gateway\Helper\SubjectReader;

/**
 * Class AddressDataBuilder
 */
class CreditCardDataBuilder implements BuilderInterface
{
    /**
     * ShippingAddress block name
     */
    const CREDIT_CARD = 'CreditCard';
    const DEBIT_CARD = 'DebitCard';
    const CARDNUMBER = 'CardNumber';
    const HOLDER = 'Holder';
    const EXPIRATIONDATE = 'ExpirationDate';
    const SECURITYCODE = 'SecurityCode';
	
	
    const ONE_CC_CARD_ID 		= 'one_cc_number_id';
    const ONE_CC_NUMBER 		= 'one_cc_number';
    const ONE_CC_OWNER 			= 'one_cc_owner';
    const ONE_CC_CID 			= 'one_cc_cid';
    const ONE_CC_EXP_MONTH 		= 'one_cc_exp_month';
    const ONE_CC_EXP_YEAR 		= 'one_cc_exp_year';
    const ONE_CC_DOCUMENT 		= 'one_cc_document';
    const ONE_CC_INSTALLMENTS 	= 'one_cc_installments';
    const ONE_CC_FLAG 			= 'one_cc_flag';
    const ONE_CC_AMOUNT 		= 'one_cc_amount';	
	
    const TWO_CC_CARD_ID 		= 'two_cc_number_id';
    const TWO_CC_NUMBER 		= 'two_cc_number';
    const TWO_CC_OWNER 			= 'two_cc_owner';
    const TWO_CC_CID 			= 'two_cc_cid';
    const TWO_CC_EXP_MONTH 		= 'two_cc_exp_month';
    const TWO_CC_EXP_YEAR 		= 'two_cc_exp_year';
    const TWO_CC_DOCUMENT 		= 'two_cc_document';
	const TWO_CC_FLAG 			= 'two_cc_flag';
    const TWO_CC_INSTALLMENTS 	= 'two_cc_installments';
    const TWO_CC_AMOUNT 		= 'two_cc_amount';
	
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
     * @inheritdoc
     */
    public function build(array $buildSubject)
    {
        $paymentDO = $this->subjectReader->readPayment($buildSubject);

        $payment = $paymentDO->getPayment();
        $result = [];
        $result[SaleDataBuilder::SALE] = [
            AbstractPaymentDataBuilder::PAYMENT => [
                self::CREDIT_CARD => [
					'one_cc_saved' 				=> $payment->getAdditionalInformation('one_cc_saved'),
					self::ONE_CC_CARD_ID 		=> $payment->getAdditionalInformation('one_cc_number_id'),
					self::ONE_CC_NUMBER 		=> $payment->getCcNumber(),
					self::ONE_CC_OWNER 			=> $payment->getCcOwner(),
					self::ONE_CC_CID 			=> $payment->getCcCid(),
					self::ONE_CC_EXP_MONTH 		=> str_pad($payment->getCcExpMonth(), 2, '0', STR_PAD_LEFT),
					self::ONE_CC_EXP_YEAR 		=> $payment->getCcExpYear(),
					self::ONE_CC_FLAG 			=> $payment->getCcType(),
					self::ONE_CC_DOCUMENT 		=> $payment->getAdditionalInformation('one_cc_document'),
					self::ONE_CC_INSTALLMENTS 	=> $payment->getAdditionalInformation('one_cc_installments'),
					self::ONE_CC_AMOUNT 		=> $payment->getAdditionalInformation('one_cc_amount'),
					
					'two_cc_saved' 				=> $payment->getAdditionalInformation('two_cc_saved'),
					self::TWO_CC_CARD_ID 		=> $payment->getAdditionalInformation('two_cc_number_id'),
					self::TWO_CC_NUMBER 		=> $payment->getAdditionalInformation('two_cc_number'),
					self::TWO_CC_OWNER 			=> $payment->getAdditionalInformation('two_cc_owner'),
					self::TWO_CC_CID 			=> $payment->getAdditionalInformation('two_cc_cid'),
					self::TWO_CC_EXP_MONTH 		=> str_pad($payment->getAdditionalInformation('two_cc_exp_month'), 2, '0', STR_PAD_LEFT),
					self::TWO_CC_EXP_YEAR 		=> $payment->getAdditionalInformation('two_cc_exp_year'),
					self::TWO_CC_FLAG 			=> $payment->getAdditionalInformation('two_cc_flag'),
					self::TWO_CC_DOCUMENT 		=> $payment->getAdditionalInformation('two_cc_document'),
					self::TWO_CC_INSTALLMENTS 	=> $payment->getAdditionalInformation('two_cc_installments'),
					self::TWO_CC_AMOUNT 		=> $payment->getAdditionalInformation('two_cc_amount'),
				
				]
            ]
        ];
		
        return $result;
    }
}
