<?php

namespace Aqbank\Aqpago\Gateway\Http\Client;

class TransactionVoid extends AbstractTransaction
{
    /**
     * Method process
     *
     * @param array $data
     */
    protected function process(array $data)
    {
        return $this->adapter->void($data);
    }
}
