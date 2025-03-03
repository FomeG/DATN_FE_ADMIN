import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { ActorService, Actor } from '../services/actor.service';

import Swal from 'sweetalert2';


declare var $: any; // Để sử dụng jQuery với Dropify


@Component({
  selector: 'app-edit-movie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './edit-movie.component.html'
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

  searchTerm: string = '';
  showDropdown: boolean = false;







  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.movieId = id;
      this.loadMovieDetails();
      this.loadActors();
    } else {
      this.router.navigate(['/movies']);
    }
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
            this.selectedActors = movieData.listdienvien.map((dv: { id: number; name: string; photo: string }) => ({
              id: dv.id,
              name: dv.name,
              photo: dv.photo
            }));
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
        }
      }
    });
  }




  removeActor(actor: Actor) {
    this.selectedActors = this.selectedActors.filter(a => a.id !== actor.id);
    this.updateFormActorIds();
  }


  private updateFormActorIds() {
    const actorIds = this.selectedActors.map(actor => actor.id);
    this.movieForm.patchValue({ listActorID: actorIds });
  }



  selectActor(actor: Actor) {
    if (!this.selectedActors.some(selected => selected.id === actor.id)) {
      this.selectedActors.push(actor);
      this.searchTerm = '';
      this.showDropdown = false;
      this.updateFormActorIds();
    }
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
  }



  onSubmit() {
    if (this.movieForm.valid) {
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

      this.movieService.updateMovie(this.movieId, formData).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            Swal.fire('Thành công!', 'Cập nhật phim thành công.', 'success')
              .then(() => this.router.navigate(['/movies']));
          } else {
            Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi cập nhật phim.', 'error');
          }
        },
        error: (error) => {
          Swal.fire('Lỗi!', 'Có lỗi xảy ra khi cập nhật phim:' + error.message, 'error');
        }
      });
    }
  }















  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest('.actor-search-container')) {
      this.showDropdown = false;
    }
  }
}
