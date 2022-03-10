<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Aqbank\Aqpago\Model\Adapter;

class AqpagoSearchAdapter
{
    /**
     * Method id
     *
     * @return TextNode
     */
    public function id()
    {
        return TransactionSearch::id();
    }

    /**
     * Method merchantAccountId
     *
     * @return MultipleValueNode
     */
    public function merchantAccountId()
    {
        return TransactionSearch::merchantAccountId();
    }

    /**
     * Method orderId
     *
     * @return TextNode
     */
    public function orderId()
    {
        return TransactionSearch::orderId();
    }

    /**
     * Method paypalPaymentId
     *
     * @return TextNode
     */
    public function paypalPaymentId()
    {
        return TransactionSearch::paypalPaymentId();
    }

    /**
     * Method createdUsing
     *
     * @return MultipleValueNode
     */
    public function createdUsing()
    {
        return TransactionSearch::createdUsing();
    }

    /**
     * Method type
     *
     * @return MultipleValueNode
     */
    public function type()
    {
        return TransactionSearch::type();
    }

    /**
     * Method createdAt
     *
     * @return RangeNode
     */
    public function createdAt()
    {
        return TransactionSearch::createdAt();
    }

    /**
     * Method amount
     *
     * @return RangeNode
     */
    public function amount()
    {
        return TransactionSearch::amount();
    }

    /**
     * Method status
     *
     * @return MultipleValueNode
     */
    public function status()
    {
        return TransactionSearch::status();
    }

    /**
     * Method settlementBatchId
     *
     * @return TextNode
     */
    public function settlementBatchId()
    {
        return TransactionSearch::settlementBatchId();
    }

    /**
     * Method paymentInstrumentType
     *
     * @return MultipleValueNode
     */
    public function paymentInstrumentType()
    {
        return TransactionSearch::paymentInstrumentType();
    }
}
