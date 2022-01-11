<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Model;

/**
 * Class ConfigProvider
 */
class AqpagoBoleto extends \Magento\Payment\Model\Method\Cc
{
    const METHOD_CODE = 'aqpago_boleto';

    protected $_code = self::METHOD_CODE;
    protected $_isGateway = true;
    protected $_canCapture= true;
    protected $_canRefund = true;
    protected $_canRefundInvoicePartial = true;
}
