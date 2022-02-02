<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Model\Ui;

use Magento\Checkout\Model\ConfigProviderInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Locale\ResolverInterface;
use Magento\Framework\View\Asset\Repository;
use Magento\Framework\View\Asset\Source;
use Magento\Framework\UrlInterface;
use Aqbank\Aqpago\Gateway\Config\Config;
use Magento\Checkout\Model\Session\Proxy as CheckoutSession;
use Aqbank\Aqpago\Model\Cards;
use \Magento\Framework\App\Config\ScopeConfigInterface;

/**
 * Class ConfigProvider
 */
final class ConfigProvider implements ConfigProviderInterface
{
    const CODE = 'aqpago';

    /**
     * @var Repository
     */
    protected $assetRepo;
	
    /**
     * @var \Magento\Framework\View\Asset\Source
     */
    protected $assetSource;
	
    /**
     * @var ResolverInterface
     */
    private $localeResolver;
    /**
     * @var Config
     */
    private $config;    
	
	/**
     * @var UrlInterface
     */
	protected $_urlInterface;
   
 	/**
     * @var CheckoutSession
     */
	protected $checkoutSession;
   
 	/**
     * @var Cards
     */
	protected $_cards;
	
	protected $scopeConfig;

    /**
     * Constructor
     *
     * @param Config $config
     * @param Repository $assetRepo
     * @param ResolverInterface $localeResolver
     * @param Source $assetSource
     * @param RequestInterface $request
     */
    public function __construct(
        Config $config,
        Repository $assetRepo,
        ResolverInterface $localeResolver,
        Source $assetSource,
		UrlInterface $urlInterface,  
		CheckoutSession $checkoutSession,
		Cards $cards,
        RequestInterface $request,
		ScopeConfigInterface $scopeConfig
    )
    {
        $this->config = $config;
        $this->assetRepo = $assetRepo;
        $this->localeResolver = $localeResolver;
        $this->assetSource = $assetSource;
		$this->_urlInterface = $urlInterface;
        $this->request = $request;
		$this->checkoutSession = $checkoutSession;
		$this->_cards = $cards;
		$this->scopeConfig = $scopeConfig;
    }
	
    /**
     * Retrieve assoc array of checkout configuration
     * @return array
     */
    public function getConfig()
    {
		$formKeyEnc = md5( uniqid() . date('H:i:S') );
		$this->checkoutSession->setFormKeyEnc($formKeyEnc);
		
		$savedCards = [];
		
		$objectManager = \Magento\Framework\App\ObjectManager::getInstance();
		$customerSession = $objectManager->get('Magento\Customer\Model\Session');
		if($customerSession->isLoggedIn()) {
			// customer login action
			$logger = new \Monolog\Logger('aqpago');
			$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_card.log', \Monolog\Logger::DEBUG));
			$logger->info('Log Cards');
			$logger->info('getCustomer ' . $customerSession->getCustomer()->getId());
			
			$cardsCollection = $this->_cards->getCollection()
			->addFieldToFilter(
				'is_active',
				['eq' => 1]
			)->addFieldToFilter(
				'expired',
				['eq' => 0]
			)->addFieldToFilter(
				'customer_id',
				['eq' => $customerSession->getCustomer()->getId()]
			); 
			
			//$cardsCollection = $this->_cards->getCollection();
			$logger->info('count ' . $cardsCollection->count());
			
			$totalSavedCards = $cardsCollection->count();
			
			if($totalSavedCards){
				foreach($cardsCollection as $savedCard) {
					$fourFirst 	= substr($savedCard->getNumberCard(), 0, 4);
					$fourLast 	= substr($savedCard->getNumberCard(), -4, 4);
					$key 		= $fourFirst . $fourLast;
					
					$savedCards[$key] = [
						'card_id' 		=> $savedCard->getAqpagoId(),
						'flag' 			=> strtolower($savedCard->getFlag()),
						'four_first' 	=> $fourFirst,
						'four_last' 	=> $fourLast,
					];
				}
			}
			else {
				$savedCards = 'false';
				$totalSavedCards = 0;
			}
		}
		else {
			$savedCards = 'false';
			$totalSavedCards = 0;
		}
		
		$storeScope 	= \Magento\Store\Model\ScopeInterface::SCOPE_STORE;
		$document_input = $this->scopeConfig->getValue('payment/aqpago/document_input', $storeScope);
		$phone_input 	= $this->scopeConfig->getValue('payment/aqpago/phone_input', $storeScope);
		
        return [
            'fomrkeyenc' => $formKeyEnc,
            'savedCards' => $savedCards,
            'totalSavedCards' => $totalSavedCards,
            'payment' => [
                self::CODE => [
                    'isActive' => $this->config->isActive(),
                    'document_input' => $document_input,
                    'phone_input' => $phone_input,
                    'orderUrlResponse' => $this->_urlInterface->getUrl('aqbank/ajax/order'),
                    'orderUpdateUrlResponse' => $this->_urlInterface->getUrl('aqbank/ajax/payment'),
                    'orderBarcode' => $this->_urlInterface->getUrl('aqbank/ajax/barcode'),
                    'myOrders' => $this->_urlInterface->getUrl('sales/order/history'),
                    'environment' => $this->config->getEnvironment(),
                    'number_installments' => $this->config->getNumberInstallments(),
                    'min_total_installments' => $this->config->getMinTotalInstallments(),
                    '3ds_enabled' => $this->config->is3DSEnabled(),
                    'debit_enabled' => $this->config->isDebitEnabled(),
                    '3ds_threshold' => $this->config->getThresholdAmount(),
                    'aqpago' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/visa_white.svg'),
                    'aqpago_off' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/visa.svg'),
                    'aqpago_card_front' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card/background-card-front.svg'),
                    'aqpago_card_back' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-back.svg'),
					'flag_visa_default' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/visa.svg'),
					'flag_visa' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/visa_white.svg'),
					'flag_mastercard' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/mastercard.svg'),
					'flag_jcb' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/jcb.svg'),
					'flag_hipercard' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/hipercard.svg'),
					'flag_hiper' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/hiper.svg'),
					'flag_elo' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/elo.svg'),
					'flag_diners' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/diners.svg'),
					'flag_banescard' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/banescard.svg'),
					'flag_aura' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/aura.svg'),
					'flag_american_express' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/flags/amex.svg'),
					'aqpago_money' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/money.svg'),
					'aqpago_logo' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/aqpago-logo.png'),
					'icon_pix' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-pix-40.png'),
					'icon_pix_white' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-pix-white.svg'),
					'icon_barcode' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-barcode-40.png'),
					'icon_credcard' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-card-12.svg'),
					'icon_card_white' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-card-white.svg'),
					'icon_load' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/load.svg'),
					'icon_cvv' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon_cvv.svg'),
					'icon_barcode_white' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-bar-code-white.svg'),
					'icon_tooltip' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-tool-tip.svg'),
					'arrow_right' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/arrow-right.svg'),
					'icon_twocards' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/two-cards.svg'),
					'credit_ticket' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/credit-ticket.svg'),
					'card_one' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-1.svg'),
					'card_two' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-2.svg'),
					'min_cc' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/min-cc.svg'),
					'icon_relogio' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-relogio.svg'),
					'icon_email' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-email.svg'),
					'icon_phone' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-phone.svg'),
					'icon_edit' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-edit.svg'),
					'address_postcode' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-postcode.svg'),
					'icon_arrow_down' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-arrow-down.svg'),
					'icon_check' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-input-check.svg'),
					'card_layout' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-layout.svg'),
					'line_dashed' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/linha-pontilhada.svg'),
					'icon_alert' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-alert.svg'),
					'icon_copy' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-copy.svg'),
					'icon_scanner' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/scanner_barcode.svg'),
					'icon_edit_erro' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-edit-erro.svg'),
					'alert_erro' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/alert_erro.svg'),
					'card_one_erro' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-1-erro.svg'),
					'card_two_erro' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-2-erro.svg'),
					'card_one_success' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-1-success.svg'),
					'card_two_success' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/card-2-success.svg'),
					'card_icon_clean' => $this->assetRepo->getUrl('Aqbank_Aqpago::images/icons/icon-card-clean.svg'),
				]
            ]
        ];
	}
	
    /**
     * Create a file asset that's subject of fallback system
     *
     * @param string $fileId
     * @param array $params
     *
     * @return \Magento\Framework\View\Asset\File
     */
    public function createAsset($fileId, array $params = [])
    {
        $params = array_merge(['_secure' => $this->request->isSecure()], $params);
        return $this->assetRepo->createAsset($fileId, $params);
    }
}
