<?php

namespace Aqbank\Aqpago\Setup;

use Magento\Framework\Setup\UpgradeSchemaInterface;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\SchemaSetupInterface;

class UpgradeSchema implements UpgradeSchemaInterface
{
    /**
     * {@inheritdoc}
     */
    public function upgrade(SchemaSetupInterface $setup, ModuleContextInterface $context) {
        $installer = $setup;
        $installer->startSetup();
		
		if (!$installer->tableExists('aqbank_aqpago_cards')) {
			/**
			 * Create table 'aqbank_aqpago_cards'
			 */
			$table = $installer->getConnection()->newTable(
				$installer->getTable('aqbank_aqpago_cards')
			)->addColumn(
				'entity_id',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true],
				'Primary key'
			)->addColumn(
				'customer_id',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true],
				'customer Id'
			)->addColumn(
				'aqpago_id',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				255,
				['nullable' => true],
				'public card id aqpago'
			)->addColumn(
				'payment_id',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'payment id'
			)->addColumn(
				'surname_card',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'surname card'
			)->addColumn(
				'name_card',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'Name card'
			)->addColumn(
				'valid_month',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true],
				'validate Month'
			)->addColumn(
				'valid_year',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true],
				'validate Year'
			)->addColumn(
				'number_card',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				30,
				['nullable' => true],
				'Number Card'
			)->addColumn(
				'flag',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				30,
				['nullable' => true],
				'Number Card'
			)->addColumn(
				'is_active',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true, 'default' => 0],
				'active card'
			)->addColumn(
				'is_confirm',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true, 'default' => 0],
				'confirmed card'
			)->addColumn(
				'expired',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => false, 'default' => 0],
				'expired card'
			)->addColumn(
				'confirm_price',
				\Magento\Framework\DB\Ddl\Table::TYPE_DECIMAL,
				'10,2',
				['nullable' => true],
				'Value send costumer confirm'
			)->addColumn(
				'ip_create',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				50,
				['nullable' => true],
				'ip create'
			)->addColumn(
				'ip_confirm',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				50,
				['nullable' => true],
				'ip confirm'
			)->addColumn(
				'create_at',
				\Magento\Framework\DB\Ddl\Table::TYPE_TIMESTAMP,
				null,
				['nullable' => false, 'default' => \Magento\Framework\DB\Ddl\Table::TIMESTAMP_INIT],
				'Created At'
			)->addColumn(
				'confirm_at',
				\Magento\Framework\DB\Ddl\Table::TYPE_TIMESTAMP,
				null,
				['nullable' => true],
				'Confirm At'
			)->addIndex(
				$installer->getIdxName(
					'aqbank_aqpago_cards',
					['customer_id', 'number_card'],
					\Magento\Framework\DB\Adapter\AdapterInterface::INDEX_TYPE_INDEX
				),
				['customer_id', 'number_card'],
				['type' => \Magento\Framework\DB\Adapter\AdapterInterface::INDEX_TYPE_INDEX]
			)->setComment(
				'Aqbank Aqpago Cards Save'
			);
			$installer->getConnection()->createTable($table);
		}
		
		if (!$installer->tableExists('aqbank_aqpago_cards_address')) {
			/**
			 * Create table 'aqbank_aqpago_cards_address'
			 */
			$table = $installer->getConnection()->newTable(
				$installer->getTable('aqbank_aqpago_cards_address')
			)->addColumn(
				'entity_id',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true],
				'Primary key'
			)->addColumn(
				'customer_id',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true],
				'customer Id'
			)->addColumn(
				'postcode',
				\Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
				null,
				['nullable' => true],
				'Postcode card'
			)->addColumn(
				'address',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'address card'
			)->addColumn(
				'number',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				30,
				['nullable' => true],
				'number card'
			)->addColumn(
				'complement',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'complement address card'
			)->addColumn(
				'district',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'district card'
			)->addColumn(
				'city',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				100,
				['nullable' => true],
				'city card'
			)->addColumn(
				'state',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				50,
				['nullable' => true],
				'state card'
			)->addColumn(
				'ip_create',
				\Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
				50,
				['nullable' => true],
				'ip create'
			)->addColumn(
				'create_at',
				\Magento\Framework\DB\Ddl\Table::TYPE_TIMESTAMP,
				null,
				['nullable' => false, 'default' => \Magento\Framework\DB\Ddl\Table::TIMESTAMP_INIT],
				'Created At'
			)->addForeignKey(
				  $installer->getFkName('aqbank_aqpago_cards_address', 'entity_id', 'aqbank_aqpago_cards', 'entity_id'),
				  'entity_id',
				  $installer->getTable('aqbank_aqpago_cards'),
				  'entity_id',
				  \Magento\Framework\DB\Ddl\Table::ACTION_CASCADE
			)->setComment(
				'Aqbank Aqpago Address Cards Save'
			);
			
			$installer->getConnection()->createTable($table);
		}
		
		$installer->endSetup();
	}
}
