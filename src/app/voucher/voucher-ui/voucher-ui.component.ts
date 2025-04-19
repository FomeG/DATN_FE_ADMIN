import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VoucherUIService, VoucherUI } from '../../services/voucher-ui.service';
import { VoucherService, Voucher } from '../../services/voucher.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-voucher-ui',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './voucher-ui.component.html',
  styleUrl: './voucher-ui.component.css'
})
export class VoucherUiComponent implements OnInit {
  voucherUIs: VoucherUI[] = [];
  filteredVoucherUIs: VoucherUI[] = [];
  availableVouchers: Voucher[] = [];
  searchTerm = '';
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  isLoading = false;
  isEditing = false;
  selectedVoucherUI: VoucherUI | null = null;
  voucherUIForm: FormGroup;
  statusOptions = [
    { value: 1, label: 'Hoạt động' },
    { value: 0, label: 'Không hoạt động' }
  ];
  imagePreview: string | null = null;

  // Biến cho sắp xếp
  sortColumn: string = 'displayOrder';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private voucherUIService: VoucherUIService,
    private voucherService: VoucherService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.voucherUIForm = this.formBuilder.group({
      voucherId: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(1000)]],
      imageUrl: [''],
      displayOrder: [0, [Validators.required, Validators.min(0)]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      status: [1, Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  ngOnInit(): void {
    this.loadVoucherUIs();
    this.loadAvailableVouchers();
  }

  dateRangeValidator(formGroup: FormGroup) {
    const startTime = formGroup.get('startTime')?.value;
    const endTime = formGroup.get('endTime')?.value;

    if (startTime && endTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      if (startDate >= endDate) {
        return { dateRangeInvalid: true };
      }
    }

    return null;
  }

  loadVoucherUIs(): void {
    this.isLoading = true;
    this.voucherUIService.getVoucherUIs(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.voucherUIs = response.data;
            this.filteredVoucherUIs = [...this.voucherUIs];
            this.totalRecords = response.totalRecord;
            this.calculateTotalPages();

            // Áp dụng sắp xếp mặc định theo thứ tự hiển thị
            this.applySort();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading voucher UIs:', error);
          this.isLoading = false;
          Swal.fire({
            title: 'Lỗi!',
            text: 'Không thể tải danh sách giao diện voucher.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  loadAvailableVouchers(): void {
    this.voucherService.getVouchers(1, 100)
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.availableVouchers = response.data.filter((voucher: Voucher) => voucher.status === 1);
          }
        },
        error: (error) => {
          console.error('Error loading available vouchers:', error);
        }
      });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadVoucherUIs();
    }
  }

  search(): void {
    if (this.searchTerm.trim() === '') {
      this.filteredVoucherUIs = [...this.voucherUIs];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredVoucherUIs = this.voucherUIs.filter(vui =>
        vui.title.toLowerCase().includes(term) ||
        vui.content.toLowerCase().includes(term) ||
        vui.voucherCode?.toLowerCase().includes(term)
      );
    }

    // Áp dụng sắp xếp sau khi tìm kiếm
    this.applySort();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.filteredVoucherUIs = [...this.voucherUIs];

    // Áp dụng sắp xếp sau khi reset tìm kiếm
    this.applySort();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedVoucherUI = null;
    this.resetForm();
    this.imagePreview = null;
    // Mở modal
    const modal = document.getElementById('voucherUIModal');
    if (modal) {
      // @ts-ignore
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  openEditModal(voucherUI: VoucherUI): void {
    this.isEditing = true;
    this.selectedVoucherUI = voucherUI;

    // Format dates for form
    const startTime = new Date(voucherUI.startTime).toISOString().split('T')[0];
    const endTime = new Date(voucherUI.endTime).toISOString().split('T')[0];

    this.voucherUIForm.patchValue({
      voucherId: voucherUI.voucherId,
      title: voucherUI.title,
      content: voucherUI.content,
      imageUrl: '',  // Don't set the file input
      displayOrder: voucherUI.displayOrder,
      startTime: startTime,
      endTime: endTime,
      status: voucherUI.status
    });

    this.imagePreview = voucherUI.imageUrl;

    // Mở modal
    const modal = document.getElementById('voucherUIModal');
    if (modal) {
      // @ts-ignore
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  resetForm(): void {
    this.voucherUIForm.reset({
      voucherId: '',
      title: '',
      content: '',
      imageUrl: '',
      displayOrder: 0,
      startTime: '',
      endTime: '',
      status: 1
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Hiển thị preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Lưu file vào form
      this.voucherUIForm.patchValue({
        imageUrl: file
      });
    }
  }

  onSubmit(): void {
    if (this.voucherUIForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.voucherUIForm.controls).forEach(key => {
        const control = this.voucherUIForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = new FormData();
    const formValue = this.voucherUIForm.value;

    // Append all form fields to FormData
    Object.keys(formValue).forEach(key => {
      if (key !== 'imageUrl' || (key === 'imageUrl' && formValue[key] instanceof File)) {
        formData.append(key, formValue[key]);
      }
    });

    // If editing and no new image is selected, don't send the imageUrl field
    if (this.isEditing && !(formValue.imageUrl instanceof File)) {
      // Remove the empty imageUrl field from FormData
      // Note: FormData doesn't have a direct way to remove entries, so we're not adding it in the first place
    }

    this.isLoading = true;

    if (this.isEditing && this.selectedVoucherUI) {
      this.voucherUIService.updateVoucherUI(this.selectedVoucherUI.id, formData)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.responseCode === 200) {
              Swal.fire({
                title: 'Thành công!',
                text: 'Cập nhật giao diện voucher thành công.',
                icon: 'success',
                confirmButtonText: 'OK'
              }).then(() => {
                this.closeModal();
                this.loadVoucherUIs();
              });
            } else {
              Swal.fire({
                title: 'Lỗi!',
                text: response.message || 'Cập nhật giao diện voucher thất bại.',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating voucher UI:', error);
            Swal.fire({
              title: 'Lỗi!',
              text: 'Cập nhật giao diện voucher thất bại.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
    } else {
      this.voucherUIService.createVoucherUI(formData)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.responseCode === 200) {
              Swal.fire({
                title: 'Thành công!',
                text: 'Tạo giao diện voucher thành công.',
                icon: 'success',
                confirmButtonText: 'OK'
              }).then(() => {
                this.closeModal();
                this.loadVoucherUIs();
              });
            } else {
              Swal.fire({
                title: 'Lỗi!',
                text: response.message || 'Tạo giao diện voucher thất bại.',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating voucher UI:', error);
            Swal.fire({
              title: 'Lỗi!',
              text: 'Tạo giao diện voucher thất bại.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
    }
  }

  closeModal(): void {
    const modal = document.getElementById('voucherUIModal');
    if (modal) {
      // @ts-ignore
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) {
        bsModal.hide();
      }
    }
  }

  deleteVoucherUI(id: string): void {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn có chắc chắn muốn xóa giao diện voucher này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.voucherUIService.deleteVoucherUI(id)
          .subscribe({
            next: (response) => {
              this.isLoading = false;
              if (response.responseCode === 200) {
                Swal.fire({
                  title: 'Thành công!',
                  text: 'Xóa giao diện voucher thành công.',
                  icon: 'success',
                  confirmButtonText: 'OK'
                }).then(() => {
                  this.loadVoucherUIs();
                });
              } else {
                Swal.fire({
                  title: 'Lỗi!',
                  text: response.message || 'Xóa giao diện voucher thất bại.',
                  icon: 'error',
                  confirmButtonText: 'OK'
                });
              }
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error deleting voucher UI:', error);
              Swal.fire({
                title: 'Lỗi!',
                text: 'Xóa giao diện voucher thất bại.',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          });
      }
    });
  }

  getVoucherName(voucherId: string): string {
    const voucher = this.availableVouchers.find(v => v.id === voucherId);
    return voucher ? `${voucher.code} - ${voucher.description}` : 'N/A';
  }

  getDiscountText(voucherUI: VoucherUI): string {
    if (!voucherUI.discountType || !voucherUI.discountValue) return 'N/A';

    if (voucherUI.discountType === 'PERCENT') {
      return `${voucherUI.discountValue}%`;
    } else if (voucherUI.discountType === 'FIXED') {
      return `${voucherUI.discountValue.toLocaleString('vi-VN')} VNĐ`;
    }

    return 'N/A';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  // Phương thức sắp xếp
  sort(column: string): void {
    // Nếu đang sắp xếp theo cột này rồi thì đổi hướng sắp xếp
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nếu chọn cột mới, mặc định sắp xếp tăng dần
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Áp dụng sắp xếp
    this.applySort();
  }

  // Áp dụng sắp xếp cho danh sách
  applySort(): void {
    this.filteredVoucherUIs.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Lấy giá trị cần so sánh dựa trên cột sắp xếp
      switch(this.sortColumn) {
        case 'displayOrder':
          valueA = a.displayOrder;
          valueB = b.displayOrder;
          break;
        case 'title':
          valueA = a.title;
          valueB = b.title;
          break;
        case 'startTime':
          valueA = new Date(a.startTime).getTime();
          valueB = new Date(b.startTime).getTime();
          break;
        case 'endTime':
          valueA = new Date(a.endTime).getTime();
          valueB = new Date(b.endTime).getTime();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a.displayOrder;
          valueB = b.displayOrder;
      }

      // So sánh giá trị
      let comparison = 0;
      if (typeof valueA === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA - valueB;
      }

      // Áp dụng hướng sắp xếp
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Lấy icon cho cột đang sắp xếp
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort'; // Icon mặc định
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
}
