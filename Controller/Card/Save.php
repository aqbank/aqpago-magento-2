<?php
namespace Aqbank\Aqpago\Controller\Card;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Aqbank\Aqpago\Model\CardsFactory;
use Magento\Framework\View\Result\PageFactory;
use Magento\Framework\Session\SessionManagerInterface;

class Save extends Action
{

    protected $_modelCardsFactory;
    protected $resultPageFactory;
    protected $_sessionManager;
	protected $formKeyValidator;
	protected $_customerSession;

    public function __construct(
        Context $context,
        CardsFactory $modelCardsFactory,
        PageFactory  $resultPageFactory,
        SessionManagerInterface $sessionManager,
		\Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator,
		\Magento\Customer\Model\Session $customerSession
    )
    {
        parent::__construct($context);
        $this->_modelCardsFactory = $modelCardsFactory;
        $this->formKeyValidator = $formKeyValidator;
        $this->resultPageFactory = $resultPageFactory;
        $this->_sessionManager = $sessionManager;
		$this->_customerSession = $customerSession;
    }
	
    public function execute()
    {   
		if (!$this->formKeyValidator->validate($this->getRequest())) {
			$objctManager = \Magento\Framework\App\ObjectManager::getInstance();
			$remote = $objctManager->get('Magento\Framework\HTTP\PhpEnvironment\RemoteAddress');

			$CardsFactory       = $this->_modelCardsFactory->create();
			$data               = $this->getRequest()->getPost(); 
			
			print_r($data);die();
			
			
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
			
			$this->_redirect('aqbank/customer/cards');
			$this->messageManager->addSuccess(__('The card has been saved.'));
		}
    }
}
