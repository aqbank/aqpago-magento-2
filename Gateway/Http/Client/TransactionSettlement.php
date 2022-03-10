<?php

namespace Aqbank\Aqpago\Gateway\Http\Client;

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
