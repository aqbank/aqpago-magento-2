<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Model;

class AqpagoBoleto extends \Magento\Payment\Model\Method\Cc
{
    public const METHOD_CODE = 'aqpago_boleto';
    /**
     * @var _code
     */
    protected $_code = self::METHOD_CODE;
    /**
     * @var _isGateway
     */
    protected $_isGateway = true;
    /**
     * @var _canCapture
     */
    protected $_canCapture= true;
    /**
     * @var _canRefund
     */
    protected $_canRefund = true;
    /**
     * @var _canRefundInvoicePartial
     */
    protected $_canRefundInvoicePartial = true;
}
