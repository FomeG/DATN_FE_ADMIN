import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { VoucherService, Voucher } from '../../services/voucher.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-voucher-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './voucher-management.component.html',
  styleUrl: './voucher-management.component.css'
})
export class VoucherManagementComponent implements OnInit {
  vouchers: Voucher[] = [];
  filteredVouchers: Voucher[] = [];
  voucherForm: FormGroup;
  isEditing = false;
  searchTerm = '';
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  isLoading = false;
  editingVoucherId: string | null = null;
  Math = Math;

  // Thêm các biến cho sort
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private voucherService: VoucherService,
    private fb: FormBuilder,
    private router: Router
  ) {
    // In your initForm() method or constructor
    this.voucherForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      discountType: ['PERCENT', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(1)]],
      minOrderValue: [0],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      maxUsage: [1, [Validators.required, Validators.min(1)]],
      status: [1]
    }, {
      validators: this.dateRangeValidator()
    });
  }

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.isLoading = true;
    this.voucherService.getVouchers(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.vouchers = response.data;
            this.filteredVouchers = [...this.vouchers];
            this.totalRecords = response.totalRecord;
            this.calculatePagination(); // Đảm bảo gọi hàm này sau khi có dữ liệu
            this.applySort();
          } else {
            // Xử lý lỗi
          }
          this.isLoading = false;
        },
        error: (error) => {
          // Xử lý lỗi
          this.isLoading = false;
        }
      });
  }

  // Thêm function cho sort
  sort(column: string): void {
    if (this.sortColumn === column) {
      // Nếu đang sort theo cột này, đổi chiều sort
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nếu sort cột mới, mặc định sort tăng dần
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySort();
  }

  // Áp dụng sort cho danh sách voucher
  applySort(): void {
    if (!this.sortColumn) return;

    this.filteredVouchers.sort((a: any, b: any) => {
      // Xử lý các kiểu dữ liệu khác nhau
      const valueA = a[this.sortColumn];
      const valueB = b[this.sortColumn];

      // So sánh dựa trên kiểu dữ liệu
      let comparison = 0;
      if (typeof valueA === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else if (valueA instanceof Date) {
        comparison = new Date(valueA).getTime() - new Date(valueB).getTime();
      } else {
        comparison = valueA - valueB;
      }

      // Áp dụng chiều sort
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Icon cho cột đang được sort
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage) || 1;
    this.pages = [];

    // Giới hạn hiển thị tối đa 5 trang
    if (this.totalPages <= 5) {
      // Nếu tổng số trang <= 5, hiển thị tất cả các trang
      for (let i = 1; i <= this.totalPages; i++) {
        this.pages.push(i);
      }
    } else {
      // Nếu tổng số trang > 5, hiển thị 5 trang xung quanh trang hiện tại
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + 4);

      // Điều chỉnh lại startPage nếu endPage đã đạt giới hạn
      const adjustedStartPage = Math.max(1, endPage - 4);

      for (let i = adjustedStartPage; i <= endPage; i++) {
        this.pages.push(i);
      }
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadVouchers();
  }

  onRecordsPerPageChange(): void {
    this.currentPage = 1; // Reset về trang đầu tiên
    this.loadVouchers();
  }

  resetForm(): void {
    this.voucherForm.reset({
      discountType: 'PERCENT',
      discountValue: 0,
      minOrderValue: 0,
      maxUsage: 0,
      status: 1
    });
    this.isEditing = false;
    this.editingVoucherId = null;
  }

  onSubmit(): void {
    if (this.voucherForm.invalid) {
      Object.keys(this.voucherForm.controls).forEach(key => {
        const control = this.voucherForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = this.voucherForm.value;

    // Format dates
    if (formData.startDate) {
      formData.startDate = new Date(formData.startDate).toISOString();
    }
    if (formData.endDate) {
      formData.endDate = new Date(formData.endDate).toISOString();
    }

    if (this.isEditing && this.editingVoucherId) {

      // Update existing voucher
      this.voucherService.updateVoucher(this.editingVoucherId, formData)
        .subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Cập nhật voucher thành công', 'success');
              this.closeModal();
              this.loadVouchers();
            } else {
              Swal.fire('Lỗi', response.message || 'Cập nhật voucher thất bại', 'error');
            }
          },
          error: (error) => {
            console.error('Error updating voucher:', error);
            Swal.fire('Lỗi', 'Đã xảy ra lỗi khi cập nhật voucher', 'error');
          }
        });
    } else {
      // Create new voucher
      this.voucherService.createVoucher(formData)
        .subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Thêm mới voucher thành công', 'success');
              this.closeModal();
              this.loadVouchers();
            } else {
              Swal.fire('Lỗi', response.message || 'Thêm mới voucher thất bại', 'error');
            }
          },
          error: (error) => {
            console.error('Error creating voucher:', error);
            Swal.fire('Lỗi', 'Đã xảy ra lỗi khi thêm mới voucher', 'error');
          }
        });
    }
  }

  editVoucher(voucher: Voucher): void {
    this.isEditing = true;
    this.editingVoucherId = voucher.id;

    // Format dates for input fields
    const startDate = voucher.startDate ? new Date(voucher.startDate).toISOString().split('T')[0] : '';
    const endDate = voucher.endDate ? new Date(voucher.endDate).toISOString().split('T')[0] : '';

    this.voucherForm.patchValue({
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue || 0,
      startDate: startDate,
      endDate: endDate,
      maxUsage: voucher.maxUsage,
      status: voucher.status
    });
  }

  deleteVoucher(id: string): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa voucher này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.voucherService.deleteVoucher(id)
          .subscribe({
            next: (response) => {
              if (response.responseCode === 200) {
                Swal.fire('Đã xóa!', 'Voucher đã được xóa thành công.', 'success');
                this.loadVouchers();
              } else {
                Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi xóa voucher.', 'error');
              }
            },
            error: (error) => {
              console.error('Error deleting voucher:', error);
              Swal.fire('Lỗi!', 'Có lỗi xảy ra khi xóa voucher.', 'error');
            }
          });
      }
    });
  }

  search(): void {
    if (!this.searchTerm.trim()) {
      this.filteredVouchers = [...this.vouchers];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredVouchers = this.vouchers.filter(voucher =>
      voucher.code.toLowerCase().includes(term) ||
      (voucher.description && voucher.description.toLowerCase().includes(term))
    );

    // Áp dụng sort sau khi search
    this.applySort();
  }

  closeModal(): void {
    // Close bootstrap modal
    const modalElement = document.getElementById('voucherModal');
    if (modalElement) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  getDiscountTypeLabel(type: string): string {
    return type === 'PERCENT' ? 'Phần trăm (%)' : 'Số tiền cố định';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  formatDiscountValue(voucher: Voucher): string {
    if (voucher.discountType === 'PERCENT') {
      return `${voucher.discountValue}%`;
    } else {
      return `${voucher.discountValue.toLocaleString('vi-VN')} VNĐ`;
    }
  }

  formatMinOrderValue(value: number): string {
    return value ? `${value.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ';
  }

  goToVoucherUsageHistory(voucherId: string): void {
    this.router.navigate(['/voucher-usage'], { queryParams: { voucherId } });
  }















  // Trả về văn bản trạng thái dựa vào mã số
  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Đã xóa';
      case 1:
        return 'Hoạt động';
      case 2:
        return 'Đã hết hạn';
      default:
        return 'Không xác định';
    }
  }

  // Trả về class CSS cho badge dựa vào trạng thái
  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 0:
        return 'bg-secondary';
      case 1:
        return 'bg-success';
      case 2:
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }





  // Add this function in your component class
  private dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get('startDate')?.value;
      const endDate = control.get('endDate')?.value;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today

      // Convert dates to Date objects for comparison
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const errors: ValidationErrors = {};

      // Check if start date is before today
      if (start && start < today) {
        errors['startDateBeforeToday'] = true;
      }

      // Check if end date is before today
      if (end && end < today) {
        errors['endDateBeforeToday'] = true;
      }

      // Check if end date is before start date
      if (start && end && end < start) {
        errors['endDateBeforeStartDate'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

















}








