<?php

namespace Aqbank\Aqpago\Model\ResourceModel\Cards;

class Collection extends \Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection
{
	protected $_idFieldName = 'entity_id';
	protected $_eventPrefix = 'aqbank_aqpago_cards_collection';
	protected $_eventObject = 'cards_collection';
	
	
	protected function _construct()
	{
		$this->_init('Aqbank\Aqpago\Model\Cards', 'Aqbank\Aqpago\Model\ResourceModel\Cards');
	}
}
