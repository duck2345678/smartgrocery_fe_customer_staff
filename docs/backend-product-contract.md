# Product API Contract (Home)

This document defines the backend response contract required by the home page.

## 1) Product list endpoint

- **Endpoint:** `GET /api/v1/products`
- **Use cases:** daily products, discount products, shop list
- **Supported shape:** array, `{ items: [] }`, `{ content: [] }`, `{ data: ... }`

## 2) Required fields

Each product item should include:

- `id` (number)
- `name` (string)
- `image` (string, full URL preferred)
- `category` (object): `{ id, name }`
- `variants` (array, at least 1 variant):
  - `id` (number)
  - `unit` or `unit_name` (string)
  - `net_price` or `netPrice` (number)
  - `compare_at_price` or `compareAtPrice` (number, optional)
  - `stock` (number)
- `purchase_count` or `purchaseCount` (number, optional)

## 3) Discount calculation rule

Frontend considers a product as discounted only when:

- `compare_at_price > net_price`
- and `net_price > 0`

Then:

- `originalPrice = compare_at_price`
- `discountPercent = round((1 - net_price / compare_at_price) * 100)`

If the condition is not met, the item is treated as non-discounted.

## 4) Home page behavior

- `Giảm giá hot` section now uses backend data only.
- No frontend mock fallback is used.
- If backend returns zero discounted products, UI shows empty state text.

## 5) Naming recommendation (preferred)

Use snake_case from backend for consistency:

- `purchase_count`
- `compare_at_price`
- `net_price`
- `sold_count`
- `total_sold`
- `variant_name`
- `unit_name`

Frontend currently supports both snake_case and camelCase to avoid breakage during migration.
