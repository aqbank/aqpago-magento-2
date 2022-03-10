<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Model\Adapter;

use Aqbank\Aqpago\Gateway\Config\Config;
use Magento\Framework\ObjectManagerInterface;

class AqpagoAdapterFactory
{
    /**
     * @var ObjectManagerInterface
     */
    private $objectManager;

    /**
     * @var Config
     */
    private $config;

    /**
     * @param ObjectManagerInterface $objectManager
     * @param Config $config
     */
    public function __construct(ObjectManagerInterface $objectManager, Config $config)
    {
        $this->config = $config;
        $this->objectManager = $objectManager;
    }

    /**
     * Method create
     *
     * @param int|null $storeId
     * @return mixed
     */
    public function create($storeId = null)
    {
        return $this->objectManager->create(
            AqpagoAdapter::class,
            [
                'config' => $this->config
            ]
        );
    }
}
