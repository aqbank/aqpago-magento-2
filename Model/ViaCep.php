<?php

namespace Aqbank\Aqpago\Model;

use \Magento\Framework\HTTP\Client\Curl;

class ViaCep extends \Magento\Framework\Model\AbstractModel
{
    public const CACHE_TAG = 'aqbank_aqpago_viacep';
    /**
     * @var _cacheTag
     */
    protected $_cacheTag = 'aqbank_aqpago_viacep';
    /**
     * @var _eventPrefix
     */
    protected $_eventPrefix = 'aqbank_aqpago_viacep';
    /**
     * @var _viaCepUrl
     */
    private $_viaCepUrl = "https://viacep.com.br/ws/__postcode__/json/";
    
    /**
     * @var \Magento\Framework\HTTP\Client\Curl
     */
    protected $_curl;
    /**
     * @param \Magento\Framework\HTTP\Client\Curl $curl
     */
    public function __construct(
        \Magento\Framework\HTTP\Client\Curl $curl
    ) {
        $this->_curl = $curl;
    }
    /**
     * Method sendViaCep
     *
     * @param string $postCode
     *
     * @return array
     */
    public function sendViaCep($postCode)
    {
        $postCode = preg_replace("/[^0-9]/", "", $postCode);
        $response = $this->execViaCep($postCode);
        $respnseArray = json_decode($response, true);
        return $respnseArray;
    }
    /**
     * Method execViaCep
     *
     * @param string $postCode
     *
     * @return string
     */
    private function execViaCep($postCode)
    {
        $this->_viaCepUrl = str_replace("__postcode__", $postCode, $this->_viaCepUrl);
        $this->_curl->get($this->_viaCepUrl);
        //$this->_curl->post($url, $params);
        $response = $this->_curl->getBody();
        return $response;
    }
}
