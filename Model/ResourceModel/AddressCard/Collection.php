<?php

namespace Aqbank\Aqpago\Model\ResourceModel\AddressCard;

class Collection extends \Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection
{
	protected $_idFieldName = 'entity_id';
	protected $_eventPrefix = 'aqbank_aqpago_cards_address_collection';
	protected $_eventObject = 'cards_address_collection';
	
	
	protected function _construct()
	{
		$this->_init('Aqbank\Aqpago\Model\AddressCard', 'Aqbank\Aqpago\Model\ResourceModel\AddressCard');
	}
}
