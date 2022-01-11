<?php
 
namespace Aqbank\Aqpago\Plugin\Checkout;
 
use Magento\Checkout\Block\Checkout\LayoutProcessor;

 
class BillingAddressLayoutProcessor
{
    public function afterProcess(
        LayoutProcessor $subject,
        array $result
    )
    {
        $this->result = $result;
		
		
        $billingConfiguration = &$this->result['components']['checkout']['children']['steps']['children']['billing-step']
        ['children']['payment']['children']['payments-list']['children'];
		
        if (isset($billingConfiguration)) {
            foreach ($billingConfiguration as $key => &$billingForm) {
                if (!strpos($key, '-form')) {
                    continue;
                }
				
                if (isset($billingForm['children']['form-fields']['children']['firstname'])) {
                    unset($billingForm['children']['form-fields']['children']['firstname']);
                }				
				if (isset($billingForm['children']['form-fields']['children']['lastname'])) {
                    unset($billingForm['children']['form-fields']['children']['lastname']);
                }				
				if (isset($billingForm['children']['form-fields']['children']['company'])) {
                    unset($billingForm['children']['form-fields']['children']['company']);
                }
            }
        }
		
        return $this->result;
    }
}