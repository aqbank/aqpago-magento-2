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
use Aqbank\Aqpago\Model\Cards;
use \Magento\Framework\App\Config\ScopeConfigInterface;

class ConfigProvider implements ConfigProviderInterface
{
    public const CODE = 'aqpago';
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
     * @var Cards
     */
    protected $_cards;
    /**
     * @var Cards
     */
    protected $scopeConfig;
    
    /**
     * Constructor
     *
     * @param Aqbank\Aqpago\Gateway\Config\Config $config
     * @param Magento\Framework\View\Asset\Repository $assetRepo
     * @param Magento\Framework\Locale\ResolverInterface $localeResolver
     * @param Magento\Framework\View\Asset\Source $assetSource
     * @param Magento\Framework\UrlInterface $urlInterface
     * @param Aqbank\Aqpago\Model\Cards $cards
     * @param Magento\Framework\App\RequestInterface $request
     * @param Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     */
    public function __construct(
        Config $config,
        Repository $assetRepo,
        ResolverInterface $localeResolver,
        Source $assetSource,
        UrlInterface $urlInterface,
        Cards $cards,
        RequestInterface $request,
        ScopeConfigInterface $scopeConfig
    ) {
        $this->config = $config;
        $this->assetRepo = $assetRepo;
        $this->localeResolver = $localeResolver;
        $this->assetSource = $assetSource;
        $this->_urlInterface = $urlInterface;
        $this->request = $request;
        $this->_cards = $cards;
        $this->scopeConfig = $scopeConfig;
    }
    /**
     * Retrieve assoc array of checkout configuration
     *
     * @return array
     */
    public function getConfig()
    {
        $savedCards = [];
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $customerSession = $objectManager->get(Magento\Customer\Model\Session::class);
        if ($customerSession->isLoggedIn()) {
            $logger = new \Monolog\Logger('aqpago');
            $logger->pushHandler(
                new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_card.log', \Monolog\Logger::DEBUG)
            );
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
            $logger->info('count ' . $cardsCollection->count());
            $totalSavedCards = $cardsCollection->count();

            if ($totalSavedCards) {
                foreach ($cardsCollection as $savedCard) {
                    $fourFirst  = substr($savedCard->getNumberCard(), 0, 4);
                    $fourLast   = substr($savedCard->getNumberCard(), -4, 4);
                    $key        = $fourFirst . $fourLast;

                    $savedCards[$key] = [
                        'card_id'       => $savedCard->getAqpagoId(),
                        'flag'          => strtolower($savedCard->getFlag()),
                        'four_first'    => $fourFirst,
                        'four_last'     => $fourLast,
                    ];
                }
            } else {
                $savedCards = 'false';
                $totalSavedCards = 0;
            }
        } else {
            $savedCards = 'false';
            $totalSavedCards = 0;
        }

        $storeScope     = \Magento\Store\Model\ScopeInterface::SCOPE_STORE;
        $document_input = $this->scopeConfig->getValue('payment/aqpago/document_input', $storeScope);
        $phone_input    = $this->scopeConfig->getValue('payment/aqpago/phone_input', $storeScope);

        $visa_white = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/flags/visa_white.svg');
        $visa = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/visa.svg');
        $background_card_front = $this->assetRepo
                                    ->getUrl('Aqbank_Aqpago::images/card/background-card-front.svg');
        $card_back = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/card-back.svg');
        $card_back = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/flags/visa.svg');
        $mastercard = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/flags/mastercard.svg');
        $jcb = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/flags/jcb.svg');
        $hipercard = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/flags/hipercard.svg');
        $hiper = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/flags/hiper.svg');
        $elo = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/flags/elo.svg');
        $diners = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/flags/diners.svg');
        $banescard = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/flags/banescard.svg');
        $aura = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/flags/aura.svg');
        $amex = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/flags/amex.svg');
        $money = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/money.svg');
        $aqpago_logo = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/aqpago-logo.png');
        $icon_pix_40 = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-pix-40.png');
        $icon_pix_white = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-pix-white.svg');
        $icon_barcode_40 = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/icon-barcode-40.png');
        $icon_card_12 = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-card-12.svg');
        $icon_card_white = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/icon-card-white.svg');
        $load = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/load.svg');
        $icon_cvv = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/icons/icon_cvv.svg');
        $icon_bar_code_white = $this->assetRepo
                                    ->getUrl('Aqbank_Aqpago::images/icons/icon-bar-code-white.svg');
        $icon_tool_tip = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-tool-tip.svg');
        $arrow_right = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/arrow-right.svg');
        $two_cards = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/icons/two-cards.svg');
        $credit_ticket = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/credit-ticket.svg');
        $card_1 = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/card-1.svg');
        $card_2 = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/card-2.svg');
        $min_cc = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/icons/min-cc.svg');
        $icon_relogio = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-relogio.svg');
        $icon_email = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-email.svg');
        $icon_phone = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/icons/icon-phone.svg');
        $icon_edit = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/icons/icon-edit.svg');
        $icon_postcode = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-postcode.svg');
        $icon_arrow_down = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/icon-arrow-down.svg');
        $icon_input_check = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/icon-input-check.svg');
        $card_layout = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/card-layout.svg');
        $linha_pontilhada = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/linha-pontilhada.svg');
        $icon_alert = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/icons/icon-alert.svg');
        $icon_copy = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/icons/icon-copy.svg');
        $scanner_barcode = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/scanner_barcode.svg');
        $icon_edit_erro = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/icon-edit-erro.svg');
        $alert_erro = $this->assetRepo
                        ->getUrl('Aqbank_Aqpago::images/alert_erro.svg');
        $card_1_erro = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/card-1-erro.svg');
        $card_2_erro = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/card-2-erro.svg');
        $card_1_success = $this->assetRepo
                    ->getUrl('Aqbank_Aqpago::images/card-1-success.svg');
        $card_2_success = $this->assetRepo
                            ->getUrl('Aqbank_Aqpago::images/card-2-success.svg');
        $icon_card_clean = $this->assetRepo
                                ->getUrl('Aqbank_Aqpago::images/icons/icon-card-clean.svg');

        return [
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
                    'aqpago' => $visa_white,
                    'aqpago_off' => $visa,
                    'aqpago_card_front' => $background_card_front,
                    'aqpago_card_back' => $card_back,
                    'flag_visa_default' => $visa,
                    'flag_visa' => $visa_white,
                    'flag_mastercard' => $mastercard,
                    'flag_jcb' => $jcb,
                    'flag_hipercard' => $hipercard,
                    'flag_hiper' => $hiper,
                    'flag_elo' => $elo,
                    'flag_diners' => $diners,
                    'flag_banescard' => $banescard,
                    'flag_aura' => $aura,
                    'flag_american_express' => $amex,
                    'aqpago_money' => $money,
                    'aqpago_logo' => $aqpago_logo,
                    'icon_pix' => $icon_pix_40,
                    'icon_pix_white' => $icon_pix_white,
                    'icon_barcode' => $icon_barcode_40,
                    'icon_credcard' => $icon_card_12,
                    'icon_card_white' => $icon_card_white,
                    'icon_load' => $load,
                    'icon_cvv' => $icon_cvv,
                    'icon_barcode_white' => $icon_bar_code_white,
                    'icon_tooltip' => $icon_tool_tip,
                    'arrow_right' => $arrow_right,
                    'icon_twocards' => $two_cards,
                    'credit_ticket' => $credit_ticket,
                    'card_one' => $card_1,
                    'card_two' => $card_2,
                    'min_cc' => $min_cc,
                    'icon_relogio' => $icon_relogio,
                    'icon_email' => $icon_email,
                    'icon_phone' => $icon_phone,
                    'icon_edit' => $icon_edit,
                    'address_postcode' => $icon_postcode,
                    'icon_arrow_down' => $icon_arrow_down,
                    'icon_check' => $icon_input_check,
                    'card_layout' => $card_layout,
                    'line_dashed' => $linha_pontilhada,
                    'icon_alert' => $icon_alert,
                    'icon_copy' => $icon_copy,
                    'icon_scanner' => $scanner_barcode,
                    'icon_edit_erro' => $icon_edit_erro,
                    'alert_erro' => $alert_erro,
                    'card_one_erro' => $card_1_erro,
                    'card_two_erro' => $card_2_erro,
                    'card_one_success' => $card_1_success,
                    'card_two_success' => $card_2_success,
                    'card_icon_clean' => $icon_card_clean,
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
