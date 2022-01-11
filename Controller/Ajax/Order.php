<?php

namespace Aqbank\Aqpago\Controller\Ajax;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;

class Order extends Action
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
		$logger = new \Monolog\Logger('aqpago');
		$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_consult.log', \Monolog\Logger::DEBUG));
		$logger->info('Log Order');
			
		$result = $this->resultJsonFactory->create();
		
        if ($this->getRequest()->isAjax()) {
			
			$data = $this->getRequest()->getPost();
			
			
			//print_r( $data );die();
			
			if(!isset($data['orderId'])){
				return $result->setData(['success' => 'false', 'message' => 'order Id not send!']);
			}
			
			if(isset($data['orderId']['success']) ){
				//print_r( $data['orderId'] );die();
				$text = "";
				if(is_array($data['orderId']['message'])) {
					foreach($data['orderId']['message'] as $k => $message){
						//$text .= json_encode($message);
						
						if(is_array($message)) {
							foreach($message as $field => $erro){
								if(is_array($message)) {
									foreach($erro as $ps => $txt){
										if(is_array($txt)) {
											foreach($txt as $p => $tx){
												$text .= __( $ps . ': ' . json_encode($tx) );
											}
										}
										else {
											$text .= __( $ps . ': ' . $txt );
										}
									}
								}
								else {
									$text .= __( $field . ' ' . $erro );
								}
							}
						}
						else {
							$text .= __( $k . ' ' . $message );
						}
						
					}
				}
				
				$response = [
					'success' => false,
					'message' => $text,
				];
				
				return $result->setData($response);
			}
			
			$logger->info('orderId ' . $data['orderId']);
			
			$order 			= $this->orderRepository->get($data['orderId']);
			$payment 		= $order->getPayment();
			$aqpagoResponse	= $payment->getAdditionalInformation('Reponse');
			$status 		= __( $order->getStatusLabel() );
			
			$logger->info('orderId ' . json_encode($aqpagoResponse));
			
			if($aqpagoResponse && is_array($aqpagoResponse)) {
				
				foreach($aqpagoResponse['payments'] as $k => $pay){
					$aqpagoResponse['payments'][$k]['message'] = __( $pay['message'] );
				}
				
				$aqpagoResponse['order_increment'] = $order->getIncrementId();
				$aqpagoResponse['pay'] = false;
				
				if($aqpagoResponse['status'] == 'ORDER_PAID' || $aqpagoResponse['status'] == 'ORDER_IN_ANALYSIS' || $aqpagoResponse['status'] == 'ORDER_WAITING'){
					$aqpagoResponse['pay'] = true;
				}
				
				if($aqpagoResponse['type'] == 'multi_ticket' && $aqpagoResponse['status'] == 'ORDER_PARTIAL_PAID') {
					$aqpagoResponse['pay'] = true;
				}
				
				$aqpagoResponse['order_status'] = $status;
				
				return $result->setData(['success' => 'true','response' => $aqpagoResponse]);
			}
			else {
				return $result->setData(['success' => 'false', 'message' => 'payment data erro!']);
			}
			
			
		} else {
			return $result->setData(['success' => 'false', 'message' => 'Invalid method request!']);
		}
	}
}
