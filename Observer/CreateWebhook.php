<?php

namespace Aqbank\Aqpago\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer as EventObserver;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\Config\Storage\WriterInterface;
use Aqbank\Aqpago\Gateway\Config\Config;
use Aqbank\Apiv2\SellerAqpago;
use Aqbank\Apiv2\Aqpago\Request\AqpagoEnvironment;
use Aqbank\Apiv2\Aqpago\Sale;
use Aqbank\Apiv2\Aqpago\Aqpago;
use Aqbank\Apiv2\Aqpago\Webhook;
use Aqbank\Apiv2\Aqpago\CreditCard;
use Aqbank\Apiv2\Aqpago\Customer;
use Aqbank\Apiv2\Aqpago\Request\Exceptions\AqpagoRequestException;

class CreateWebhook implements ObserverInterface
{
    /**
     * @var request
     */
    private $request;
    /**
     * @var configWriter
     */
    private $configWriter;
    /**
     * @var config
     */
    private $config;
    /**
     * @var token
     */
    private $token;
    /**
     * @var environment
     */
    private $environment;
    /**
     * @var taxDocument
     */
    private $taxDocument;
    /**
     * @var _messageManager
     */
    private $_messageManager;

    /**
     * @param RequestInterface $request
     * @param WriterInterface $configWriter
     * @param \Magento\Store\Model\StoreManagerInterface $storeManagerInterface
     * @param \Magento\Framework\Message\ManagerInterface $messageManager
     * @param Config $config
     */
    public function __construct(
        RequestInterface $request,
        WriterInterface $configWriter,
        \Magento\Store\Model\StoreManagerInterface $storeManagerInterface,
        \Magento\Framework\Message\ManagerInterface $messageManager,
        Config $config
    ) {
        $this->request = $request;
        $this->configWriter = $configWriter;
        $this->config = $config;
        $this->_storeManager = $storeManagerInterface;
        $this->_messageManager = $messageManager;
        $this->taxDocument = preg_match("/^[0-9]+$/", $this->config->getConfig('tax_document'));
        $this->token = $this->config->getConfig('token');
        $this->environment = $this->config->getConfig('environment');
    }

    /**
     * Method execute
     *
     * @param EventObserver $observer
     * @return Object
     */
    public function execute(EventObserver $observer)
    {
        if (!$this->taxDocument || !$this->taxDocument) {
            return $this;
        }

        /** Create Webhook if not exist **/
        $params      = $this->request->getParam('groups');
        $aqpagoData  = $params['aqpago'];

        $environment = $this->environment;
        $environment = AqpagoEnvironment::$environment();
        // Aqbank\Apiv2\Aqpago\SellerAqpago
        $sellerAqpago = new SellerAqpago($this->taxDocument, $this->token, 'modulo magento 2');
        $Webhooks = (new Aqpago($sellerAqpago, $environment))->getWebhooks();
        $response = json_encode(array_filter($Webhooks->jsonSerialize()));
        $response = json_decode($response, true);
        $baseUrl = $this->_storeManager->getStore()->getBaseUrl();

        $configWebHook = false;
        if (isset($response['data']) && count($response['data'])) {
            foreach ($response['data'] as $k => $hook) {
                if ($hook['url'] == $baseUrl . 'aqbank/webhook/index') {
                    $configWebHook = true;
                }
            }
        }

        if (!$configWebHook) {
            $webhook = new Webhook();
            $webhook->setEvent([
                "transation.success",
                "transaction.succeeded",
                "transaction.reversed",
                "transaction.failed",
                "transaction.canceled",
                "transaction.disputed",
                "transaction.charged_back",
                "transaction.pre_authorized"
            ])
            ->setUrl($baseUrl . 'aqbank/webhook/index')
            ->setDescription('loja magento 2')
            ->setMethod('POST');
            
            $aqpago     = (new Aqpago($sellerAqpago, $environment))->createWebhook($webhook);
            $response   = json_encode(array_filter($aqpago->jsonSerialize()));
            $response   = json_decode($response, true);
            
            if (!isset($response['success']) || !$response['success']) {
                $this->_messageManager->addError(__('Falha ao criar configuração de notificação!'));
            } else {
                $this->_messageManager->addSuccess(__('Configuração de notificação salva com sucesso!'));
            }
        }
        return $this;
    }
}
