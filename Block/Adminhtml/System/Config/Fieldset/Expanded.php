<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Block\Adminhtml\System\Config\Fieldset;

use Magento\Framework\Data\Form\Element\AbstractElement;

class Expanded extends \Magento\Config\Block\System\Config\Form\Fieldset
{
    /**
     * Whether is collapsed by default
     *
     * @var bool
     */
    protected $isCollapsedDefault = true;
}
