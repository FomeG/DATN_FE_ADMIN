import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceManagementService } from '../services/service-management.service';
import { Service } from '../../model/service.model';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.css']
})
export class ServiceManagementComponent implements OnInit {
  services: Service[] = [];
  serviceTypes: any[] = [];
  isLoading = false;
  totalRecords = 0;
  currentPage = 1;
  recordPerPage = 10;
  totalPages = 0;
  pages: number[] = [];
  serviceForm: FormGroup;
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
    private serviceManagementService: ServiceManagementService,
    private fb: FormBuilder
  ) {
    this.serviceForm = this.fb.group({
      id: [''],
      serviceName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0)]],
      serviceTypeID: ['']
    });
  }

  ngOnInit(): void {
    this.loadServices();
    this.loadServiceTypes();
  }

  loadServices(): void {
    this.isLoading = true;
    this.serviceManagementService.getServices(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.services = response.data;
          this.totalRecords = response.totalRecord;
          this.calculatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.isLoading = false;
          Swal.fire({
            title: 'Lỗi!',
            text: 'Không thể tải danh sách dịch vụ.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  loadServiceTypes(): void {
    this.serviceManagementService.getServiceTypes(1, 100)
      .subscribe({
        next: (response) => {
          this.serviceTypes = response.data;
        },
        error: (error) => {
          console.error('Error loading service types:', error);
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
    this.loadServices();
  }

  onRecordsPerPageChange(): void {
    this.currentPage = 1;
    this.loadServices();
  }

  resetForm(): void {
    this.serviceForm.reset({
      id: '',
      serviceName: '',
      description: '',
      price: 0,
      serviceTypeID: ''
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
    const modal = document.getElementById('serviceModal');
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  editService(service: Service): void {
    this.isEditing = true;
    this.serviceForm.patchValue({
      id: service.id,
      serviceName: service.serviceName,
      description: service.description,
      price: service.price,
      serviceTypeID: service.serviceTypeID
    });
    this.imagePreview = service.imageUrl;
    
    const modal = document.getElementById('serviceModal');
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      return;
    }

    const formData = this.serviceForm.value;
    const serviceData = {
      ...formData,
      photo: this.selectedImage
    };

    if (this.isEditing) {
      this.serviceManagementService.updateService(serviceData)
        .subscribe({
          next: (response: any) => {
            if (response.responseCode === 200) {
              Swal.fire({
                title: 'Thành công!',
                text: 'Cập nhật dịch vụ thành công',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              this.closeModal();
              this.loadServices();
            } else {
              Swal.fire({
                title: 'Lỗi!',
                text: response.message || 'Không thể cập nhật dịch vụ',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error: any) => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Không thể cập nhật dịch vụ',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
    } else {
      this.serviceManagementService.createService(serviceData)
        .subscribe({
          next: (response: any) => {
            if (response.responseCode === 200) {
              Swal.fire({
                title: 'Thành công!',
                text: 'Thêm dịch vụ mới thành công',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              this.closeModal();
              this.loadServices();
            } else {
              Swal.fire({
                title: 'Lỗi!',
                text: response.message || 'Không thể thêm dịch vụ mới',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error: any) => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Không thể thêm dịch vụ mới',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
    }
  }

  deleteService(id: string): void {
    Swal.fire({
      title: 'Bạn có chắc chắn muốn xóa?',
      text: 'Bạn sẽ không thể khôi phục lại dịch vụ này!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.serviceManagementService.deleteService(id)
          .subscribe({
            next: (response: any) => {
              if (response.responseCode === 200) {
                Swal.fire(
                  'Đã xóa!',
                  'Dịch vụ đã được xóa thành công.',
                  'success'
                );
                this.loadServices();
              } else {
                Swal.fire(
                  'Lỗi!',
                  response.message || 'Không thể xóa dịch vụ',
                  'error'
                );
              }
            },
            error: (error: any) => {
              Swal.fire(
                'Lỗi!',
                'Không thể xóa dịch vụ',
                'error'
              );
            }
          });
      }
    });
  }

  closeModal(): void {
    const modalElement = document.getElementById('serviceModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  search(): void {
    if (this.searchTerm.trim() === '') {
      this.loadServices();
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase();
    this.services = this.services.filter(service => 
      service.serviceName.toLowerCase().includes(searchTermLower) ||
      service.description.toLowerCase().includes(searchTermLower)
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
    this.services.sort((a, b) => {
      let comparison = 0;
      
      if (this.sortColumn === 'serviceName') {
        comparison = a.serviceName.localeCompare(b.serviceName);
      } else if (this.sortColumn === 'price') {
        comparison = a.price - b.price;
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
}