import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShowtimeService, Showtime } from '../services/showtime.service';
import { MovieService } from '../services/movie.service';
import { RoomService } from '../services/room.service';

declare var bootstrap: any; // Add this line to fix bootstrap error

@Component({
  selector: 'app-showtime-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './showtime-management.component.html',
  styleUrl: './showtime-management.component.css'
})
export class ShowtimeManagementComponent implements OnInit {
  showtimes: Showtime[] = [];
  movies: any[] = [];
  rooms: any[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  showtimeForm: FormGroup;
  selectedShowtime: Showtime | null = null;
  isEditing = false;
  selectedMovieId: string = '';
  selectedRoomId: string = '';

  constructor(
    private showtimeService: ShowtimeService,
    private movieService: MovieService,
    private roomService: RoomService,
    private fb: FormBuilder
  ) {
    this.showtimeForm = this.fb.group({
      movieId: ['', Validators.required],
      roomId: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      status: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMovies();
    this.loadRooms();
    this.loadShowtimes();
  }

  getMovieName(movieId: string): string {
    const movie = this.movies.find(m => m.id === movieId);
    return movie ? movie.movieName : '';
  }

  getRoomName(roomId: string): string {
    const room = this.rooms.find(r => r.id === roomId);
    return room ? room.name : '';
  }

  loadShowtimes() {
    this.showtimeService.getShowtimes(
      this.selectedMovieId,
      this.selectedRoomId,
      this.currentPage,
      this.recordPerPage
    ).subscribe({
      next: (response) => {
        this.showtimes = response.data;
        this.totalRecords = response.totalRecord;
      },
      error: (error) => {
        console.error('Error loading showtimes:', error);
      }
    });
  }

  loadMovies() {
    this.movieService.getMovies(1, 100).subscribe({
      next: (response) => {
        this.movies = response.data;
      },
      error: (error) => {
        console.error('Error loading movies:', error);
      }
    });
  }

  loadRooms() {
    this.roomService.getRooms().subscribe({
      next: (response) => {
        this.rooms = response.data;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
      }
    });
  }

  onSubmit() {
    if (this.showtimeForm.valid) {
      const formData = this.showtimeForm.value;
      
      if (this.isEditing && this.selectedShowtime) {
        this.showtimeService.updateShowtime(
          this.selectedShowtime.id,
          formData
        ).subscribe({
          next: () => {
            this.loadShowtimes();
            this.resetForm();
            const modal = document.getElementById('showtimeModal');
            if (modal) {
              const modalInstance = bootstrap.Modal.getInstance(modal);
              modalInstance?.hide();
            }
          },
          error: (error) => {
            console.error('Error updating showtime:', error);
          }
        });
      } else {
        this.showtimeService.createShowtime(formData)
          .subscribe({
            next: () => {
              this.loadShowtimes();
              this.resetForm();
              const modal = document.getElementById('showtimeModal');
              if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
              }
            },
            error: (error) => {
              console.error('Error creating showtime:', error);
            }
          });
      }
    }
  }

  editShowtime(showtime: Showtime) {
    this.isEditing = true;
    this.selectedShowtime = showtime;
    this.showtimeForm.patchValue({
      movieId: showtime.movieId,
      roomId: showtime.roomId,
      startTime: new Date(showtime.startTime).toISOString().slice(0, 16),
      endTime: new Date(showtime.endTime).toISOString().slice(0, 16),
      status: showtime.status
    });
  }

  deleteShowtime(id: string) {
    if (confirm('Are you sure you want to delete this showtime?')) {
      this.showtimeService.deleteShowtime(id).subscribe({
        next: () => {
          this.loadShowtimes();
        },
        error: (error) => {
          console.error('Error deleting showtime:', error);
        }
      });
    }
  }

  resetForm() {
    this.showtimeForm.reset();
    this.selectedShowtime = null;
    this.isEditing = false;
    this.showtimeForm.patchValue({ status: 1 });
  }

  onPageChange(page: number) {
    if (page >= 1 && (page - 1) * this.recordPerPage < this.totalRecords) {
      this.currentPage = page;
      this.loadShowtimes();
    }
  }

  onMovieChange() {
    this.loadShowtimes();
  }

  onRoomChange() {
    this.loadShowtimes();
  }
}