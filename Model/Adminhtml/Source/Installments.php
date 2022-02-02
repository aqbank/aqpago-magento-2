<?php


namespace Aqbank\Aqpago\Model\Adminhtml\Source;



class Installments implements \Magento\Framework\Option\ArrayInterface
{
    /**
     * {@inheritdoc}
     */
    public function toOptionArray()
    {
        return array_map(
            function ($i) {
                return [
                    'value' => $i,
                    'label' => sprintf('%dx', $i)
                ];
            },
            range(1, 12)
        );
    }

}