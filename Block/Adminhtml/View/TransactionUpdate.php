<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Block\Adminhtml\View;

use Magento\Sales\Model\Order;
use Aqbank\Aqpago\Gateway\Config\Config;

class TransactionUpdate
{
    /**
     * @var $config
     */
    private $config;

    /**
     * TransactionUpdate constructor.
     *
     * @param Config $config
     */
    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * Method beforeSetLayout.
     *
     * @param \Magento\Sales\Block\Adminhtml\Order\View $view
     */
    public function beforeSetLayout(\Magento\Sales\Block\Adminhtml\Order\View $view)
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $order = $objectManager->create(\Magento\Sales\Model\Order::class)->load($view->getOrderId());
        $payment = $order->getPayment();
        $canConsult = empty($payment->getAdditionalInformation("Nsu")) &&
                      empty($payment->getAdditionalInformation("Id Refund")) &&
                      empty($payment->getAdditionalInformation("Id Cancel")) &&
                      $payment->getMethodInstance()->getCode() == 'aqpago';
    }
}
