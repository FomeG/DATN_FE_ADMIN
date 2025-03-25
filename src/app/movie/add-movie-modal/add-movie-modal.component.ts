import { Component, OnInit, Output, EventEmitter, HostListener, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { ActorService, Actor } from '../../services/actor.service';
import { GenreService, Genre } from '../../services/genre.service';
import Swal from 'sweetalert2'; // Thêm import này

declare var $: any; // Để sử dụng jQuery với Dropify

@Component({
  selector: 'app-add-movie-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-movie-modal.component.html',
  styleUrls: ['./add-movie-modal.component.css']
})
export class AddMovieModalComponent implements OnInit {
  @Output() movieAdded = new EventEmitter<void>();

  movieForm: FormGroup;
  actors: Actor[] = [];
  filteredActors: Actor[] = [];
  selectedActors: Actor[] = [];
  searchTerm: string = '';
  showDropdown: boolean = false;
  genres: Genre[] = [];
  filteredGenres: Genre[] = [];
  selectedGenres: Genre[] = [];
  genreSearchTerm: string = '';
  showGenreDropdown: boolean = false;

  selectedThumbnail: File | null = null;
  selectedBanner: File | null = null;
  selectedTrailer: File | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private movieService: MovieService,
    private actorService: ActorService,
    private genreService: GenreService
  ) {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      status: [1],
      listActorID: [[]],
      listGenreID: [[]]
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadActors();
    this.loadGenres();
  }

  loadGenres() {
    this.genreService.getGenres(1, 1000).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.genres = response.data;
          this.filteredGenres = this.genres.filter(genre =>
            !this.selectedGenres.some(selected => selected.id === genre.id)
          );
        }
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        this.errorMessage = 'Không thể tải danh sách thể loại';
      }
    });
  }

  filterGenres() {
    if (!this.genreSearchTerm.trim()) {
      this.filteredGenres = this.genres.filter(genre =>
        !this.selectedGenres.some(selected => selected.id === genre.id)
      );
    } else {
      this.filteredGenres = this.genres.filter(genre =>
        genre.genreName.toLowerCase().includes(this.genreSearchTerm.toLowerCase()) &&
        !this.selectedGenres.some(selected => selected.id === genre.id)
      );
    }
    this.showGenreDropdown = true;
  }

  selectGenre(genre: Genre) {
    if (!this.selectedGenres.some(selected => selected.id === genre.id)) {
      this.selectedGenres.push(genre);
      this.genreSearchTerm = '';
      this.showGenreDropdown = false;
      this.updateFormGenreIds();
    }
  }

  removeGenre(genre: Genre) {
    this.selectedGenres = this.selectedGenres.filter(g => g.id !== genre.id);
    this.updateFormGenreIds();
  }

  private updateFormGenreIds() {
    const genreIds = this.selectedGenres.map(genre => genre.id);
    this.movieForm.patchValue({
      listGenreID: genreIds
    });
  }

  ngAfterViewInit() {
    // Khởi tạo Dropify
    $('.dropify').dropify({
      messages: {
        default: 'Kéo và thả file vào đây hoặc click để chọn',
        replace: 'Kéo và thả hoặc click để thay thế',
        remove: 'Xóa',
        error: 'Có lỗi xảy ra'
      }
    });
  }

  loadActors() {
    this.actorService.getActors(1, 99999).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.actors = response.data;
          this.filteredActors = this.actors.filter(actor =>
            !this.selectedActors.some(selected => selected.id === actor.id)
          );
        }
      },
      error: (error) => {
        console.error('Error loading actors:', error);
        this.errorMessage = 'Không thể tải danh sách diễn viên';
      }
    });
  }

  filterActors() {
    if (!this.searchTerm.trim()) {
      // Khi không có từ khóa tìm kiếm, hiển thị tất cả actors chưa được chọn
      this.filteredActors = this.actors.filter(actor =>
        !this.selectedActors.some(selected => selected.id === actor.id)
      );
    } else {
      // Lọc theo từ khóa và loại bỏ các actors đã được chọn
      this.filteredActors = this.actors.filter(actor =>
        actor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
        !this.selectedActors.some(selected => selected.id === actor.id)
      );
    }
    this.showDropdown = true;
  }

  // Thêm click outside handler để đóng dropdown
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const element = event.target as HTMLElement;
    if (!element.closest('.actor-dropdown') && !element.closest('.genre-dropdown') && 
        !element.closest('input[placeholder="Tìm kiếm diễn viên..."]') && 
        !element.closest('input[placeholder="Tìm kiếm thể loại..."]')) {
      this.showDropdown = false;
      this.showGenreDropdown = false;
    }
  }

  selectActor(actor: Actor) {
    if (!this.selectedActors.some(selected => selected.id === actor.id)) {
      this.selectedActors.push(actor);
      this.searchTerm = '';
      this.showDropdown = false;
      this.updateFormActorIds();
    }
  }

  removeActor(actor: Actor) {
    this.selectedActors = this.selectedActors.filter(a => a.id !== actor.id);
    this.updateFormActorIds();
  }

  private updateFormActorIds() {
    const actorIds = this.selectedActors.map(actor => actor.id);
    this.movieForm.patchValue({ listActorID: actorIds });
  }

  onFileSelect(event: any, type: string) {
    // Lấy file từ target của event hoặc từ sự kiện dropify
    let file: File | null = null;

    // Kiểm tra nếu là sự kiện từ dropify
    if (event.target && event.target.files && event.target.files[0]) {
      file = event.target.files[0];
    }

    if (file) {
      console.log(`Selected ${type} file:`, file.name);
      switch (type) {
        case 'thumbnail':
          this.selectedThumbnail = file;
          break;
        case 'banner':
          this.selectedBanner = file;
          break;
        case 'trailer':
          this.selectedTrailer = file;
          break;
      }
    }
  }

  closeModal() {
    const modalElement = document.getElementById('addMovieModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.hide();
    }
  }

  onSubmit() {
    if (this.movieForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formData = new FormData();
      
      // Add form fields
      formData.append('movieName', this.movieForm.value.movieName);
      formData.append('description', this.movieForm.value.description);
      formData.append('duration', this.movieForm.value.duration);
      formData.append('releaseDate', this.movieForm.value.releaseDate);
      formData.append('status', this.movieForm.value.status);
      
      // Add files if selected
      if (this.selectedThumbnail) {
        formData.append('thumbnail', this.selectedThumbnail);
      }
      
      if (this.selectedBanner) {
        formData.append('banner', this.selectedBanner);
      }
      
      if (this.selectedTrailer) {
        formData.append('trailer', this.selectedTrailer);
      }
      
      // Add actor IDs
      if (this.selectedActors && this.selectedActors.length > 0) {
        this.selectedActors.forEach(actor => {
          formData.append('listActorID', actor.id);
        });
      }
      
      // Add genre IDs
      if (this.selectedGenres && this.selectedGenres.length > 0) {
        this.selectedGenres.forEach(genre => {
          formData.append('listGenreID', genre.id);
        });
      }

      // Add actor IDs
      if (this.selectedActors && this.selectedActors.length > 0) {
        this.selectedActors.forEach(actor => {
          formData.append('listActorID', actor.id);
        });
      }

      // Add genre IDs
      if (this.selectedGenres && this.selectedGenres.length > 0) {
        this.selectedGenres.forEach(genre => {
          formData.append('listGenreID', genre.id);
        });
      }

      this.movieService.createMovie(formData).subscribe({
        next: (response) => {
          if (response.responseCode === 1) {
            // Hiển thị SweetAlert2 khi thành công
            Swal.fire({
              icon: 'success',
              title: 'Thành công!',
              text: 'Thêm phim mới thành công',
              confirmButtonText: 'OK',
              customClass: {
                confirmButton: 'btn btn-success',
              }
            }).then((result) => {
              if (result.isConfirmed) {
                // Đóng modal
                const modalElement = document.getElementById('addMovieModal');
                if (modalElement) {
                  modalElement.click(); // Trigger click để đóng modal
                }
                // Emit event để refresh danh sách
                this.movieAdded.emit();
                // Reset form
                this.closeModal();
              }
            });
          } else {
            // Hiển thị lỗi với SweetAlert2
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: response.message || 'Thêm phim thất bại',
              confirmButtonText: 'Đóng',
              customClass: {
                confirmButton: 'btn btn-danger',
              }
            });
          }
        },
        error: (error) => {
          console.error('Error creating movie:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Có lỗi xảy ra khi thêm phim',
            confirmButtonText: 'Đóng',
            customClass: {
              confirmButton: 'btn btn-danger',
            }
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin bắt buộc';
    }
  }

  // Cập nhật initForm để thêm listGenreID
  private initForm() {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [90, [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      status: [1],
      listActorID: [[]],
      listGenreID: [[]]
    });
  }
}