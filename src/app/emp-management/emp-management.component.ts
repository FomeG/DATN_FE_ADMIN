import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../services/employee.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-emp-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './emp-management.component.html',
  styleUrl: './emp-management.component.css'
})
export class EmpManagementComponent implements OnInit {
  employees: Employee[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  isLoading = false;

  employeeForm: FormGroup;
  editEmployeeForm: FormGroup;
  isSubmitting = false;
  selectedEmployeeId: string = '';

  // Modal references
  private addEmployeeModalRef: any;
  private editEmployeeModalRef: any;

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Initialize the form in the constructor
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      userName: ['', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]],
      dob: [null],
      sex: [1], // Default to male
      address: ['']
    });

    // Initialize the edit form
    this.editEmployeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      userName: ['', Validators.required],
      dob: [null],
      sex: [1], // Default to male
      address: ['']
    });
  }

  ngOnInit() {
    this.loadEmployees();

    // Initialize modal references
    setTimeout(() => {
      const addEmployeeModalElement = document.getElementById('addEmployeeModal');
      const editEmployeeModalElement = document.getElementById('editEmployeeModal');

      if (addEmployeeModalElement) {
        this.addEmployeeModalRef = new (window as any).bootstrap.Modal(addEmployeeModalElement);
      }

      if (editEmployeeModalElement) {
        this.editEmployeeModalRef = new (window as any).bootstrap.Modal(editEmployeeModalElement);
      }
    }, 500); // Small delay to ensure DOM is ready
  }

  loadEmployees() {
    this.isLoading = true;
    this.employeeService.getEmployeeList(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.employees = response.data;
          this.totalRecords = response.totalRecord;
          this.calculateTotalPages();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.isLoading = false;
        }
      });
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);

    // Giới hạn hiển thị tối đa 5 trang
    if (this.totalPages <= 5) {
      // Nếu tổng số trang <= 5, hiển thị tất cả các trang
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      // Nếu tổng số trang > 5, hiển thị 5 trang xung quanh trang hiện tại
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + 4);

      // Điều chỉnh lại startPage nếu endPage đã đạt giới hạn
      const adjustedStartPage = Math.max(1, endPage - 4);

      this.pages = Array.from({ length: 5 }, (_, i) => adjustedStartPage + i).filter(p => p <= this.totalPages);
    }
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadEmployees();
  }

  onDeleteEmployee(id: string) {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa nhân viên này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.deleteEmployee(id).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Xóa nhân viên thành công', 'success');
              this.loadEmployees();
            } else {
              Swal.fire('Lỗi', response.message || 'Không thể xóa nhân viên', 'error');
            }
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            Swal.fire('Lỗi', 'Không thể xóa nhân viên', 'error');
          }
        });
      }
    });
  }

  onToggleLockoutEmployee(id: string) {
    // Tìm nhân viên trong danh sách hiện tại
    const employee = this.employees.find(emp => emp.id === id);
    if (!employee) return;

    // Cập nhật UI ngay lập tức để tạo trải nghiệm mượt mà hơn
    const previousState = employee.lockoutEnabled;
    employee.lockoutEnabled = !previousState;

    // Gọi API để cập nhật trạng thái trên server
    this.employeeService.toggleLockoutEmployee(id).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          // Tải lại danh sách để đảm bảo dữ liệu đồng bộ
          this.loadEmployees();
        } else {
          // Nếu có lỗi, khôi phục trạng thái trước đó và hiển thị thông báo lỗi nhỏ
          employee.lockoutEnabled = previousState;
          console.error('Error toggling lockout status:', response.message);

          // Hiển thị thông báo lỗi nhỏ (toast) thay vì Swal đầy màn hình
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: 'error',
            title: 'Không thể cập nhật trạng thái'
          });
        }
      },
      error: (error) => {
        // Khôi phục trạng thái trước đó nếu có lỗi
        employee.lockoutEnabled = previousState;
        console.error('Error toggling employee lockout status:', error);

        // Hiển thị thông báo lỗi nhỏ (toast)
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          icon: 'error',
          title: 'Không thể cập nhật trạng thái'
        });
      }
    });
  }

  // Method to handle form submission
  onSubmitEmployee() {
    if (this.employeeForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Call the API to add an employee
    this.employeeService.createEmployee(this.employeeForm.value)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;

          if (response.responseCode === 200 || response.responseCode === 0) {
            // Success
            Swal.fire({
              title: 'Thành công',
              text: 'Thêm nhân viên thành công',
              icon: 'success',
              confirmButtonText: 'Đóng'
            });

            // Close the modal and remove backdrop
            this.closeModalAndRemoveBackdrop('addEmployeeModal', this.addEmployeeModalRef);

            // Reset the form
            this.employeeForm.reset({
              sex: 1
            });

            // Reload the employee list
            this.loadEmployees();
          } else {
            // Error
            Swal.fire({
              title: 'Lỗi',
              text: response.message || 'Có lỗi xảy ra khi thêm nhân viên',
              icon: 'error',
              confirmButtonText: 'Đóng'
            });
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          Swal.fire({
            title: 'Lỗi',
            text: error.error?.message || 'Có lỗi xảy ra khi thêm nhân viên',
            icon: 'error',
            confirmButtonText: 'Đóng'
          });
        }
      });
  }

  // Method to handle edit employee button click
  onEditEmployee(id: string) {
    this.selectedEmployeeId = id;
    // Get employee details and populate the form
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          const employee = response.data;

          // Format date for the date input (YYYY-MM-DD)
          const dob = employee.dob ? new Date(employee.dob) : null;
          const formattedDob = dob ? dob.toISOString().split('T')[0] : null;

          // Populate the form with employee data
          this.editEmployeeForm.patchValue({
            name: employee.name,
            email: employee.email,
            phoneNumber: employee.phoneNumber,
            userName: employee.userName,
            dob: formattedDob,
            sex: employee.sex,
            address: employee.address
          });
        } else {
          Swal.fire({
            title: 'Lỗi',
            text: response.message || 'Không thể tải thông tin nhân viên',
            icon: 'error',
            confirmButtonText: 'Đóng'
          });
        }
      },
      error: (error) => {
        console.error('Error loading employee details:', error);
        Swal.fire({
          title: 'Lỗi',
          text: 'Không thể tải thông tin nhân viên',
          icon: 'error',
          confirmButtonText: 'Đóng'
        });
      }
    });
  }

  // Helper method to close modal and remove backdrop
  private closeModalAndRemoveBackdrop(modalId: string, modalRef?: any) {
    if (modalRef) {
      modalRef.hide();
    } else {
      // Fallback methods
      try {
        (window as any).$(`#${modalId}`).modal('hide');
      } catch (error) {
        console.error('Error closing modal with jQuery:', error);
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.hide();
        }
      }
    }

    // Remove backdrop and clean up body classes
    setTimeout(() => {
      try {
        // Try jQuery first
        (window as any).$('.modal-backdrop').remove();
        (window as any).$('body').removeClass('modal-open');
        (window as any).$('body').css('overflow', '');
        (window as any).$('body').css('padding-right', '');
      } catch (e) {
        // Fallback to manual DOM manipulation
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }, 200);
  }

  // Method to handle update employee form submission
  onUpdateEmployee() {
    if (this.editEmployeeForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.editEmployeeForm.controls).forEach(key => {
        this.editEmployeeForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Call the API to update employee
    this.employeeService.updateEmployee(this.selectedEmployeeId, this.editEmployeeForm.value)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;

          if (response.responseCode === 200) {
            // Success
            Swal.fire({
              title: 'Thành công',
              text: 'Cập nhật thông tin nhân viên thành công',
              icon: 'success',
              confirmButtonText: 'Đóng'
            });

            // Close the modal and remove backdrop
            this.closeModalAndRemoveBackdrop('editEmployeeModal', this.editEmployeeModalRef);

            // Reload the employee list
            this.loadEmployees();
          } else {
            // Error
            Swal.fire({
              title: 'Lỗi',
              text: response.message || 'Có lỗi xảy ra khi cập nhật thông tin nhân viên',
              icon: 'error',
              confirmButtonText: 'Đóng'
            });
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          Swal.fire({
            title: 'Lỗi',
            text: error.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin nhân viên',
            icon: 'error',
            confirmButtonText: 'Đóng'
          });
        }
      });
  }
}