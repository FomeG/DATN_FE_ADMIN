import { Component, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../model/user.model';
import { Observable } from 'rxjs';
import { ChangePasswordModalComponent } from '../../../change-password/change-password.component';
import Swal from 'sweetalert2';

// Định nghĩa giao diện cho các tùy chọn điều hướng
interface NavigationOption {
  name: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ChangePasswordModalComponent
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @ViewChild(ChangePasswordModalComponent) changePasswordModal!: ChangePasswordModalComponent;
  currentUser$: Observable<User | null>;
  unreadMessages: number = 0;
  unreadNotifications: number = 0;
  
  // Các thuộc tính cho chức năng tìm kiếm và điều hướng
  searchTerm: string = '';
  filteredOptions: NavigationOption[] = [];
  
  // Danh sách các tùy chọn điều hướng có sẵn
  navigationOptions: NavigationOption[] = [
    { name: 'Phim', path: '/movies', icon: 'mdi-movie' },
    { name: 'Diễn viên', path: '/actors', icon: 'mdi-account-star' },
    { name: 'Lịch chiếu', path: '/showtimes', icon: 'mdi-clock' },
    { name: 'Rạp phim', path: '/cinemas', icon: 'mdi-theater' },
    { name: 'Thành viên', path: '/memberships', icon: 'mdi-account-card-details' },
    { name: 'Phòng chiếu', path: '/rooms', icon: 'mdi-seat' },
    { name: 'Quy tắc giá', path: '/pricing-rules', icon: 'mdi-currency-usd' },
    { name: 'Nhật ký', path: '/log', icon: 'mdi-playlist-play' }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Khởi tạo currentUser$ trong constructor
    this.currentUser$ = this.authService.currentUser$;

    // Subscribe để theo dõi thay đổi của user
    this.currentUser$.subscribe(user => {
      console.log('Current user:', user);
      // Khi người dùng đăng nhập, giả lập có thông báo mới
      if (user) {
        this.loadNotifications();
      }
    });
    
    // Khởi tạo danh sách gợi ý ban đầu
    this.filteredOptions = [];
  }

  // Phương thức xử lý khi người dùng nhập vào ô tìm kiếm
  onSearchKeyup(event: KeyboardEvent): void {
    const value = this.searchTerm.toLowerCase();
    
    if (!value) {
      this.filteredOptions = [];
      return;
    }
    
    this.filteredOptions = this.navigationOptions.filter(option => 
      option.name.toLowerCase().includes(value)
    );
  }
  
  // Phương thức điều hướng đến trang được chọn
  navigateTo(event: Event | null, path?: string): void {
    if (event) {
      event.preventDefault();
    }
    
    // Nếu có đường dẫn được chỉ định, sử dụng nó
    if (path) {
      this.router.navigate([path]);
      this.searchTerm = '';
      this.filteredOptions = [];
      return;
    }
    
    // Nếu không có đường dẫn, tìm kiếm dựa trên searchTerm
    const matchingOption = this.navigationOptions.find(
      option => option.name.toLowerCase() === this.searchTerm.toLowerCase()
    );
    
    if (matchingOption) {
      this.router.navigate([matchingOption.path]);
      this.searchTerm = '';
      this.filteredOptions = [];
    } else {
      // Hiển thị thông báo nếu không tìm thấy
      Swal.fire({
        title: 'Không tìm thấy',
        text: `Không tìm thấy trang "${this.searchTerm}"`,
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
  }

  // Thêm phương thức logout
  logout(): void {
    // Hiển thị xác nhận trước khi đăng xuất
    Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  // Thêm phương thức mở modal đổi mật khẩu
  openChangePasswordModal(): void {
    this.changePasswordModal.show(); 
  }

  // Phương thức để tải thông báo mới
  loadNotifications(): void {
    // Giả lập có thông báo mới
    setTimeout(() => {
      this.unreadMessages = Math.floor(Math.random() * 5);
      this.unreadNotifications = Math.floor(Math.random() * 3);
    }, 1000);
  }

  // Phương thức để xử lý khi người dùng nhấp vào thông báo
  markNotificationsAsRead(): void {
    this.unreadNotifications = 0;
  }

  // Phương thức để xử lý khi người dùng nhấp vào tin nhắn
  markMessagesAsRead(): void {
    this.unreadMessages = 0;
  }

  // Import và các phương thức xử lý lỗi logo
  headerLogoError(event: any) {
    event.target.src = 'https://via.placeholder.com/40/151419/0090e7?text=CA';
  }
}