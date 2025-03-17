import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/Components/Header/header.component';
import { FooterComponent } from './shared/Components/Footer/footer.component';
import { NavbarComponent } from './shared/Components/Navbar/Navbar.component';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
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

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Khởi tạo currentUser$ trong constructor
    this.currentUser$ = this.authService.currentUser$;
    
    // Subscribe để theo dõi thay đổi của user
    this.currentUser$.subscribe(user => {
      console.log('Current user:', user);
    });
  }
}