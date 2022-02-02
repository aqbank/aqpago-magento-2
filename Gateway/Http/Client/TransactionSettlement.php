<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Gateway\Http\Client;


/**
 * Class TransactionSettlement
 */
class TransactionSettlement extends AbstractTransaction
{
    /**
     * @inheritdoc
     */
    protected function process(array $data)
    {
        return $this->adapter->capture($data);
    }
}
