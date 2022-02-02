<?php 

namespace Aqbank\Aqpago\Setup;

use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\InstallDataInterface;
use Magento\Eav\Setup\EavSetupFactory;


class InstallData implements InstallDataInterface
{
	private $eavSetupFactory;
	
	public function __construct(EavSetupFactory $eavSetupFactory) 
	{
		$this->eavSetupFactory = $eavSetupFactory;
	}
	
	public function install(ModuleDataSetupInterface $setup, ModuleContextInterface $context)
	{
		/* Add news */
		$eavSetup = $this->eavSetupFactory->create(['setup' => $setup]);
	}
}
