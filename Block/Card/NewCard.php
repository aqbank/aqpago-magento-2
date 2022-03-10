<?php

namespace Aqbank\Aqpago\Block\Card;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Mkdevcommerce\Pontos\Model\Point;
use Magento\Framework\Pricing\Helper\Data as priceHelper;

class NewCard extends Template
{
    /**
     * @var _cardsCollection
     */
    protected $_cardsCollection;
    /**
     * @var priceHepler
     */
    protected $priceHepler;
    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;
    /**
     * @var orderRepository
     */
    protected $orderRepository;
    /**
     * @var _productFactory
     */
    protected $_productFactory;
    /**
     * @var _helperData
     */
    protected $_helperData;

    /**
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param \Magento\Sales\Api\OrderRepositoryInterface $orderRepository
     * @param \Magento\Catalog\Model\ProductFactory $productFactory
     * @param \Aqbank\Aqpago\Model\Cards $cardsCollection
     * @param \Magento\Customer\Model\Session $customerSession
     * @param priceHelper $priceHepler
     * @param \Aqbank\Aqpago\Helper\Data $helperData
     */
    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        \Magento\Sales\Api\OrderRepositoryInterface $orderRepository,
        \Magento\Catalog\Model\ProductFactory $productFactory,
        \Aqbank\Aqpago\Model\Cards $cardsCollection,
        \Magento\Customer\Model\Session $customerSession,
        priceHelper $priceHepler,
        \Aqbank\Aqpago\Helper\Data $helperData
    ) {
        $this->orderRepository = $orderRepository;
        $this->_productFactory = $productFactory;
        $this->_cardsCollection = $cardsCollection;
        $this->_customerSession = $customerSession;
        $this->priceHepler = $priceHepler;
        $this->_helperData = $helperData;
        parent::__construct($context);
    }

    /**
     * Method _prepareLayout
     *
     * @return object
     */
    protected function _prepareLayout()
    {
        parent::_prepareLayout();
        $this->pageConfig->getTitle()->set(__('Cartão de Crédito'));
        
        return $this;
    }

    /**
     * Method setMonthName
     *
     * @param stringn $month
     * @return string
     */
    public function setMonthName($month)
    {
        return $this->_helperData->monthNames($month);
    }

    /**
     * Method getAddressAjaxUrl
     *
     * @return string
     */
    public function getAddressAjaxUrl()
    {
        return $this->getUrl('aqbank/ajax/address');
    }

    /**
     * Method getSaveUrl
     *
     * @return string
     */
    public function getSaveUrl()
    {
        return $this->getUrl('aqbank/card/save');
    }
}
