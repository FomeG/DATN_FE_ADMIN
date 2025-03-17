// components/header/header.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../model/user.model';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './Navbar.html',  // Link tới file HTML riêng
  styleUrls: ['./Navbar.css']    // Link tới file CSS riêng
})
export class NavbarComponent {



  currentUser$: Observable<User | null>;

  constructor(public authService: AuthService) {
    // Khởi tạo currentUser$ trong constructor
    this.currentUser$ = this.authService.currentUser$;

    // Subscribe để theo dõi thay đổi của user
    this.currentUser$.subscribe(user => {
      console.log('Current user:', user);
    });
  }


}