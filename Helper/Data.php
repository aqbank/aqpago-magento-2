<?php

namespace Aqbank\Aqpago\Helper;

use Magento\Store\Model\ScopeInterface;

class Data extends \Magento\Framework\App\Helper\AbstractHelper
{
    /**
     * @var _storeManager
     */
    protected $_storeManager;
    /**
     * @var serialize
     */
    protected $serialize;
    /**
     * @var storesFactory
     */
    protected $storesFactory;
    /**
     * @var assetRepo
     */
    protected $assetRepo;
    /**
     * @var request
     */
    protected $request;
    /**
     * @param \Magento\Framework\App\Helper\Context $context
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\Serialize\Serializer\Json $serialize
     */
    public function __construct(
        \Magento\Framework\App\Helper\Context $context,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\Serialize\Serializer\Json $serialize
    ) {
        $this->_storeManager = $storeManager;
        $this->serialize = $serialize;
        parent::__construct($context);
    }
    /**
     * Method getStoreid
     *
     * @return int
     */
    public function getStoreid()
    {
        return $this->_storeManager->getStore()->getId();
    }
    /**
     * Method masc
     *
     * @param string $val
     * @param string $mask
     * @return string
     */
    public function masc($val, $mask)
    {
        $maskared = '';
        $k = 0;
        $total = (strlen($mask)-1) ? (strlen($mask)-1) : 0;
        for ($i=0; $i<=$total; $i++) {
            if ($mask[$i] == '#') {
                if (isset($val[$k])) {
                    $maskared .= $val[$k++];
                }
            } else {
                if (isset($mask[$i])) {
                    $maskared .= $mask[$i];
                }
            }
        }
        return $maskared;
    }
    /**
     * Method monthNames
     *
     * @param string $month
     * @return string
     */
    public function monthNames($month)
    {
        $MonthNames     = [];
        $MonthNames[1]  = 'Jan';
        $MonthNames[2]  = 'Fev';
        $MonthNames[3]  = 'Mar';
        $MonthNames[4]  = 'Abr';
        $MonthNames[5]  = 'Mai';
        $MonthNames[6]  = 'Jun';
        $MonthNames[7]  = 'Jul';
        $MonthNames[8]  = 'Ago';
        $MonthNames[9]  = 'Set';
        $MonthNames[10] = 'Out';
        $MonthNames[11] = 'Nov';
        $MonthNames[12] = 'Dez';

        return $MonthNames[$month];
    }
    /**
     * Method setFlag
     *
     * @param string $flag
     * @return string
     */
    public function setFlag($flag)
    {
        $flagsImages = [
            'visa'          => 'Aqbank_Aqpago::images/visa.svg',
            'mastercard'    => 'Aqbank_Aqpago::images/mastercard.svg',
            'jcb'           => 'Aqbank_Aqpago::images/jcb.svg',
            'hipercard'     => 'Aqbank_Aqpago::images/hipercard.svg',
            'hiper'         => 'Aqbank_Aqpago::images/hiper.svg',
            'elo'           => 'Aqbank_Aqpago::images/elo.svg',
            'diners'        => 'Aqbank_Aqpago::images/diners.svg',
            'banescard'     => 'Aqbank_Aqpago::images/banescard.svg',
            'aura'          => 'Aqbank_Aqpago::images/aura.svg',
            'amex'          => 'Aqbank_Aqpago::images/amex.svg',
        ];
        
        return $flagsImages[strtolower($flag)];
    }
    /**
     * Method barcodes
     *
     * @return array
     */
    private function barcodes()
    {
        $barcodes = [
            0 => '00110',
            1 => '10001',
            2 => '01001',
            3 => '11000',
            4 => '00101',
            5 => '10100',
            6 => '01100',
            7 => '00011',
            8 => '10010',
            9 => '01010'
        ];
        for ($f1=9; $f1>=0; $f1--) {
            for ($f2=9; $f2>=0; $f2--) {
                $f = ($f1 * 10) + $f2;
                $texto = '';
                for ($i=1; $i<6; $i++) {
                    $texto .= substr($barcodes[$f1], ($i - 1), 1) . substr($barcodes[$f2], ($i - 1), 1);
                }
                $barcodes[$f] = $texto;
            }
        }
        return $barcodes;
    }
}
