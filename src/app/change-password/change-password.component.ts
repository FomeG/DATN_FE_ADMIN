import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="changePasswordModalLabel">Đổi mật khẩu</h5>
            <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="currentPassword">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="currentPassword" 
                  formControlName="currentPassword">
                <div *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched" class="text-danger">
                  Vui lòng nhập mật khẩu hiện tại
                </div>
              </div>
              
              <div class="form-group">
                <label for="newPassword">Mật khẩu mới</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="newPassword" 
                  formControlName="newPassword">
                <div *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched" class="text-danger">
                  Mật khẩu mới phải có ít nhất 6 ký tự
                </div>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="confirmPassword" 
                  formControlName="confirmPassword">
                <div *ngIf="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched" class="text-danger">
                  Vui lòng xác nhận mật khẩu
                </div>
                <div *ngIf="passwordForm.errors?.['passwordMismatch']" class="text-danger">
                  Mật khẩu xác nhận không khớp
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm mr-1"></span>
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChangePasswordModalComponent implements OnInit {
  @ViewChild('changePasswordModal') modalElement!: ElementRef;
  passwordForm: FormGroup;
  isLoading = false;
  modal: Modal | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Modal sẽ được khởi tạo khi component được load
  }

  show() {
    if (!this.modal) {
      this.modal = new Modal(document.getElementById('changePasswordModal')!);
    }
    this.modal.show();
  }

  hide() {
    if (this.modal) {
      this.modal.hide();
    }
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading = true;
    const userId = this.authService.getCurrentUser()?.userId;

    if (!userId) {
      Swal.fire('Lỗi', 'Không thể xác định người dùng hiện tại', 'error');
      this.isLoading = false;
      return;
    }

    const changePasswordData = {
      userId: userId,
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    this.http.post(`${environment.apiUrl}/Employee/ChangePassword`, changePasswordData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.responseCode === 200) {
            this.hide();
            Swal.fire('Thành công', 'Đổi mật khẩu thành công', 'success');
            this.passwordForm.reset();
          } else {
            Swal.fire('Lỗi', response.message || 'Đổi mật khẩu thất bại', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          Swal.fire('Lỗi', error.error?.message || 'Đã xảy ra lỗi khi đổi mật khẩu', 'error');
        }
      });
  }
}