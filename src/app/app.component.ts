import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/Components/Header/header.component';
import { FooterComponent } from './shared/Components/Footer/footer.component';
import { NavbarComponent } from './shared/Components/Navbar/Navbar.component';
import { AuthService } from './auth/auth.service';
import { Observable, filter } from 'rxjs';
import { User } from './model/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NavbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'test';
  currentUser$: Observable<User | null>;
  isLoginPage: boolean = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    
    // Check current route on navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage = event.url.includes('/login');
        
        // If user is not logged in and not on login page or payment page, redirect to login
        if (!this.authService.isLoggedIn() && 
            !this.isLoginPage && 
            !this.isPaymentRoute()) {
          this.router.navigate(['/login']);
        }
      });
  }

  isPaymentRoute(): boolean {
    return this.router.url.includes('payment-callback');
  }
}