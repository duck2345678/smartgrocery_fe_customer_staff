# Staff Frontend (v2)

## Mục tiêu

- Thay thế hoàn toàn UI staff cũ bằng UI mới theo cấu trúc 5 tab: Trang chủ, Sản phẩm, Đơn hàng, Chấm công, Cá nhân.
- Chuẩn hoá loading/error/validation theo cùng một giọng điệu và hành vi.
- Tối ưu trải nghiệm trên mobile; chạy được trên web (Expo Web) để kiểm tra tương thích trình duyệt.

## Kiến trúc tổng quan

```mermaid
flowchart TD
  App[app/_layout.tsx\nProviders (SafeArea, React Query, Router)] --> Auth[app/(auth)\nLogin/Redirect]
  App --> Staff[app/(staff)\nTabs (5)]
  App --> Customer[app/(customer)\nCustomer routes]

  Staff --> Home[Trang chủ\napp/(staff)/index.tsx]
  Staff --> Products[Sản phẩm\napp/(staff)/products]
  Staff --> Orders[Đơn hàng\napp/(staff)/orders]
  Staff --> Attendance[Chấm công\napp/(staff)/attendance]
  Staff --> Profile[Cá nhân\napp/(staff)/profile]

  Products --> ProductApi[src/api/products.ts\n/products + /categories]
  Orders --> StaffOrdersApi[src/api/staffOrders.ts\n/staff/orders/*]
  Home --> StaffIssuesApi[src/api/staffIssues.ts\n/staff/issues/my]

  Home --> HomeStore[src/store/staffHomeStore.ts]
  Products --> ProductsStore[src/store/staffProductsStore.ts]
  Orders --> OrdersStore[src/store/staffOrdersStore.ts]
  Attendance --> AttendanceStore[src/store/staffAttendanceStore.ts\n(persist AsyncStorage)]
  Profile --> ProfileStore[src/store/staffProfileStore.ts\n(persist AsyncStorage)]
```

## Điều hướng (Navigation)

- 5 tab nằm trong [app/(staff)/_layout.tsx](file:///c:/Users/ACER/Documents/1/smartgrocery_fe_customer_staff/app/(staff)/_layout.tsx)
  - Trang chủ: `/(staff)`
  - Sản phẩm: `/(staff)/products`
  - Đơn hàng: `/(staff)/orders`
  - Chấm công: `/(staff)/attendance`
  - Cá nhân: `/(staff)/profile`

## State management

- Mỗi tab có store riêng (Zustand):
  - Trang chủ: `src/store/staffHomeStore.ts`
  - Sản phẩm: `src/store/staffProductsStore.ts`
  - Đơn hàng: `src/store/staffOrdersStore.ts`
  - Chấm công: `src/store/staffAttendanceStore.ts` (persist)
  - Cá nhân: `src/store/staffProfileStore.ts` (persist)

## API integration guide

### Base URL

- `EXPO_PUBLIC_API_URL` (ví dụ local Android emulator): `http://10.0.2.2:8080/api/v1`
- Cấu hình trong: [src/api/client.ts](file:///c:/Users/ACER/Documents/1/smartgrocery_fe_customer_staff/src/api/client.ts#L4)

### Endpoints đang dùng trong Staff v2

- Sản phẩm:
  - `GET /products` (query: `search`, `categoryId`, …)
  - `GET /products/{id}`
  - `GET /categories`
  - Client: [products.ts](file:///c:/Users/ACER/Documents/1/smartgrocery_fe_customer_staff/src/api/products.ts)

- Đơn hàng (staff):
  - `GET /staff/orders/queue`
  - `GET /staff/orders/my-active`
  - `POST /staff/orders/{orderId}/assign`
  - `POST /staff/orders/{orderId}/release`
  - `GET /staff/orders/{orderId}/pick-list`
  - Client: [staffOrders.ts](file:///c:/Users/ACER/Documents/1/smartgrocery_fe_customer_staff/src/api/staffOrders.ts)

- Sự cố (staff):
  - `GET /staff/issues/my`
  - Client: [staffIssues.ts](file:///c:/Users/ACER/Documents/1/smartgrocery_fe_customer_staff/src/api/staffIssues.ts)

### Chấm công

- Hiện tại chấm công được lưu local bằng AsyncStorage (phục vụ UI/UX + validation). Nếu backend có endpoint chấm công, có thể thay implementation bằng API mà không đổi UI.

## Testing

### Unit tests

```bash
npm run test
npm run test:coverage
```

- Coverage threshold đang đặt ở 80% cho phần Staff v2 + UI kit + staff stores (xem [vite.config.ts](file:///c:/Users/ACER/Documents/1/smartgrocery_fe_customer_staff/vite.config.ts)).

### Test report

- Report coverage nằm trong thư mục `coverage/` sau khi chạy `npm run test:coverage`.

## Performance notes

- Các màn Staff được tách theo route (Expo Router), tương đương lazy-loading theo module ở mức màn hình.
- Danh sách sản phẩm và đơn hàng ưu tiên render theo danh sách ngắn + UI gọn; có thể nâng lên FlashList/virtualization khi dữ liệu lớn.

## Cross-browser checklist (Expo Web)

- Chạy:

```bash
npm run web
```

- Kiểm tra tối thiểu:
  - Điều hướng 5 tab hoạt động đúng.
  - Products search + filter không bị lag khi gõ nhanh.
  - Orders queue có thể nhận đơn và mở chi tiết.
  - Attendance: validation giới hạn 200 ký tự và state lưu lại sau reload.

Ghi chú: Safari không thể tự động kiểm tra trên Windows. Khuyến nghị kiểm tra thủ công trên macOS/iOS hoặc qua BrowserStack.

## Deployment guide

### Staging/Production API

- Thiết lập biến môi trường `EXPO_PUBLIC_API_URL` tương ứng staging/prod.

### Web

- Chạy dev server: `npm run web`
- Build/export web: dùng Expo CLI (khuyến nghị `npm exec -- expo export -p web`).

### Mobile (staging/prod)

- Khuyến nghị dùng EAS Build cho staging/prod.
- Push notifications (Android remote) cần development build hoặc build thật (Expo Go không hỗ trợ đầy đủ theo SDK mới).
