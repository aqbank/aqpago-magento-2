<?php

namespace Aqbank\Aqpago\Controller\Ajax;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;


use Magento\Sales\Model\Order;
use Magento\Sales\Model\Order\Payment\Transaction\Builder;
use Magento\Sales\Model\Order\Payment\Transaction;
use Magento\Framework\DB\Transaction as DbTransaction;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Model\Service\InvoiceService;
use Magento\Sales\Model\Order\Email\Sender\InvoiceSender;
use Magento\Framework\Pricing\Helper\Data;

use Aqbank\Aqpago\Gateway\Config\Config;
use Aqbank\Apiv2\SellerAqpago;
use Aqbank\Apiv2\Aqpago\Request\AqpagoEnvironment;

use Aqbank\Apiv2\Aqpago\Sale;
use Aqbank\Apiv2\Aqpago\Aqpago;
use Aqbank\Apiv2\Aqpago\UpdateOrder;
use Aqbank\Apiv2\Aqpago\CreditCard;
use Aqbank\Apiv2\Aqpago\Customer;
use Aqbank\Apiv2\Aqpago\Request\Exceptions\AqpagoRequestException;

class Payment extends Action
{
    /**
     * @var OrderRepositoryInterface
     */
	protected $orderRepository;
	
    /**
     * @var Config
     */
    private $config;
	
    /**
     * @var taxDocument
     */
    private $taxDocument;	
	
    /**
     * @var environment
     */
    private $environment;
    
    /**
     * @var token
     */
	private $token;
	
	protected $transactionBuilder;
	
    protected $transaction;
	
    protected $invoiceService;
	
    protected $invoiceSender;
	
	protected $priceHelper;
	
	public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
		Builder $transactionBuilder,
        OrderRepositoryInterface $orderRepository,
        DbTransaction $dbTransaction,
        InvoiceService $invoiceService,
        InvoiceSender $invoiceSender,
		Config $config,
		Data $priceHelper
    ) {
		parent::__construct($context);
		
        $this->resultJsonFactory 	= $resultJsonFactory;
        $this->orderRepository 		= $orderRepository;
		$this->transaction 			= $dbTransaction;
        $this->invoiceService 		= $invoiceService;
        $this->invoiceSender 		= $invoiceSender;
		$this->transactionBuilder 	= $transactionBuilder;
		$this->config 				= $config;
		$this->taxDocument 			= preg_match("/^[0-9]+$/", $this->config->getConfig('tax_document'));
		$this->token 				= $this->config->getConfig('token');
		$this->environment			= $this->config->getConfig('environment');
		$this->priceHelper 			= $priceHelper;
    }
	
    public function execute()
    {
		$logger = new \Monolog\Logger('aqpago');
		$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_edit.log', \Monolog\Logger::DEBUG));
		
		$result = $this->resultJsonFactory->create();
		
        if ($this->getRequest()->isAjax()) {
			
			$data = $this->getRequest()->getPost();
			
			//echo json_encode($data, JSON_PRETTY_PRINT);die();
			
			if(!isset($data['orderId'])){
				return $result->setData(['success' => false, 'message' => 'order Id not send!']);
			}
			
			$order 			= $this->orderRepository->get($data['orderId']);
			$payment 		= $order->getPayment();
			$aqpagoResponse	= $payment->getAdditionalInformation('Reponse');
			
			//echo json_encode($data, JSON_PRETTY_PRINT);die();
			
			$erro_credit 	= $data['paymentData']['additional_data']['erro_credit'];
			$card_one_erro 	= $data['paymentData']['additional_data']['card_one_erro'];
			$card_two_erro 	= $data['paymentData']['additional_data']['card_two_erro'];
			
			$type_payment	= $data['paymentData']['additional_data']['type_payment'];
			
			if($type_payment == 'credit_multiple'){
				$type_payment = 'multi_credit';
			}
			else if($type_payment == 'ticket_multiple'){
				$type_payment = 'multi_ticket';
			}
			
			$message_response = [
				'ORDER_CREATE' 				=> 'order created.',
				'ORDER_WAITING' 			=> 'order waiting payment.',
				'ORDER_IN_ANALYSIS' 		=> 'order in analysis.',
				'ORDER_NOT_PAID' 			=> 'order not paid.',
				'ORDER_PAID' 				=> 'order paid.',
				'ORDER_PARTIAL_PAID'		=> 'partially paid order.',
				'ORDER_CANCELED'			=> 'order canceled.',
				'ORDER_REVERSED'			=> 'order reversed.',
				'ORDER_PARTIAL_REVERSED'	=> 'order partial reversed.',
				'ORDER_CHARGE_BACK'			=> 'order with charge back.',
				'ORDER_DISPUTE'				=> 'order in dispute.',
				'ORDER_FAILED'				=> 'order failed.',
			];
					
			//echo json_encode($data, JSON_PRETTY_PRINT);die();
			
			$environment = $this->environment;
			$environment = AqpagoEnvironment::$environment();
			
			$referenceId = 'pay-' . uniqid();
			$referenceIdTwo = false;
			// Aqbank\Apiv2\Aqpago\SellerAqpago
			$sellerAqpago = new SellerAqpago($this->taxDocument, $this->token, 'modulo magento 2');
		
			// Aqbank\Apiv2\Aqpago\Order
			$UpdateOrder = new UpdateOrder($aqpagoResponse['id']);
			
			if($type_payment == 'credit') {
				/** processar um cartão **/
				$amount 			= $data['paymentData']['additional_data']['one_cc_amount'];
				$installments 		= $data['paymentData']['additional_data']['one_cc_installments'];
				$card_number 		= $data['paymentData']['additional_data']['one_cc_number'];
				$holder_name 		= $data['paymentData']['additional_data']['one_cc_owner'];
				$expiration_month 	= $data['paymentData']['additional_data']['one_cc_exp_month'];
				$expiration_year 	= $data['paymentData']['additional_data']['one_cc_exp_year'];
				$security_code 		= $data['paymentData']['additional_data']['one_cc_cid'];
				$cpf 				= $data['paymentData']['additional_data']['one_cc_document'];
				
				$UpdateOrder->getOrder()
					->setType($type_payment)
					->creditCard($amount, $installments, $referenceId)
					->setCardNumber($card_number)
					->setHolderName($holder_name)
					->setExpirationMonth($expiration_month)
					->setExpirationYear($expiration_year)
					->setSecurityCode($security_code)
					->setCpf($cpf);
			}			
			else if($type_payment == 'multi_credit') {
				
				/** processar dois cartões **/
				if($erro_credit == 'true' || $card_one_erro == 'true') {
					$UpdateOrder->getOrder()
					->setType($type_payment)
					->creditCard($data['paymentData']['additional_data']['one_cc_amount'], $data['paymentData']['additional_data']['one_cc_installments'], $referenceId)
					->setCardNumber($data['paymentData']['additional_data']['one_cc_number'] )
					->setHolderName($data['paymentData']['additional_data']['one_cc_owner'])
					->setExpirationMonth($data['paymentData']['additional_data']['one_cc_exp_month'])
					->setExpirationYear($data['paymentData']['additional_data']['one_cc_exp_year'])
					->setSecurityCode($data['paymentData']['additional_data']['one_cc_cid'])
					->setCpf($data['paymentData']['additional_data']['one_cc_document']);
				}
				
				if($erro_credit == 'true' || $card_two_erro == 'true') {
					$referenceIdTwo = 'pay-' . uniqid();
					$UpdateOrder->getOrder()
					->setType($type_payment)
					->creditCard($data['paymentData']['additional_data']['two_cc_amount'], $data['paymentData']['additional_data']['two_cc_installments'], $referenceIdTwo)
					->setCardNumber($data['paymentData']['additional_data']['two_cc_number'])
					->setHolderName($data['paymentData']['additional_data']['two_cc_owner'])
					->setExpirationMonth($data['paymentData']['additional_data']['two_cc_exp_month'])
					->setExpirationYear($data['paymentData']['additional_data']['two_cc_exp_year'])
					->setSecurityCode($data['paymentData']['additional_data']['two_cc_cid'])
					->setCpf($data['paymentData']['additional_data']['two_cc_document']);
				}
			}
			else if($type_payment == 'multi_ticket') {
				$UpdateOrder->getOrder()->setType($type_payment);
				$cardPay = false;
				
				if(is_array($aqpagoResponse['payments'])) {
					foreach($aqpagoResponse['payments'] as $key => $pay) {
						if($pay['type'] == 'credit' && ($pay['status'] == 'succeeded' || $pay['status'] == 'pre_authorized')) {
							$cardPay = true;
							$cardPayAmount = $pay['amount'];
						}
					}
				}
				
				/** Cartão já está pago **/
				if($cardPay) {
					$amount_ticket = $data['paymentData']['additional_data']['amount_ticket'];					
					$UpdateOrder->getOrder()->ticket($amount_ticket)
								->setBodyInstructions( $this->config->getConfig('body_instructions') );
				}
				else {
					/** processar um cartão **/
					$amount 			= $data['paymentData']['additional_data']['one_cc_amount'];
					$installments 		= $data['paymentData']['additional_data']['one_cc_installments'];
					$card_number 		= $data['paymentData']['additional_data']['one_cc_number'];
					$holder_name 		= $data['paymentData']['additional_data']['one_cc_owner'];
					$expiration_month 	= $data['paymentData']['additional_data']['one_cc_exp_month'];
					$expiration_year 	= $data['paymentData']['additional_data']['one_cc_exp_year'];
					$security_code 		= $data['paymentData']['additional_data']['one_cc_cid'];
					$cpf 				= $data['paymentData']['additional_data']['one_cc_document'];
					
					$UpdateOrder->getOrder()
						->setType($type_payment)
						->creditCard($amount, $installments, $referenceId)
						->setCardNumber($card_number)
						->setHolderName($holder_name)
						->setExpirationMonth($expiration_month)
						->setExpirationYear($expiration_year)
						->setSecurityCode($security_code)
						->setCpf($cpf);
				}
			}
			else {
				/** processar boleto **/
				$UpdateOrder->getOrder()->setType($type_payment);
				$UpdateOrder->getOrder()->ticket($order->getGrandTotal())
								->setBodyInstructions( $this->config->getConfig('body_instructions') );
			}
			
			//echo json_encode(array_filter($UpdateOrder->jsonSerialize()), JSON_PRETTY_PRINT);die();
			
			try {
				$transaction = (new \Aqbank\Apiv2\Aqpago\Aqpago($sellerAqpago, $environment, $logger))->updateOrder($UpdateOrder);
			} catch (\Exception $e) {
				$logger->info('Log Editar Pagamento com falha');
				$logger->info('Erro ' . $e->getMessage());
				$logger->info('Arquivo Aqbank\Aqpago\Controller\Ajax\Payment line ' . $e->getLine());
				
				return $result->setData(json_decode($e->getMessage(), true));           
			}
			
			//echo json_encode($transaction->jsonSerialize(), JSON_PRETTY_PRINT);die();
			
			$response = json_encode($transaction->jsonSerialize());
			$response = json_decode($response, true);
			
			if(isset($response['id'])) {
				//$payment->setAdditionalInformation("Transaction ID", $response['id']);
				$payment->setAdditionalInformation("Status", $response['status']);
				$payment->setAdditionalInformation("Return Message", $message_response[  $response['status'] ]);
				$payment->setAdditionalInformation("order_type", $response['type']);
				
				if($response['type'] == 'credit' || $response['type'] == 'multi_ticket') {
					foreach($response['payments'] as  $k => $pay) {
						if($pay['type'] == 'credit') {
							if(
								$pay['credit_card']['first4_digits'] == substr($data['paymentData']['additional_data']['one_cc_number'], 0, 4) &&
								$pay['credit_card']['last4_digits'] == substr($data['paymentData']['additional_data']['one_cc_number'], -4, 4)
								
							) {
								
								$payment->setAdditionalInformation("Payment Type", $pay['type']);
								$payment->setAdditionalInformation("One Payment Status", $pay['status']);
								$payment->setAdditionalInformation("Installments", $pay['installments']);	
								$payment->setAdditionalInformation("Amount", $pay['amount']);
								$payment->setAdditionalInformation("Flag", $pay['credit_card']['flag']);
								$payment->setAdditionalInformation("First 4", $pay['credit_card']['first4_digits']);
								$payment->setAdditionalInformation("Last 4", $pay['credit_card']['last4_digits']);
								
								$payment->setAdditionalInformation('1_pay_amount', $pay['amount']);
								$payment->setAdditionalInformation('1_pay_type', $pay['type']);
								$payment->setAdditionalInformation('1_pay_status', $pay['status']);
								$payment->setAdditionalInformation('1_pay_message', $pay['message']);
								$payment->setAdditionalInformation('1_pay_date', (isset($pay['payment_date'])) ? $pay['payment_date'] : null);
								$payment->setAdditionalInformation('1_pay_created_at', $pay['created_at']);
								
								$payment->setAdditionalInformation('1_pay_installments', $pay['installments']);
								$payment->setAdditionalInformation('1_pay_flag', $pay['credit_card']['flag']);
								$payment->setAdditionalInformation('1_pay_number', $pay['credit_card']['first4_digits'] . ' **** ***** ' .  $pay['credit_card']['last4_digits']);
								$payment->setAdditionalInformation('1_pay_holder_name', $pay['credit_card']['holder_name']);						
								
							}
						}
					}
				}
				else if($response['type'] == 'multi_credit') {
					$ps = 1;
					foreach($response['payments'] as  $k => $pay) {
						if($pay['type'] == 'ticket') {
							$payment->setAdditionalInformation("Payment Type", $pay['type']);
							//$payment->setAdditionalInformation("Installments", $pay['installments']);
							$payment->setAdditionalInformation("One Payment Status", $pay['status']);
							$payment->setAdditionalInformation("Amount", $order->getBaseCurrency()->formatTxt($pay['amount']));
							$payment->setAdditionalInformation("Body Instructions", 
								($this->config->getConfig('body_instructions')) ? $this->config->getConfig('body_instructions') : null
							);
							$payment->setIsTransactionPending(true);
						}
						else {
							
							if(
								$card_one_erro == 'true' &&
								$pay['credit_card']['first4_digits'] == substr($data['paymentData']['additional_data']['one_cc_amount'], 0, 4) &&
								$pay['credit_card']['last4_digits'] == substr($data['paymentData']['additional_data']['one_cc_amount'], -4, 4)
								
							) {
								$payment->setAdditionalInformation("Payment Type", $pay['type']);
								$payment->setAdditionalInformation("One Payment Status", $pay['status']);
								$payment->setAdditionalInformation("Installments", $pay['installments']);	
								$payment->setAdditionalInformation("Amount", $order->getBaseCurrency()->formatTxt($pay['amount']));
								$payment->setAdditionalInformation("Flag", $pay['credit_card']['flag']);
								$payment->setAdditionalInformation("First 4", $pay['credit_card']['first4_digits']);
								$payment->setAdditionalInformation("Last 4", $pay['credit_card']['last4_digits']);
								
								$payment->setAdditionalInformation("Second Payment Type", $pay['type']);
								$payment->setAdditionalInformation("Second Payment Status", $pay['status']);
								$payment->setAdditionalInformation("Second Installments", $pay['installments']);	
								$payment->setAdditionalInformation("Second Amount", $order->getBaseCurrency()->formatTxt($pay['amount']));
								$payment->setAdditionalInformation("Second Flag", $pay['credit_card']['flag']);
								$payment->setAdditionalInformation("Second First 4", $pay['credit_card']['first4_digits']);	
								$payment->setAdditionalInformation("Second Last 4", $pay['credit_card']['last4_digits']);
								
								$payment->setAdditionalInformation('1_pay_amount', $pay['amount']);
								$payment->setAdditionalInformation('1_pay_type', $pay['type']);
								$payment->setAdditionalInformation('1_pay_status', $pay['status']);
								$payment->setAdditionalInformation('1_pay_message', $pay['message']);
								$payment->setAdditionalInformation('1_pay_date', (isset($pay['payment_date'])) ? $pay['payment_date'] : null);
								$payment->setAdditionalInformation('1_pay_created_at', $pay['created_at']);
								$payment->setAdditionalInformation('1_pay_installments', $pay['installments']);
								$payment->setAdditionalInformation('1_pay_flag', $pay['credit_card']['flag']);
								$payment->setAdditionalInformation('1_pay_number', $pay['credit_card']['first4_digits'] . ' **** ***** ' .  $pay['credit_card']['last4_digits']);
								$payment->setAdditionalInformation('1_pay_holder_name', $pay['credit_card']['holder_name']);
								
							}
							
							if(
								$card_two_erro == 'true' &&
								$pay['credit_card']['first4_digits'] == substr($data['paymentData']['additional_data']['two_cc_number'], 0, 4) &&
								$pay['credit_card']['last4_digits'] == substr($data['paymentData']['additional_data']['two_cc_number'], -4, 4)
								
							) {
								
								$payment->setAdditionalInformation("Second Payment Type", $pay['type']);
								$payment->setAdditionalInformation("Second Payment Status", $pay['status']);
								$payment->setAdditionalInformation("Second Installments", $pay['installments']);	
								$payment->setAdditionalInformation("Second Amount", $order->getBaseCurrency()->formatTxt($pay['amount']));
								$payment->setAdditionalInformation("Second Flag", $pay['credit_card']['flag']);
								$payment->setAdditionalInformation("Second First 4", $pay['credit_card']['first4_digits']);	
								$payment->setAdditionalInformation("Second Last 4", $pay['credit_card']['last4_digits']);
								
								$payment->setAdditionalInformation('2_pay_amount', $pay['amount']);
								$payment->setAdditionalInformation('2_pay_type', $pay['type']);
								$payment->setAdditionalInformation('2_pay_status', $pay['status']);
								$payment->setAdditionalInformation('2_pay_message', $pay['message']);
								$payment->setAdditionalInformation('2_pay_date', (isset($pay['payment_date'])) ? $pay['payment_date'] : null);
								$payment->setAdditionalInformation('2_pay_created_at', $pay['created_at']);
								$payment->setAdditionalInformation('2_pay_installments', $pay['installments']);
								$payment->setAdditionalInformation('2_pay_flag', $pay['credit_card']['flag']);
								$payment->setAdditionalInformation('2_pay_number', $pay['credit_card']['first4_digits'] . ' **** ***** ' .  $pay['credit_card']['last4_digits']);
								$payment->setAdditionalInformation('2_pay_holder_name', $pay['credit_card']['holder_name']);
								
							}
						}
						
					} 
				}
				else if($response['type'] == 'ticket') {
					foreach($response['payments'] as  $k => $pay) {
						
						if($pay['type'] == 'ticket') {
							$payment->setAdditionalInformation("Payment Type", $pay['type']);
							//$payment->setAdditionalInformation("Installments", $pay['installments']);
							$payment->setAdditionalInformation("One Payment Status", $pay['status']);
							$payment->setAdditionalInformation("Amount", $order->getBaseCurrency()->formatTxt($pay['amount']));
							$payment->setAdditionalInformation("Body Instructions", 
								($this->config->getConfig('body_instructions')) ? $this->config->getConfig('body_instructions') : null
							);
							$payment->setIsTransactionPending(true);
						}
					}
				}
				
				$payment->setAdditionalInformation("payments", json_encode($transaction->getPayments()));
				$payment->setAdditionalInformation('Reponse', $transaction->jsonSerialize());
				$payment->save();
				$order->save();
				
				$_response = [];
				$_payments = [];
				$amount = '';
				foreach($response['payments'] as $k => $pay){
					if(isset($pay['reference_id']) && $pay['reference_id'] == $referenceId){
						$response['payments'][$k]['message'] = (isset($response['payments'][$k]['message'])) ? __( $response['payments'][$k]['message'] ) : null;
						$response['payment'] = $response['payments'][$k];
						
						if(
							$response['status'] == 'ORDER_PARTIAL_PAID' && 
							($pay['status'] == 'succeeded' || $pay['status'] == 'pre_authorized')
						) {
							$amount = $pay['amount'];
						}
					}
				}
				
				$response['card_erro'] 		= ($card_one_erro == 'true') ? 'one' : 'two';
				$response['pay'] 			= false;
				$response['order_increment']= $order->getIncrementId();
				
				if($response['status'] == 'ORDER_PAID') {
					$response['pay'] = true;
					
					// create capture
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_CAPTURE, 
						'Captured the amount of %1 online.'
					);
					
					// create invoice
					$idinvoice = $this->createInvoice($order);
					
					$order->setState(Order::STATE_PROCESSING)
							->setStatus(Order::STATE_PROCESSING);
					
					$order->save();
				}
				else if($response['status'] == 'ORDER_IN_ANALYSIS'){
					$response['pay'] = true;
					
					// create capture
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_AUTH, 
						'Authorized the amount of %1 online.'
					);
					
					
					$order->setState(Order::STATE_PAYMENT_REVIEW)
							->setStatus(Order::STATE_PAYMENT_REVIEW);
					
					$order->save();
				}
				else if($response['status'] == 'ORDER_PARTIAL_PAID') {
					$response['pay'] = true;
					
					$amount = $order->getBaseCurrency()->formatTxt($amount);
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_AUTH,
						"Authorized the amount {$amount} of a total %1, online.", 
					);
					
					$order->setState(Order::STATE_HOLDED)
							->setStatus(Order::STATE_HOLDED);
					$order->save();
				}
				else if($response['status'] == 'ORDER_WAITING') {
					/** status de boleto liberar no checkout **/
					$response['pay'] = true;
					
					// create authorize
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_PAYMENT, 
						'Waiting payment the amount of %1 in ticket.'
					);
					
					$order->setState(Order::STATE_HOLDED)
							->setStatus(Order::STATE_HOLDED);
					$order->save();
				}
				else if($response['status'] == 'ORDER_CANCELED') {
					// create cancel
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_VOID, 
						'Canceled the amount of %1 online'
					);
					
					$order->setState(Order::STATE_CANCELED)
							->setStatus(Order::STATE_CANCELED);
					$order->save();
				}
				else if($response['status'] == 'ORDER_NOT_PAID'){
					// create cancel
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_VOID, 
						'Void the amount of %1 online, payment fail.'
					);
					
					$order->setState(Order::STATE_PENDING_PAYMENT)
							->setStatus(Order::STATE_PENDING_PAYMENT);
					$order->save();
				}
				else {
					
					$comment = (isset($message_response[ $response['status'] ])) ? $message_response[ $response['status'] ] : '';
					$idTrans = $this->createTransaction(
						$order, 
						$response, 
						Transaction::TYPE_VOID, 
						'Payment fail, ' . $comment
					);
					
					$order->setState(Order::STATE_CANCELED)
							->setStatus(Order::STATE_CANCELED);
					$order->save();
				}
				
				$response['orderId'] = $order->getId();
				
				return $result->setData(['success' => true, 'response' => $response]);
			}
			else if(is_array($response) && isset($response['message'])){
				return $result->setData(['success' => false, 'message' => $response['message']]);
			}
			else {
				return $result->setData(['success' => false, 'message' => 'failed!']);
			}
			
		} else {
			return $result->setData(['success' => false, 'message' => 'Invalid method request!']);
		}
	}
	
	
	private function createInvoice($order)
	{
        if ($order->canInvoice()) {
            $invoice = $this->invoiceService->prepareInvoice($order);
            $invoice->register();
            $invoice->save();
			
            $transactionSave = $this->transaction->addObject(
                $invoice
            )->addObject(
                $invoice->getOrder()
            );
            $transactionSave->save();
			
            $this->invoiceSender->send($invoice);
			
			//Send Invoice mail to customer
            $order->addStatusHistoryComment(
					__('Notified customer about invoice creation #%1.', $invoice->getId())
				)
                ->setIsCustomerNotified(true)
                ->save();
				
			return $invoice->getId();
        } else {
			// 'invoice already created'
			return;
		}
	}
	
	private function createTransaction($order, $paymentData, $type, $comment)
    {
        try {
            // Prepare payment object
            $payment = $order->getPayment();
            
            // Formatted price
            $formatedPrice = $order->getBaseCurrency()->formatTxt($order->getGrandTotal());
 
			
			$_payments = [];
			$_payments['Order status'] = $paymentData['status'];
			$_payments['Order amount'] = $this->priceHelper->currency($paymentData['amount'], true, false);
			$_payments['Order type'] = $paymentData['type'];
			$_payments['Order description'] = $paymentData['description'];
			
			if(count($paymentData['payments'])){
				$t = 1;
				foreach($paymentData['payments'] as $k => $pay) {
					$pay = json_encode($pay);
					$pay = json_decode($pay, true);
					
					$_payments["{$t} Payment ID"] = (isset($pay['id'])) ? $pay['id'] : null;
					$_payments["{$t} Payment amount"] = (isset($pay['id'])) ? $this->priceHelper->currency($pay['amount'], true, false) : null;
					$_payments["{$t} Payment type"] = (isset($pay['type'])) ? $pay['type'] : null;
					$_payments["{$t} Payment status"] = (isset($pay['status'])) ? $pay['status'] : null;
					$_payments["{$t} Payment message"] = (isset($pay['message'])) ? $pay['message'] : null;
					$_payments["{$t} Payment created_at"] = (isset($pay['created_at']) && !empty($pay['created_at'])) ? date("d/m/Y H:i:s", strtotime($pay['created_at'])) : null;
					$_payments["{$t} Payment date"] = (isset($pay['payment_date']) && !empty($pay['payment_date'])) ? date("d/m/Y H:i:s", strtotime($pay['payment_date'])) : null;
					
					if(isset($pay['credit_card'])) {
						$_payments["{$t} Payment installments"] = (isset($pay['installments'])) ? $pay['installments'] : null;
						$_payments["{$t} Card"] = (isset($pay['credit_card']['first4_digits'])) ? $pay['credit_card']['first4_digits'] .' XXXX XXXX XXXX ' . $pay['credit_card']['last4_digits'] : null;
						$_payments["{$t} Flag"] = (isset($pay['credit_card']['flag'])) ? $pay['credit_card']['flag'] : null;
						$_payments["{$t} Holder name"] = (isset($pay['credit_card']['holder_name'])) ? $pay['credit_card']['holder_name'] : null;
						$_payments["{$t} Expiration month"] = (isset($pay['credit_card']['expiration_month'])) ? $pay['credit_card']['expiration_month'] : null;
						$_payments["{$t} Expiration year"] = (isset($pay['credit_card']['expiration_year'])) ? $pay['credit_card']['expiration_year'] : null;
					}
					
					$_payments["{$t} end"] = '-';
					$t++;
				}
				
			}
			
            // Prepare transaction
            $transaction = $this->transactionBuilder->setPayment($payment)
            ->setOrder($order)
            ->setTransactionId( $paymentData['id'] )
			->setAdditionalInformation([Transaction::RAW_DETAILS => $_payments])
            ->setFailSafe(true)
            ->build($type);
			
            // Add transaction to payment
            $payment->addTransactionCommentsToOrder($transaction, __($comment, $formatedPrice));
            $payment->setParentTransactionId( $paymentData['id'] . '-' . $type );
			
            // Save payment, transaction and order
            $payment->save();
            $order->save();
            $transaction->save();
			
            return  $transaction->getTransactionId();

        } catch (Exception $e) {
			return $e->getMessage();
        }
    }

}
