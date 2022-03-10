<?php
/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Gateway\Config;

class Config extends \Magento\Payment\Gateway\Config\Config
{
    public const KEY_ENVIRONMENT = 'environment';
    public const KEY_ACTIVE = 'active';
    public const KEY_PV = 'pv';
    public const KEY_TOKEN = 'token';
    public const KEY_SOFT_DESCRIPTOR = 'soft_descriptor';
    public const KEY_VERIFY_3DSECURE = 'verify_3dsecure';
    public const KEY_ENABLE_DEBIT = 'enable_debit';
    public const KEY_THRESHOLD_AMOUNT = 'threshold_amount';
    public const INSTALLMENTS = 'installments';
    public const NUMBER_INSTALLMENTS = 'number_installments';
    public const MIN_TOTAL_INSTALLMENTS = 'min_total_installments';
    public const KEY_MODULE = 'module';
    public const KEY_GATEWAY = 'gateway';
    public const VALUE_3DSECURE_ALL = 0;
    public const CODE_3DSECURE = 'three_d_secure';
    public const FRAUD_PROTECTION = 'fraudprotection';
    /**
     * Return the country specific card type config
     *
     * @return array
     */
    public function getInstallments()
    {
        $installments = \Magento\Framework\Serialize\SerializerInterface::unserialize(
            $this->getValue(self::INSTALLMENTS)
        );

        return is_array($installments) ? $installments : [];
    }
    
    /**
     * Return the country specific card type config
     *
     * @return float
     */
    public function getNumberInstallments()
    {
        return (double)$this->getValue(self::NUMBER_INSTALLMENTS);
    }

    /**
     * Return is3DSEnabled
     *
     * @return mixed
     */
    public function is3DSEnabled()
    {
        return (bool) $this->getValue(self::KEY_VERIFY_3DSECURE);
    }

    /**
     * Return isDebitEnabled
     *
     * @return boolean
     */
    public function isDebitEnabled()
    {
        return (bool) $this->getValue(self::KEY_ENABLE_DEBIT);
    }

    /**
     * Return the country specific card type config
     *
     * @return float
     */
    public function getMinTotalInstallments()
    {
        return (double)$this->getValue(self::MIN_TOTAL_INSTALLMENTS);
    }

    /**
     * Return getModule
     *
     * @return string
     */
    public function getModule()
    {
        return $this->getValue(Config::KEY_MODULE);
    }

    /**
     * Return getGateway
     *
     * @return string
     */
    public function getGateway()
    {
        return $this->getValue(Config::KEY_GATEWAY);
    }

    /**
     * Check if 3d secure verification enabled
     *
     * @return bool
     */
    public function isVerify3DSecure()
    {
        return (bool)$this->getValue(self::KEY_VERIFY_3DSECURE);
    }

    /**
     * Get threshold amount for 3d secure
     *
     * @return float
     */
    public function getThresholdAmount()
    {
        return (double)$this->getValue(self::KEY_THRESHOLD_AMOUNT);
    }

    /**
     * Return getSoftDescriptor
     *
     * @return string
     */
    public function getSoftDescriptor()
    {
        return $this->getValue(Config::KEY_SOFT_DESCRIPTOR);
    }

    /**
     * Return getEnvironment
     *
     * @return string
     */
    public function getEnvironment()
    {
        return $this->getValue(Config::KEY_ENVIRONMENT);
    }

    /**
     * Return getPv
     *
     * @return string
     */
    public function getPv()
    {
        return $this->getValue(Config::KEY_PV);
    }

    /**
     * Return getToken
     *
     * @return string
     */
    public function getToken()
    {
        return $this->getValue(Config::KEY_TOKEN);
    }

    /**
     * Return hasFraudProtection
     *
     * @return bool
     */
    public function hasFraudProtection()
    {
        return (bool)$this->getValue(Config::FRAUD_PROTECTION);
    }

    /**
     * Get Payment configuration status
     *
     * @return bool
     */
    public function isActive()
    {
        return (bool)$this->getValue(self::KEY_ACTIVE);
    }
    
    /**
     * Return getConfigValue
     *
     * @param string $key
     * @return string
     */
    public function getConfigValue($key)
    {
        return $this->getValue(Config::$key);
    }
    
    /**
     * Return getConfig
     *
     * @param string $key
     * @return string
     */
    public function getConfig($key)
    {
        return $this->getValue($key);
    }
}
