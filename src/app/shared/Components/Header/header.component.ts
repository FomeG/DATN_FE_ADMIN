import { Component, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../model/user.model';
import { Observable } from 'rxjs';
import { ChangePasswordModalComponent } from '../../../change-password/change-password.component';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ChangePasswordModalComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @ViewChild(ChangePasswordModalComponent) changePasswordModal!: ChangePasswordModalComponent;
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

  // Thêm phương thức logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Thêm phương thức mở modal đổi mật khẩu
  openChangePasswordModal(): void {
    this.changePasswordModal.show(); 
  }

  test() :void{
    const userId = this.authService.getCurrentUser()?.userId;
    Swal.fire('ID người dùng hiện tại (nghĩa test):',userId, 'success');
  }
}