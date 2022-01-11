<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Http\Client;

/**
 * Class TransactionCapture
 */
class TransactionCapture extends AbstractTransaction
{
    /**
     * @inheritdoc
     * @throws \Exception
     */
    protected function process(array $data)
    {
        return $this->adapter->capture($data);
    }
}
