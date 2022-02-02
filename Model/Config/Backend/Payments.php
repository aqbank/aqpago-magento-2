<?php

namespace Aqbank\Aqpago\Model\Config\Backend;

/**
 * Class Payments
 * @package Aqbank\Aqpago\Model\Config
 */
class Payments implements \Magento\Framework\Option\ArrayInterface
{
    /**
     * @var array
     */
    protected $payments = array(

    );

    /**
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