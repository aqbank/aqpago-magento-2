
# Módulo de integração AQPago com Magento 2x

### Descrição
Integração com Magento 2x para utilizar o meio de pagamento AQPago.
Com o módulo instalado e configurado você pode oferecer os seguintes meios de pagamentos da AQPago:
- Pagamento com cartão de crédito.
- Pagamento múltiplo com dois cartões.
- Pagamento múltiplo com cartão e boleto.
- Pagamento com boleto.

### Requisitos
- Magento Community 2.3x até 2.4x
- [SDK] aqbank/api-v2 1x
- [Picqer] picqer/php-barcode-generator 1x
- [cURL]

## Instalação via composer
> Atenção! é receomendado que você faça um backup de sua loja antes de instalar o módulo .


```sh
composer require aqbank/aqpago-modulo-magento2

php bin/magento setup:upgrade

php bin/magento setup:di:compile

php bin/magento setup:static-content:deploy

```

### Configuração
> Atenção! Adquira seu token em https://aqbank.app menu Integrações -> Acesso ShopAQPago ou pelo APP AQPago Gestor.

- **Habilitado:** ativa o meio de pagamento AQPago para os compradores.
- **Ambiente:** especifica em qual ambiente as transações serão realizadas (produção ou sandbox).
- **Ativar Multi Pagamentos** Ativa pagar com 2 cartões e cartão + boleto.
- **Título:** título do pagamento que aparecerá para o comprador.
- **Documento do Lojista:** documento cadastrado no crediciamento da AQPago.
- **AQPAGO Token:** token adiquirido atráves https://aqbank.app menu Integrações -> Acesso ShopAQPago ou pelo APP AQPago Gestor.
> Atenção ao atualizar um token em https://aqbank.app ou pelo APP, o token antigo deixa de funcionar, lembre-se de atualizar a loja com o novo token gerado!
- **Nome na fatura:** nome que aparecerá na fatura do cliente (ainda não disponível alterar por https://aqbank.app ou pelo APP AQPago Gestor)
- **Número máximo de parcelas:** Quantidade Máxima permitida de parcelas.
- **Valor mínimo para parcelamento:** valor mínimo de cada parcela, deixa em branco para parcelas com qualquer valor.
- **Instruções no Boleto:** instruções que apareceram no boleto para o cliente.
- **Ordenação:** posição do pagamento no checkout com realação aos demais meios de pagamentos.

[aqpago]: <https://aqpago.com.br>
[SDK]: <https://github.com/aqbank/aqpago-sdk-api-v2>
[Picqer]: <https://github.com/picqer/php-barcode-generator>
[cURL]: <https://www.php.net/manual/en/book.curl.php>
