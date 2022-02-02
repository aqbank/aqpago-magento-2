<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Request;

use Magento\Directory\Model\RegionFactory;
use Magento\Payment\Gateway\Request\BuilderInterface;
use Aqbank\Aqpago\Gateway\Helper\SubjectReader;


/**
 * Class AddressDataBuilder
 */
class SaleDataBuilder implements BuilderInterface
{

    const SALE = 'Sale';

    const ORDER_ID = 'orderId';

    /**
     * @var SubjectReader
     */
    private $subjectReader;

    /**
     * @var _cart
     */
    protected $_cart;
	
    /**
     * @var _customer
     */
    protected $_customer;	
	
    /**
     * @var _product
     */
    protected $_product;

	protected $regionFactory;
	
    /**
     * Constructor
     *
     * @param SubjectReader $subjectReader
     * @param \Magento\Checkout\Model\Cart $cart
     * @param \Magento\Customer\Api\CustomerRepositoryInterface $customerRepositoryInterface
     * @param \Magento\Catalog\Api\ProductRepositoryInterfaceFactory $productRepositoryFactory
     * @param RegionFactory $regionFactory
     */
    public function __construct(
		SubjectReader $subjectReader,
		\Magento\Checkout\Model\Cart $cart,
		\Magento\Customer\Api\CustomerRepositoryInterface $customerRepositoryInterface,
		\Magento\Catalog\Api\ProductRepositoryInterfaceFactory $productRepositoryFactory,
		RegionFactory $regionFactory
	)
    {

        $this->subjectReader = $subjectReader;
        $this->_cart = $cart;
		$this->_customer = $customerRepositoryInterface;
		$this->_product = $productRepositoryFactory;
		$this->regionFactory = $regionFactory;
    }

    /**
     * @inheritdoc
     */
    public function build(array $buildSubject)
    {
		$objectManager 	= \Magento\Framework\App\ObjectManager::getInstance();
		
        $paymentDO 	= $this->subjectReader->readPayment($buildSubject);
        $order 		= $paymentDO->getOrder();
        $result 	= [];
		
		$address 	= $this->_cart->getQuote()->getShippingAddress();
		$street  	= $address->getStreet();
		if($address->getLastname() == '-') $address->setLastname('');
		
		
		$vatId = preg_replace('/[^0-9]/', '', $address->getVatId());
		
		$objectManager = \Magento\Framework\App\ObjectManager::getInstance();
		$customerSession = $objectManager->get('Magento\Customer\Model\Session');
		if($customerSession->isLoggedIn()) {
			// customer login action
			$customer 	= $this->_customer->getById( $address->getCustomerId() );
			$vatId 		= preg_replace('/[^0-9]/', '', $customer->getTaxvat());
			
		}
		
		$address->setVatId($vatId);
		//$customer = $this->_customer->getById( $address->getCustomerId() );
		//$regionFactory 	= $objectManager->get('\Magento\Directory\Model\RegionFactory\RegionFactory');
		
		$region = $this->regionFactory->create()->load($address->getRegionId());
		//$region 		= $regionFactory->create()->load($address->getRegionId());
		
		$telephone 	= preg_replace("/[^0-9]/", "", $address->getTelephone());
		$phones   	= [];
		
		if($telephone) {
			if(strlen($telephone) == 10) {
				$ddd 	= substr($telephone, 0, 2);
				$phone 	= substr($telephone, 2, 8);
			}
			if(strlen($telephone) == 11) {
				$ddd 	= substr($telephone, 0, 2);
				$phone 	= substr($telephone, 2, 9);
			}
			else {
				$ddd 	= substr($telephone, 0, 2);
				$phone 	= substr($telephone, 2, (strlen($telephone) - 2));
			}
			
			$phones[] = [
				'area' 		=> $ddd,
				'number'	=> $phone
			];
		}
		
		$customer = [
			'name' 			=> trim($address->getFirstname() . ' ' . $address->getLastname()),
			'email' 		=> $address->getEmail(),
			'type' 			=> (strlen($address->getVatId()) == 11) ? 'F' : 'J',
			'tax_document' 	=> $address->getVatId(),
			'phones' 		=> $phones,
			'address' 		=> [
				'postcode' 		=> preg_replace("/[^0-9]/", "", $address->getPostcode()),
				'street' 		=> $street[0],
				'number' 		=> $street[1],
				'complement' 	=> (count($street) == 4) ? $street[2] : null,
				'district' 		=> (isset($street[3])) ? $street[3] : $street[2],
				'city' 			=> $address->getCity(),
				'state' 		=> $region->getCode(),
			],
		];	
		
		$spMethod = explode('_', $address->getShippingMethod());
		
		// 'aqenvios' 	=> ($spMethod[0] == 'aqenvios') ? true : false,
		// regra do aqenvios
		$shipping = [
			'aqenvios' 	=> false,
			'amount' 	=> $address->getShippingAmount(),
			'method' 	=> $address->getShippingMethod(),
		];
		
		$items 			= [];
		
		$helperImport 	= $objectManager->get('\Magento\Catalog\Helper\Image');
		$quoteItems 	= $this->_cart->getQuote()->getAllItems();
		
		
		$logger = new \Monolog\Logger('aqpago');
		$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_discount.log', \Monolog\Logger::DEBUG));		
		$logger->info('Log Discount');
		
		$priceItem = 0.00;
		foreach($quoteItems as $item) {
			$product = $this->_product->create()
							->getById($item->getProductId());
	
			$imageUrl = $helperImport->init($product, 'product_page_image_small')
							->setImageFile($product->getSmallImage()) // image,small_image,thumbnail
							->resize(380)
							->getUrl();
				

			
			if($item->getDiscountAmount() > 0){
				$logger->info('getDiscountAmount: ' . $item->getDiscountAmount());
				
				$discount 		= $item->getDiscountAmount();
				$totalItem 		= $item->getPrice() * $item->getQty();
				$totalWithDisc  = $totalItem - $discount;
				$priceItem  	= ($totalWithDisc / $item->getQty());
			}
			else if($item->getOriginalPrice() != $item->getPrice()){
				
				$logger->info('getOriginalPrice: ' . $item->getOriginalPrice());
				$logger->info('getPrice: ' . $item->getPrice());				
				
				$priceItem = $item->getOriginalPrice() - $item->getPrice();
				
			}
			else {
				$priceItem = $item->getPrice();
			}
			
			$logger->info('priceItem: ' . $priceItem);
			
			$items[] = [
				'name' 			=> $item->getName(),
				'qty' 			=> $item->getQty(),
				'unit_amount' 	=> $priceItem,
				'image' 		=> ($imageUrl) ? $imageUrl : null,
				'link'	 		=> $product->getProductUrl(),
			];
		}
		
        $result[self::SALE] = [
			self::ORDER_ID => $order->getOrderIncrementId(),
			'Customer' 	=> $customer,
			'Shipping' 	=> $shipping,
			'Items' 	=> $items,
        ];
		
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_saledata.log', \Monolog\Logger::DEBUG));
        $logger->info('Response ' .json_encode($result));
		
		
        return $result;
    }
}
