# Kẻ Đếm Tiền — Marketplace Excel

## Mục tiêu

Website cho phép admin upload và quản lý sản phẩm Excel `.xlsx`; khách hàng có thể tìm kiếm, lọc, thêm nhiều sản phẩm vào giỏ, thanh toán qua PayOS và nhận link tải bảo mật.

## Phạm vi đã triển khai

- Marketplace responsive tiếng Việt, phong cách xanh tím, có dữ liệu minh họa khi chưa có sản phẩm thật.
- Trang chi tiết sản phẩm, giỏ hàng, đăng nhập OTP, thư viện khách hàng và các trang trạng thái thanh toán.
- Trang admin để upload `.xlsx` và ảnh preview, tạo/sửa/ẩn sản phẩm, thay phiên bản file, xem đơn hàng và gửi lại email.
- D1 lưu metadata, tài khoản, session, đơn hàng và quyền tải; R2 lưu file Excel và ảnh ở chế độ private.
- Sản phẩm miễn phí được giao qua email mà không cần OTP. Sản phẩm trả phí tạo PayOS checkout và chỉ giao sau webhook hợp lệ.
- Link khách vãng lai có hiệu lực 7 ngày và tối đa 5 lượt tải; tài khoản có thể tạo link một lần từ thư viện.
- Bản nháp Điều khoản, Riêng tư, Bản quyền và Hoàn tiền.

## Cấu hình cần có trước staging thật

Sao chép `.env.example` thành `.env` cho local hoặc khai báo secrets trên môi trường Sites:

- `APP_ORIGIN`
- `ALLOW_INDEXING=0` cho staging; chỉ đổi thành `1` khi production đã sẵn sàng được tìm kiếm.
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `SESSION_SECRET`, `OTP_HMAC_SECRET`
- `ADMIN_EMAILS`

`ALLOW_DEV_OTP=1` chỉ dùng local. Production phải đặt bằng `0` hoặc bỏ biến này.

## Kiểm thử trước khi mở bán

1. Đăng nhập bằng một email trong `ADMIN_EMAILS` và upload sản phẩm thật.
2. Kiểm tra sản phẩm draft không xuất hiện công khai; published xuất hiện và có thể thêm vào giỏ.
3. Kiểm tra đơn miễn phí gửi email và tải file được.
4. Cấu hình webhook PayOS tới `/api/payos/webhook`, thực hiện một giao dịch giá trị nhỏ và xác nhận đơn chuyển sang `paid`.
5. Xác minh email Resend, link tải 7 ngày và chức năng tải lại trong tài khoản.
6. Duyệt lại nội dung pháp lý trước khi công bố production.

## Kết quả xác minh hiện tại

- Migration D1 đã được sinh trong thư mục `drizzle/`.
- Build production bằng `npm run build` đã thành công.
- Các trang marketplace, chi tiết, giỏ hàng, đăng nhập, tài khoản, admin, pháp lý và trạng thái thanh toán đều trả về đúng.
- Trang không tồn tại và token tải sai trả về `404`.
- OTP local, session cookie, phân quyền admin và các trường hợp input không hợp lệ đã được kiểm thử.
- `oxlint` và TypeScript `tsc --noEmit` đã chạy sạch; React/RSC đã được cập nhật lên bản vá `19.2.8`.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Với cấu hình local hiện tại, admin dùng email nằm trong `ADMIN_EMAILS`; mã OTP phát triển được trả về từ API để giao diện tự hiển thị khi `ALLOW_DEV_OTP=1`.

## Việc cần làm để mở bán thật

1. Khai báo URL staging/production trong `APP_ORIGIN` và giữ `ALLOW_INDEXING=0` cho tới khi website hoàn chỉnh.
2. Thêm thông tin PayOS, cấu hình webhook `/api/payos/webhook` và thực hiện một giao dịch thử giá trị nhỏ.
3. Xác minh tên miền gửi trên Resend rồi đặt `EMAIL_FROM` bằng địa chỉ thuộc tên miền đó.
4. Thay `SESSION_SECRET` và `OTP_HMAC_SECRET` bằng chuỗi ngẫu nhiên dài tối thiểu 32 ký tự.
5. Đổi `ADMIN_EMAILS` sang email admin thật, upload ít nhất một file `.xlsx` kèm ảnh preview và chạy lại checklist bên trên.

## Lưu ý phụ thuộc

`npm audit` vẫn báo advisory ở `vinext`, `vite`, `image-size` và một số công cụ Cloudflare dùng trong quá trình build/local. Bản sửa tự động hiện yêu cầu nâng ra ngoài dải phiên bản do bộ Sites sinh ra, nên không dùng `--force`. Không mở dev server ra Internet; trước production nên nâng toolchain Sites/Vinext khi bản tương thích chính thức có sẵn, rồi chạy lại build, lint và UAT.

## Giới hạn MVP

Chưa hỗ trợ `.xls`, `.xlsm`, ZIP, coupon, subscription, hóa đơn VAT, hoàn tiền tự động, render preview từ Excel hoặc đa ngôn ngữ.
