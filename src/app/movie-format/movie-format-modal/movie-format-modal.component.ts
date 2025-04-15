import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovieFormatService, MovieFormat } from '../../services/movie-format.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movie-format-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './movie-format-modal.component.html',
  styleUrl: './movie-format-modal.component.css'
})
export class MovieFormatModalComponent implements OnInit {
  @Input() mode: 'add' | 'list' = 'list';
  @Output() formatChanged = new EventEmitter<void>();

  movieFormats: MovieFormat[] = [];
  formatForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  editingFormatId: string | null = null;
  Math = Math; // Thêm Math để sử dụng trong template
  formatNameInput = ''; // Biến để lưu giá trị input tên
  formatDescriptionInput = ''; // Biến để lưu giá trị input mô tả

  constructor(
    private fb: FormBuilder,
    private movieFormatService: MovieFormatService
  ) {
    this.formatForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadMovieFormats();

    // Theo dõi sự thay đổi của formatNameInput để cập nhật form control
    this.formatForm.get('name')?.valueChanges.subscribe(value => {
      if (value !== this.formatNameInput) {
        this.formatNameInput = value;
      }
    });

    // Theo dõi sự thay đổi của formatDescriptionInput để cập nhật form control
    this.formatForm.get('description')?.valueChanges.subscribe(value => {
      if (value !== this.formatDescriptionInput) {
        this.formatDescriptionInput = value;
      }
    });
  }

  loadMovieFormats(): void {
    this.isLoading = true;
    this.movieFormatService.getMovieFormatList(this.currentPage, this.recordPerPage).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.movieFormats = response.data;
          this.totalRecords = response.totalRecord;
        } else {
          Swal.fire('Lỗi', 'Không thể tải danh sách định dạng phim', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading movie formats:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách định dạng phim', 'error');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.formatForm.invalid) {
      this.formatForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.formatForm.value;

    if (this.isEditing && this.editingFormatId) {
      // Update existing movie format
      const updateData = {
        formatId: this.editingFormatId,
        name: formData.name,
        description: formData.description,
        status: 1
      };

      this.movieFormatService.updateMovieFormat(updateData).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            Swal.fire('Thành công', 'Cập nhật định dạng phim thành công', 'success');
            this.resetForm();
            this.loadMovieFormats();
            this.formatChanged.emit();
          } else {
            Swal.fire('Lỗi', response.message || 'Không thể cập nhật định dạng phim', 'error');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating movie format:', error);
          Swal.fire('Lỗi', 'Không thể cập nhật định dạng phim', 'error');
          this.isLoading = false;
        }
      });
    } else {
      // Create new movie format
      const createData = {
        name: formData.name,
        description: formData.description
      };

      this.movieFormatService.createMovieFormat(createData).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            Swal.fire('Thành công', 'Thêm định dạng phim thành công', 'success');
            this.resetForm();
            this.loadMovieFormats();
            this.formatChanged.emit();
          } else {
            Swal.fire('Lỗi', response.message || 'Không thể thêm định dạng phim', 'error');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating movie format:', error);
          Swal.fire('Lỗi', 'Không thể thêm định dạng phim', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  editMovieFormat(format: MovieFormat): void {
    this.isEditing = true;
    this.editingFormatId = format.formatId;
    this.formatNameInput = format.name; // Cập nhật giá trị input tên
    this.formatDescriptionInput = format.description; // Cập nhật giá trị input mô tả
    this.formatForm.patchValue({
      name: format.name,
      description: format.description
    });
  }

  deleteMovieFormat(formatId: string): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa định dạng phim này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.movieFormatService.deleteMovieFormat(formatId).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Xóa định dạng phim thành công', 'success');
              this.loadMovieFormats();
              this.formatChanged.emit();
            } else {
              Swal.fire('Lỗi', response.message || 'Không thể xóa định dạng phim', 'error');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error deleting movie format:', error);
            Swal.fire('Lỗi', 'Không thể xóa định dạng phim', 'error');
            this.isLoading = false;
          }
        });
      }
    });
  }

  resetForm(): void {
    // Đặt lại giá trị input
    this.formatNameInput = '';
    this.formatDescriptionInput = '';

    // Sử dụng patchValue thay vì reset để tránh các vấn đề với form control
    this.formatForm.patchValue({
      name: '',
      description: ''
    });

    // Đặt lại trạng thái touched/dirty của các control
    Object.keys(this.formatForm.controls).forEach(key => {
      const control = this.formatForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });

    this.isEditing = false;
    this.editingFormatId = null;
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadMovieFormats();
  }
}
