import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService, Movie } from '../../services/movie.service';
import { AddMovieModalComponent } from '../add-movie-modal/add-movie-modal.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-movie-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, AddMovieModalComponent],
  templateUrl: './movie-management.component.html',
  styleUrls: ['./movie-management.component.css']
})
export class MovieManagementComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  searchTerm: string = '';
  isLoading = false;

  // Sorting properties
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // All movies cache for client-side operations
  allMovies: Movie[] = [];

  constructor(
    private movieService: MovieService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadMovies();
  }

  loadMovies() {
    this.isLoading = true;
    this.movieService.getMovieList(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.movies = response.data;
          this.filteredMovies = [...this.movies];
          this.totalRecords = response.totalRecord;
          this.calculateTotalPages();

          // If we haven't cached all movies yet, load them all
          if (this.allMovies.length === 0) {
            this.loadAllMovies();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading movies:', error);
          this.isLoading = false;
        }
      });
  }

  // Load all movies for client-side operations
  loadAllMovies() {
    this.isLoading = true;
    // We'll use a large enough page size to get all movies in one request
    // Adjust this based on your total movie count
    this.movieService.getMovieList(1, 1000)
      .subscribe({
        next: (response) => {
          this.allMovies = response.data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading all movies:', error);
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
        this.loadMovies();
      }
    }
  }

  onMovieAdded() {
    this.loadMovies();
    this.loadAllMovies(); // Refresh the all movies cache too
  }

  onEditMovie(movieId: string) {
    this.router.navigate([`/movies/edit/${movieId}`]);
  }

  onDeleteMovie(movieId: string) {
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
        this.movieService.deleteMovie(movieId).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire(
                'Đã xóa!',
                'Phim đã được xóa thành công.',
                'success'
              );
              this.loadMovies();
              this.loadAllMovies(); // Refresh the all movies cache too
            } else {
              Swal.fire(
                'Lỗi!',
                response.message || 'Có lỗi xảy ra khi xóa phim.',
                'error'
              );
            }
          },
          error: (error) => {
            Swal.fire(
              'Lỗi!',
              'Có lỗi xảy ra khi xóa phim.' + error.message,
              'error'
            );
          }
        });
      }
    });
  }

  onViewMovieDetails(movieId: string) {
    this.router.navigate([`/movies/detail/${movieId}`]);
  }

  navigateToSettings() {
    this.router.navigate(['/movies/settings']);
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

  applyFilters() {
    this.isLoading = true;
    // 1. Filter by search term
    let result = [...this.allMovies];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(movie =>
        movie.movieName.toLowerCase().includes(term) ||
        movie.description.toLowerCase().includes(term)
      );
    }

    // 2. Sort if needed
    if (this.sortColumn) {
      result.sort((a: any, b: any) => {
        let valueA = a[this.sortColumn];
        let valueB = b[this.sortColumn];

        // Handle dates
        if (this.sortColumn === 'releaseDate') {
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
    this.filteredMovies = result.slice(startIndex, startIndex + this.recordPerPage);
    this.isLoading = false;
  }

  // Helper method to get column sort icon
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort'; // Default icon
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }


  // Add this method to your component class
  minValue(a: number, b: number): number {
    return a < b ? a : b;
  }





  // Phương thức xử lý khi thay đổi số bản ghi mỗi trang
  onRecordsPerPageChange() {
    this.currentPage = 1; // Reset về trang đầu tiên

    if (this.searchTerm || this.sortColumn) {
      // Nếu đang tìm kiếm hoặc sắp xếp (client-side), cập nhật lại kết quả
      this.applyFilters();
    } else {
      // Nếu không, tải lại từ server với số bản ghi mới
      this.loadMovies();
    }
  }
}