# Đăng nhập Sổ Tiền

Tính năng hỗ trợ tài khoản đã có trong PostgreSQL. Người dùng có thể đăng nhập bằng email và mật khẩu hoặc bằng tài khoản Google đã liên kết, sau đó đăng xuất trong **Cài đặt**.

## Chạy cục bộ

1. Tạo một cơ sở dữ liệu PostgreSQL cho dự án. Sao chép `apps/api/.env.example` thành `apps/api/.env` và điền `DATABASE_URL`. Sao chép `apps/client/.env.example` thành `apps/client/.env`.
2. Cài gói, áp dụng migration và biên dịch API từ thư mục gốc.

   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter @so-tien/api db:migrate
   pnpm --filter @so-tien/api build
   ```

3. Với cơ sở dữ liệu phát triển, đặt `AUTH_FIXTURE_EMAIL` và `AUTH_FIXTURE_PASSWORD` trong môi trường của lệnh rồi chạy `pnpm --filter @so-tien/api user:fixture`. Để tạo tài khoản thử nghiệm có Google, đặt thêm `AUTH_FIXTURE_GOOGLE_SUB` bằng `sub` lấy từ ID token đã được xác minh của tài khoản thử. Có thể bỏ mật khẩu nếu tài khoản thử chỉ dùng Google. Lệnh tạo bản ghi mới và báo lỗi nếu email hoặc định danh Google đã tồn tại.
4. Chạy `pnpm --filter @so-tien/api start` trong một terminal và `pnpm web` trong terminal khác. Mở `http://localhost:8081` để dùng mặc định. Nếu cổng Web thay đổi, cập nhật `WEB_ORIGIN` và khởi động lại API. Dùng cùng tên máy chủ cho Web và API cục bộ để trình duyệt gửi cookie.
5. Để thử Android trên trình giả lập có Google Play Services, thiết lập Android SDK và JDK rồi chạy `pnpm --dir apps/client exec expo run:android`. Bản development build tích hợp Credential Manager. Giả lập truy cập API qua `10.0.2.2`. Khi dùng thiết bị thật, đặt địa chỉ API mà thiết bị truy cập được và cấu hình `HOST` của API tương ứng. Bản phân phối Android yêu cầu HTTPS.

## Thiết lập Google

Trong Google Cloud Console, cấu hình màn hình đồng ý và thêm tài khoản kiểm thử nếu ứng dụng đang ở chế độ Testing.

- **Web.** Tạo OAuth client loại Web application. Đăng ký đúng callback `http://localhost:3001/api/auth/google/callback` khi phát triển, và URI HTTPS của môi trường triển khai. Đặt `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và `GOOGLE_REDIRECT_URI` trong cấu hình API.
- **Android.** Tạo OAuth client loại Android với package `vn.sotien.app` và SHA-1 của khóa dùng để ký bản cài đặt. Cấu hình trong cùng dự án Google Cloud với OAuth client Web. API trả về Web client ID để Android yêu cầu ID token có đúng đối tượng nhận.

Google client secret và URL kết nối PostgreSQL chỉ đặt ở API. Các biến `EXPO_PUBLIC_*` được đưa vào bundle.

[Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) · [Thiết lập Google trên Expo](https://docs.expo.dev/guides/google-authentication/)

## API và dữ liệu

| Endpoint | Yêu cầu và kết quả |
| --- | --- |
| `POST /api/auth/login` | Nhận `email`, `password`, `platform`. Trả người dùng và hạn phiên, cùng cookie Web hoặc bearer token Android. |
| `POST /api/auth/google/attempts` | Nhận `platform`. Trả URL chuyển hướng cho Web hoặc `attempt`, `nonce`, `clientId` cho Android. |
| `GET /api/auth/google/callback` | Nhận `state` và `code` hoặc `error`. Đối chiếu cookie của trình duyệt, đổi mã, xác minh ID token, cấp phiên và chuyển về Web. |
| `POST /api/auth/google/login` | Nhận `attempt` và `idToken` từ Android. Trả thông tin phiên và bearer token sau khi xác minh. |
| `GET /api/auth/session` | Trả `user` và `expiresAt` cho phiên hợp lệ. Trả `401` khi thiếu phiên hoặc phiên mất hiệu lực. |
| `POST /api/auth/logout` | Thu hồi phiên hiện tại và trả `204`. Web xóa cookie, Android xóa token khỏi SecureStore. Có thể thử lại nếu mất kết nối. |

Prisma ánh xạ `users` cho email chuẩn hóa và bản băm Argon2id, `auth_identities` cho định danh Google `sub`, `auth_sessions` cho phiên và `oauth_attempts` cho thử thách Google. Backend tra cứu người dùng qua `sub` đã liên kết. Mỗi thử thách có hạn 5 phút và được tiêu thụ nguyên tử trong PostgreSQL. Web dùng PKCE, `state` gắn với cookie trình duyệt và `nonce`. Android dùng Credential Manager và cùng cơ chế xác minh `nonce` ở backend.

Phiên của Sổ Tiền có hạn tuyệt đối 7 ngày. PostgreSQL lưu SHA-256 của token ngẫu nhiên, mốc hết hạn và mốc thu hồi. Web dùng cookie `HttpOnly`, `SameSite=Strict`, thêm `Secure` trên HTTPS và kiểm tra `Origin` cho các thao tác xác thực thay đổi trạng thái. Android gửi bearer token qua HTTPS và lưu trong SecureStore. Expo Router mở nhóm route nội bộ sau khi tải được phiên hợp lệ. Các trang tài chính hiện lấy dữ liệu mẫu từ `mockFinanceRepository`.

## Kiểm thử và triển khai

Áp dụng migration lên một cơ sở dữ liệu kiểm thử riêng và đặt `AUTH_TEST_DATABASE_URL` trỏ tới đó. Chạy `pnpm --filter @so-tien/api test` để kiểm tra mật khẩu, giới hạn tần suất, phiên bị thu hồi hoặc hết hạn, và luồng Google với nhà cung cấp giả lập. Chạy `pnpm build` để kiểm tra TypeScript và xuất Web, `pnpm build:android` để xuất bundle Android.

Trên trình duyệt và Android, thử đăng nhập email hợp lệ, email chưa tồn tại, mật khẩu sai, Google đã liên kết, Google chưa liên kết và hủy trình chọn Google. Tải lại Web hoặc đóng rồi mở Android để kiểm tra khôi phục phiên. Đăng xuất và xác nhận lần truy cập phiên cũ trả `401`. Thử mở trực tiếp một URL nội bộ khi chưa đăng nhập và kiểm tra điều hướng giữa các màn hình tài chính sau khi đăng nhập.

Khi triển khai Web, phục vụ thư mục `apps/client/dist` và chuyển tiếp `/api/auth/*` tới API trên cùng origin HTTPS. Để trống `EXPO_PUBLIC_WEB_API_URL` khi xuất bản cùng origin. Đặt `NODE_ENV=production` và cấu hình `WEB_ORIGIN` tương ứng ở API. Nếu API chạy sau proxy, đặt `TRUST_PROXY_HOPS` theo số lớp proxy tin cậy và bảo đảm proxy ghi đè các header chuyển tiếp. Giới hạn tần suất hiện lưu theo IP trong từng tiến trình API. Tránh ghi query string của callback Google hoặc các header và body có thông tin xác thực vào log.
