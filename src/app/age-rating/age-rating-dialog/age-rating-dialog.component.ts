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
import { AgeRatingService, AgeRating } from '../../services/age-rating.service';
import Swal from 'sweetalert2';

export interface AgeRatingDialogData {
  mode: 'add' | 'list';
}

@Component({
  selector: 'app-age-rating-dialog',
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
  templateUrl: './age-rating-dialog.component.html',
  styleUrl: './age-rating-dialog.component.css'
})
export class AgeRatingDialogComponent implements OnInit {
  ageRatings: AgeRating[] = [];
  ageRatingForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  editingAgeRatingId: string | null = null;
  displayedColumns: string[] = ['position', 'code', 'minAge', 'description', 'actions'];
  activeTab = 0; // 0 for list, 1 for add/edit

  constructor(
    private fb: FormBuilder,
    private ageRatingService: AgeRatingService,
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<AgeRatingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AgeRatingDialogData
  ) {
    this.ageRatingForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      minimumAge: [0, [Validators.required, Validators.min(0), Validators.max(21)]]
    });
  }

  ngOnInit(): void {
    this.loadAgeRatings();

    // Set active tab based on mode
    if (this.data.mode === 'add') {
      this.activeTab = 1;
    } else {
      this.activeTab = 0;
    }
  }

  loadAgeRatings(): void {
    this.isLoading = true;
    this.ageRatingService.getAgeRatingList(this.currentPage, this.recordPerPage).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.ageRatings = response.data;
          this.totalRecords = response.totalRecord;
        } else {
          Swal.fire('Lỗi', 'Không thể tải danh sách xếp hạng độ tuổi', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading age ratings:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách xếp hạng độ tuổi', 'error');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.ageRatingForm.invalid) {
      this.ageRatingForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.ageRatingForm.value;

    if (this.isEditing && this.editingAgeRatingId) {
      // Update existing age rating
      const updateData = {
        ageRatingId: this.editingAgeRatingId,
        code: formData.code,
        description: formData.description,
        minimumAge: formData.minimumAge,
        status: 1
      };

      this.ageRatingService.updateAgeRating(updateData).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            Swal.fire('Thành công', 'Cập nhật xếp hạng độ tuổi thành công', 'success');
            this.resetForm();
            this.loadAgeRatings();
            this.activeTab = 0; // Switch to list tab
            this.dialogRef.close(true); // Close with success
          } else {
            Swal.fire('Lỗi', response.message || 'Không thể cập nhật xếp hạng độ tuổi', 'error');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating age rating:', error);
          Swal.fire('Lỗi', 'Không thể cập nhật xếp hạng độ tuổi', 'error');
          this.isLoading = false;
        }
      });
    } else {
      // Create new age rating
      const createData = {
        code: formData.code,
        description: formData.description,
        minimumAge: formData.minimumAge
      };

      this.ageRatingService.createAgeRating(createData).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            Swal.fire('Thành công', 'Thêm xếp hạng độ tuổi thành công', 'success');
            this.resetForm();
            this.loadAgeRatings();
            this.activeTab = 0; // Switch to list tab
            this.dialogRef.close(true); // Close with success
          } else {
            Swal.fire('Lỗi', response.message || 'Không thể thêm xếp hạng độ tuổi', 'error');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating age rating:', error);
          Swal.fire('Lỗi', 'Không thể thêm xếp hạng độ tuổi', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  editAgeRating(ageRating: AgeRating): void {
    this.isEditing = true;
    this.editingAgeRatingId = ageRating.ageRatingId;
    this.ageRatingForm.patchValue({
      code: ageRating.code,
      description: ageRating.description,
      minimumAge: ageRating.minAge
    });
    this.activeTab = 1; // Switch to edit tab
  }

  deleteAgeRating(ageRatingId: string): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa xếp hạng độ tuổi này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.ageRatingService.deleteAgeRating(ageRatingId).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Xóa xếp hạng độ tuổi thành công', 'success');
              this.loadAgeRatings();
            } else {
              Swal.fire('Lỗi', response.message || 'Không thể xóa xếp hạng độ tuổi', 'error');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error deleting age rating:', error);
            Swal.fire('Lỗi', 'Không thể xóa xếp hạng độ tuổi', 'error');
            this.isLoading = false;
          }
        });
      }
    });
  }

  resetForm(): void {
    this.ageRatingForm.reset({
      code: '',
      description: '',
      minimumAge: 0
    });
    this.isEditing = false;
    this.editingAgeRatingId = null;
  }

  changePage(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.recordPerPage = event.pageSize;
    this.loadAgeRatings();
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    if (index === 0) {
      this.loadAgeRatings();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
