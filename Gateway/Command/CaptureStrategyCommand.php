<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Aqbank\Aqpago\Gateway\Command;

use Aqbank\Aqpago\Gateway\Helper\SubjectReader;
use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Sales\Api\TransactionRepositoryInterface;
use Magento\Payment\Gateway\Data\PaymentDataObjectInterface;
use Magento\Payment\Gateway\Command\CommandPoolInterface;
use Magento\Payment\Gateway\CommandInterface;

use Aqbank\Aqpago\Model\Adapter\AqpagoAdapterFactory;
use Aqbank\Aqpago\Model\Adapter\AqpagoSearchAdapter;

/**
 * Class CaptureStrategyCommand
 */
class CaptureStrategyCommand implements CommandInterface
{
    /**
     * Aqpago authorize and capture command
     */
    const SALE = 'sale';

    /**
     * Aqpago capture command
     */
    const CAPTURE = 'settlement';

    /**
     * @var CommandPoolInterface
     */
    private $commandPool;

    /**
     * @var TransactionRepositoryInterface
     */
    private $transactionRepository;

    /**
     * @var FilterBuilder
     */
    private $filterBuilder;

    /**
     * @var SearchCriteriaBuilder
     */
    private $searchCriteriaBuilder;

    /**
     * @var SubjectReader
     */
    private $subjectReader;

    /**
     * @var AqpagoAdapterFactory
     */
    private $aqpagoAdapterFactory;

    /**
     * @var aqpagoSearchAdapter
     */
    private $aqpagoSearchAdapter;

    /**
     * Constructor
     *
     * @param CommandPoolInterface $commandPool
     * @param TransactionRepositoryInterface $repository
     * @param FilterBuilder $filterBuilder
     * @param SearchCriteriaBuilder $searchCriteriaBuilder
     * @param SubjectReader $subjectReader
     * @param AqpagoAdapterFactory $aqpagoAdapterFactory ,
     * @param AqpagoSearchAdapter $aqpagoSearchAdapter
     */
    public function __construct(
        CommandPoolInterface $commandPool,
        TransactionRepositoryInterface $repository,
        FilterBuilder $filterBuilder,
        SearchCriteriaBuilder $searchCriteriaBuilder,
        SubjectReader $subjectReader,
        AqpagoAdapterFactory $aqpagoAdapterFactory,
        AqpagoSearchAdapter $aqpagoSearchAdapter
    )
    {
        $this->commandPool = $commandPool;
        $this->transactionRepository = $repository;
        $this->filterBuilder = $filterBuilder;
        $this->searchCriteriaBuilder = $searchCriteriaBuilder;
        $this->subjectReader = $subjectReader;
        $this->aqpagoAdapterFactory = $aqpagoAdapterFactory;
        $this->aqpagoSearchAdapter = $aqpagoSearchAdapter;
    }
	
    /**
     * @inheritdoc
     * @throws \Magento\Framework\Exception\NotFoundException
     */
    public function execute(array $commandSubject)
    {
        /** @var \Magento\Payment\Gateway\Data\PaymentDataObjectInterface $paymentDO */
        $paymentDO = $this->subjectReader->readPayment($commandSubject);

        $command = $this->getCommand($paymentDO);
		
		$logger = new \Monolog\Logger('aqpago');
		$logger->pushHandler(new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_strategy.log', \Monolog\Logger::DEBUG));
		$logger->info('Log response');
		$logger->info('command ' . $command);

        $this->commandPool->get($command)->execute($commandSubject);
    }

    /**
     * Get execution command name.
     *
     * @param PaymentDataObjectInterface $paymentDO
     * @return string
     */
    private function getCommand(PaymentDataObjectInterface $paymentDO)
    {
        $payment = $paymentDO->getPayment();

        if ($payment->getAdditionalInformation('Status') != 'ORDER_PAID') {
			return self::SALE;
        }
		
        return self::CAPTURE;
    }
}
