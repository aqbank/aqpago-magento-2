<?php

namespace Aqbank\Aqpago\Model;

class Cards extends \Magento\Framework\Model\AbstractModel implements \Magento\Framework\DataObject\IdentityInterface
{
    public const CACHE_TAG = 'aqbank_aqpago_cards';
    /**
     * @var _cacheTag
     */
    protected $_cacheTag = 'aqbank_aqpago_cards';
    /**
     * @var _eventPrefix
     */
    protected $_eventPrefix = 'aqbank_aqpago_cards';
    /**
     * Method _construct
     */
    protected function _construct()
    {
        $this->_init(Aqbank\Aqpago\Model\ResourceModel\Cards::class);
    }
    /**
     * Method getIdentities
     *
     * @return array
     */
    public function getIdentities()
    {
        return [self::CACHE_TAG . '_' . $this->getId()];
    }
    /**
     * Method getDefaultValues
     *
     * @return array
     */
    public function getDefaultValues()
    {
        $values = [];

        return $values;
    }
}
