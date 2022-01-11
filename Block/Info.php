<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Block;

use Magento\Framework\Phrase;
use Magento\Framework\View\Element\Template\Context;
use Magento\Payment\Gateway\ConfigInterface;
use Magento\Framework\Pricing\PriceCurrencyInterface;
use Aqbank\Aqpago\Helper\Data;

/**
 * Class Info
 */
class Info extends \Magento\Payment\Block\Info
{
    /**
     * @var ConfigInterface
     */
    private $config;
	
    private $_helperData;

    /**
     * @var string
     */
    protected $_template = 'Aqbank_Aqpago::info/default.phtml';
	
    /**
     * @param Context $context
     * @param ConfigInterface $config
     * @param array $data
     */
    public function __construct(
        Context $context,
        ConfigInterface $config,
		PriceCurrencyInterface $priceCurrency,
		Data $helperData,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->config = $config;
		$this->priceCurrency = $priceCurrency;
		$this->_helperData = $helperData;
		
        if (isset($data['pathPattern'])) {
            $this->config->setPathPattern($data['pathPattern']);
        }

        if (isset($data['methodCode'])) {
            $this->config->setMethodCode($data['methodCode']);
        }
    }

    /**
     * Function getFormatedPrice
     *
     * @param float $price
     *
     * @return string
     */
    public function getFormatedPrice($amount)
    {
        return $this->priceCurrency->convertAndFormat($amount);
    }
	
    /**
     * Prepare payment information
     *
     * @param \Magento\Framework\DataObject|array|null $transport
     * @return \Magento\Framework\DataObject
     */
    protected function _prepareSpecificInformation($transport = null)
    {
        $transport = parent::_prepareSpecificInformation($transport);
        $payment = $this->getInfo();
        $storedFields = explode(',', (string)$this->config->getValue('paymentInfoKeys'));
        if ($this->getIsSecureMode()) {
            $storedFields = array_diff(
                $storedFields,
                explode(',', (string)$this->config->getValue('privateInfoKeys'))
            );
        }
		
        foreach ($storedFields as $field) {
            if ($payment->getAdditionalInformation($field) !== null) {
                $this->setDataToTransfer(
                    $transport,
                    $field,
                    $payment->getAdditionalInformation($field)
                );
            }
        }

        return $transport;
    }

    /**
     * Sets data to transport
     *
     * @param \Magento\Framework\DataObject $transport
     * @param string $field
     * @param string $value
     * @return void
     */
    protected function setDataToTransfer(
        \Magento\Framework\DataObject $transport,
        $field,
        $value
    ) {
        $transport->setData(
            (string)$this->getLabel($field),
            (string)$this->getValueView(
                $field,
                $value
            )
        );
    }

    /**
     * Returns label
     *
     * @param string $field
     * @return string | Phrase
     */
    protected function getLabel($field)
    {
        return __( $field );
    }

    /**
     * Returns value view
     *
     * @param string $field
     * @param string $value
     * @return string | Phrase
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function getValueView($field, $value)
    {
		if($field == '1_pay_date' || $field == '2_pay_date') {
			$value = date("d/m/Y H:i", strtotime($value));
		}
		if($field == 'expiration_date') {
			$value = date("d/m/Y", strtotime($value));
		}
		if($field == 'Status' || $field == 'Return Message' || $field == 'order_type') {
			$value = __( $value );
		}
		
		$payment = $this->getInfo();
		
		if($field == 'order_type' || $field == '1_pay_status' || $field == '2_pay_status'){
			$value = __($value);
		}
		
		if($field == '1_pay_amount') {
			$installments = $payment->getAdditionalInformation('1_pay_installments');
			$value = sprintf(__('%s in %sx'), strip_tags($this->getFormatedPrice($value)), $installments );
		}		
		if($field == '2_pay_amount') {
			$installments = $payment->getAdditionalInformation('2_pay_installments');
			$value = sprintf(__('%s in %sx'), strip_tags($this->getFormatedPrice($value)), $installments );
		}
		
        return $value;
    }
	
	public function getBarCodeImage($barCode)
	{
		$barCode 	= preg_replace('/^(\d{4})(\d{5})\d{1}(\d{10})\d{1}(\d{10})\d{1}(\d{15})$/', '$1$5$2$3$4', $barCode);
		$generator 	= new \Picqer\Barcode\BarcodeGeneratorPNG();
		$bar_code   = $generator->getBarcode($barCode, $generator::TYPE_INTERLEAVED_2_5);
		$img_base64 = base64_encode($bar_code);
		
		echo '<img src="data:image/png;base64,' . $img_base64 . '" style="height: 70px;">';
	} 
}
