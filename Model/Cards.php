<?php

namespace Aqbank\Aqpago\Model;

class Cards extends \Magento\Framework\Model\AbstractModel implements \Magento\Framework\DataObject\IdentityInterface
{
	const CACHE_TAG = 'aqbank_aqpago_cards';

	protected $_cacheTag = 'aqbank_aqpago_cards';

	protected $_eventPrefix = 'aqbank_aqpago_cards';
	
	protected function _construct()
	{
		$this->_init('Aqbank\Aqpago\Model\ResourceModel\Cards');
	}

	public function getIdentities()
	{
		return [self::CACHE_TAG . '_' . $this->getId()];
	}

	public function getDefaultValues()
	{
		$values = [];

		return $values;
	}
}