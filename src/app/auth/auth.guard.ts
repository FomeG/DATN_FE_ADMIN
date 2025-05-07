import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Kiểm tra đã đăng nhập và có role Admin
  if (authService.isLoggedIn() && authService.hasAdminRole()) {
    return true;
  }

  // Nếu đã đăng nhập nhưng không có quyền Admin, đăng xuất và chuyển về trang login
  if (authService.isLoggedIn() && !authService.hasAdminRole()) {
    authService.logout();
    router.navigate(['/login'], {
      queryParams: {
        returnUrl: state.url,
        error: 'Bạn không có quyền truy cập. Chỉ tài khoản Admin mới được phép đăng nhập.'
      }
    });
    return false;
  }

  // Chưa đăng nhập, chuyển về trang login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};