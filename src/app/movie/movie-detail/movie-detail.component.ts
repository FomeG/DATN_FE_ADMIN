import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.css']
})
export class MovieDetailComponent implements OnInit {
  movieId: string = '';
  movie: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  safeTrailerUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.movieId = params['id'];
      this.loadMovieDetails();
    });
  }

  loadMovieDetails(): void {
    this.isLoading = true;
    this.movieService.getMovieById(this.movieId).subscribe({
      next: (response) => {
        if (response.responseCode === 200 && response.data) {
          this.movie = response.data;
          // Sanitize trailer URL for iframe embedding
          if (this.movie.trailer) {
            this.processTrailerUrl(this.movie.trailer);
          }
        } else {
          this.errorMessage = response.message || 'Không thể tải thông tin phim';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading movie details:', error);
        this.errorMessage = 'Đã xảy ra lỗi khi tải thông tin phim';
        this.isLoading = false;
        Swal.fire('Lỗi', 'Không thể tải thông tin phim', 'error');
      }
    });
  }

  processTrailerUrl(url: string): void {
    console.log('Original URL:', url); // Log để debug

    // Kiểm tra nếu URL đã ở dạng embed
    if (url.includes('youtube.com/embed/')) {
      this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      return;
    }

    // Xử lý URL YouTube thông thường
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      }

      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        console.log('Converted embed URL:', embedUrl);
        this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }
    } else {
      // Nếu không phải URL YouTube, dùng trực tiếp
      this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  goBack(): void {
    this.router.navigate(['/movies']);
  }
}