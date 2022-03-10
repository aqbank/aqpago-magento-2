<?php

namespace Aqbank\Aqpago\Model;

use Exception;
use Magento\Framework\App\Config\ScopeConfigInterface;

class Webhook
{
    /**
     * Method __construct
     */
    public function __construct()
    {
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(
            new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_webhook.log', \Monolog\Logger::DEBUG)
        );
        $logger->info('Log __construct Webhook');
    }
    
    /**
     * Method validateRequest
     *
     * @param Object $request
     * @return array
     * @throws Exception
     */
    public function validateRequest($request)
    {
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(
            new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_webhook.log', \Monolog\Logger::DEBUG)
        );
        $logger->info('Log Webhook');
        $logger->info("Received notification" . json_encode($request->getParams()));
    }
}
