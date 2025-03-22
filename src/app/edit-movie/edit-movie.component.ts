import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { ActorService, Actor } from '../services/actor.service';
import { GenreService, Genre } from '../services/genre.service';

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

  // Genre properties
  genres: Genre[] = [];
  filteredGenres: Genre[] = [];
  selectedGenres: Genre[] = [];
  genreSearchTerm: string = '';
  showGenreDropdown: boolean = false;

  searchTerm: string = '';
  showDropdown: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private actorService: ActorService,
    private genreService: GenreService
  ) {
    this.movieForm = this.fb.group({
      movieName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(1)]],
      releaseDate: ['', Validators.required],
      status: [1],
      listActorID: [[]],
      listGenreID: [[]]
    });
  }

  ngOnInit() {
    this.initForm();
    this.route.params.subscribe(params => {
      this.movieId = params['id'];
      this.loadMovieDetails();
      this.loadActors();
      this.loadGenres(); // Load all genres
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
      listGenreID: [[]]
    });
  }

  // Load genres
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
    this.showGenreDropdown = true;
  }

  // Select a genre
  selectGenre(genre: Genre) {
    if (!this.selectedGenres.some(selected => selected.id === genre.id)) {
      this.selectedGenres.push(genre);
      this.genreSearchTerm = '';
      this.showGenreDropdown = false;
      this.updateFormGenreIds();
    }
  }

  // Remove a genre
  removeGenre(genre: Genre) {
    this.selectedGenres = this.selectedGenres.filter(g => g.id !== genre.id);
    this.updateFormGenreIds();
  }

  // Update form genre IDs
  private updateFormGenreIds() {
    const genreIds = this.selectedGenres.map(genre => genre.id);
    this.movieForm.patchValue({ listGenreID: genreIds });
  }

  onFileSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      switch (type) {
        case 'thumbnail':
          this.selectedThumbnail = file;
          break;
        case 'trailer':
          this.selectedTrailer = file;
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
              releaseDate: movieData.releaseDate.split('T')[0],
              status: movieData.status
            });

            // Cập nhật danh sách diễn viên từ listdienvien
            this.selectedActors = movieData.listdienvien ? movieData.listdienvien.map((dv: any) => ({
              id: dv.id,
              name: dv.name,
              photo: dv.photo
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
          }
        },
        error: (error) => {
          console.error('Error loading movie details:', error);
        }
      });
    }
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
    this.showDropdown = true;
  }

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

  goBack() {
    this.router.navigate(['/movies']);
  }

  onSubmit() {
    if (this.movieForm.valid) {
      this.isLoading = true;
      
      const formData = new FormData();
      
      formData.append('movieID', this.movieId);
      formData.append('movieName', this.movieForm.value.movieName);
      formData.append('description', this.movieForm.value.description);
      formData.append('duration', this.movieForm.value.duration);
      formData.append('releaseDate', this.movieForm.value.releaseDate);
      formData.append('status', this.movieForm.value.status);
      
      if (this.selectedThumbnail) {
        formData.append('thumbnail', this.selectedThumbnail);
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
  
      // Fix: Pass both movieId and formData to updateMovie
      this.movieService.updateMovie(this.movieId, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.responseCode === 200) {
            Swal.fire(
              'Thành công!',
              'Cập nhật phim thành công.',
              'success'
            ).then(() => {
              this.router.navigate(['/movies']);
            });
          } else {
            Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi cập nhật phim.', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          Swal.fire('Lỗi!', 'Có lỗi xảy ra khi cập nhật phim:' + error.message, 'error');
        }
      });
    }
  }

  
}