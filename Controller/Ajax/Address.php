<?php

namespace Aqbank\Aqpago\Controller\Ajax;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;

class Address extends Action
{
    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
    ) {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
    }

    /**
     * Method execute
     */
    public function execute()
    {
        $result = $this->resultJsonFactory->create();
        
        if ($this->getRequest()->isAjax()) {
            
            $data = $this->getRequest()->getPost();
            $viaCep = $this->_objectManager->get(Aqbank\Aqpago\Model\ViaCep::class);
            $postCode = $viaCep->sendViaCep($data['postcode']);
            
            if (isset($postCode['logradouro']) &&
                isset($postCode['localidade']) &&
                ($postCode['logradouro'] != '' ||
                $postCode['localidade'] != '')
            ) {
                return $result->setData(['success' => 'true','response' => $postCode]);
            } else {
                return $result->setData([
                    'success' => 'false',
                    'erro' => 'true',
                    'message' => 'address not found!'
                ]);
            }
        } else {
            return $result->setData([
                'success' => 'false',
                'erro' => 'true',
                'message' => 'Invalid method request!'
            ]);
        }
    }
}
