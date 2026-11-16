# Sổ Tiền

Ứng dụng quản lý tài chính cá nhân cho đồ án tốt nghiệp. Sổ Tiền dùng chung giao diện React Native + TypeScript cho Android và trình duyệt, với Expo Router, NativeWind và React Native Web. Giao diện hiển thị tiếng Việt và dùng đơn vị VND.

## Chạy dự án

Yêu cầu pnpm 11.10.0 và Node.js 22.13+ trong dòng 22, 24.3+ trong dòng 24, hoặc Node.js 25 trở lên. Chạy các lệnh sau từ thư mục gốc của repository.

```bash
pnpm install
pnpm web
```

Mở địa chỉ Metro in trong terminal. Để chạy trên Android, dùng `pnpm start` và quét mã QR bằng Expo Go hỗ trợ SDK 57. Khi đã mở giả lập Android, dùng `pnpm android`.

| Lệnh | Kết quả |
| --- | --- |
| `pnpm typecheck` | Kiểm tra TypeScript |
| `pnpm build` | Xuất bản web tĩnh vào `apps/client/dist/` |
| `pnpm --dir apps/client exec expo serve dist` | Xem bản web đã xuất |
| `pnpm build:android` | Kiểm tra đóng gói Metro và xuất bundle Hermes vào `apps/client/dist-android/` |

Để biên dịch và cài ứng dụng Android trực tiếp, dùng `pnpm --dir apps/client exec expo run:android` với Android SDK và JDK đã thiết lập.

## Các trang

| Trang | Nội dung |
| --- | --- |
| Tổng quan | Tổng số dư, thu chi theo kỳ, biểu đồ dòng tiền, mức sử dụng ngân sách và giao dịch gần đây |
| Giao dịch | Bảng trên desktop, danh sách trên điện thoại và bố cục danh sách–chi tiết khi cửa sổ đủ rộng. Chọn tháng, tìm theo tên hoặc danh mục, lọc thu nhập hoặc chi tiêu |
| Tài khoản | Số dư từng tài khoản, ví điện tử và tiền mặt |
| Ngân sách | Hạn mức, số tiền đã chi và tỷ lệ sử dụng theo danh mục |
| Thống kê | Xu hướng dòng tiền và tỷ trọng chi theo danh mục |
| Dự báo | Số liệu chi tiêu minh họa cho tháng tiếp theo |
| Cài đặt | Giao diện sáng, tối hoặc theo thiết bị. Lựa chọn được lưu cục bộ qua AsyncStorage trên Android và web |

## Cấu trúc thư mục

Ứng dụng Expo nằm trong `apps/client`. Các thư mục `apps/api`, `services/ml-api` và `packages/shared` dành cho các phần sẽ triển khai sau. Xem sơ đồ monorepo trong [tài liệu quy trình phát triển](QUY_TRINH_PHAT_TRIEN.md#project-structure).

```text
apps/client/src/
├── app/                 Route và layout của Expo Router
├── screens/             Nội dung các màn hình
├── components/native/   Khung ứng dụng, biểu đồ và danh sách tài chính
├── ui/                  Nút, ô nhập, bộ chọn và hộp thoại dùng chung
├── hooks/               Tải dữ liệu, chọn kỳ và quản lý giao diện
├── services/            Nguồn dữ liệu mẫu và phép tính thu chi
├── theme/               Bảng màu sáng/tối của Sổ Tiền
├── types/               Kiểu dữ liệu và giao diện FinanceRepository
└── lib/                 Định dạng số tiền và ngày
```

## Nguồn dữ liệu

`FinanceProvider` nhận một `FinanceRepository` bất đồng bộ. Ứng dụng truyền `mockFinanceRepository` ở `apps/client/src/app/_layout.tsx`, với giao dịch minh họa từ tháng 5 đến tháng 10/2026. Số dư tài khoản là ảnh chụp cuối kỳ mẫu và được giữ cố định khi chọn tháng. Thu chi, ngân sách và biểu đồ được tính từ giao dịch của kỳ đã chọn. Tham số `thang` trong URL lưu kỳ báo cáo của từng màn hình hỗ trợ chọn tháng.

Khi có REST API, triển khai `FinanceRepository` để chuyển dữ liệu trả về sang `FinanceSnapshot` rồi truyền repository mới vào provider. Một repository offline-first có thể triển khai cùng giao diện để đọc snapshot từ bộ nhớ cục bộ và cập nhật từ REST khi kết nối trở lại. Bản hiện tại chỉ có frontend, dữ liệu mẫu và tùy chọn giao diện lưu cục bộ.
