# DATN_FE_ADMIN

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.8.

## Continuous Integration (CI)

Dự án này bao gồm một quy trình Continuous Integration (CI) đơn giản sử dụng GitHub Actions. Quy trình này tự động hóa việc kiểm tra và xây dựng ứng dụng.

### Quy trình CI

Quy trình CI chạy mỗi khi push code lên nhánh main và khi tạo pull request. Nó thực hiện các tác vụ sau:

- Cài đặt các dependencies
- Xây dựng ứng dụng
- Chạy các bài kiểm tra (nếu được bật)

Để biết thêm chi tiết về thiết lập CI, xem file [CI_SETUP.md](./CI_SETUP.md).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Build cho Production

Để build ứng dụng cho môi trường production:

```bash
npm run build
```

Các file build sẽ được tạo trong thư mục `dist/nghia_test`.
