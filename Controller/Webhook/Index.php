<?php

namespace Aqbank\Aqpago\Controller\Webhook;

use Magento\Framework\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Framework\App\Action\Action;
use Magento\Sales\Model\Order;
use Magento\Sales\Model\Order\Payment\Transaction\Builder;
use Magento\Sales\Model\Order\Payment\Transaction;
use Magento\Sales\Model\Service\InvoiceService;
use Magento\Sales\Model\Order\Email\Sender\InvoiceSender;
use Magento\Framework\DB\Transaction as DbTransaction;
use Magento\Framework\Pricing\Helper\Data;
use Magento\Framework\App\Request\InvalidRequestException;
use Magento\Framework\App\RequestInterface;
use Aqbank\Aqpago\Gateway\Config\Config;
use Aqbank\Aqpago\Model\Adminhtml\Source\Environment;
use Aqbank\Apiv2\SellerAqpago;
use Aqbank\Apiv2\Aqpago\Request\AqpagoEnvironment;
use Aqbank\Apiv2\Aqpago\Aqpago;
use Aqbank\Apiv2\Aqpago\Request\Exceptions\AqpagoRequestException;

class Index extends \Magento\Framework\App\Action\Action implements \Magento\Framework\App\CsrfAwareActionInterface
{
    /**
     * @var $config
     */
    private $config;
    /**
     * @var $taxDocument
     */
    private $taxDocument;
    /**
     * @var $token
     */
    private $token;
    /**
     * @var $environment
     */
    private $environment;
    /**
     * @var $resultPageFactory
     */
    protected $resultPageFactory;
    /**
     * @var $_order
     */
    protected $_order;
    /**
     * @var \Magento\Sales\Api\Data\OrderInterfaceFactory $order
     */
    protected $orderFactory;
    /**
     * @var $transactionBuilder
     */
    protected $transactionBuilder;
    /**
     * @var $transaction
     */
    protected $transaction;
    /**
     * @var $invoiceService
     */
    protected $invoiceService;
    /**
     * @var $invoiceSender
     */
    protected $invoiceSender;
    /**
     * @var $priceHelper
     */
    protected $priceHelper;
    /**
     * @param Context $context
     * @param Config $config
     * @param \Magento\Sales\Api\Data\OrderInterface $order
     * @param \Magento\Sales\Api\Data\OrderInterfaceFactory $orderFactory
     * @param Builder $transactionBuilder
     * @param DbTransaction $dbTransaction
     * @param InvoiceService $invoiceService
     * @param InvoiceSender $invoiceSender
     * @param Data $priceHelper
     * @param PageFactory $resultPageFactory
     */
    public function __construct(
        Context $context,
        Config $config,
        \Magento\Sales\Api\Data\OrderInterface $order,
        \Magento\Sales\Api\Data\OrderInterfaceFactory $orderFactory,
        Builder $transactionBuilder,
        DbTransaction $dbTransaction,
        InvoiceService $invoiceService,
        InvoiceSender $invoiceSender,
        Data $priceHelper,
        PageFactory $resultPageFactory
    ) {
        parent::__construct($context);
        $this->config = $config;
        $this->resultPageFactory = $resultPageFactory;
        $this->orderFactory = $orderFactory;
        $this->_order = $order;
        $this->transaction = $dbTransaction;
        $this->invoiceService = $invoiceService;
        $this->invoiceSender = $invoiceSender;
        $this->transactionBuilder = $transactionBuilder;
        $this->priceHelper = $priceHelper;
        $this->taxDocument = preg_match("/^[0-9]+$/", $this->config->getConfig('tax_document'));
        $this->token = $this->config->getConfig('token');
        $this->environment = $this->config->getConfig('environment');
    }

    /**
     * Method execute
     */
    public function execute()
    {
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(
            new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_webhook.log', \Monolog\Logger::DEBUG)
        );
        $content = $this->getRequest()->getContent();
        $post = json_decode($content, true);
        $logger->info('content: ' . $content);
        $logger->info('post: ' . json_encode($post));

        if (isset($post['order_id'])) {
            $environment = $this->environment;
            $environment = AqpagoEnvironment::$environment();
            $sellerAqpago = new SellerAqpago($this->taxDocument, $this->token, 'modulo magento 2');
            $aqpagoconsult = (new Aqpago($sellerAqpago, $environment))->getOrder($post['order_id']);
            $response = json_decode($aqpagoconsult->jsonSerialize(), true);

            if (isset($response['success']) && $response['success']) {
                $reference_id = $response['order']['reference_id'];
                $order = $this->orderFactory->create()->loadByIncrementId($reference_id);
                if ($order->getId()) {
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

                    $payment = $order->getPayment();
                    $payment->setAdditionalInformation(
                        'Reponse',
                        $response['order']
                    );
                    $payment->setAdditionalInformation(
                        'payments',
                        json_encode($response['order']['payments'])
                    );
                    $payment->save();
                    $paymentData = $payment->getAdditionalInformation('Reponse');

                    try {
                        /** Ordem Paga criar fatura se não existir e cadastrar transação de captura, status processando **/
                        if ($response['order']['status'] == 'ORDER_PAID') {
                            $logger->info('Order status ORDER_PAID');
                            $logger->info('paymentData: ' . json_encode($paymentData));
                            $idTrans = $this->createTransaction(
                                $order,
                                $paymentData,
                                Transaction::TYPE_CAPTURE,
                                'Captured the amount of %1 online.'
                            );
                            $idinvoice = $this->createInvoice($order);
                            $order->setState(Order::STATE_PROCESSING)
                                        ->setStatus(Order::STATE_PROCESSING);
                            $order->save();
                            $logger->info('create invoice');
                            $logger->info('ORDER_PAID');
                            $logger->info('Order status processing');
                        } elseif ($response['order']['status'] == 'ORDER_IN_ANALYSIS') {
                            /** Ordem em analise cadastrar transação de autorização, status pagamento em analise **/
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
                        } elseif ($response['order']['status'] == 'ORDER_WAITING') {
                            /** Ordem em espera cadastrar transação de autorização, status em espera **/
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
                        } elseif ($response['order']['status'] == 'ORDER_PARTIAL_PAID') {
                            /** Ordem paga parcialmente cadastrar transação de autorização, status pagamento em espera **/
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
                        } elseif ($response['order']['status'] == 'ORDER_CANCELED') {
                            /** Ordem cancelada cadastrar transação de cancelamento, status pagamento cancelado **/
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
                        } elseif ($response['order']['status'] == 'ORDER_NOT_PAID') {
                            /** Ordem não paga cadastrar transação de cancelamento, status pagamento pendente **/
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
                        } elseif ($response['order']['status'] == 'ORDER_REVERSED' ||
                            $response['order']['status'] == 'ORDER_CHARGE_BACK' ||
                            $response['order']['status'] == 'ORDER_DISPUTE' ||
                            $response['order']['status'] == 'ORDER_FAILED'
                        ) {
                            /** Estorno, Disputa, falha ou chargeBack status cancelado **/
                            $comment = (isset($message_response[ $paymentData['status'] ])) ?
                            $message_response[ $paymentData['status'] ] : '';
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
                    } catch (Exception $e) {

                        $this->getResponse()
                            ->setHeader('Content-Type', 'application/json', true);
                        $this->getResponse()
                            ->setBody(json_encode([
                                'fail'=>'falha ao atualizar',
                                'reference_id' => $reference_id
                            ]));
                        $this->getResponse()->setHttpResponseCode(400);
                        return;
                    }
                } else {
                    
                    $this->getResponse()
                        ->setHeader(
                            'Content-Type',
                            'application/json',
                            true
                        );
                    $this->getResponse()
                        ->setBody(json_encode([
                            'order' => 'Reference ID not found',
                            'message' => $e->getMessage()
                        ]));
                    $this->getResponse()->setHttpResponseCode(400);
                    return ;
                }
            } else {
                $this->getResponse()
                    ->setHeader(
                        'Content-Type',
                        'application/json',
                        true
                    );
                $this->getResponse()
                    ->setBody(json_encode([
                        'order_id' => 'not found in api',
                        'response' => $response
                    ]));
                $this->getResponse()->setHttpResponseCode(400);
                return ;
            }
        } else {
            $this->getResponse()
                ->setHeader(
                    'Content-Type',
                    'application/json',
                    true
                );
            $this->getResponse()
                ->setBody(json_encode([
                    'order_id' => 'not found',
                    'post' => $post
                ]));
            $this->getResponse()->setHttpResponseCode(400);

            return ;
        }

        $this->getResponse()
            ->setHeader(
                'Content-Type',
                'application/json',
                true
            );
        $this->getResponse()
            ->setBody(json_encode([
                'update' => 'success'
            ]));
        $this->getResponse()->setHttpResponseCode(200);
    }
    /**
     * Create exception in case CSRF validation failed.
     *
     * @param RequestInterface $request
     * @return InvalidRequestException|null
     */
    public function createCsrfValidationException(
        RequestInterface $request
    ): ?InvalidRequestException {
        return null;
    }
    /**
     * Perform custom request validation.
     *
     * @param RequestInterface $request
     * @return bool|null
     */
    public function validateForCsrf(RequestInterface $request): ?bool
    {
        return true;
    }
    /**
     * Method createInvoice.
     *
     * @param Order $order
     */
    private function createInvoice($order)
    {
        if ($order->canInvoice()) {
            $invoice = $this->invoiceService->prepareInvoice($order);
            $invoice->register();
            $invoice->save();
            $transactionSave = $this->transaction->addObject(
                $invoice
            )->addObject(
                $invoice->getOrder()
            );
            $transactionSave->save();
            $this->invoiceSender->send($invoice);
            $order->addStatusHistoryComment(
                __('Notified customer about invoice creation #%1.', $invoice->getId())
            )
            ->setIsCustomerNotified(true)
            ->save();

            return $invoice->getId();
        } else {
            // invoice already created
            return;
        }
    }

    /**
     * Method createTransaction.
     *
     * @param Order $order
     * @param array $paymentData
     * @param string $type
     * @param string $comment
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
                    !empty($pay['created_at'])) ?
                    date("d/m/Y H:i:s", strtotime($pay['created_at'])) : null;
                    $_payments["{$t} Payment date"] = (isset($pay['payment_date']) &&
                    !empty($pay['payment_date'])) ?
                    date("d/m/Y H:i:s", strtotime($pay['payment_date'])) : null;

                    if (isset($pay['credit_card'])) {
                        $_credit_card = $pay['credit_card']['first4_digits'];
                        $_credit_card = ' XXXX XXXX XXXX ';
                        $_credit_card = $pay['credit_card']['last4_digits'];

                        $_payments["{$t} Payment installments"] = (isset($pay['installments'])) ?
                        $pay['installments'] : null;
                        $_payments["{$t} Card"] = (isset($pay['credit_card']['first4_digits'])) ?
                        $_credit_card : null;
                        $_payments["{$t} Flag"] = (isset($pay['credit_card']['flag'])) ?
                        $pay['credit_card']['flag'] : null;
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

            $payment->addTransactionCommentsToOrder($transaction, __($comment, $formatedPrice));
            $payment->setParentTransactionId($paymentData['id'] . '-' . $type);
            $payment->save();
            $order->save();
            $transaction->save();

            return $transaction->getTransactionId();
        } catch (Exception $e) {
            return $e->getMessage();
        }
    }
}
