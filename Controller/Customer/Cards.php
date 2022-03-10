<?php

namespace Aqbank\Aqpago\Controller\Customer;

use Magento\Framework\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Framework\App\Action\Action;

class Cards extends Action
{
    /**
     * @var $resultPageFactory
     */
    protected $resultPageFactory;
    /**
     * Method __construct
     *
     * @param Context $context
     * @param PageFactory $resultPageFactory
     */
    public function __construct(
        Context $context,
        PageFactory $resultPageFactory
    ) {
        parent::__construct($context);
        $this->resultPageFactory = $resultPageFactory;
    }
    /**
     * Method execute
     *
     * @return object
     */
    public function execute()
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->getConfig()->getTitle()->set(__('Meus cartões'));
        return $resultPage;
    }
}
