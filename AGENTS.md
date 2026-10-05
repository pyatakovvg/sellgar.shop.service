# @service/shop

`sellgar.shop.service` - сервис магазинов и каналов продаж. Он отделен от `sellgar.store.service`, потому что один catalog product может продаваться в разных магазинах с разными ценами, остатками и публикацией.

## Граница

- Product service владеет catalog product/variant/property/image.
- Store service владеет sellable product/variant, ценой, остатками и резервами.
- Shop service владеет магазинами/каналами, юридическими реквизитами, публичными контактами,
  адресами.

## Правила

- Не добавлять сюда product/store/cart/order логику.
- Схема изменяется только TypeORM migrations; `synchronize` всегда выключен.
- Изменение aggregate и запись integration event выполняются в одной транзакции через outbox.
- Магазин сам является продавцом. Не вводить отдельный seller aggregate без нового требования
  marketplace или независимого управления несколькими магазинами одним юридическим лицом.
- Валюта принадлежит ценам и коммерческим предложениям Store. Не добавлять валюту по умолчанию в Shop.
- Shop-owned collections заменяются одной versioned-командой `shop.update`; отдельный публичный
  CRUD для контактов и адресов не вводится.
- Способы оплаты принадлежат Store/checkout/payment-конфигурации и не хранятся в Shop.
- Домены витрины, способы доставки и документы не входят в модель Shop. Их владельцы и жизненный
  цикл должны проектироваться отдельно при появлении соответствующей задачи.
- HTTP endpoints остаются в admin gateway, сервис принимает RMQ-команды из README.
- Не смешивать shop со складом. Если появится многоскладской учет, проектировать отдельную warehouse/inventory границу.

## Проверка

```bash
yarn --version
yarn migration:show
yarn build
yarn test --runInBand
```
