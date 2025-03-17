import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MovieService } from '../services/movie.service';
import { ActorService, Actor } from '../services/actor.service';
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

  selectedThumbnail: File | null = null;
  selectedBanner: File | null = null;
  selectedTrailer: File | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private movieService: MovieService,
    private actorService: ActorService
  ) {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      status: [1],
      listActorID: [[]]
    });
  }

  ngOnInit() {
    this.loadActors();
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
          this.filteredActors = [...this.actors];
          // console.log('Loaded actors:', this.actors);
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
    if (!element.closest('.actor-dropdown') && !element.closest('input')) {
      this.showDropdown = false;
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
    const file = event.target.files[0];
    if (file) {
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

      Object.keys(this.movieForm.value).forEach(key => {
        if (key === 'listActorID') {
          this.movieForm.value[key].forEach((id: string) => {
            formData.append('listActorID', id);
          });
        } else {
          formData.append(key, this.movieForm.value[key]);
        }
      });

      if (this.selectedThumbnail) {
        formData.append('thumbnail', this.selectedThumbnail);
      }
      if (this.selectedBanner) {
        formData.append('banner', this.selectedBanner);
      }
      if (this.selectedTrailer) {
        formData.append('trailer', this.selectedTrailer);
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
}