import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgeRatingService, AgeRating } from '../../services/age-rating.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-age-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './age-rating-modal.component.html',
  styleUrl: './age-rating-modal.component.css'
})
export class AgeRatingModalComponent implements OnInit {
  @Input() mode: 'add' | 'list' = 'list';
  @Output() ageRatingChanged = new EventEmitter<void>();

  ageRatings: AgeRating[] = [];
  ageRatingForm: FormGroup;
  isLoading = false;
  isEditing = false;
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  editingAgeRatingId: string | null = null;
  Math = Math; // Thêm Math để sử dụng trong template
  ratingCodeInput = ''; // Biến để lưu giá trị input mã xếp hạng
  ratingDescriptionInput = ''; // Biến để lưu giá trị input mô tả

  constructor(
    private fb: FormBuilder,
    private ageRatingService: AgeRatingService
  ) {
    this.ageRatingForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      minimumAge: [0, [Validators.required, Validators.min(0), Validators.max(21)]]
    });
  }

  ngOnInit(): void {
    this.loadAgeRatings();

    // Theo dõi sự thay đổi của ratingCodeInput để cập nhật form control
    this.ageRatingForm.get('code')?.valueChanges.subscribe(value => {
      if (value !== this.ratingCodeInput) {
        this.ratingCodeInput = value;
      }
    });

    // Theo dõi sự thay đổi của ratingDescriptionInput để cập nhật form control
    this.ageRatingForm.get('description')?.valueChanges.subscribe(value => {
      if (value !== this.ratingDescriptionInput) {
        this.ratingDescriptionInput = value;
      }
    });
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
            this.ageRatingChanged.emit();
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
            this.ageRatingChanged.emit();
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
    this.ratingCodeInput = ageRating.code; // Cập nhật giá trị input mã
    this.ratingDescriptionInput = ageRating.description; // Cập nhật giá trị input mô tả
    this.ageRatingForm.patchValue({
      code: ageRating.code,
      description: ageRating.description,
      minimumAge: ageRating.minAge
    });
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
              this.ageRatingChanged.emit();
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
    // Đặt lại giá trị input
    this.ratingCodeInput = '';
    this.ratingDescriptionInput = '';

    // Sử dụng patchValue thay vì reset để tránh các vấn đề với form control
    this.ageRatingForm.patchValue({
      code: '',
      description: '',
      minimumAge: 0
    });

    // Đặt lại trạng thái touched/dirty của các control
    Object.keys(this.ageRatingForm.controls).forEach(key => {
      const control = this.ageRatingForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });

    this.isEditing = false;
    this.editingAgeRatingId = null;
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadAgeRatings();
  }
}
