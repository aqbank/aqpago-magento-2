<?php

namespace Aqbank\Aqpago\Model;

use \Magento\Framework\HTTP\Client\Curl;

class ViaCep extends \Magento\Framework\Model\AbstractModel 
{
	const CACHE_TAG = 'aqbank_aqpago_viacep';

	protected $_cacheTag = 'aqbank_aqpago_viacep';

	protected $_eventPrefix = 'aqbank_aqpago_viacep';
	
	private $_viaCepUrl = "https://viacep.com.br/ws/__postcode__/json/";
	
	/**
	 * @var \Magento\Framework\HTTP\Client\Curl
	 */
	protected $_curl;

	public function __construct(
		\Magento\Framework\HTTP\Client\Curl $curl
	) {
		$this->_curl = $curl;
	}
	
	public function sendViaCep($postCode) 
	{
		$postCode = preg_replace("/[^0-9]/", "", $postCode);
		
		$response = $this->execViaCep($postCode);
		
		$respnseArray = json_decode($response, true);
		
		return $respnseArray;
	}
	
	private function execViaCep($postCode) 
	{
		$this->_viaCepUrl = str_replace("__postcode__", $postCode, $this->_viaCepUrl);
		
		//if the method is get
		$this->_curl->get($this->_viaCepUrl);
		
		//if the method is post
		//$this->_curl->post($url, $params);
		
		$response = $this->_curl->getBody();
		
		return $response;
	}
}