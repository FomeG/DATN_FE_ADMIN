import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MovieFormatService, MovieFormat } from '../../../services/movie-format.service';
import Swal from 'sweetalert2';

export interface MovieFormatDialogData {
  mode: 'add' | 'list';
}

@Component({
  selector: 'app-movie-format-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './movie-format-dialog.component.html',
  styleUrl: './movie-format-dialog.component.css'
})
export class MovieFormatDialogComponent implements OnInit {
  formatForm: FormGroup;
  isLoading = false;
  isEditing = false;
  editingFormatId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private movieFormatService: MovieFormatService,
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<MovieFormatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovieFormatDialogData
  ) {
    this.formatForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    // Khởi tạo form với giá trị mặc định hoặc giá trị chỉnh sửa
    if (this.data.mode === 'add') {
      this.isEditing = false;
    }
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
            this.dialogRef.close(true); // Close with success
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
            this.dialogRef.close(true); // Close with success
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

  // Phương thức này không còn cần thiết vì không còn tab danh sách
  // Chỉ giữ lại để tương thích với các component khác nếu cần
  editMovieFormat(format: MovieFormat): void {
    this.isEditing = true;
    this.editingFormatId = format.formatId;
    this.formatForm.patchValue({
      name: format.name,
      description: format.description
    });
  }

  // Phương thức này không còn cần thiết vì không còn tab danh sách
  // Chỉ giữ lại để tương thích với các component khác nếu cần
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
              this.dialogRef.close(true); // Đóng dialog và trả về kết quả thành công
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
    this.formatForm.reset({
      name: '',
      description: ''
    });
    this.isEditing = false;
    this.editingFormatId = null;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
