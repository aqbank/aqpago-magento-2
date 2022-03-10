<?php

namespace Aqbank\Aqpago\Gateway\Http\Client;

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
