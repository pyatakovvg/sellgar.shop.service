# @service/shop

`sellgar.shop.service` - сервис магазинов и каналов продаж. Он отделен от `sellgar.store.service`, потому что один catalog product может продаваться в разных магазинах с разными ценами, остатками и публикацией.

## Граница

- Product service владеет catalog product/variant/property/image.
- Store service владеет sellable product/variant, ценой, остатками и резервами.
- Shop service владеет только магазинами/каналами и их настройками.

## Правила

- Не добавлять сюда product/store/cart/order логику.
- Не переносить legacy `shop` из product service без проектирования нужной модели магазина.
- Перед добавлением таблиц зафиксировать, что такое shop/channel для Sellgar: магазин, склад, витрина или sales channel.

## Проверка

```bash
yarn --version
yarn build
```
