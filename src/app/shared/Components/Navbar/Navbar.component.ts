// components/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../model/user.model';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './Navbar.html',  // Link tới file HTML riêng
  styleUrls: ['./Navbar.css']    // Link tới file CSS riêng
})
export class NavbarComponent implements OnInit {

  currentUser$: Observable<User | null>;
  sidebarOpen: boolean = true; // Mặc định sidebar đang mở

  logoError: boolean = false;
  miniLogoError: boolean = false;

  constructor(public authService: AuthService) {
    // Khởi tạo currentUser$ trong constructor
    this.currentUser$ = this.authService.currentUser$;

    // Subscribe để theo dõi thay đổi của user
    this.currentUser$.subscribe(user => {
      console.log('Current user:', user);
    });
  }

  ngOnInit(): void {
    // Khởi tạo component
  }

  // Phương thức để chuyển đổi trạng thái sidebar
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    // Thông báo cho các thành phần khác về trạng thái sidebar
    document.body.classList.toggle('sidebar-icon-only', !this.sidebarOpen);
  }

  handleLogoError(event: any) {
    this.logoError = true;
    event.target.src = 'https://via.placeholder.com/150x50/151419/0090e7?text=Cinema+Admin';
  }

  handleMiniLogoError(event: any) {
    this.miniLogoError = true;
    event.target.src = 'https://via.placeholder.com/50/151419/0090e7?text=CA';
  }
}