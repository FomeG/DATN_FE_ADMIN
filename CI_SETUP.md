# Thiết lập CI đơn giản cho DATN_FE_ADMIN

Tài liệu này giải thích cách thiết lập và sử dụng quy trình Continuous Integration (CI) đơn giản cho dự án DATN_FE_ADMIN.

## Tổng quan

Quy trình CI đơn giản này sẽ tự động hóa việc kiểm tra và xây dựng ứng dụng mỗi khi bạn đẩy code lên GitHub. Điều này giúp:

- Đảm bảo code luôn được build thành công
- Phát hiện lỗi sớm
- Tự động hóa quy trình kiểm tra chất lượng code

## Quy trình CI

Quy trình CI (`simple-ci.yml`) thực hiện các bước sau:

- Checkout code
- Thiết lập Node.js
- Cài đặt các dependencies
- Build ứng dụng
- (Tùy chọn) Chạy các bài kiểm tra
- Lưu trữ các artifacts build

Quy trình này sẽ tự động chạy khi:
- Mỗi khi push code lên nhánh `main`
- Mỗi khi tạo pull request vào nhánh `main`

## Cách sử dụng

1. **Đẩy code lên GitHub**: Mỗi khi bạn đẩy code lên GitHub, quy trình CI sẽ tự động chạy.

2. **Kiểm tra kết quả**: Bạn có thể kiểm tra kết quả của quy trình CI trong tab Actions của repository GitHub.

3. **Tải xuống build artifacts**: Nếu cần, bạn có thể tải xuống các artifacts build từ tab Actions của repository GitHub.

## Mở rộng trong tương lai

Khi dự án của bạn phát triển, bạn có thể mở rộng quy trình CI này để bao gồm:

1. **Kiểm tra code**: Thêm các bước kiểm tra code như linting, kiểm tra định dạng, v.v.

2. **Kiểm thử tự động**: Thêm các bài kiểm tra đơn vị và kiểm tra tích hợp.

3. **Triển khai (CD)**: Khi bạn sẵn sàng triển khai ứng dụng, bạn có thể thêm các bước triển khai vào quy trình.

## Tài nguyên bổ sung

- [Tài liệu GitHub Actions](https://docs.github.com/en/actions)
- [Tài liệu Angular CLI](https://angular.dev/tools/cli)
