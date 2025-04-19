import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActorService, Actor } from '../services/actor.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actor-management',
  templateUrl: './actor-management.component.html',
  styleUrls: ['./actor-management.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
  providers: [DatePipe]
})
export class ActorManagementComponent implements OnInit {
  actors: Actor[] = [];
  filteredActors: Actor[] = [];
  actorForm: FormGroup;
  isEditing = false;
  editActorId: string = '';
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  selectedPhoto: File | null = null;
  searchTerm: string = '';
  isLoading = false;

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // All actors cache for client-side operations
  allActors: Actor[] = [];

  // Math helper for template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private actorService: ActorService,
    private datePipe: DatePipe
  ) {
    this.actorForm = this.fb.group({
      name: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      biography: ['', Validators.required],
      status: [1]
    });
  }

  ngOnInit() {
    this.loadActors();
  }

  loadActors() {
    this.isLoading = true;
    this.actorService.getActors(this.currentPage, this.recordPerPage).subscribe({
      next: (response) => {
        this.actors = response.data;
        this.filteredActors = [...this.actors];
        this.totalRecords = response.totalRecord;
        this.calculateTotalPages();

        // If we haven't cached all actors yet, load them all
        if (this.allActors.length === 0) {
          this.loadAllActors();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading actors:', error);
        Swal.fire('Lỗi!', 'Có lỗi xảy ra khi tải danh sách diễn viên.', 'error');
        this.isLoading = false;
      }
    });
  }

  // Load all actors for client-side operations
  loadAllActors() {
    this.isLoading = true;
    // We'll use a large enough page size to get all actors in one request
    this.actorService.getActors(1, 1000).subscribe({
      next: (response) => {
        this.allActors = response.data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading all actors:', error);
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
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;

      if (this.searchTerm || this.sortColumn) {
        // If filtering or sorting, use client-side pagination
        this.applyFilters();
      } else {
        // Otherwise use server pagination
        this.loadActors();
      }
    }
  }

  // Sort function
  sort(column: string) {
    if (this.sortColumn === column) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applyFilters();
  }

  // Search function
  search() {
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }

  // Combined filter, sort and paginate
  applyFilters() {
    this.isLoading = true;
    // 1. Filter by search term
    let result = [...this.allActors];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(actor =>
        actor.name.toLowerCase().includes(term) ||
        actor.biography.toLowerCase().includes(term)
      );
    }

    // 2. Sort if needed
    if (this.sortColumn) {
      result.sort((a: any, b: any) => {
        let valueA = a[this.sortColumn];
        let valueB = b[this.sortColumn];

        // Handle dates
        if (this.sortColumn === 'dateOfBirth') {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        }

        // Handle string comparison
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        // Compare values based on sort direction
        if (valueA < valueB) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // 3. Update total records for pagination
    this.totalRecords = result.length;
    this.calculateTotalPages();

    // 4. Apply pagination
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    this.filteredActors = result.slice(startIndex, startIndex + this.recordPerPage);
    this.isLoading = false;
  }

  // Helper method to get column sort icon
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort'; // Default icon
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // Records per page change handler
  onRecordsPerPageChange() {
    this.currentPage = 1; // Reset to first page

    if (this.searchTerm || this.sortColumn) {
      // If filtering or sorting, update client-side pagination
      this.applyFilters();
    } else {
      // Otherwise refresh from server
      this.loadActors();
    }
  }

  // Form handling methods
  resetForm() {
    this.isEditing = false;
    this.editActorId = '';
    this.selectedPhoto = null;
    this.actorForm.reset({
      status: 1
    });
  }

  editActor(actor: Actor) {
    this.isEditing = true;
    this.editActorId = actor.id;
    this.actorForm.patchValue({
      name: actor.name,
      dateOfBirth: this.datePipe.transform(actor.dateOfBirth, 'yyyy-MM-dd'),
      biography: actor.biography,
      status: actor.status
    });
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedPhoto = event.target.files[0];
    }
  }

  onSubmit() {
    if (this.actorForm.valid) {
      const formData = new FormData();
      formData.append('name', this.actorForm.get('name')?.value);
      formData.append('dateOfBirth', this.actorForm.get('dateOfBirth')?.value);
      formData.append('biography', this.actorForm.get('biography')?.value);
      formData.append('status', this.actorForm.get('status')?.value);

      if (this.selectedPhoto) {
        formData.append('photo', this.selectedPhoto);
      }

      if (this.isEditing) {
        this.actorService.updateActor(this.editActorId, formData).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công!', 'Cập nhật diễn viên thành công.', 'success');
              this.loadActors();
              this.loadAllActors(); // Refresh cache
              this.resetForm();
              document.getElementById('closeModalBtn')?.click();
            } else {
              Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi cập nhật diễn viên.', 'error');
            }
          },
          error: (error) => {
            Swal.fire('Lỗi!', 'Có lỗi xảy ra khi cập nhật diễn viên:' + error.message, 'error');
          }
        });
      } else {
        this.actorService.createActor(formData).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công!', 'Thêm diễn viên thành công.', 'success');
              this.loadActors();
              this.loadAllActors(); // Refresh cache
              this.resetForm();
              document.getElementById('closeModalBtn')?.click();
            } else {
              Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi thêm diễn viên.', 'error');
            }
          },
          error: (error) => {
            Swal.fire('Lỗi!', 'Có lỗi xảy ra khi thêm diễn viên:' + error.message, 'error');
          }
        });
      }
    }
  }

  deleteActor(actorID: string) {
    Swal.fire({
      text: "Bạn không thể hoàn tác sau khi xoá!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actorService.deleteActor(actorID).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire(
                'Đã xóa!',
                'Diễn viên đã được xóa thành công.',
                'success'
              );
              this.loadActors();
              this.loadAllActors(); // Refresh cache
            } else {
              Swal.fire(
                'Lỗi!',
                response.message || 'Có lỗi xảy ra khi xóa diễn viên.',
                'error'
              );
            }
          },
          error: (error) => {
            Swal.fire(
              'Lỗi!',
              'Có lỗi xảy ra khi xóa diễn viên.' + error.message,
              'error'
            );
          }
        });
      }
    });
  }
}