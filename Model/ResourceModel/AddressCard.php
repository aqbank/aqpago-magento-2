<?php

namespace Aqbank\Aqpago\Model\ResourceModel;


class AddressCard extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
	
	public function __construct(
		\Magento\Framework\Model\ResourceModel\Db\Context $context
	)
	{
		parent::__construct($context);
	}
	
	protected function _construct()
	{
		$this->_init('aqbank_aqpago_cards_address', 'entity_id');
	}	
}