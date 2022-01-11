<?php

namespace Aqbank\Aqpago\Controller\Ajax;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;

class Barcode extends Action
{
	protected $orderRepository;
	
	public function __construct(
        \Magento\Framework\App\Action\Context $context,
		\Magento\Sales\Api\OrderRepositoryInterface $orderRepository,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
    ) {
		parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
        $this->orderRepository = $orderRepository;
        
    }
	
    public function execute()
    {			
		$result = $this->resultJsonFactory->create();
		
        if ($this->getRequest()->isAjax()) {
			
			$data = $this->getRequest()->getPost();
			
			if(!isset($data['orderId'])){
				return $result->setData(['success' => 'false', 'message' => 'order Id not send!']);
			}
			
			$order 			= $this->orderRepository->get($data['orderId']);
			$payment 		= $order->getPayment();
			$aqpagoResponse	= $payment->getAdditionalInformation('Reponse');
			
			$_return = '';
			foreach($aqpagoResponse['payments'] as $k => $pay){
				if($pay['type'] == 'ticket'){
					$_return = $this->getBarCodeImage($pay['ticket_bar_code']);
				}
			}
			
			return $result->setData(['success' => 'true','response' => $_return]);
		} else {
			return $result->setData(['success' => 'false', 'message' => 'Invalid method request!']);
		}
	}
	
	public function getBarCodeImage($barCode)
	{
		$barCode 	= preg_replace('/^(\d{4})(\d{5})\d{1}(\d{10})\d{1}(\d{10})\d{1}(\d{15})$/', '$1$5$2$3$4', $barCode);
		$generator 	= new \Picqer\Barcode\BarcodeGeneratorPNG();
		$bar_code   = $generator->getBarcode($barCode, $generator::TYPE_INTERLEAVED_2_5);
		$img_base64 = base64_encode($bar_code);
		
		return '<img src="data:image/png;base64,' . $img_base64 . '" style="height: 81px;max-width: 656px;">';
	} 
}
