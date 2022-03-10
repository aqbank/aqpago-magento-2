<?php

namespace Aqbank\Aqpago\Model\ResourceModel;

class Cards extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
    /**
     * Method _construct
     */
    protected function _construct()
    {
        $this->_init('aqbank_aqpago_cards', 'entity_id');
    }
}
