<?php

namespace Aqbank\Aqpago\Helper;

use Magento\Store\Model\ScopeInterface;


class Data extends \Magento\Framework\App\Helper\AbstractHelper
{
    protected $_storeManager;
    protected $serialize;
    protected $storesFactory;
    protected $assetRepo;
    protected $request;
	
    public function __construct(
    \Magento\Framework\App\Helper\Context $context,
    \Magento\Store\Model\StoreManagerInterface $storeManager,
    \Magento\Framework\Serialize\Serializer\Json $serialize)
    {
        $this->_storeManager = $storeManager;
        $this->serialize = $serialize;
        parent::__construct($context);
    }
	
    public function getStoreid()
    {
        return $this->_storeManager->getStore()->getId();
    }
	
    public function masc($val, $mask)
    {
        $maskared = '';
        $k = 0;
        for ($i = 0; $i <= strlen($mask) - 1; $i++) {
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
	
	public function monthNames($month)
	{
		$MonthNames 	= [];
		$MonthNames[1] 	= 'Jan';
		$MonthNames[2] 	= 'Fev';
		$MonthNames[3] 	= 'Mar';
		$MonthNames[4] 	= 'Abr';
		$MonthNames[5] 	= 'Mai';
		$MonthNames[6] 	= 'Jun';
		$MonthNames[7] 	= 'Jul';
		$MonthNames[8] 	= 'Ago';
		$MonthNames[9] 	= 'Set';
		$MonthNames[10] = 'Out';
		$MonthNames[11] = 'Nov';
		$MonthNames[12] = 'Dez'; 
		
		return $MonthNames[$month];
	}
	
	public function setFlag($flag)
	{
		$flagsImages = [
			'visa' 			=> 'Aqbank_Aqpago::images/visa.svg',
			'mastercard' 	=> 'Aqbank_Aqpago::images/mastercard.svg',
			'jcb' 			=> 'Aqbank_Aqpago::images/jcb.svg',
			'hipercard' 	=> 'Aqbank_Aqpago::images/hipercard.svg',
			'hiper' 		=> 'Aqbank_Aqpago::images/hiper.svg',
			'elo' 			=> 'Aqbank_Aqpago::images/elo.svg',
			'diners' 		=> 'Aqbank_Aqpago::images/diners.svg',
			'banescard' 	=> 'Aqbank_Aqpago::images/banescard.svg',
			'aura' 			=> 'Aqbank_Aqpago::images/aura.svg',
			'amex' 			=> 'Aqbank_Aqpago::images/amex.svg',
		];
		
		return $flagsImages[strtolower($flag)];
	}
	
	
    /**
    * Generate Barcode
    *
    * @param $value Código de barras em dígitos
    *
    * @throws InvalidArgumentException Gera exceção quando passa o valor do código de barras inválido
    */
    public function generate($value, $img_width = 415, $img_height = 58)
    {
        if (!$value) {
            throw new \InvalidArgumentException("Código de barras inválido", 1);
        }
       // if (strlen($value) !== 44) {
           // throw new \InvalidArgumentException("Código de barras inválido.", 1);
        //}

        $width_bar = 415;
        $height_bar = 58;
        $thin = 1;
        $wide = $this->getWide();
        $top = 0;
        $barcodes = $this->barcodes();

        $new_img = null;
        $img = imagecreatetruecolor($width_bar, $height_bar) or die('Cannot initialize new image stream');
        try {
            $cl_black = imagecolorallocate($img, 0, 0, 0);
            $cl_white = imagecolorallocate($img, 255, 255, 255);

            imagefilledrectangle($img, 0, 0, $width_bar, $height_bar, $cl_white);
            imagefilledrectangle($img, 5, $top, 5, $height_bar, $cl_black);
            imagefilledrectangle($img, 6, $top, 6, $height_bar, $cl_white);
            imagefilledrectangle($img, 7, $top, 7, $height_bar, $cl_black);
            imagefilledrectangle($img, 8, $top, 8, $height_bar, $cl_white);

            $pos = 9;
            $text = $value;
            while (strlen($text) > 0) {
                $i = round($this->JSK_left($text, 2));
                $text = $this->JSK_right($text, strlen($text)-2);
                $f = $barcodes[$i];

                for ($i = 1; $i < 11; $i += 2) {
                    if (substr($f, ($i-1), 1) == '0') {
                        $f1 = $thin;
                    } else {
                        $f1 = $wide;
                    }
                    imagefilledrectangle($img, $pos, $top, $pos - 1 + $f1, $height_bar, $cl_black);
                    $pos = $pos + $f1 ;

                    if (substr($f, $i, 1) == '0') {
                        $f2 = $thin;
                    }else{
                        $f2 = $wide;
                    }
                    imagefilledrectangle($img, $pos, $top, $pos-1+$f2, $height_bar, $cl_white);
                    $pos = $pos + $f2 ;
                }
            }
            imagefilledrectangle($img, $pos, $top, $pos-1+$wide, $height_bar, $cl_black);
            $pos = $pos + $wide;

            imagefilledrectangle($img, $pos, $top, $pos-1+$thin, $height_bar, $cl_white);
            $pos = $pos + $thin;

            imagefilledrectangle($img, $pos, $top, $pos-1+$thin, $height_bar, $cl_black);
            $pos = $pos + $thin;

            if (($img_width != $width_bar) || ($img_height != $height_bar)) {
                $img = imagescale($img, $img_width, $img_height);
            }
            ob_start();
            imagepng($img);
            $buffer = ob_get_clean();
            if (ob_get_contents()) ob_end_clean();
            return 'data:image/png;base64,' . base64_encode($buffer);
        } finally {
            imagedestroy($img);
        }
    }

    private function barcodes()
    {
        $barcodes = array(
            0 => '00110',
            1 => '10001',
            2 => '01001',
            3 => '11000',
            4 => '00101',
            5 => '10100',
            6 => '01100',
            7 => '00011',
            8 => '10010',
            9 => '01010');

        for ($f1 = 9; $f1 >= 0; $f1--) {
            for ($f2 = 9; $f2 >= 0; $f2--) {
                $f = ($f1 * 10) + $f2;
                $texto = '';
                for ($i = 1; $i < 6; $i++) {
                    $texto .= substr($barcodes[$f1], ($i - 1), 1) . substr($barcodes[$f2], ($i - 1), 1);
                }
                $barcodes[$f] = $texto;
            }
        }
        return $barcodes;
    }

    private function getWide()
    {
        $win32 = (array_key_exists('REMOTE_HOST', $_SERVER)) ? substr_count(strtoupper($_SERVER["SERVER_SOFTWARE"]), 'WIN32') : false;
        return ($win32) ? 2.72 : 3;
    }

    private function JSK_left($input, $comp)
    {
        return substr($input, 0, $comp);
    }

    private function JSK_right($input, $comp)
    {
        return substr($input, strlen($input) - $comp, $comp);
    }
}
