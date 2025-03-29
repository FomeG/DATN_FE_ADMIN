import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceTypeService, ServiceType } from '../../services/serviceType.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-service-type-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './service-type-management.component.html',
  styleUrls: ['./service-type-management.component.css']
})
export class ServiceTypeManagementComponent implements OnInit {
  serviceTypes: ServiceType[] = [];
  isLoading = false;
  totalRecords = 0;
  currentPage = 1;
  recordPerPage = 10;
  totalPages = 0;
  pages: number[] = [];
  serviceTypeForm: FormGroup;
  isEditing = false;
  selectedImage: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  searchTerm = '';

  // Sort
  sortColumn = '';
  sortDirection = 'asc';

  // Math object for template
  Math = Math;

  constructor(
    private serviceTypeService: ServiceTypeService,
    private fb: FormBuilder
  ) {
    this.serviceTypeForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadServiceTypes();
  }

  loadServiceTypes(): void {
    this.isLoading = true;
    this.serviceTypeService.getServiceTypes(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.serviceTypes = response.data;
          this.totalRecords = response.totalRecord;
          this.calculatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading service types:', error);
          this.isLoading = false;
          Swal.fire({
            title: 'Lỗi!',
            text: 'Không thể tải danh sách loại dịch vụ.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pages.push(i);
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadServiceTypes();
  }

  onRecordsPerPageChange(): void {
    this.currentPage = 1;
    this.loadServiceTypes();
  }

  resetForm(): void {
    this.serviceTypeForm.reset({
      id: '',
      name: '',
      description: ''
    });
    this.imagePreview = null;
    this.selectedImage = null;
    this.isEditing = false;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedImage = fileInput.files[0];
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  openAddModal(): void {
    this.resetForm();
    const modal = document.getElementById('serviceTypeModal');
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  editServiceType(serviceType: ServiceType): void {
    this.isEditing = true;
    this.serviceTypeForm.patchValue({
      id: serviceType.id,
      name: serviceType.name,
      description: serviceType.description
    });
    this.imagePreview = serviceType.imageUrl;

    const modal = document.getElementById('serviceTypeModal');
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  onSubmit(): void {
    if (this.serviceTypeForm.invalid) {
      return;
    }

    const formData = this.serviceTypeForm.value;
    const serviceTypeData = {
      ...formData,
      photo: this.selectedImage
    };

    if (this.isEditing) {
      this.serviceTypeService.updateServiceType(serviceTypeData)
        .subscribe({
          next: (response: any) => {
            if (response.responseCode === 200) {
              Swal.fire({
                title: 'Thành công!',
                text: 'Cập nhật loại dịch vụ thành công',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              this.closeModal();
              this.loadServiceTypes();
            } else {
              Swal.fire({
                title: 'Lỗi!',
                text: response.message || 'Không thể cập nhật loại dịch vụ',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error: any) => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Không thể cập nhật loại dịch vụ',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
    } else {
      this.serviceTypeService.createServiceType(serviceTypeData)
        .subscribe({
          next: (response: any) => {
            if (response.responseCode === 200) {
              Swal.fire({
                title: 'Thành công!',
                text: 'Thêm loại dịch vụ mới thành công',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              this.closeModal();
              this.loadServiceTypes();
            } else {
              Swal.fire({
                title: 'Lỗi!',
                text: response.message || 'Không thể thêm loại dịch vụ mới',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error: any) => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Không thể thêm loại dịch vụ mới',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
    }
  }

  deleteServiceType(id: string): void {
    Swal.fire({
      title: 'Bạn có chắc chắn muốn xóa?',
      text: 'Bạn sẽ không thể khôi phục lại loại dịch vụ này!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.serviceTypeService.deleteServiceType(id)
          .subscribe({
            next: (response: any) => {
              if (response.responseCode === 200) {
                Swal.fire(
                  'Đã xóa!',
                  'Loại dịch vụ đã được xóa thành công.',
                  'success'
                );
                this.loadServiceTypes();
              } else {
                Swal.fire(
                  'Lỗi!',
                  response.message || 'Không thể xóa loại dịch vụ',
                  'error'
                );
              }
            },
            error: (error: any) => {
              Swal.fire(
                'Lỗi!',
                'Không thể xóa loại dịch vụ',
                'error'
              );
            }
          });
      }
    });
  }

  closeModal(): void {
    const modalElement = document.getElementById('serviceTypeModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  search(): void {
    if (this.searchTerm.trim() === '') {
      this.loadServiceTypes();
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.serviceTypes = this.serviceTypes.filter(serviceType =>
      serviceType.name.toLowerCase().includes(searchTermLower) ||
      serviceType.description.toLowerCase().includes(searchTermLower)
    );
  }

  // Functions for sorting
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySort();
  }

  applySort(): void {
    this.serviceTypes.sort((a, b) => {
      let comparison = 0;

      if (this.sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getServiceCount(serviceType: ServiceType): number {
    return serviceType.serviceList ? serviceType.serviceList.length : 0;
  }
}