import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { AgeRatingService, AgeRating } from '../../services/age-rating.service';
import { MovieFormatService, MovieFormat } from '../../services/movie-format.service';
import { AgeRatingDialogComponent } from '../movie-age-rating/age-rating-dialog/age-rating-dialog.component';
import { MovieFormatDialogComponent } from '../movie-format/movie-format-dialog/movie-format-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movie-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    NgbTooltipModule
  ],
  templateUrl: './movie-settings.component.html',
  styleUrl: './movie-settings.component.css'
})
export class MovieSettingsComponent implements OnInit {
  // Age Rating properties
  ageRatings: AgeRating[] = [];
  ageRatingCurrentPage = 1;
  ageRatingRecordPerPage = 10;
  ageRatingTotalRecords = 0;
  ageRatingTotalPages = 0;
  ageRatingPages: number[] = [];
  isLoadingAgeRatings = false;

  // Movie Format properties
  movieFormats: MovieFormat[] = [];
  movieFormatCurrentPage = 1;
  movieFormatRecordPerPage = 10;
  movieFormatTotalRecords = 0;
  movieFormatTotalPages = 0;
  movieFormatPages: number[] = [];
  isLoadingMovieFormats = false;

  constructor(
    private ageRatingService: AgeRatingService,
    private movieFormatService: MovieFormatService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadAgeRatings();
    this.loadMovieFormats();
  }

  // Age Rating methods
  loadAgeRatings(): void {
    this.isLoadingAgeRatings = true;
    this.ageRatingService.getAgeRatingList(this.ageRatingCurrentPage, this.ageRatingRecordPerPage).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.ageRatings = response.data;
          this.ageRatingTotalRecords = response.totalRecord;
          this.calculateAgeRatingTotalPages();
        } else {
          Swal.fire('Lỗi', 'Không thể tải danh sách xếp hạng độ tuổi', 'error');
        }
        this.isLoadingAgeRatings = false;
      },
      error: (error) => {
        console.error('Error loading age ratings:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách xếp hạng độ tuổi', 'error');
        this.isLoadingAgeRatings = false;
      }
    });
  }

  calculateAgeRatingTotalPages(): void {
    this.ageRatingTotalPages = Math.ceil(this.ageRatingTotalRecords / this.ageRatingRecordPerPage);
    this.ageRatingPages = Array.from({ length: this.ageRatingTotalPages }, (_, i) => i + 1);
  }

  onAgeRatingPageChange(page: number): void {
    if (page !== this.ageRatingCurrentPage && page >= 1 && page <= this.ageRatingTotalPages) {
      this.ageRatingCurrentPage = page;
      this.loadAgeRatings();
    }
  }

  openAddAgeRatingDialog(): void {
    const dialogRef = this.dialog.open(AgeRatingDialogComponent, {
      width: '600px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAgeRatings();
      }
    });
  }

  editAgeRating(ageRating: AgeRating): void {
    const dialogRef = this.dialog.open(AgeRatingDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        ageRating: { ...ageRating } // Truyền bản sao của đối tượng để tránh tham chiếu
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAgeRatings();
      }
    });
  }

  deleteAgeRating(id: string): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa xếp hạng độ tuổi này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ageRatingService.deleteAgeRating(id).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Xóa xếp hạng độ tuổi thành công', 'success');
              this.loadAgeRatings();
            } else {
              Swal.fire('Lỗi', response.message || 'Xóa xếp hạng độ tuổi thất bại', 'error');
            }
          },
          error: (error) => {
            console.error('Error deleting age rating:', error);
            Swal.fire('Lỗi', 'Xóa xếp hạng độ tuổi thất bại', 'error');
          }
        });
      }
    });
  }

  // Movie Format methods
  loadMovieFormats(): void {
    this.isLoadingMovieFormats = true;
    this.movieFormatService.getMovieFormatList(this.movieFormatCurrentPage, this.movieFormatRecordPerPage).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.movieFormats = response.data;
          this.movieFormatTotalRecords = response.totalRecord;
          this.calculateMovieFormatTotalPages();
        } else {
          Swal.fire('Lỗi', 'Không thể tải danh sách định dạng phim', 'error');
        }
        this.isLoadingMovieFormats = false;
      },
      error: (error) => {
        console.error('Error loading movie formats:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách định dạng phim', 'error');
        this.isLoadingMovieFormats = false;
      }
    });
  }

  calculateMovieFormatTotalPages(): void {
    this.movieFormatTotalPages = Math.ceil(this.movieFormatTotalRecords / this.movieFormatRecordPerPage);
    this.movieFormatPages = Array.from({ length: this.movieFormatTotalPages }, (_, i) => i + 1);
  }

  onMovieFormatPageChange(page: number): void {
    if (page !== this.movieFormatCurrentPage && page >= 1 && page <= this.movieFormatTotalPages) {
      this.movieFormatCurrentPage = page;
      this.loadMovieFormats();
    }
  }

  openAddMovieFormatDialog(): void {
    const dialogRef = this.dialog.open(MovieFormatDialogComponent, {
      width: '600px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMovieFormats();
      }
    });
  }

  editMovieFormat(movieFormat: MovieFormat): void {
    const dialogRef = this.dialog.open(MovieFormatDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        movieFormat: { ...movieFormat } // Truyền bản sao của đối tượng để tránh tham chiếu
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMovieFormats();
      }
    });
  }

  deleteMovieFormat(id: string): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa định dạng phim này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.movieFormatService.deleteMovieFormat(id).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Thành công', 'Xóa định dạng phim thành công', 'success');
              this.loadMovieFormats();
            } else {
              Swal.fire('Lỗi', response.message || 'Xóa định dạng phim thất bại', 'error');
            }
          },
          error: (error) => {
            console.error('Error deleting movie format:', error);
            Swal.fire('Lỗi', 'Xóa định dạng phim thất bại', 'error');
          }
        });
      }
    });
  }
}
