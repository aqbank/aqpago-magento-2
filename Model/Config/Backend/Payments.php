<?php

namespace Aqbank\Aqpago\Model\Config\Backend;

class Payments implements \Magento\Framework\Option\ArrayInterface
{
    /**
     * @var payments
     */
    protected $payments = [];

    /**
     * Method toOptionArray
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [
            [
                'value' => 'aqpago',
                'label' => 'Cartão de Crédito'
            ],
            [
                'value' => 'aqpago_boleto',
                'label' => 'Boleto Bancário'
            ],
        ];
    }
}
