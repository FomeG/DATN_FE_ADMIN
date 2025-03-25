import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShowtimeService, Showtime } from '../services/showtime.service';
import { MovieService } from '../services/movie.service';
import { RoomService } from '../services/room.service';
import Swal from 'sweetalert2';

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
  searchTerm: string = '';
  selectedStatus: string = '';
  startDateFilter: string = '';
  endDateFilter: string = '';

  readonly STATUS_TYPES = {
    ALL: '',
    UPCOMING: 'upcoming',
    PLAYING: 'playing',
    ENDED: 'ended'
  };

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

  loadShowtimes() {
    // Only use pagination parameters for the API call since backend doesn't process filters
    const params = {
      currentPage: this.currentPage,
      recordPerPage: this.recordPerPage
    };

    console.log('Loading all showtimes with pagination params:', params);

    this.showtimeService.getShowtimes(params).subscribe({
      next: (response) => {
        console.log('API response:', response);
        
        if (response && response.data) {
          // Filter out deleted showtimes
          let filteredData = response.data.filter(item => item.isDeleted === false);
          console.log('Data after removing deleted items:', filteredData.length);
          
          // Apply client-side movieId filter
          if (this.selectedMovieId && this.selectedMovieId.trim() !== '') {
            console.log('Applying client-side movieId filter:', this.selectedMovieId);
            filteredData = filteredData.filter(item => 
              item.movieId === this.selectedMovieId
            );
            console.log('Data after movieId filtering:', filteredData.length);
          }
          
          // Apply client-side roomId filter
          if (this.selectedRoomId && this.selectedRoomId.trim() !== '') {
            console.log('Applying client-side roomId filter:', this.selectedRoomId);
            filteredData = filteredData.filter(item => 
              item.roomId === this.selectedRoomId
            );
            console.log('Data after roomId filtering:', filteredData.length);
          }
          
          // Apply date range filter
          if (this.startDateFilter) {
            const startDate = new Date(this.startDateFilter);
            console.log('Applying start datetime filter:', startDate);
            filteredData = filteredData.filter(item => {
              const showtimeDate = new Date(item.startTime);
              return showtimeDate >= startDate;
            });
            console.log('Data after start datetime filtering:', filteredData.length);
          }

          if (this.endDateFilter) {
            const endDate = new Date(this.endDateFilter);
            console.log('Applying end datetime filter:', endDate);
            filteredData = filteredData.filter(item => {
              const showtimeDate = new Date(item.startTime);
              return showtimeDate <= endDate;
            });
            console.log('Data after end datetime filtering:', filteredData.length);
          }
          
          // Apply search term filter
          if (this.searchTerm && this.searchTerm.trim() !== '') {
            const searchTermLower = this.searchTerm.toLowerCase().trim();
            console.log('Applying search term filter:', searchTermLower);
            filteredData = filteredData.filter(item => 
              item.movieName && item.movieName.toLowerCase().includes(searchTermLower)
            );
            console.log('Data after search term filtering:', filteredData.length);
          }
          
          // Apply status filter
          if (this.selectedStatus) {
            console.log('Applying status filter:', this.selectedStatus);
            filteredData = filteredData.filter(item => this.showtimeMatchesStatusFilter(item));
            console.log('Data after status filtering:', filteredData.length);
          }
          
          // Update total records based on filtered data
          this.totalRecords = filteredData.length;
          
          // Store the filtered showtimes
          this.showtimes = filteredData;
        } else {
          this.showtimes = [];
          this.totalRecords = 0;
        }
      },
      error: (error) => {
        console.error('Error loading showtimes:', error);
        this.showtimes = [];
        this.totalRecords = 0;
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
    this.roomService.getRooms(1,10).subscribe({
      next: (response) => {
        this.rooms = response.data;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
      }
    });
  }

  validateTimeRange(): boolean {
    const startTime = this.showtimeForm.get('startTime')?.value;
    const endTime = this.showtimeForm.get('endTime')?.value;
    
    if (!startTime || !endTime) return false;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return end > start;
  }

  onSubmit() {
    if (this.showtimeForm.valid) {
      if (!this.validateTimeRange()) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi thời gian!',
          text: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
          confirmButtonText: 'OK'
        });
        return;
      }

      const formData = this.showtimeForm.value;
      
      if (this.isEditing && this.selectedShowtime) {
        this.showtimeService.updateShowtime(
          this.selectedShowtime.id,
          formData
        ).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Thành công!',
              text: 'Cập nhật suất chiếu thành công',
              confirmButtonText: 'OK'
            });
            
            this.loadShowtimes();
            this.resetForm();
            
            const modal = document.getElementById('showtimeModal');
            if (modal) {
              const modalInstance = bootstrap.Modal.getInstance(modal);
              if (modalInstance) {
                modalInstance.hide();
              } else {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.hide();
              }
            }
          },
          error: (error) => {
            console.error('Error updating showtime:', error);
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Không thể cập nhật suất chiếu. Vui lòng thử lại!',
              confirmButtonText: 'OK'
            });
          }
        });
      } else {
        this.showtimeService.createShowtime(formData)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Thêm mới suất chiếu thành công',
                confirmButtonText: 'OK'
              });
              
              this.loadShowtimes();
              this.resetForm();
              
              const modal = document.getElementById('showtimeModal');
              if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                  modalInstance.hide();
                } else {
                  const bsModal = new bootstrap.Modal(modal);
                  bsModal.hide();
                }
              }
            },
            error: (error) => {
              console.error('Error creating showtime:', error);
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể thêm mới suất chiếu. Vui lòng thử lại!',
                confirmButtonText: 'OK'
              });
            }
          });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Dữ liệu không hợp lệ!',
        text: 'Vui lòng kiểm tra lại thông tin đã nhập',
        confirmButtonText: 'OK'
      });
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
      status: showtime.status !== undefined ? showtime.status : 1
    });
  }

  deleteShowtime(id: string) {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn không thể hoàn tác hành động này!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimeService.deleteShowtime(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Đã xóa!',
              text: 'Suất chiếu đã được xóa thành công.',
              confirmButtonText: 'OK'
            });
            this.loadShowtimes();
          },
          error: (error) => {
            console.error('Error deleting showtime:', error);
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Không thể xóa suất chiếu. Vui lòng thử lại!',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

  resetForm() {
    this.showtimeForm.reset({
      movieId: '',
      roomId: '',
      startTime: '',
      endTime: '',
      status: 1
    });
    
    this.selectedShowtime = null;
    this.isEditing = false;
    
    Object.keys(this.showtimeForm.controls).forEach(key => {
      const control = this.showtimeForm.get(key);
      control?.setErrors(null);
      control?.markAsUntouched();
    });
  }

  onPageChange(page: number) {
    if (page >= 1 && (page - 1) * this.recordPerPage < this.totalRecords) {
      this.currentPage = page;
      this.loadShowtimes();
    }
  }

  onMovieChange() {
    this.currentPage = 1;
    console.log('Movie filter changed to:', this.selectedMovieId);
    this.loadShowtimes();
  }

  onRoomChange() {
    this.currentPage = 1;
    console.log('Room filter changed to:', this.selectedRoomId);
    this.loadShowtimes();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadShowtimes();
  }

  getShowtimeStatus(startTime: Date, endTime: Date): { class: string, text: string } {
    try {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (now < start) {
        return { class: 'bg-info', text: 'Sắp chiếu' };
      } else if (now > end) {
        return { class: 'bg-secondary', text: 'Đã chiếu' };
      } else {
        return { class: 'bg-success', text: 'Đang chiếu' };
      }
    } catch (error) {
      console.error('Error calculating showtime status:', error);
      return { class: 'bg-warning', text: 'Không xác định' };
    }
  }

  showtimeMatchesStatusFilter(showtime: Showtime): boolean {
    if (!this.selectedStatus || this.selectedStatus === this.STATUS_TYPES.ALL) {
      return true;
    }

    const now = new Date();
    const startTime = new Date(showtime.startTime);
    const endTime = new Date(showtime.endTime);

    switch (this.selectedStatus) {
      case this.STATUS_TYPES.UPCOMING:
        return now < startTime;
      case this.STATUS_TYPES.PLAYING:
        return now >= startTime && now <= endTime;
      case this.STATUS_TYPES.ENDED:
        return now > endTime;
      default:
        return true;
    }
  }

  onStatusChange() {
    this.currentPage = 1;
    this.loadShowtimes();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    console.log('Date filter changed - Start:', this.startDateFilter, 'End:', this.endDateFilter);
    this.loadShowtimes();
  }

  clearDateFilters(): void {
    this.startDateFilter = '';
    this.endDateFilter = '';
    console.log('Date filters cleared');
    this.loadShowtimes();
  }

  clearAllFilters(): void {
    this.selectedMovieId = '';
    this.selectedRoomId = '';
    this.selectedStatus = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.searchTerm = '';
    console.log('All filters cleared');
    this.currentPage = 1;
    this.loadShowtimes();
  }
}