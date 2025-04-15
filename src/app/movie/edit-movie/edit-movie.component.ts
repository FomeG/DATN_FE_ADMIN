import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { ActorService, Actor } from '../../services/actor.service';
import { GenreService, Genre } from '../../services/genre.service';
import { AgeRatingService, AgeRating } from '../../services/age-rating.service';
import { MovieFormatService, MovieFormat } from '../../services/movie-format.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';






import Swal from 'sweetalert2';

declare var $: any; // Để sử dụng jQuery với Dropify

@Component({
  selector: 'app-edit-movie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './edit-movie.component.html',
  styleUrls: ['./edit-movie.component.css']
})
export class EditMovieComponent implements OnInit {
  movieForm: FormGroup;
  movieId: string = '';
  isLoading = false;
  actors: any[] = [];
  filteredActors: Actor[] = [];
  selectedActors: any[] = [];
  selectedThumbnail: File | null = null;
  selectedTrailer: File | null = null;
  selectedBanner: File | null = null;

  // Genre properties
  genres: Genre[] = [];
  filteredGenres: Genre[] = [];
  selectedGenres: Genre[] = [];
  genreSearchTerm: string = '';
  showGenreDropdown: boolean = false;

  // Age Rating properties
  ageRatings: AgeRating[] = [];
  selectedAgeRatingId: string = '';

  // Movie Format properties
  movieFormats: MovieFormat[] = [];
  selectedFormats: MovieFormat[] = [];
  filteredFormats: MovieFormat[] = [];
  formatSearchTerm: string = '';
  showFormatDropdown: boolean = false;

  searchTerm: string = '';
  showDropdown: boolean = false;




  // Thêm vào class EditMovieComponent
  movie: any; // Thông tin phim hiện tại
  thumbnailPreviewUrl: string | null = null;
  bannerPreviewUrl: string | null = null;
  trailerPreviewUrl: string | null = null;
  safeTrailerUrl: SafeResourceUrl | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private actorService: ActorService,
    private genreService: GenreService,
    private ageRatingService: AgeRatingService,
    private movieFormatService: MovieFormatService,
    private sanitizer: DomSanitizer
  ) {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      status: [1],
      listActorID: [[]],
      listGenreID: [[]],
      ageRatingId: [''],
      listFormatID: [[]]
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadAgeRatings();
    this.loadMovieFormats();

    // Đầu tiên, tải chi tiết phim
    this.route.params.subscribe(params => {
      this.movieId = params['id'];

      // Tải chi tiết phim trước
      this.movieService.getMovieById(this.movieId).subscribe({
        next: (response) => {
          if (response.data) {
            const movieData = response.data;
            this.movieForm.patchValue({
              movieName: movieData.movieName,
              description: movieData.description,
              duration: movieData.duration,
              releaseDate: movieData.releaseDate instanceof Date ? movieData.releaseDate.toISOString().split('T')[0] : String(movieData.releaseDate).split('T')[0],
              status: movieData.status,
              ageRatingId: movieData.ageRatingId || ''
            });

            // Cập nhật danh sách diễn viên từ listdienvien
            this.selectedActors = movieData.listdienvien ? movieData.listdienvien.map((dv: any) => ({
              id: dv.id,
              name: dv.name,
              photo: dv.photo
            })) : [];

            // Cập nhật danh sách định dạng phim từ formats
            this.selectedFormats = movieData.formats ? movieData.formats.map((f: any) => ({
              formatId: f.formatId,
              name: f.name,
              description: f.description,
              status: 1
            })) : [];

            // Update listActorID control
            this.updateFormActorIds();

            // Cập nhật danh sách thể loại từ genres
            this.selectedGenres = movieData.genres ? movieData.genres.map((g: any) => ({
              id: g.id,
              genreName: g.genreName,
              status: g.status
            })) : [];

            // Update listGenreID control
            this.updateFormGenreIds();

            // Update listFormatID control
            this.updateFormFormatIds();

            // Sau khi có dữ liệu phim, mới tải diễn viên và thể loại
            this.loadActors();
            this.loadGenres();
            this.filterFormats();

          }
        },
        error: (error) => {
          console.error('Error loading movie details:', error);
          Swal.fire('Lỗi!', 'Không thể tải thông tin phim', 'error');
        }
      });
    });



  }

  // Initialize form
  private initForm() {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      status: [1],
      listActorID: [[]],
      listGenreID: [[]],
      ageRatingId: [''],
      listFormatID: [[]]
    });
  }

  // Load age ratings
  loadAgeRatings() {
    this.ageRatingService.getAgeRatingList(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.ageRatings = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading age ratings:', error);
        Swal.fire('Lỗi!', 'Không thể tải danh sách xếp hạng độ tuổi', 'error');
      }
    });
  }

  // Load movie formats
  loadMovieFormats() {
    this.movieFormatService.getMovieFormatList(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.movieFormats = response.data;
          this.filterFormats();
        }
      },
      error: (error) => {
        console.error('Error loading movie formats:', error);
        Swal.fire('Lỗi!', 'Không thể tải danh sách định dạng phim', 'error');
      }
    });
  }

  loadGenres() {
    this.genreService.getGenres(1, 1000).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.genres = response.data;
          // Lọc ra các thể loại chưa được chọn
          this.filterGenres();
        }
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        Swal.fire('Lỗi!', 'Không thể tải danh sách thể loại', 'error');
      }
    });
  }

  // Filter genres
  filterGenres() {
    if (!this.genreSearchTerm) {
      this.filteredGenres = this.genres.filter(genre =>
        !this.selectedGenres.some(selected => selected.id === genre.id)
      );
    } else {
      this.filteredGenres = this.genres.filter(genre =>
        genre.genreName.toLowerCase().includes(this.genreSearchTerm.toLowerCase()) &&
        !this.selectedGenres.some(selected => selected.id === genre.id)
      );
    }
    this.showGenreDropdown = false;
  }



  // Select a genre
  selectGenre(genre: Genre) {
    if (!this.selectedGenres.some(selected => selected.id === genre.id)) {
      this.selectedGenres.push(genre);
      this.genreSearchTerm = '';
      this.filterGenres(); // Cập nhật lại danh sách đã lọc
      this.updateFormGenreIds();
    }
  }

  // Remove a genre
  removeGenre(genre: Genre) {
    this.selectedGenres = this.selectedGenres.filter(g => g.id !== genre.id);
    this.filterGenres(); // Cập nhật lại danh sách đã lọc sau khi xóa
    this.updateFormGenreIds();
  }

  // Update form genre IDs
  private updateFormGenreIds() {
    const genreIds = this.selectedGenres.map(genre => genre.id);
    this.movieForm.patchValue({ listGenreID: genreIds });
  }

  // Sửa phương thức onFileSelect để tạo URL preview
  onFileSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {

      switch (type) {
        case 'thumbnail':
          this.selectedThumbnail = file;
          // Tạo URL xem trước
          this.thumbnailPreviewUrl = URL.createObjectURL(file);
          break;
        case 'trailer':
          this.selectedTrailer = file;
          // Tạo URL xem trước
          this.trailerPreviewUrl = URL.createObjectURL(file);
          break;
        case 'banner':
          this.selectedBanner = file;
          // Tạo URL xem trước
          this.bannerPreviewUrl = URL.createObjectURL(file);
          break;

      }
    }
  }

  // Sửa lại phương thức loadMovieDetails()
  loadMovieDetails() {
    if (this.movieId) {
      this.movieService.getMovieById(this.movieId).subscribe({
        next: (response) => {
          if (response.data) {
            const movieData = response.data;
            this.movieForm.patchValue({
              movieName: movieData.movieName,
              description: movieData.description,
              duration: movieData.duration,
              releaseDate: movieData.releaseDate instanceof Date ? movieData.releaseDate.toISOString().split('T')[0] : String(movieData.releaseDate).split('T')[0],
              status: movieData.status
            });

            // Xử lý trailer URL nếu có
            if (movieData.trailer) {
              this.processTrailerUrl(movieData.trailer);
            }

            // Cập nhật danh sách diễn viên từ listdienvien
            this.selectedActors = movieData.listdienvien ? movieData.listdienvien.map((dv: any) => ({
              id: dv.id,
              name: dv.name,
              photo: dv.photo
            })) : [];

            // Update listActorID control
            this.updateFormActorIds();

            // Cập nhật lại danh sách diễn viên đã lọc
            this.filterActors();

            // Cập nhật danh sách thể loại từ genres
            this.selectedGenres = movieData.genres ? movieData.genres.map((g: any) => ({
              id: g.id,
              genreName: g.genreName,
              status: g.status
            })) : [];

            // Update listGenreID control
            this.updateFormGenreIds();

            // Cập nhật lại danh sách thể loại đã lọc
            this.filterGenres();



            this.loadActors();
            this.loadGenres();

          }
        },
        error: (error) => {
          console.error('Error loading movie details:', error);
          Swal.fire('Lỗi!', 'Không thể tải thông tin phim', 'error');
        }
      });
    }
  }





  // Thêm phương thức để xử lý trailer URL
  processTrailerUrl(url: string): void {
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
        this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }
    } else {
      // Nếu không phải URL YouTube, dùng trực tiếp nếu là file
      if (url.startsWith('http')) {
        this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    }
  }
  loadActors() {
    this.actorService.getActors(1, 99999).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.actors = response.data;
          // Lọc ra các diễn viên chưa được chọn
          this.filterActors();
        }
      },
      error: (error) => {
        console.error('Error loading actors:', error);
        Swal.fire('Lỗi!', 'Không thể tải danh sách diễn viên', 'error');
      }
    });
  }

  filterActors() {
    if (!this.searchTerm) {
      this.filteredActors = this.actors.filter(actor =>
        !this.selectedActors.some(selected => selected.id === actor.id)
      );
    } else {
      this.filteredActors = this.actors.filter(actor =>
        actor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
        !this.selectedActors.some(selected => selected.id === actor.id)
      );
    }
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const element = event.target as HTMLElement;
    if (!element.closest('.actor-dropdown') && !element.closest('.genre-dropdown') &&
        !element.closest('.format-dropdown') &&
        !element.closest('input[placeholder="Tìm kiếm diễn viên..."]') &&
        !element.closest('input[placeholder="Tìm kiếm thể loại..."]') &&
        !element.closest('input[placeholder="Tìm kiếm định dạng phim..."]')) {
      this.showDropdown = false;
      this.showGenreDropdown = false;
      this.showFormatDropdown = false;
    }
  }

  selectActor(actor: Actor) {
    if (!this.selectedActors.some(selected => selected.id === actor.id)) {
      this.selectedActors.push(actor);
      this.searchTerm = '';
      this.filterActors(); // Cập nhật lại danh sách đã lọc
      this.updateFormActorIds();
    }
  }

  removeActor(actor: Actor) {
    this.selectedActors = this.selectedActors.filter(a => a.id !== actor.id);
    this.filterActors(); // Cập nhật lại danh sách đã lọc sau khi xóa
    this.updateFormActorIds();
  }

  private updateFormActorIds() {
    const actorIds = this.selectedActors.map(actor => actor.id);
    this.movieForm.patchValue({ listActorID: actorIds });
  }

  // Filter formats
  filterFormats() {
    if (!this.formatSearchTerm) {
      this.filteredFormats = this.movieFormats.filter(format =>
        !this.selectedFormats.some(selected => selected.formatId === format.formatId)
      );
    } else {
      this.filteredFormats = this.movieFormats.filter(format =>
        format.name.toLowerCase().includes(this.formatSearchTerm.toLowerCase()) &&
        !this.selectedFormats.some(selected => selected.formatId === format.formatId)
      );
    }
    this.showFormatDropdown = false;
  }

  // Select a format
  selectFormat(format: MovieFormat) {
    if (!this.selectedFormats.some(selected => selected.formatId === format.formatId)) {
      this.selectedFormats.push(format);
      this.formatSearchTerm = '';
      this.filterFormats();
      this.updateFormFormatIds();
    }
  }

  // Remove a format
  removeFormat(format: MovieFormat) {
    this.selectedFormats = this.selectedFormats.filter(f => f.formatId !== format.formatId);
    this.filterFormats();
    this.updateFormFormatIds();
  }

  // Update form format IDs
  private updateFormFormatIds() {
    const formatIds = this.selectedFormats.map(format => format.formatId);
    this.movieForm.patchValue({ listFormatID: formatIds });
  }

  goBack() {
    this.router.navigate(['/movies']);
  }


  onSubmit() {
    if (this.movieForm.valid) {
      this.isLoading = true;

      const formData = new FormData();
      formData.append('MovieId', this.movieId);
      formData.append('MovieName', this.movieForm.get('movieName')?.value);
      formData.append('Description', this.movieForm.get('description')?.value);
      formData.append('Duration', this.movieForm.get('duration')?.value);
      formData.append('ReleaseDate', this.movieForm.get('releaseDate')?.value);
      formData.append('Status', this.movieForm.get('status')?.value);

      // Thêm AgeRatingId nếu có
      if (this.movieForm.get('ageRatingId')?.value) {
        formData.append('AgeRatingId', this.movieForm.get('ageRatingId')?.value);
      }

      // Thêm danh sách diễn viên và thể loại
      const actorIds = this.selectedActors.map(actor => actor.id);
      const genreIds = this.selectedGenres.map(genre => genre.id);
      const formatIds = this.selectedFormats.map(format => format.formatId);

      formData.append('ListActorID', JSON.stringify(actorIds));
      formData.append('ListGenreID', JSON.stringify(genreIds));
      formData.append('ListFormatID', JSON.stringify(formatIds));

      // Thêm các file
      if (this.selectedThumbnail) {
        formData.append('Thumbnail', this.selectedThumbnail);
      }

      if (this.selectedTrailer) {
        formData.append('Trailer', this.selectedTrailer);
      }

      if (this.selectedBanner) {
        formData.append('Banner', this.selectedBanner); // Thêm banner vào formData
      }

      // Gọi service để cập nhật
      this.movieService.updateMovie(this.movieId, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.responseCode === 200) {
            Swal.fire('Thành công!', 'Cập nhật phim thành công', 'success').then(() => {
              this.router.navigate(['/movies']);
            });
          } else {
            Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi cập nhật phim', 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire('Lỗi!', 'Có lỗi xảy ra khi cập nhật phim', 'error');
          console.error(err);
        }
      });
    }
  }





  // Thêm phương thức ngOnDestroy để dọn dẹp các URL đã tạo
  ngOnDestroy() {
    // Dọn dẹp các URL đã tạo
    if (this.thumbnailPreviewUrl) {
      URL.revokeObjectURL(this.thumbnailPreviewUrl);
    }
    if (this.trailerPreviewUrl) {
      URL.revokeObjectURL(this.trailerPreviewUrl);
    }
    if (this.bannerPreviewUrl) {
      URL.revokeObjectURL(this.bannerPreviewUrl);
    }
  }


}