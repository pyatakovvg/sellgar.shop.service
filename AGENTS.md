# @service/shop

`sellgar.shop.service` - сервис магазинов и каналов продаж. Он отделен от `sellgar.store.service`, потому что один catalog product может продаваться в разных магазинах с разными ценами, остатками и публикацией.

## Граница

- Product service владеет catalog product/variant/property/image.
- Store service владеет sellable product/variant, ценой, остатками и резервами.
- Shop service владеет только магазинами/каналами и их настройками.

## Правила

- Не добавлять сюда product/store/cart/order логику.
- Текущая первая таблица сервиса - `shop`; она владеет `uuid`, `version`, `name`, `status`, `createdAt`, `updatedAt`.
- HTTP endpoints остаются в admin gateway, а этот сервис принимает RMQ-команды `shop.getAll`, `shop.getByUuid`, `shop.create`, `shop.update`.
- Не смешивать shop со складом. Если появится многоскладской учет, проектировать отдельную warehouse/inventory границу.

## Проверка

```bash
yarn --version
yarn build
```
