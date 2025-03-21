import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
export class LoginComponent {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {
    document.body.classList.add('auth', 'login-bg');

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/movies']);
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('auth', 'login-bg');
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.router.navigate(['/movies']);
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
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