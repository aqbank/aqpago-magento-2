<?php

namespace Aqbank\Aqpago\Observer;

use Psr\Log\LoggerInterface;
use Magento\Framework\Event\ObserverInterface;
use Magento\Sales\Model\Order;
use Magento\Sales\Model\Order\Payment\Transaction\Builder;
use Magento\Sales\Model\Order\Payment\Transaction;
use Magento\Framework\DB\Transaction as DbTransaction;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Model\Service\InvoiceService;
use Magento\Sales\Model\Order\Email\Sender\InvoiceSender;
use Magento\Framework\Pricing\Helper\Data;

class OrderSaveAfter implements ObserverInterface
{
    /**
     * @var logger
     */
    protected $logger;
    /**
     * @var transactionBuilder
     */
    protected $transactionBuilder;
    /**
     * @var orderRepository
     */
    protected $orderRepository;
    /**
     * @var transaction
     */
    protected $transaction;
    /**
     * @var invoiceService
     */
    protected $invoiceService;
    /**
     * @var invoiceSender
     */
    protected $invoiceSender;
    /**
     * @var priceHelper
     */
    protected $priceHelper;

    /**
     * @param Builder $transactionBuilder
     * @param OrderRepositoryInterface $orderRepository
     * @param DbTransaction $dbTransaction
     * @param InvoiceService $invoiceService
     * @param InvoiceSender $invoiceSender
     * @param LoggerInterface $logger
     * @param Data $priceHelper
     */
    public function __construct(
        Builder $transactionBuilder,
        OrderRepositoryInterface $orderRepository,
        DbTransaction $dbTransaction,
        InvoiceService $invoiceService,
        InvoiceSender $invoiceSender,
        LoggerInterface $logger,
        Data $priceHelper
    ) {
        $this->orderRepository = $orderRepository;
        $this->transaction = $dbTransaction;
        $this->invoiceService = $invoiceService;
        $this->invoiceSender = $invoiceSender;
        $this->logger = $logger;
        $this->transactionBuilder = $transactionBuilder;
        $this->priceHelper = $priceHelper;
    }

    /**
     * Method execute
     *
     * @param \Magento\Framework\Event\Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $order          = $observer->getEvent()->getOrder();
        $payment        = $order->getPayment();
        $method         = $payment->getMethod();
        $paymentData    = $payment->getAdditionalInformation('Reponse');

        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(
            new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_observe.log', \Monolog\Logger::DEBUG)
        );
        $logger->info('Log Order');
        $logger->info('Log Order ' .$order->getId());
        $logger->info('Log getState ' .$order->getState());

        $message_response = [
            'ORDER_CREATE'              => 'order created.',
            'ORDER_WAITING'             => 'order waiting payment.',
            'ORDER_IN_ANALYSIS'         => 'order in analysis.',
            'ORDER_NOT_PAID'            => 'order not paid.',
            'ORDER_PAID'                => 'order paid.',
            'ORDER_PARTIAL_PAID'        => 'partially paid order.',
            'ORDER_CANCELED'            => 'order canceled.',
            'ORDER_REVERSED'            => 'order reversed.',
            'ORDER_PARTIAL_REVERSED'    => 'order partial reversed.',
            'ORDER_CHARGE_BACK'         => 'order with charge back.',
            'ORDER_DISPUTE'             => 'order in dispute.',
            'ORDER_FAILED'              => 'order failed.',
        ];
        
        if ($order->getState() == 'payment_review' && $method == 'aqpago') {
            $payments = $order->getPayment()->getAdditionalInformation('payments');
            $payments = json_decode($payments, true);
            
            if ($paymentData['status'] == 'ORDER_PARTIAL_PAID') {
                // create cancel
                $idTrans = $this->createTransaction(
                    $order,
                    $paymentData,
                    Transaction::TYPE_VOID,
                    'Void the amount of %1 online, payment partial pay.'
                );
                
                $order->setState(Order::STATE_HOLDED)
                        ->setStatus(Order::STATE_HOLDED);
                $order->save();
                
                $logger->info('ORDER_PARTIAL_PAID');
                $logger->info('Order status ' . Order::STATE_HOLDED);
            } else {
                if (isset($payments[0])) {
                    foreach ($payments as $k => $pay) {
                        if ($pay['type'] == 'ticket' && $pay['status'] == 'pending') {
                            $order->setState(Order::STATE_HOLDED)
                                ->setStatus(Order::STATE_HOLDED);
                            $order->save();
                        }
                    }
                }
            }
            
        } elseif ($order->getState() == 'processing' && $method == 'aqpago') {
            $logger->info('Order status processing');

            if ($paymentData && is_array($paymentData)) {
                $logger->info('paymentData: ' . json_encode($paymentData));
                if ($paymentData['status'] == 'ORDER_PAID') {
                    // create capture
                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_CAPTURE,
                        'Captured the amount of %1 online.'
                    );
                    $idinvoice = $this->createInvoice($order);
                    $logger->info('idinvoice: ' . $idinvoice);
                    $logger->info('ORDER_PAID');
                    $logger->info('Order status processing');
                } elseif ($paymentData['status'] == 'ORDER_IN_ANALYSIS') {
                    // create authorize
                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_AUTH,
                        'Authorized the amount of %1 online.'
                    );

                    $order->setState(Order::STATE_PAYMENT_REVIEW)
                        ->setStatus(Order::STATE_PAYMENT_REVIEW);
                    $order->save();
                    $logger->info('ORDER_IN_ANALYSIS');
                    $logger->info('Order status ' . Order::STATE_PAYMENT_REVIEW);
                } elseif ($paymentData['status'] == 'ORDER_WAITING') {
                    // create authorize
                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_AUTH,
                        'Waiting payment the amount of %1 in ticket.'
                    );

                    $order->setState(Order::STATE_HOLDED)
                        ->setStatus(Order::STATE_HOLDED);
                    $order->save();
                    $logger->info('ORDER_WAITING');
                    $logger->info('Order status ' . Order::STATE_HOLDED);
                } elseif ($paymentData['status'] == 'ORDER_CANCELED') {
                    // create cancel
                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_VOID,
                        'Canceled the amount of %1 online'
                    );

                    $order->setState(Order::STATE_CANCELED)
                        ->setStatus(Order::STATE_CANCELED);
                    $order->save();
                    $logger->info('ORDER_CANCELED');
                    $logger->info('Order status ' . Order::STATE_CANCELED);
                } elseif ($paymentData['status'] == 'ORDER_PARTIAL_PAID') {
                    // create cancel
                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_AUTH,
                        'Void the amount of %1 online, payment partial pay.'
                    );

                    $order->setState(Order::STATE_HOLDED)
                        ->setStatus(Order::STATE_HOLDED);
                    $order->save();
                    $logger->info('ORDER_PARTIAL_PAID');
                    $logger->info('Order status ' . Order::STATE_HOLDED);
                } elseif ($paymentData['status'] == 'ORDER_NOT_PAID') {
                    // create cancel
                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_VOID,
                        'Void the amount of %1 online, payment fail.'
                    );

                    $order->setState(Order::STATE_PENDING_PAYMENT)
                        ->setStatus(Order::STATE_PENDING_PAYMENT);
                    $order->save();
                    $logger->info('ORDER_NOT_PAID');
                    $logger->info('Order status ' . Order::STATE_PENDING_PAYMENT);
                } else {
                    if (isset($message_response[ $paymentData['status'] ])) {
                        $comment = $message_response[ $paymentData['status'] ];
                    } else {
                        $comment = '';
                    }

                    $idTrans = $this->createTransaction(
                        $order,
                        $paymentData,
                        Transaction::TYPE_VOID,
                        'The amount of %1 online, ' . $comment
                    );

                    $order->setState(Order::STATE_CANCELED)
                        ->setStatus(Order::STATE_CANCELED);
                    $order->save();
                    $logger->info($paymentData['status']);
                    $logger->info('Order status ' . Order::STATE_CANCELED);
                }
                
                $logger->info('idTrans: ' . $idTrans);
            }
        }
    }
    /**
     * Method createInvoice
     *
     * @param \Magento\Sales\Model\Order $order
     * @return void
     */
    private function createInvoice($order)
    {
        if ($order->canInvoice()) {
            $invoice = $this->invoiceService->prepareInvoice($order);
            $invoice->register();
            $invoice->save();

            $transactionSave = $this->transaction->addObject($invoice)
                                    ->addObject($invoice->getOrder());
            $transactionSave->save();
            $this->invoiceSender->send($invoice);
            //Send Invoice mail to customer
            $order->addStatusHistoryComment(
                __('Notified customer about invoice creation #%1.', $invoice->getId())
            )
            ->setIsCustomerNotified(true)
            ->save();

            return $invoice->getId();
        } else {
            // 'invoice already created'
            return;
        }
    }
    /**
     * Method createTransaction
     *
     * @param \Magento\Sales\Model\Order $order
     * @param array $paymentData
     * @param string $type
     * @param string $comment
     * @return string
     */
    private function createTransaction($order, $paymentData, $type, $comment)
    {
        try {
            $payment = $order->getPayment();
            $formatedPrice = $order->getBaseCurrency()->formatTxt($order->getGrandTotal());
            $_payments = [];
            $_payments['Order status'] = $paymentData['status'];
            $_payments['Order amount'] = $this->priceHelper->currency($paymentData['amount'], true, false);
            $_payments['Order type'] = $paymentData['type'];
            $_payments['Order description'] = $paymentData['description'];

            if (count($paymentData['payments'])) {
                $t = 1;
                foreach ($paymentData['payments'] as $k => $pay) {
                    $logger = new \Monolog\Logger('aqpago');
                    $logger->pushHandler(
                        new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_observe.log', \Monolog\Logger::DEBUG)
                    );
                    $logger->info('pay ' . json_encode($pay));
                    $pay = json_encode($pay);
                    $pay = json_decode($pay, true);

                    $_payments["{$t} Payment ID"] = (isset($pay['id'])) ?
                    $pay['id'] : null;
                    $_payments["{$t} Payment amount"] = (isset($pay['id'])) ?
                    $this->priceHelper->currency($pay['amount'], true, false) : null;
                    $_payments["{$t} Payment type"] = (isset($pay['type'])) ?
                    $pay['type'] : null;
                    $_payments["{$t} Payment status"] = (isset($pay['status'])) ?
                    $pay['status'] : null;
                    $_payments["{$t} Payment message"] = (isset($pay['message'])) ?
                    $pay['message'] : null;
                    $_payments["{$t} Payment created_at"] = (isset($pay['created_at']) &&
                    !empty($pay['created_at'])) ? date("d/m/Y H:i:s", strtotime($pay['created_at'])) : null;
                    $_payments["{$t} Payment date"] = (isset($pay['payment_date']) &&
                    !empty($pay['payment_date'])) ? date("d/m/Y H:i:s", strtotime($pay['payment_date'])) : null;

                    if (isset($pay['credit_card'])) {
                        $_payments["{$t} Payment installments"] = (isset($pay['installments'])) ?
                        $pay['installments'] : null;

                        if (isset($pay['credit_card']['first4_digits'])) {
                            $_credit_card  = $pay['credit_card']['first4_digits'];
                            $_credit_card .= ' XXXX XXXX XXXX ';
                            $_credit_card .= $pay['credit_card']['last4_digits'];
                            $_payments["{$t} Card"] = $_credit_card;
                        } else {
                            $_payments["{$t} Card"] = null;
                        }

                        if (isset($pay['credit_card']['flag'])) {
                            $_payments["{$t} Flag"] = $pay['credit_card']['flag'];
                        } else {
                            $_payments["{$t} Flag"] = null;
                        }
                        $_payments["{$t} Holder name"] = (isset($pay['credit_card']['holder_name'])) ?
                        $pay['credit_card']['holder_name'] : null;
                        $_payments["{$t} Expiration month"] = (isset($pay['credit_card']['expiration_month'])) ?
                        $pay['credit_card']['expiration_month'] : null;
                        $_payments["{$t} Expiration year"] = (isset($pay['credit_card']['expiration_year'])) ?
                        $pay['credit_card']['expiration_year'] : null;
                    }

                    $_payments["{$t} end"] = '-';
                    $t++;
                }
                
            }

            $transaction = $this->transactionBuilder->setPayment($payment)
                ->setOrder($order)
                ->setTransactionId($paymentData['id'])
                ->setAdditionalInformation([Transaction::RAW_DETAILS => $_payments])
                ->setFailSafe(true)
                ->build($type);

            // Add transaction to payment
            $payment->addTransactionCommentsToOrder($transaction, __($comment, $formatedPrice));
            $payment->setParentTransactionId($paymentData['id'] . '-' . $type);

            // Save payment, transaction and order
            $payment->save();
            $order->save();
            $transaction->save();
            return  $transaction->getTransactionId();
        } catch (Exception $e) {
            return $e->getMessage();
        }
    }
}
