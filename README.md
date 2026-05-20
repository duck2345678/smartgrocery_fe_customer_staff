# 📱 SmartGrocery Mobile App (Customer & Staff)

Chào mừng bạn đến với **SmartGrocery Mobile App** – ứng dụng di động đa nhiệm tích hợp cả hai phân hệ chính dành cho **Khách hàng (Customer)** và **Nhân viên (Staff)**. Ứng dụng được xây dựng trên nền tảng **React Native / Expo** với hiệu suất vượt trội, giao diện chuyên nghiệp, mượt mà và tương thích tốt trên cả hai hệ điều hành Android & iOS.

---

## 🎨 1. Trải nghiệm người dùng cao cấp (Premium UX)
* **Giao diện tab hiện đại:** Phân chia luồng Khách hàng và Nhân viên thông minh thông qua cơ chế định tuyến (Routing) linh hoạt của Expo Router.
* **Optimistic UI:** Khi khách hàng hoặc nhân viên cập nhật ảnh đại diện mới, màn hình sẽ thay đổi ảnh ngay lập tức mà không có độ trễ, tự động phục hồi ảnh cũ nếu mạng lỗi.
* **Inline validation thời gian thực:** Kiểm tra biểu mẫu họ tên và số điện thoại Việt Nam trực tiếp khi người dùng đang nhập liệu, vô hiệu hóa nút Lưu nếu có lỗi để bảo vệ tính toàn vẹn dữ liệu.
* **Micro-animations & Phản hồi xúc giác (Haptic alerts):** Mang lại trải nghiệm chạm vuốt vô cùng cao cấp.

---

## 🌟 2. Tính năng chính theo phân hệ

### 👤 1. Phân hệ Khách hàng (Customer)
* **Xác thực:** Đăng ký, đăng nhập bảo mật cùng luồng khôi phục mật khẩu / xác thực mã OTP gửi qua Email.
* **Trợ lý AI chuyên sâu:** 
  * Gợi ý thực đơn món ăn cá nhân hóa dựa trên chỉ số BMI, chế độ ăn kiêng, mục tiêu dinh dưỡng và các món dị ứng của người dùng.
  * Tự động bóc tách thực đơn AI thành danh sách nguyên liệu mua sắm thực tế có sẵn tại cửa hàng.
  * Tặng mã Voucher mua sắm hấp dẫn trực tiếp khi đặt hàng theo thực đơn gợi ý của AI.
* **Mua sắm & Đơn hàng:** Lọc tìm kiếm sản phẩm tốc độ cao, quản lý giỏ hàng trực quan, thanh toán nhanh và theo dõi lịch sử đơn hàng chi tiết.

### 👥 2. Phân hệ Nhân viên (Staff)
* **Đăng ký ca & Điểm danh:** Quản lý ca làm linh hoạt, check-in và check-out thông minh bằng camera quét thẻ nội bộ.
* **Xử lý đơn hàng 3 bước chuyên nghiệp:** 
  * **Bước 1 (Nhận đơn):** Tiếp nhận đơn hàng khi đang trong ca trực.
  * **Bước 2 (Đóng gói):** Chuẩn bị nguyên liệu, cập nhật số lượng đóng gói và chụp ảnh hoàn tất.
  * **Bước 3 (Giao hàng):** Giao hàng cho khách hàng và hoàn thành quy trình khép kín.
* **Hiệu suất & Lương:** Xem biểu đồ KPI năng suất làm việc (theo ngày/tuần/tháng) và tra cứu bảng lương hàng tháng tự động.

---

## 🛠️ 3. Cấu hình & Khởi chạy

### Bước 1: Yêu cầu hệ thống
* Cài đặt **Node.js** phiên bản v18 hoặc v20.
* Tải xuống ứng dụng **Expo Go** trên điện thoại Android/iOS của bạn để chạy thử.

### Bước 2: Tạo tệp cấu hình `.env`
Tạo tệp `.env` tại thư mục gốc của phân hệ `smartgrocery_fe_customer_staff/`:

```properties
# Điền địa chỉ IP Wi-Fi nội bộ của máy tính đang chạy Backend Spring Boot (cổng 8080)
# LƯU Ý: Không được dùng localhost hoặc 127.0.0.1 vì điện thoại thật quét QR sẽ không kết nối được.
EXPO_PUBLIC_API_URL=http://<IP_MÁY_TÍNH_CỦA_BẠN>:8080/api/v1
```

### Bước 3: Khởi chạy ứng dụng
1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   npm install
   ```
2. **Khởi chạy Metro Bundler (Expo):**
   ```bash
   npx expo start -c
   ```
   * *Quét mã QR:* Sử dụng camera (iPhone) hoặc app Expo Go (Android) quét mã QR hiển thị trên màn hình terminal của bạn để mở và trải nghiệm ứng dụng di động ngay lập tức!

---

## 📁 4. Cấu trúc thư mục ứng dụng
```text
smartgrocery_fe_customer_staff/
├── app/
│   ├── (auth)/        # Luồng xác thực đăng nhập, đăng ký, quên mật khẩu
│   ├── (customer)/    # Toàn bộ giao diện tab, giỏ hàng, AI và thanh toán của Khách hàng
│   ├── (staff)/       # Giao diện chấm công, danh sách đơn hàng, hiệu suất và lương của Nhân viên
│   └── _layout.tsx    # Cấu hình định tuyến gốc toàn ứng dụng
├── src/
│   ├── api/           # Các module gọi REST API kết nối Backend (ai, auth, orders, staff, v.v.)
│   ├── components/    # Các UI components tái sử dụng (Button, Card, Input, FlashSaleTimer...)
│   ├── hooks/         # Các custom React Hooks xử lý giỏ hàng, thanh toán, validation lỗi
│   ├── store/         # Quản lý trạng thái ứng dụng bằng Zustand (auth, giỏ hàng, điểm danh...)
│   └── utils/         # Hàm tiện ích định dạng, xử lý ảnh đại diện, kiểm tra Device Fingerprint
└── package.json       # Định nghĩa thư viện và script khởi chạy dự án
```
