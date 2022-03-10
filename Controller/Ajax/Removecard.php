<?php

namespace Aqbank\Aqpago\Controller\Ajax;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;

class Removecard extends Action
{
    /**
     * @var _cardsCollection
     */
    protected $_cardsCollection;
    /**
     * @var _customer
     */
    protected $_customer;
    /**
     * @var _messageManager
     */
    protected $_messageManager;
    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
     * @param \Aqbank\Aqpago\Model\Cards $cardsCollection
     * @param \Magento\Framework\Message\ManagerInterface $messageManager
     * @param \Magento\Customer\Model\Session $customer
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Aqbank\Aqpago\Model\Cards $cardsCollection,
        \Magento\Framework\Message\ManagerInterface $messageManager,
        \Magento\Customer\Model\Session $customer
    ) {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
        $this->_cardsCollection = $cardsCollection;
        $this->_customer = $customer;
        $this->_messageManager = $messageManager;
    }

    /**
     * Method execute
     */
    public function execute()
    {
        $result = $this->resultJsonFactory->create();

        if ($this->getRequest()->isAjax()) {
            $data   = $this->getRequest()->getPost();
            $cardId = (int)$data['cardId'];
            if ($cardId) {
                $collection = $this->_cardsCollection->getCollection()
                                    ->addFieldToSelect(
                                        '*'
                                    )
                                    ->addFieldToFilter(
                                        'entity_id',
                                        ['eq' => $cardId]
                                    )
                                    ->addFieldToFilter(
                                        'customer_id',
                                        ['eq' => $this->_customer->getId()]
                                    );

                if ($collection->getSize()) {
                    $card = $collection->getFirstItem();
                    $card->setIsActive(0);
                    $card->save();

                    $this->_messageManager->addSuccess(
                        'cartão removido com sucesso!'
                    );
                    return $result->setData([
                        'success' => 'true',
                        'message' => __('cartão removido!')
                    ]);
                } else {
                    $this->_messageManager->addError(__('Cartão inválido!'));
                    return $result->setData([
                        'success' => 'false',
                        'erro' => 'true',
                        'message' => __('Cartão inválido!')
                    ]);
                }
            } else {
                $this->_messageManager->addError(__('Cartão inválido!'));
                return $result->setData([
                    'success' => 'false',
                    'erro' => 'true',
                    'message' => __('Cartão inválido!')
                ]);
            }
            
        } else {
            $this->_messageManager->addError(__('Metodo inválido!'));
            return $result->setData([
                'success' => 'false',
                'erro' => 'true',
                'message' => __('metodo inválido!')
            ]);
        }
    }
}
