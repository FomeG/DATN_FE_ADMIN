import { Component, OnInit, Output, EventEmitter, HostListener, AfterViewInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { ActorService, Actor } from '../../services/actor.service';
import { GenreService, Genre } from '../../services/genre.service';
import { AgeRatingService, AgeRating } from '../../services/age-rating.service';
import { MovieFormatService, MovieFormat } from '../../services/movie-format.service';
import Swal from 'sweetalert2';

// Import Material Dialog
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AgeRatingDialogComponent } from '../movie-age-rating/age-rating-dialog/age-rating-dialog.component';
import { MovieFormatDialogComponent } from '../movie-format/movie-format-dialog/movie-format-dialog.component';

declare var $: any; // Để sử dụng jQuery với Dropify

@Component({
  selector: 'app-add-movie-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './add-movie-modal.component.html',
  styleUrls: ['./add-movie-modal.component.css']
})


export class AddMovieModalComponent implements OnInit, AfterViewInit {
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

  // Age Rating properties
  ageRatings: AgeRating[] = [];
  selectedAgeRatingId: string = '';

  // Movie Format properties
  movieFormats: MovieFormat[] = [];
  selectedFormats: MovieFormat[] = [];
  filteredFormats: MovieFormat[] = [];
  formatSearchTerm: string = '';
  showFormatDropdown: boolean = false;

  selectedThumbnail: File | null = null;
  selectedBanner: File | null = null;
  selectedTrailer: File | null = null;
  isLoading = false;
  errorMessage = '';


  trailerPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private movieService: MovieService,
    private actorService: ActorService,
    private genreService: GenreService,
    private ageRatingService: AgeRatingService,
    private movieFormatService: MovieFormatService,
    @Inject(MatDialog) private dialog: MatDialog
  ) {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1)]],
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
    this.loadActors();
    this.loadGenres();
    this.loadAgeRatings();
    this.loadMovieFormats();
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
        this.errorMessage = 'Không thể tải danh sách xếp hạng độ tuổi';
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
        this.errorMessage = 'Không thể tải danh sách định dạng phim';
      }
    });
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


  selectGenre(genre: Genre) {
    if (!this.selectedGenres.some(selected => selected.id === genre.id)) {
      this.selectedGenres.push(genre);
      this.genreSearchTerm = '';
      this.filterGenres();
      this.updateFormGenreIds();
    }
  }

  removeGenre(genre: Genre) {
    this.selectedGenres = this.selectedGenres.filter(g => g.id !== genre.id);
    this.filterGenres();
    this.updateFormGenreIds();
  }

  private updateFormGenreIds() {
    const genreIds = this.selectedGenres.map(genre => genre.id);
    this.movieForm.patchValue({
      listGenreID: genreIds
    });
  }

  ngAfterViewInit() {
    // Đảm bảo jQuery và dropify đã tải xong
    setTimeout(() => {
      try {
        if ($ && $.fn && $.fn.dropify) {
          $('.dropify').dropify({
            messages: {
              default: 'Kéo và thả file vào đây hoặc click để chọn',
              replace: 'Kéo và thả hoặc click để thay thế',
              remove: 'Xóa',
              error: 'Có lỗi xảy ra'
            }
          });
          console.log('Dropify initialized successfully');
        } else {
          console.error('Dropify plugin not loaded properly');
        }
      } catch (error) {
        console.error('Error initializing dropify:', error);
      }
    }, 500);
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
    this.showDropdown = this.filteredActors.length > 0;
  }

  filterGenres() {
    if (!this.genreSearchTerm.trim()) {
      // Khi không có từ khóa tìm kiếm, hiển thị tất cả genres chưa được chọn
      this.filteredGenres = this.genres.filter(genre =>
        !this.selectedGenres.some(selected => selected.id === genre.id)
      );
    } else {
      // Lọc theo từ khóa và loại bỏ các genres đã được chọn
      this.filteredGenres = this.genres.filter(genre =>
        genre.genreName.toLowerCase().includes(this.genreSearchTerm.toLowerCase()) &&
        !this.selectedGenres.some(selected => selected.id === genre.id)
      );
    }
    this.showGenreDropdown = this.filteredGenres.length > 0;
  }


  // Thêm click outside handler để đóng dropdown
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
      this.filterActors();
      this.updateFormActorIds();
    }
  }

  removeActor(actor: Actor) {
    this.selectedActors = this.selectedActors.filter(a => a.id !== actor.id);
    this.filterActors();
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
    this.showFormatDropdown = this.filteredFormats.length > 0;
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
          this.trailerPreviewUrl = URL.createObjectURL(file);
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
      formData.append('importDate', this.movieForm.value.importDate);
      formData.append('endDate', this.movieForm.value.endDate);
      formData.append('status', this.movieForm.value.status);

      // Add AgeRatingId if selected
      if (this.movieForm.value.ageRatingId) {
        formData.append('ageRatingId', this.movieForm.value.ageRatingId);
      }

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
          formData.append('ListActorID', actor.id);
        });
      }

      // Add genre IDs
      if (this.selectedGenres && this.selectedGenres.length > 0) {
        this.selectedGenres.forEach(genre => {
          formData.append('ListGenreID', genre.id);
        });
      }

      // Add format IDs
      if (this.selectedFormats && this.selectedFormats.length > 0) {
        this.selectedFormats.forEach(format => {
          formData.append('listFormatID', format.formatId);
        });
      }

      this.movieService.createMovie(formData).subscribe({
        next: (response) => {
          // Kiểm tra responseCode để xác định thành công (chấp nhận cả 1 và 200)
          if (response.responseCode === 1 || response.responseCode === 200) {
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
                const modalElement = document.getElementById('addMovieModal');
                if (modalElement) {
                  modalElement.click(); // Trigger click để đóng modal
                }
                this.movieAdded.emit();
                this.closeModal();
              }
            });
          } else {
            // Hiển thị thông báo lỗi khi responseCode không phải 1 hoặc 200
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
          let errorMessage = 'Có lỗi xảy ra khi thêm phim';

          // Kiểm tra nếu có thông báo lỗi cụ thể từ API
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }

          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: errorMessage,
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
    // Tạo ngày mặc định cho ImportDate (hôm nay) và EndDate (1 năm sau)
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    // Format dates to YYYY-MM-DD for form
    const todayFormatted = today.toISOString().split('T')[0];
    const oneYearLaterFormatted = oneYearLater.toISOString().split('T')[0];

    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [90, [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      importDate: [todayFormatted, Validators.required],
      endDate: [oneYearLaterFormatted, Validators.required],
      status: [1],
      listActorID: [[]],
      listGenreID: [[]],
      ageRatingId: [''],
      listFormatID: [[]]
    }, { validators: this.endDateValidator });
  }

  // Validator để kiểm tra EndDate không nhỏ hơn ImportDate
  endDateValidator(formGroup: FormGroup) {
    const importDate = formGroup.get('importDate')?.value;
    const endDate = formGroup.get('endDate')?.value;

    if (importDate && endDate && new Date(endDate) < new Date(importDate)) {
      return { endDateInvalid: true };
    }

    return null;
  }











  // Nhớ xóa URL khi component bị hủy
  ngOnDestroy() {
    if (this.trailerPreviewUrl) {
      URL.revokeObjectURL(this.trailerPreviewUrl);
    }
  }

  // Mở dialog quản lý Age Rating sử dụng Angular Material
  openAgeRatingModal(mode: 'add' | 'list') {
    const dialogRef = this.dialog.open(AgeRatingDialogComponent, {
      width: '900px',
      disableClose: false,
      data: { mode: mode }
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        // Nếu có thay đổi, tải lại danh sách age rating
        this.loadAgeRatings();
      }
    });
  }

  // Mở dialog quản lý Movie Format sử dụng Angular Material
  openMovieFormatModal(mode: 'add' | 'list') {
    const dialogRef = this.dialog.open(MovieFormatDialogComponent, {
      width: '900px',
      disableClose: false,
      data: { mode: mode }
    });

    dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
      if (result) {
        // Nếu có thay đổi, tải lại danh sách movie format
        this.loadMovieFormats();
      }
    });
  }









}