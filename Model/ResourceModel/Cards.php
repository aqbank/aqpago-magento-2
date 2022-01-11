<?php

namespace Aqbank\Aqpago\Model\ResourceModel;


class Cards extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
	
	public function __construct(
		\Magento\Framework\Model\ResourceModel\Db\Context $context
	)
	{
		parent::__construct($context);
	}
	
	protected function _construct()
	{
		$this->_init('aqbank_aqpago_cards', 'entity_id');
	}	
}