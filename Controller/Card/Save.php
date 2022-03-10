<?php

namespace Aqbank\Aqpago\Controller\Card;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use \Magento\Framework\Controller\Result\RedirectFactory;
use Aqbank\Aqpago\Model\CardsFactory;
use Magento\Framework\View\Result\PageFactory;
use Magento\Framework\Session\SessionManagerInterface;

class Save extends Action
{
    /**
     * @var redirectFactory
     */
    protected $redirectFactory;
    /**
     * @var _modelCardsFactory
     */
    protected $_modelCardsFactory;
    /**
     * @var resultPageFactory
     */
    protected $resultPageFactory;
    /**
     * @var _sessionManager
     */
    protected $_sessionManager;
    /**
     * @var formKeyValidator
     */
    protected $formKeyValidator;
    /**
     * @var _customerSession
     */
    protected $_customerSession;
    /**
     * @param RedirectFactory $redirectFactory
     * @param Context $context
     * @param CardsFactory $modelCardsFactory
     * @param PageFactory $resultPageFactory
     * @param SessionManagerInterface $sessionManager
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param \Magento\Customer\Model\Session $customerSession
     */
    public function __construct(
        RedirectFactory $redirectFactory,
        Context $context,
        CardsFactory $modelCardsFactory,
        PageFactory  $resultPageFactory,
        SessionManagerInterface $sessionManager,
        \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator,
        \Magento\Customer\Model\Session $customerSession
    ) {
        parent::__construct($context);
        $this->redirectFactory = $redirectFactory;
        $this->_modelCardsFactory = $modelCardsFactory;
        $this->formKeyValidator = $formKeyValidator;
        $this->resultPageFactory = $resultPageFactory;
        $this->_sessionManager = $sessionManager;
        $this->_customerSession = $customerSession;
    }
    /**
     * Method save card data
     */
    public function execute()
    {
        if (!$this->formKeyValidator->validate($this->getRequest())) {
            $objctManager = \Magento\Framework\App\ObjectManager::getInstance();
            $remote = $objctManager->get(Magento\Framework\HTTP\PhpEnvironment\RemoteAddress::class);
            $CardsFactory = $this->_modelCardsFactory->create();
            $data = $this->getRequest()->getPost();

            $CardsFactory->setData('customer_id', $this->_customerSession->getCustomer()->getId());
            $CardsFactory->setData('number_card', $data['number_card']);
            $CardsFactory->setData('name_card', $data['name_card']);
            $CardsFactory->setData('valid_month', $data['valid_month']);
            $CardsFactory->setData('valid_year', $data['valid_year']);
            $CardsFactory->setData('documento', $data['documento']);
            $CardsFactory->setData('is_active', 0);
            $CardsFactory->setData('is_confirm', 0);
            $CardsFactory->setData('expired', 0);
            $CardsFactory->setData('ip_create', $remote->getRemoteAddress());
            $CardsFactory->save();
            $this->messageManager->addSuccess(__('The card has been saved.'));

            $resultadoRedirect = $this->resultRedirectFactory->create();
            $resultadoRedirect->setPath('aqbank/customer/cards');
            return $resultRedirect;
        }
    }
}
