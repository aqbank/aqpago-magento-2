<?php

namespace Aqbank\Aqpago\Block\Customer;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Mkdevcommerce\Pontos\Model\Point;
use Magento\Framework\Pricing\Helper\Data as priceHelper;

class Cards extends Template
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
     * @var _customerSession
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
        $this->pageConfig->getTitle()->set(__('My Cards'));
        if ($this->getCustomCollection()) {
            $pager = $this->getLayout()->createBlock(
                \Magento\Theme\Block\Html\Pager::class,
                'custom.history.pager'
            )->setAvailableLimit(
                [10 => 10, 30 => 30]
            )->setShowPerPage(true)->setCollection(
                $this->getCustomCollection()
            );
            $this->setChild('pager', $pager);
            $this->getCustomCollection()->load();
        }
        
        return $this;
    }

    /**
     * Method getPagerHtml
     */
    public function getPagerHtml()
    {
        return $this->getChildHtml('pager');
    }

    /**
     * Method getCustomCollection
     *
     * @return object
     */
    public function getCustomCollection()
    {
        if (!($customerId = $this->_customerSession->getCustomerId())) {
            return false;
        }
        
        $page = ($this->getRequest()->getParam('p')) ? $this->getRequest()->getParam('p') : 1;
        $pageSize = ($this->getRequest()->getParam('limit')) ? $this->getRequest()->getParam('limit') : 10;
        
        $collection = $this->_cardsCollection->getCollection()
            ->addFieldToSelect(
                '*'
            )->addFieldToFilter(
                'is_active',
                ['eq' => 1]
            )->addFieldToFilter(
                'customer_id',
                ['eq' => $this->_customerSession->getId()]
            )->setOrder(
                'main_table.is_active',
                'desc'
            );

        $collection->setPageSize($pageSize);
        $collection->setCurPage($page);

        return $collection;
    }

    /**
     * Get Total Cards
     *
     * @return int
     */
    public function getTotalCards()
    {
        if (!($customerId = $this->_customerSession->getCustomerId())) {
            return false;
        }
        
        $collection = $this->_cardsCollection->getCollection()
            ->addFieldToFilter(
                'is_active',
                ['eq' => 1]
            )->addFieldToFilter(
                'expired',
                ['eq' => 0]
            )->addFieldToFilter(
                'customer_id',
                ['eq' => $customerId]
            );
        
        if ($collection->getSize()) {
            return $collection->count();
        } else {
            return 0;
        }
    }

    /**
     * Get order view URL
     *
     * @param object $order
     * @return string
     */
    public function getNewCardUrl()
    {
        return $this->getUrl('aqbank/card/newcard');
    }

    /**
     * Method setCardMask
     *
     * @param string $number
     * @return string
     */
    public function setCardMask($number)
    {
        return $this->_helperData->masc($number, "#### #### #### #######");
    }

    /**
     * Method setCardMask
     *
     * @param string $flag
     * @return string
     */
    public function setFlagImage($flag)
    {
        $imgSrc = $this->getViewFileUrl($this->_helperData->setFlag($flag));
        return $imgSrc;
    }
}
