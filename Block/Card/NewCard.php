<?php

namespace Aqbank\Aqpago\Block\Card;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Mkdevcommerce\Pontos\Model\Point;
use Magento\Framework\Pricing\Helper\Data as priceHelper;

class NewCard extends Template
{
    protected $_cardsCollection;
	
    protected $priceHepler;
	
    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;
	
	protected $orderRepository;
	
	protected $_productFactory; 
	
	protected $_helperData;

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
	
    protected function _prepareLayout()
    {
        parent::_prepareLayout();
		$this->pageConfig->getTitle()->set(__('Cartão de Crédito'));
		
        return $this;
    }
	
	public function setMonthName($month)
	{
		return $this->_helperData->monthNames($month);
	}
	
	public function getAddressAjaxUrl()
	{
		return $this->getUrl('aqbank/ajax/address');
	}
	
    public function getSaveUrl()
    {
        return $this->getUrl('aqbank/card/save');
    }
}
