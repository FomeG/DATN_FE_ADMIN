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

  employeeForm: FormGroup;
  isSubmitting = false;

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
  }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployeeList(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.employees = response.data;
          this.totalRecords = response.totalRecord;
          this.calculateTotalPages();
        },
        error: (error) => {
          console.error('Error loading employees:', error);
        }
      });
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

  onLockoutEmployee(id: string) {
    Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc chắn muốn thay đổi trạng thái khóa của nhân viên này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.lockoutEmployee(id).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Thay đổi trạng thái thành công', 'success');
              this.loadEmployees();
            } else {
              Swal.fire('Lỗi', response.message || 'Không thể thay đổi trạng thái', 'error');
            }
          },
          error: (error) => {
            console.error('Error locking out employee:', error);
            Swal.fire('Lỗi', 'Không thể thay đổi trạng thái', 'error');
          }
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

            // Close the modal
            const modalElement = document.getElementById('addEmployeeModal');
            if (modalElement) {
              const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
              if (modal) {
                modal.hide();
              }
            }

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
}