import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../services/movie.service';
import { ActorService } from '../services/actor.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-movie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-movie.component.html'
})
export class EditMovieComponent implements OnInit {
  movieForm: FormGroup;
  movieId: string = '';
  isLoading = false;
  actors: any[] = [];
  selectedActors: any[] = [];
  selectedThumbnail: File | null = null;
  selectedTrailer: File | null = null;
  
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
      if (type === 'thumbnail') {
        this.selectedThumbnail = file;
      } else if (type === 'trailer') {
        this.selectedTrailer = file;
      }
    }
  }
  loadMovieDetails() {
    this.movieService.getMovieById(this.movieId).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.movieForm.patchValue({
            movieName: response.data.movieName,
            description: response.data.description,
            duration: response.data.duration,
            releaseDate: response.data.releaseDate,
            status: response.data.status,
            listActorID: response.data.listdienvien?.map((actor: any) => actor.id) || []
          });
          // Set selected actors
          this.selectedActors = response.data.listdienvien || [];
        }
      },
      error: (error) => {
        Swal.fire('Lỗi!', 'Không thể tải thông tin phim.', 'error');
      }
    });
  }

  loadActors() {
    this.actorService.getActors(1,99999).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.actors = response.data;
        }
      }
    });
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
}
