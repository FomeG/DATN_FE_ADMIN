import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MovieFormatService, MovieFormat } from '../../services/movie-format.service';
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
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './movie-format-dialog.component.html',
  styleUrl: './movie-format-dialog.component.css'
})
export class MovieFormatDialogComponent implements OnInit {
  movieFormats: MovieFormat[] = [];
  formatForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  editingFormatId: string | null = null;
  displayedColumns: string[] = ['position', 'name', 'description', 'actions'];
  activeTab = 0; // 0 for list, 1 for add/edit

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
    this.loadMovieFormats();

    // Set active tab based on mode
    if (this.data.mode === 'add') {
      this.activeTab = 1;
    } else {
      this.activeTab = 0;
    }
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
            this.activeTab = 0; // Switch to list tab
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
            this.loadMovieFormats();
            this.activeTab = 0; // Switch to list tab
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

  editMovieFormat(format: MovieFormat): void {
    this.isEditing = true;
    this.editingFormatId = format.formatId;
    this.formatForm.patchValue({
      name: format.name,
      description: format.description
    });
    this.activeTab = 1; // Switch to edit tab
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

  changePage(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.recordPerPage = event.pageSize;
    this.loadMovieFormats();
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    if (index === 0) {
      this.loadMovieFormats();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
