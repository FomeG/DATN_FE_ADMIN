import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService, Movie } from '../services/movie.service';
import { AddMovieModalComponent } from '../add-movie-modal/add-movie-modal.component';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movie-management',
  standalone: true,
  imports: [CommonModule, AddMovieModalComponent],
  templateUrl: './movie-management.component.html',
  styleUrls: ['./movie-management.component.css']
})
export class MovieManagementComponent implements OnInit {
  movies: Movie[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];

  constructor(
    private movieService: MovieService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadMovies();
  }

  loadMovies() {
    this.movieService.getMovieList(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.movies = response.data;
          this.totalRecords = response.totalRecord;
          this.calculateTotalPages();
        },
        error: (error) => {
          console.error('Error loading movies:', error);
        }
      });
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMovies();
    }
  }

  onMovieAdded() {
    this.loadMovies();
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



}