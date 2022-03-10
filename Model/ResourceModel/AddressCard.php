<?php

namespace Aqbank\Aqpago\Model\ResourceModel;

class AddressCard extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
    /**
     * Method _construct
     */
    protected function _construct()
    {
        $this->_init('aqbank_aqpago_cards_address', 'entity_id');
    }
}
