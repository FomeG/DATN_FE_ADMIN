import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  returnUrl: string = '/statistics';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {
    document.body.classList.add('auth', 'login-bg');
  }

  ngOnInit(): void {
    // Lấy thông báo lỗi từ route nếu có
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.errorMessage = params['error'];
      }

      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // Kiểm tra nếu đã đăng nhập và có quyền Admin thì chuyển hướng
    if (this.authService.isLoggedIn() && this.authService.hasAdminRole()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('auth', 'login-bg');
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Vui lòng nhập tên đăng nhập và mật khẩu';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          // Kiểm tra xem người dùng có role Admin không
          const user = this.authService.getCurrentUser();
          if (user && user.roles.includes('Admin')) {
            this.router.navigate([this.returnUrl]);
          } else {
            // Nếu không có quyền Admin, đăng xuất và hiển thị thông báo
            this.authService.logout();
            this.errorMessage = 'Bạn không có quyền truy cập. Chỉ tài khoản Admin mới được phép đăng nhập.';
          }
        } else {
          this.errorMessage = response.message || 'Đăng nhập thất bại';
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = error.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  forgotPassword() {
    // Implement forgot password functionality
    console.log('Forgot password clicked');
    // this.router.navigate(['/reset-password']);
  }


  goToSignUp() {
    // Navigate to sign up page
    console.log('Sign up clicked');
    this.router.navigate(['/signup']);
  }
}