<?php

namespace Aqbank\Aqpago\Controller\Ajax;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;

class Order extends Action
{
    /**
     * @var orderRepository
     */
    protected $orderRepository;
    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Sales\Api\OrderRepositoryInterface $orderRepository
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Sales\Api\OrderRepositoryInterface $orderRepository,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
    ) {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
        $this->orderRepository = $orderRepository;
    }
    /**
     * Method execute
     */
    public function execute()
    {
        $logger = new \Monolog\Logger('aqpago');
        $logger->pushHandler(
            new \Monolog\Handler\StreamHandler(BP . '/var/log/aqpago_consult.log', \Monolog\Logger::DEBUG)
        );
        $logger->info('Log Order');
        $result = $this->resultJsonFactory->create();

        if ($this->getRequest()->isAjax()) {
            $data = $this->getRequest()->getPost();

            if (!isset($data['orderId'])) {
                return $result->setData(['success' => 'false', 'message' => 'order Id not send!']);
            }

            if (isset($data['orderId']['success'])) {
                $text = "";
                if (is_array($data['orderId']['message'])) {
                    foreach ($data['orderId']['message'] as $k => $message) {
                        if (is_array($message)) {
                            $text .= $this->processMessage($message);
                        } else {
                            $text .= __($k . ' ' . $message);
                        }
                    }
                }

                $response = [
                    'success' => false,
                    'message' => $text,
                ];
                
                return $result->setData($response);
            }

            $logger->info('orderId ' . $data['orderId']);
            $order = $this->orderRepository->get($data['orderId']);
            $payment = $order->getPayment();
            $aqpagoResponse = $payment->getAdditionalInformation('Reponse');
            $objResponse = $payment->getAdditionalInformation("Reponse");

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

            if (isset($message_response[ $objResponse['status'] ])) {
                $status = __($message_response[ $objResponse['status'] ]);
            } else {
                $status = $objResponse['status'];
            }
            $logger->info('orderId ' . json_encode($aqpagoResponse));
            $logger->info('status ' . $status);

            if ($aqpagoResponse && is_array($aqpagoResponse)) {
                foreach ($aqpagoResponse['payments'] as $k => $pay) {
                    $aqpagoResponse['payments'][$k]['message'] = __($pay['message']);
                }

                $aqpagoResponse['order_increment'] = $order->getIncrementId();
                $aqpagoResponse['pay'] = false;
                if ($aqpagoResponse['status'] == 'ORDER_PAID' ||
                    $aqpagoResponse['status'] == 'ORDER_IN_ANALYSIS' ||
                    $aqpagoResponse['status'] == 'ORDER_WAITING'
                ) {
                    $aqpagoResponse['pay'] = true;
                }

                if ($aqpagoResponse['type'] == 'multi_ticket' && $aqpagoResponse['status'] == 'ORDER_PARTIAL_PAID') {
                    $aqpagoResponse['pay'] = true;
                }

                $aqpagoResponse['order_status'] = $status;
                return $result->setData([
                    'success' => 'true',
                    'response' => $aqpagoResponse
                ]);
            } else {
                return $result->setData([
                    'success' => 'false',
                    'message' => 'payment data erro!'
                ]);
            }
        } else {
            return $result->setData([
                'success' => 'false',
                'message' => 'Invalid method request!'
            ]);
        }
    }
    /**
     * Method processMessage
     *
     * @param array $message
     * @return string
     */
    public function processMessage($message)
    {
        $text = '';
        foreach ($message as $field => $erro) {
            if (is_array($message)) {
                foreach ($erro as $ps => $txt) {
                    if (is_array($txt)) {
                        foreach ($txt as $p => $tx) {
                            $text .= __($ps . ': ' . json_encode($tx));
                        }
                    } else {
                        $text .= __($ps . ': ' . $txt);
                    }
                }
            } else {
                $text .= __($field . ' ' . $erro);
            }
        }
        
        return $text;
    }
}
