<?php

namespace Aqbank\Aqpago\Model\ResourceModel\Cards;

class Collection extends \Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection
{
    /**
     * @var _idFieldName
     */
    protected $_idFieldName = 'entity_id';
    /**
     * @var _eventPrefix
     */
    protected $_eventPrefix = 'aqbank_aqpago_cards_collection';
    /**
     * @var _eventObject
     */
    protected $_eventObject = 'cards_collection';
    /**
     * Method _construct
     */
    protected function _construct()
    {
        $this->_init(\Aqbank\Aqpago\Model\Cards::class, \Aqbank\Aqpago\Model\ResourceModel\Cards::class);
    }
}
