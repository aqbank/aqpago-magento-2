<?php

namespace Aqbank\Aqpago\Gateway\Http\Client;

class TransactionSale extends AbstractTransaction
{
    /**
     * @inheritdoc
     * @throws \Exception
     */
    protected function process(array $data)
    {
        return $this->adapter->authorize($data, true);
    }
}
