# Đăng ký Sổ Tiền

Từ màn hình **Đăng nhập**, chọn **Tạo tài khoản** để mở `/dang-ky` trên Web hoặc Android. Với email và mật khẩu, ứng dụng đưa người dùng về màn hình đăng nhập sau khi tạo tài khoản. Với Google, ứng dụng tạo tài khoản hoặc tìm tài khoản theo định danh Google đã liên kết, sau đó cấp phiên bằng luồng xác thực hiện có.

## Quy tắc đăng ký

- Email được kiểm tra định dạng, bỏ khoảng trắng đầu và cuối, rồi chuyển thành chữ thường. Mỗi email đã chuẩn hóa chỉ thuộc một tài khoản.
- Mật khẩu cần ít nhất 15 ký tự Unicode, tối đa 1.024 đơn vị mã UTF-16 và có ít nhất một ký tự khác khoảng trắng. Mật khẩu và xác nhận phải khớp chính xác. Client và API dùng chung quy tắc. API lưu bản băm Argon2id và bỏ trường xác nhận sau khi kiểm tra.
- API xác minh ID token và đối chiếu `nonce` của lượt xác thực Google. Để tạo mới, email trong token cần hợp lệ và có `email_verified` bằng `true`. Tài khoản Google được nhận diện bằng `sub`. Nếu một tài khoản Sổ Tiền đã dùng email đó nhưng chưa có định danh Google tương ứng, yêu cầu kết thúc với lỗi trùng email. Quy tắc này áp dụng cả khi Google đã xác minh email.
- Xác minh email cho tài khoản dùng mật khẩu và khôi phục mật khẩu là hai tính năng riêng. Hiện có thể dùng tài khoản mật khẩu ngay sau khi tạo.

## API

| Endpoint | Yêu cầu và kết quả |
| --- | --- |
| `POST /api/auth/register` | Nhận `email`, `password`, `passwordConfirmation` và `platform` (`web` hoặc `android`). Trả `201` với body rỗng khi tạo thành công. Web phải gửi `Origin` đã cấu hình. |
| `POST /api/auth/google/attempts` | Nhận thêm trường tùy chọn `intent` với giá trị `register` để cho phép tạo người dùng. Mặc định là `login`. Web yêu cầu thêm phạm vi `email` khi đăng ký. |
| `GET /api/auth/google/callback` | Dùng ý định lưu trong lượt xác thực để quyết định có tạo tài khoản hay không. Khi thành công, cấp cookie `HttpOnly` và chuyển về trang chính. Với lượt đăng ký hợp lệ đã được xác nhận bằng cookie và `state`, lỗi đưa người dùng về `/dang-ky`. |
| `POST /api/auth/google/login` | Android tiếp tục gửi `attempt` và `idToken`. API dùng ý định lưu trong lượt xác thực. Khi thành công, API cấp phiên với bearer token để ứng dụng lưu trong SecureStore. |

`POST /register` trả `400` cho dữ liệu sai, với mã `INVALID_EMAIL`, `INVALID_PASSWORD` hoặc `PASSWORD_MISMATCH` cho các trường tương ứng. Email đã tồn tại trả `409 EMAIL_ALREADY_REGISTERED`. Yêu cầu vượt giới hạn tần suất trả `429 RATE_LIMITED`. Với Google, email chưa được xác minh trả mã `GOOGLE_EMAIL_UNVERIFIED`.

## PostgreSQL và các tệp triển khai

Migration `20261116000100_enable_registration` chuẩn hóa email hiện có trong `users` và đặt ràng buộc để dữ liệu mới luôn được chuẩn hóa. Cùng với ràng buộc duy nhất đang có, PostgreSQL chặn việc tạo trùng kể cả khi nhiều yêu cầu đến đồng thời. Nếu hai email hiện có trùng sau khi chuẩn hóa, migration dừng trước khi cập nhật dữ liệu để chủ dự án xử lý các bản ghi đó. Migration thêm `oauth_attempts.is_registration` với giá trị mặc định `false`. ID người dùng và các quan hệ hiện có được giữ nguyên.

Khi đăng ký Google, Prisma tạo `users` và `auth_identities` trong cùng một thao tác. Nếu hai lượt cùng đăng ký một `sub`, lượt còn lại tra lại định danh của tài khoản vừa được tạo để tiếp tục đăng nhập.

| Tệp | Thay đổi |
| --- | --- |
| `packages/shared/src/auth.ts` | Schema đăng ký, ý định Google và mã lỗi dùng chung. |
| `apps/api/src/auth/routes.ts`, `password.ts`, `google.ts` trong cùng thư mục | Endpoint đăng ký, băm mật khẩu, xác minh và tạo tài khoản Google. |
| `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20261116000100_enable_registration/migration.sql` | Ý định OAuth và ràng buộc chuẩn hóa email. |
| `apps/client/src/app/_layout.tsx`, `dang-ky.tsx` trong cùng thư mục | Route đăng ký dành cho người chưa đăng nhập. |
| `apps/client/src/screens/register.tsx`, `login.tsx` trong cùng thư mục, `apps/client/src/components/native/auth-form.tsx` | Form đăng ký, liên kết điều hướng và bố cục dùng chung. |
| `apps/client/src/hooks/use-auth.ts`, `apps/client/src/services/auth-api.ts`, `auth-messages.ts`, `google-login.ts`, `google-login.web.ts` trong thư mục services | Gửi yêu cầu API, hiển thị lỗi và dùng lại phiên Google. |
| `apps/api/test/auth.test.mjs` | Kiểm thử đăng ký, trùng email, yêu cầu đồng thời và tích hợp phiên trên hai nền tảng. |

## Chạy và kiểm thử

1. Cấu hình PostgreSQL, API, Web và Google theo [hướng dẫn đăng nhập](dang-nhap.md). Chạy `pnpm --filter @so-tien/api db:migrate` trước khi chạy phiên bản API mới.
2. Áp dụng migration cho cơ sở dữ liệu kiểm thử riêng. Đặt `AUTH_TEST_DATABASE_URL` trỏ tới cơ sở dữ liệu đó và chạy `pnpm --filter @so-tien/api test`. Bộ kiểm thử dùng PostgreSQL thật và mô phỏng nhà cung cấp Google.
3. Chạy `pnpm build` và `pnpm build:android` để kiểm tra bản xuất Web và bundle Android.
4. Trên Web và bản Android có Google Play Services, mở **Đăng nhập** và chọn **Tạo tài khoản**. Thử email sai, mật khẩu quá ngắn, xác nhận sai và email trùng với chữ hoa khác nhau. Tạo một tài khoản hợp lệ, kiểm tra thông báo thành công rồi đăng nhập bằng tài khoản vừa tạo.
5. Chọn **Đăng ký bằng Google** với một email chưa tồn tại. Kiểm tra ứng dụng mở trang chính và khôi phục được phiên sau khi tải lại hoặc mở lại. Đăng xuất, dùng **Đăng nhập bằng Google** với cùng tài khoản, rồi thử hủy lượt chọn Google và thử đăng ký với email đã dùng cho tài khoản mật khẩu.
