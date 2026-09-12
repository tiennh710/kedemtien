# Kẻ Đếm Tiền — Marketplace Excel

## Mục tiêu

Website cho phép admin upload và quản lý sản phẩm Excel `.xlsx`; khách hàng có thể tìm kiếm, lọc, thêm nhiều sản phẩm vào giỏ, thanh toán qua PayOS và nhận link tải bảo mật.

## Phạm vi đã triển khai

- Marketplace responsive tiếng Việt, phong cách xanh tím, có dữ liệu minh họa khi chưa có sản phẩm thật.
- Trang chi tiết sản phẩm, giỏ hàng, đăng nhập Google qua Supabase Auth, thư viện khách hàng và các trang trạng thái thanh toán.
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
- `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SESSION_SECRET`
- `ADMIN_EMAILS`

Trong Supabase Auth, bật nhà cung cấp Google và cho phép callback `/api/auth/callback` của cả local và production. Resend chỉ còn dùng để gửi link tải file sau khi đơn hàng hoàn tất.

## Kiểm thử trước khi mở bán

1. Đăng nhập Google bằng một email trong `ADMIN_EMAILS` và upload sản phẩm thật.
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
- Google OAuth, session cookie nội bộ và phân quyền admin dùng chung email tài khoản Google.
- `oxlint` và TypeScript `tsc --noEmit` đã chạy sạch; React/RSC đã được cập nhật lên bản vá `19.2.8`.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Để đăng nhập local, thêm `http://localhost:3000/api/auth/callback` vào danh sách Redirect URLs của Supabase Auth. Admin dùng tài khoản Google có email nằm trong `ADMIN_EMAILS`.

## Việc cần làm để mở bán thật

1. Khai báo URL staging/production trong `APP_ORIGIN` và giữ `ALLOW_INDEXING=0` cho tới khi website hoàn chỉnh.
2. Thêm thông tin PayOS, cấu hình webhook `/api/payos/webhook` và thực hiện một giao dịch thử giá trị nhỏ.
3. Tạo OAuth Client dạng Web trong Google Cloud; đặt callback của Google là URL `/auth/v1/callback` do trang Google Provider trong Supabase cung cấp.
4. Trong Supabase Auth URL Configuration, đặt Site URL là production và thêm `http://localhost:3000/api/auth/callback` cùng URL callback production vào Redirect URLs.
5. Xác minh tên miền gửi trên Resend rồi đặt `EMAIL_FROM` bằng địa chỉ thuộc tên miền đó; phần này chỉ phục vụ giao file qua email.
6. Thay `SESSION_SECRET` bằng chuỗi ngẫu nhiên dài tối thiểu 32 ký tự.
7. Đổi `ADMIN_EMAILS` sang email Google của admin, upload ít nhất một file `.xlsx` kèm ảnh preview và chạy lại checklist bên trên.

## Lưu ý phụ thuộc

`npm audit` vẫn báo advisory ở `vinext`, `vite`, `image-size` và một số công cụ Cloudflare dùng trong quá trình build/local. Bản sửa tự động hiện yêu cầu nâng ra ngoài dải phiên bản do bộ Sites sinh ra, nên không dùng `--force`. Không mở dev server ra Internet; trước production nên nâng toolchain Sites/Vinext khi bản tương thích chính thức có sẵn, rồi chạy lại build, lint và UAT.

## Giới hạn MVP

Chưa hỗ trợ `.xls`, `.xlsm`, ZIP, coupon, subscription, hóa đơn VAT, hoàn tiền tự động, render preview từ Excel hoặc đa ngôn ngữ.
