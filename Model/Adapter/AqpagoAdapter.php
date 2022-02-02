<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Model\Adapter;

use Magento\Payment\Model\Method\Logger;
use Magento\Framework\Exception\LocalizedException;

use Aqbank\Aqpago\Gateway\Config\Config;
use Aqbank\Aqpago\Model\Adminhtml\Source\Environment;

use Aqbank\Apiv2\SellerAqpago;
use Aqbank\Apiv2\Aqpago\Request\AqpagoEnvironment;

use Aqbank\Apiv2\Aqpago\Sale;
use Aqbank\Apiv2\Aqpago\Aqpago;
use Aqbank\Apiv2\Aqpago\Order;
use Aqbank\Apiv2\Aqpago\CreditCard;
use Aqbank\Apiv2\Aqpago\Customer;
use Aqbank\Apiv2\Aqpago\Request\Exceptions\AqpagoRequestException;


/**
 * Class AqpagoAdapter
 * @codeCoverageIgnore
 */
class AqpagoAdapter
{

    /**
     * @var Config
     */
    private $config;

    private $taxDocument;
    
	private $token;
	
    private $logger;
	
    private $_url = "https://apishopaqpago.aqbank.com.br/api";
	
    private $_bearerToken;
	
    private $_remoteAddress;
	
    private $_messageManager;
	
    /**
     * @param Config $config
     * @param Logger $logger
     */
    public function __construct(
		Config $config, 
		Logger $logger = null,
		\Magento\Framework\Message\ManagerInterface $messageManager
	) {
        $this->config = $config;
        $this->logger = $logger;
		$this->_messageManager = $messageManager;
		
		$this->taxDocument 	= preg_match("/^[0-9]+$/", $this->config->getConfig('tax_document'));
		$this->token 		= $this->config->getConfig('token');
		$this->environment	= $this->config->getConfig('environment');
		
		$objctManager = \Magento\Framework\App\ObjectManager::getInstance();
		$remote = $objctManager->get('Magento\Framework\HTTP\PhpEnvironment\RemoteAddress');
		$this->_remoteAddress = $remote->getRemoteAddress();
    }
	
    /**
     * @param array $attributes
     *
     * @return \Aqbank\Apiv2\Aqpago\Aqpago
     * @throws \Exception
     */
    public function authorize(array $attributes)
    {
		$environment = $this->environment;
		$environment = AqpagoEnvironment::$environment();
		
		$logger = new \Monolog\Logger('aqpago');
		$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_adpter.log', \Monolog\Logger::DEBUG));
		//$logger->info('Log Adpter');
		//$logger->info('Resquest: ' . json_encode($attributes) );
		
		// Aqbank\Apiv2\Aqpago\SellerAqpago
		$sellerAqpago = new SellerAqpago($this->taxDocument, $this->token, 'modulo magento 2');
		
		// Aqbank\Apiv2\Aqpago\Order
		$aqpagoOrder = new Order();
		
		$aqpagoOrder->setReferenceId( $attributes['Sale']['orderId'] )
				->setPlatform('magento2')
				->setAmount($attributes['Sale']['Payment']['Amount'])
				->setType($attributes['Sale']['Payment']['type_payment']) // credit, multi_credit, ticket, multi_ticket
				->setDescription('Loja Magento');
		
		$customer = $aqpagoOrder->customer();
		
		$customer->setName($attributes['Sale']['Customer']['name'])
					->setEmail($attributes['Sale']['Customer']['email'])
					->setTaxDocument($attributes['Sale']['Customer']['tax_document']);
		
		if(isset($attributes['Sale']['Customer']['phones']) && count($attributes['Sale']['Customer']['phones'])){
			foreach($attributes['Sale']['Customer']['phones'] as $k => $phone){
				$customer->phones()
					->setArea($phone['area'])
					->setNumber($phone['number']);
			}
		}
		
		$customer->address()
					->setPostCode($attributes['Sale']['Customer']['address']['postcode'])
					->setStreet($attributes['Sale']['Customer']['address']['street'])
					->setNumber($attributes['Sale']['Customer']['address']['number'])
					->setComplement($attributes['Sale']['Customer']['address']['complement'])
					->setDistrict($attributes['Sale']['Customer']['address']['district'])
					->setCity($attributes['Sale']['Customer']['address']['city'])
					->setState($attributes['Sale']['Customer']['address']['state']);		
		
		$shipping = $aqpagoOrder->shipping($attributes['Sale']['Shipping']['amount'], $attributes['Sale']['Shipping']['method']);
		
		$shipping->setAqenvios($attributes['Sale']['Shipping']['aqenvios']);
		
		if(isset($attributes['Sale']['Items']) && count($attributes['Sale']['Items'])) {
			foreach($attributes['Sale']['Items'] as $k => $item) {
				$aqpagoOrder->items()
						->setName($item['name'])
						->setQty($item['qty'])
						->setUnitAmount($item['unit_amount'])
						->setImage($item['image'])
						->setLink($item['link']);
			}
		}
		
		if(
			$attributes['Sale']['Payment']['type_payment'] == 'credit' ||
			$attributes['Sale']['Payment']['type_payment'] == 'multi_credit' ||
			$attributes['Sale']['Payment']['type_payment'] == 'multi_ticket'
		){
			
			$amount_one = ($attributes['Sale']['Payment']['type_payment'] == 'credit') ? $attributes['Sale']['Payment']['Amount'] : $attributes['Sale']['Payment']['CreditCard']['one_cc_amount'];
			
			if($attributes['Sale']['Payment']['CreditCard']['one_cc_number_id'] && $attributes['Sale']['Payment']['CreditCard']['one_cc_saved']) {

				$aqpagoOrder->creditCard($amount_one, $attributes['Sale']['Payment']['CreditCard']['one_cc_installments'])
					->setSecurityCode($attributes['Sale']['Payment']['CreditCard']['one_cc_cid'])
					->setCardId($attributes['Sale']['Payment']['CreditCard']['one_cc_number_id']);
				
			}
			else {
				$aqpagoOrder->creditCard($amount_one, $attributes['Sale']['Payment']['CreditCard']['one_cc_installments'])
					->setCardNumber($attributes['Sale']['Payment']['CreditCard']['one_cc_number'])
					->setHolderName($attributes['Sale']['Payment']['CreditCard']['one_cc_owner'])
					->setExpirationMonth($attributes['Sale']['Payment']['CreditCard']['one_cc_exp_month'])
					->setExpirationYear($attributes['Sale']['Payment']['CreditCard']['one_cc_exp_year'])
					->setSecurityCode($attributes['Sale']['Payment']['CreditCard']['one_cc_cid'])
					->setCpf($attributes['Sale']['Payment']['CreditCard']['one_cc_document']);
					
			}
			
			/** Cartão Multiplo **/
			if($attributes['Sale']['Payment']['type_payment'] == 'multi_credit') {
				if($attributes['Sale']['Payment']['CreditCard']['two_cc_number_id'] && $attributes['Sale']['Payment']['CreditCard']['two_cc_saved']) {
					$aqpagoOrder->creditCard($attributes['Sale']['Payment']['CreditCard']['two_cc_amount'], $attributes['Sale']['Payment']['CreditCard']['two_cc_installments'])
						->setCardId($attributes['Sale']['Payment']['CreditCard']['two_cc_number_id'])
						->setSecurityCode($attributes['Sale']['Payment']['CreditCard']['two_cc_cid']);
				}
				else {
					$aqpagoOrder->creditCard($attributes['Sale']['Payment']['CreditCard']['two_cc_amount'], $attributes['Sale']['Payment']['CreditCard']['two_cc_installments'])
						->setCardNumber($attributes['Sale']['Payment']['CreditCard']['two_cc_number'])
						->setHolderName($attributes['Sale']['Payment']['CreditCard']['two_cc_owner'])
						->setExpirationMonth($attributes['Sale']['Payment']['CreditCard']['two_cc_exp_month'])
						->setExpirationYear($attributes['Sale']['Payment']['CreditCard']['two_cc_exp_year'])
						->setSecurityCode($attributes['Sale']['Payment']['CreditCard']['two_cc_cid'])
						->setCpf($attributes['Sale']['Payment']['CreditCard']['two_cc_document']);
				}
			}
			
			if($attributes['Sale']['Payment']['type_payment'] == 'multi_ticket') {
				$aqpagoOrder->ticket($attributes['Sale']['Payment']['Ticket']['amount'])
								->setBodyInstructions( $this->config->getConfig('body_instructions') );
			}
			
		}
		else {
			/** Boleto **/
			$aqpagoOrder->ticket($attributes['Sale']['Payment']['Amount'])
							->setBodyInstructions( $this->config->getConfig('body_instructions') );
		}
		
		//$logger = new \Monolog\Logger('aqpago');
		//$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_send.log', \Monolog\Logger::DEBUG));
		//$logger->info('Log Aqpago');
		//$logger->info('Resquest: ' . json_encode(array_filter($aqpagoOrder->jsonSerialize())));
		
		//echo json_encode(array_filter($aqpagoOrder->jsonSerialize()), JSON_PRETTY_PRINT);die();
		//$logger->info('jsonSerialize: ' . json_encode(array_filter($aqpagoOrder->jsonSerialize()), JSON_PRETTY_PRINT));
		
		try {
			$transaction = (new \Aqbank\Apiv2\Aqpago\Aqpago($sellerAqpago, $environment))->createOrder($aqpagoOrder);
			//$logger->info('Response: ' . json_encode(array_filter($transaction->jsonSerialize())));
		} catch (\Exception $e) {
			$logger->info('Request: ' . json_encode(array_filter($aqpagoOrder->jsonSerialize()), JSON_PRETTY_PRINT));
			$logger->info('Response Exception: ' . $e->getMessage());
			
			$Message = $e->getMessage();
			$convert = json_decode($Message, true);
			
			if(isset($convert['error'])){
				if(is_array($convert['error'])) {
					foreach($convert['error'] as $tags => $arrayErro){
						if(is_array($arrayErro)) {
							foreach($arrayErro as $tag => $arrayEr){
								if(is_array($arrayEr)) {
									foreach($arrayEr as $k => $list){
										if(is_array($list)) {
											if(isset($list[0])){
												$Message = __($k) . ': ';
												foreach($list as $k2 => $msgErro){
													$Message .= __($msgErro) . ' ';
												}
											}
											else {
												$Message = __($k) . ':' . json_encode($list);
											}
										}
									}
								}
							}
						}
					}
				}
				else {
					$Message = $convert['error'];
				}
			}
			
			//$Message = json_encode($Message);
			$transaction = '{"success": false, "message": "'.$Message.'"}';
			$logger->info('Response erro: ' . $Message);
        }
		
		if(!is_object($transaction)) {
			$logger->info('Request: ' . json_encode(array_filter($aqpagoOrder->jsonSerialize()), JSON_PRETTY_PRINT));
			$logger->info('Response: ' . json_encode($transaction));
			
			$transaction = str_replace("O campo tax document n\u00e3o \u00e9 um CPF v\u00e1lido.", "O documento CPF/CNPJ está com erro retorne aos dados de cadastro do pedido e corrija.", $transaction);
			$transaction = str_replace("O campo tax document não é um CPF válido.", "O documento CPF/CNPJ está com erro retorne aos dados de cadastro do pedido e corrija.", $transaction);
			
			header('Content-Type: application/json; charset=utf-8');
			echo $transaction;
			die();
		}
		
		//echo json_encode($transaction->jsonSerialize(), JSON_PRETTY_PRINT);die();
		
		return $transaction;
    }
	
    public function capture(array $data)
    {	
		/*
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago.log', \Monolog\Logger::DEBUG));
        $logger->info('Log Aqpago capture');
        $logger->info('data: ' . json_encode($data));
		*/
		
		$this->_messageManager->addError(__("Não é possivel fazer a captura do valor, o sistema irá atualizar o pedido de forma automática quando estiver liberado."));
		
        return false;
    }

    public function void(array $data)
    {
		$environment = $this->environment;
		$environment = AqpagoEnvironment::$environment();
		
		// Aqbank\Apiv2\Aqpago\SellerAqpago
		$sellerAqpago = new SellerAqpago($this->taxDocument, $this->token, 'modulo magento 2');
		
        //$logger = new \Monolog\Logger('aqpago');
        //$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_cancel.log', \Monolog\Logger::DEBUG));
        //$logger->info('Log Aqpago void');
        //$logger->info('data: ' . json_encode($data));
		
		// Aqbank\Apiv2\Aqpago\Order
		$aqpagoOrder = new Order();
		$aqpagoOrder->setOrderId($data['TID']);
		
		try {
			$transaction = (new Aqpago($sellerAqpago, $environment))->cancelOrder($aqpagoOrder);
			//$logger->info('Response: ' . json_encode(array_filter($transaction->jsonSerialize())));
		} catch (\Exception $e) {
			//$logger->info('Response: ' . $e->getMessage());
			$Message = $e->getMessage();
			
			$transaction = '{"success": false, "message": '.$Message.'}';
			//$logger->info('Resquest: ' . $transaction);
        }
		
		if(!is_object($transaction)) {
			$transaction = json_decode($transaction, true);
			$this->_messageManager->addError(__( $transaction['message'] ) );
			return false;
		}
		
		if(!$transaction->getStatus()){
			$this->_messageManager->addError(__( $transaction->getMessage() ));
			return false;
		}
		
		if($transaction->getStatus() != 'ORDER_CANCELED'){
			$this->_messageManager->addError(__('Não foi possivel cancelar seu pedido, status do pedido: ' . $transaction->getStatus()));
			return false;
		}
		
        return $transaction;
    }

    public function getEnvironment()
    {
        $result = null;
        if ($this->config->getEnvironment() == Environment::ENVIRONMENT_TEST) {
            $result = Environment::sandbox();
        }
		
        return $result;
    }
}
