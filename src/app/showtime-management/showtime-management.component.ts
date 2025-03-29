import { Component, OnInit, OnDestroy } from '@angular/core';
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
  styleUrl: './showtime-management.component.css',
  styles: [`
    ::ng-deep .modal-backdrop {
      display: none !important;
    }
    ::ng-deep body {
      overflow: auto !important;
      padding-right: 0 !important;
    }
  `]
})
export class ShowtimeManagementComponent implements OnInit, OnDestroy {
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
  upcomingShowtimes: Showtime[] = [];
  playingShowtimes: Showtime[] = [];
  maintenanceShowtimes: Showtime[] = [];
  private reportIssueModalInstance: any;

  readonly STATUS_TYPES = {
    ALL: '',
    UPCOMING: 'upcoming',
    PLAYING: 'playing',
    ENDED: 'ended'
  };

  readonly SHOWTIME_STATUS = {
    UPCOMING_SALE: 1,    // Sắp chiếu (chưa tới thời gian)
    NOT_STARTED: 2,      // Chưa bắt đầu (chưa tới thời gian)
    ON_SALE: 3,          // Đang chiếu (đang trong thời gian chiếu)
    ENDED: 4,            // Đã kết thúc (quá thời gian chiếu)
    MAINTENANCE: 5       // Đang bảo trì (báo sự cố)
  };

  readonly INTRO_TIMES = [
    { value: 10, label: '10 phút' },
    { value: 15, label: '15 phút' },
    { value: 20, label: '20 phút' }
  ];

  readonly CLEANUP_TIMES = [
    { value: 15, label: '15 phút' },
    { value: 20, label: '20 phút' },
    { value: 30, label: '30 phút' }
  ];

  private modalInstance: any;
  isSubmitting = false;
  private updateInterval: any;

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
      endTime: [''],
      introTime: [10], // Default 10 minutes
      cleanupTime: [15], // Default 15 minutes
      status: [this.SHOWTIME_STATUS.UPCOMING_SALE] // Set default status
    });

    // Calculate end time when start time, intro time, or cleanup time changes
    this.showtimeForm.get('startTime')?.valueChanges.subscribe(() => this.calculateEndTime());
    this.showtimeForm.get('introTime')?.valueChanges.subscribe(() => this.calculateEndTime());
    this.showtimeForm.get('cleanupTime')?.valueChanges.subscribe(() => this.calculateEndTime());
  }

  ngOnInit(): void {
    this.loadMovies();
    this.loadRooms();
    this.loadShowtimes();
    this.addBackdropFixStylesheet();

    // Setup modal event listeners
    setTimeout(() => {
      this.setupModalEventListeners();
    }, 500);

    // Clean up any existing modal effects
    this.cleanupModalEffects();

    // Start auto-update interval
    this.startAutoUpdate();
  }

  ngOnDestroy(): void {
    // Clear interval when component is destroyed
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private startAutoUpdate(): void {
    // Update every 5 seconds
    this.updateInterval = setInterval(() => {
      this.updateShowtimeStatuses();
    }, 5000);
  }

  private updateShowtimeStatuses(): void {
    const now = new Date();
    
    this.showtimes.forEach(showtime => {
      // Skip if showtime is in maintenance
      if (showtime.status === this.SHOWTIME_STATUS.MAINTENANCE) {
        return;
      }

      try {
        // Convert string dates to Date objects
        const startTime = new Date(showtime.startTime);
        const endTime = new Date(showtime.endTime);
        
        let newStatus: number;
        
        // Compare Date objects using getTime()
        if (now.getTime() < startTime.getTime()) {
          newStatus = this.SHOWTIME_STATUS.UPCOMING_SALE;
        } else if (now.getTime() > endTime.getTime()) {
          newStatus = this.SHOWTIME_STATUS.ENDED;
        } else {
          newStatus = this.SHOWTIME_STATUS.ON_SALE;
        }

        // Only update if status has changed
        if (showtime.status !== newStatus) {
          this.showtimeService.updateShowtimeStatus(showtime.id, newStatus)
            .subscribe({
              next: (response) => {
                if (response.responseCode === 200) {
                  // Update local showtime status
                  showtime.status = newStatus;
                }
              },
              error: (error) => {
                console.error(`Error updating status for showtime ${showtime.id}:`, error);
              }
            });
        }
      } catch (error) {
        console.error(`Error processing showtime ${showtime.id}:`, error);
      }
    });
  }

  loadShowtimes() {
    const params = {
      currentPage: this.currentPage,
      recordPerPage: this.recordPerPage
    };

    this.showtimeService.getShowtimes(params).subscribe({
      next: (response) => {
        if (response && response.data) {
          // Filter out deleted showtimes
          let filteredData = response.data.filter(item => item.isDeleted === false);
          
          // Apply client-side movieId filter
          if (this.selectedMovieId && this.selectedMovieId.trim() !== '') {
            filteredData = filteredData.filter(item => 
              item.movieId === this.selectedMovieId
            );
          }
          
          // Apply client-side roomId filter
          if (this.selectedRoomId && this.selectedRoomId.trim() !== '') {
            filteredData = filteredData.filter(item => 
              item.roomId === this.selectedRoomId
            );
          }
          
          // Apply date range filter
          if (this.startDateFilter) {
            const startDate = new Date(this.startDateFilter);
            filteredData = filteredData.filter(item => {
              const showtimeDate = new Date(item.startTime);
              return showtimeDate >= startDate;
            });
          }

          if (this.endDateFilter) {
            const endDate = new Date(this.endDateFilter);
            filteredData = filteredData.filter(item => {
              const showtimeDate = new Date(item.startTime);
              return showtimeDate <= endDate;
            });
          }
          
          // Apply search term filter
          if (this.searchTerm && this.searchTerm.trim() !== '') {
            const searchTermLower = this.searchTerm.toLowerCase().trim();
            filteredData = filteredData.filter(item => 
              item.movieName && item.movieName.toLowerCase().includes(searchTermLower)
            );
          }
          
          // Apply status filter
          if (this.selectedStatus) {
            filteredData = filteredData.filter(item => this.showtimeMatchesStatusFilter(item));
          }
          
          // Update total records based on filtered data
          this.totalRecords = filteredData.length;
          
          // Store the filtered showtimes
          this.showtimes = filteredData;
          
          // Immediately update statuses when data is loaded
          this.updateShowtimeStatuses();
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
        // Handle error
      }
    });
  }

  loadRooms() {
    this.roomService.getRooms(1,10).subscribe({
      next: (response) => {
        this.rooms = response.data;
      },
      error: (error) => {
        // Handle error
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

  // Add stylesheet to fix modal backdrop issues
  private addBackdropFixStylesheet(): void {
    try {
      const styleEl = document.createElement('style');
      styleEl.id = 'showtime-backdrop-fix-style';
      styleEl.innerHTML = `
        .modal-backdrop {
          display: none !important;
          opacity: 0 !important;
          z-index: -9999 !important;
        }
        body.modal-open {
          overflow: auto !important;
          padding-right: 0 !important;
        }
      `;
      document.head.appendChild(styleEl);
    } catch (error) {
      // Handle error
    }
  }

  // Set up event listeners for modals
  private setupModalEventListeners(): void {
    try {
      const modalEl = document.getElementById('showtimeModal');
      if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
          this.cleanupModalEffects();
        });
      }
    } catch (error) {
      // Handle error
    }
  }

  // Clean up modal effects
  cleanupModalEffects(): void {
    // Remove all backdrop elements
    document.querySelectorAll('.modal-backdrop').forEach(el => {
      el.remove();
    });

    // Try using HTMLCollection for more thorough cleanup
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }

    // Remove modal-open class from body
    if (document.body.classList.contains('modal-open')) {
      document.body.classList.remove('modal-open');
    }

    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Force reset data attributes
    document.body.removeAttribute('data-bs-overflow');
    document.body.removeAttribute('data-bs-padding-right');
  }

  openAddModal(): void {
    try {
      // Clean up any existing modal effects
      this.cleanupModalEffects();

      this.isEditing = false;
      this.selectedShowtime = null;

      this.showtimeForm.reset({
        status: this.SHOWTIME_STATUS.UPCOMING_SALE
      });

      const modalEl = document.getElementById('showtimeModal');
      if (modalEl) {
        // Dispose existing modal if any
        try {
          const existingModal = bootstrap.Modal.getInstance(modalEl);
          if (existingModal) {
            existingModal.dispose();
          }
        } catch (e) {
          // Handle error
        }

        // Create new modal with specific options
        this.modalInstance = new bootstrap.Modal(modalEl, {
          backdrop: 'static',
          keyboard: true,
          focus: true
        });

        // Setup event listeners
        modalEl.addEventListener('shown.bs.modal', () => {
          modalEl.removeAttribute('aria-hidden');
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => {
          modalEl.setAttribute('aria-hidden', 'true');
          this.cleanupModalEffects();
        }, { once: true });

        // Show the modal
        this.modalInstance.show();
      }
    } catch (error) {
      this.cleanupModalEffects();
    }
  }

  canEditShowtime(showtime: Showtime): boolean {
    // Chỉ cho phép sửa suất chiếu có trạng thái sắp bán vé hoặc chưa bắt đầu
    return showtime.status === this.SHOWTIME_STATUS.NOT_STARTED || 
           showtime.status === this.SHOWTIME_STATUS.ON_SALE;
  }

  editShowtime(showtime: Showtime) {
    if (!this.canEditShowtime(showtime)) {
      Swal.fire({
        icon: 'warning',
        title: 'Không thể sửa!',
        text: 'Chỉ có thể sửa suất chiếu chưa bắt đầu hoặc đang chiếu.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      // Clean up any existing modal effects
      this.cleanupModalEffects();

      this.isEditing = true;
      this.selectedShowtime = showtime;
      
      // Calculate total duration from start and end time
      const startTime = new Date(showtime.startTime);
      const endTime = new Date(showtime.endTime);
      const totalDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Set default values for intro and cleanup time
      const defaultIntroTime = 10;
      const defaultCleanupTime = 15;
      
      this.showtimeForm.patchValue({
        movieId: showtime.movieId,
        roomId: showtime.roomId,
        startTime: new Date(showtime.startTime).toISOString().slice(0, 16),
        endTime: new Date(showtime.endTime).toISOString().slice(0, 16),
        introTime: defaultIntroTime,
        cleanupTime: defaultCleanupTime
      });

      const modalEl = document.getElementById('showtimeModal');
      if (modalEl) {
        // Dispose existing modal if any
        try {
          const existingModal = bootstrap.Modal.getInstance(modalEl);
          if (existingModal) {
            existingModal.dispose();
          }
        } catch (e) {
          // Handle error
        }

        // Create new modal with specific options
        this.modalInstance = new bootstrap.Modal(modalEl, {
          backdrop: 'static',
          keyboard: true,
          focus: true
        });

        // Setup event listeners
        modalEl.addEventListener('shown.bs.modal', () => {
          modalEl.removeAttribute('aria-hidden');
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => {
          modalEl.setAttribute('aria-hidden', 'true');
          this.cleanupModalEffects();
        }, { once: true });

        // Show the modal
        this.modalInstance.show();
      }
    } catch (error) {
      this.cleanupModalEffects();
    }
  }

  closeModal(): void {
    try {
      if (this.modalInstance) {
        this.modalInstance.hide();
      } else {
        const modalEl = document.getElementById('showtimeModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) {
            modal.hide();
          }
        }
      }

      // Reset form and state
      this.resetForm();

      // Ensure modal effects are cleaned up
      setTimeout(() => {
        this.cleanupModalEffects();
      }, 100);
    } catch (error) {
      this.cleanupModalEffects();
    }
  }

  onSubmit() {
    if (this.showtimeForm.valid) {
      const formData = {
        movieId: this.showtimeForm.get('movieId')?.value,
        roomId: this.showtimeForm.get('roomId')?.value,
        startTime: this.showtimeForm.get('startTime')?.value,
        endTime: this.showtimeForm.get('endTime')?.value,
        status: this.SHOWTIME_STATUS.UPCOMING_SALE // Always set status for new showtimes
      };

      if (this.isEditing && this.selectedShowtime) {
        // Khi sửa, chỉ gửi các trường được phép thay đổi
        const updateData = {
          roomId: formData.roomId,
          startTime: formData.startTime,
          endTime: formData.endTime
        };

        this.showtimeService.updateShowtime(
          this.selectedShowtime.id,
          updateData
        ).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cập nhật suất chiếu thành công',
                confirmButtonText: 'OK'
              }).then(() => {
                this.loadShowtimes();
                this.closeModal();
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: response.message || 'Không thể cập nhật suất chiếu',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Không thể cập nhật suất chiếu. Vui lòng thử lại!',
              confirmButtonText: 'OK'
            });
          }
        });
      } else {
        // Khi thêm mới, gửi tất cả thông tin
        this.showtimeService.createShowtime(formData)
          .subscribe({
            next: (response) => {
              if (response.responseCode === 200) {
                Swal.fire({
                  icon: 'success',
                  title: 'Thành công!',
                  text: 'Thêm mới suất chiếu thành công',
                  confirmButtonText: 'OK'
                }).then(() => {
                  this.loadShowtimes();
                  this.closeModal();
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Lỗi!',
                  text: response.message || 'Không thể thêm mới suất chiếu',
                  confirmButtonText: 'OK'
                });
              }
            },
            error: (error) => {
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

  canDeleteShowtime(showtime: Showtime): boolean {
    // Không cho phép xóa suất chiếu đang chiếu hoặc sắp chiếu
    return !(showtime.status === this.SHOWTIME_STATUS.ON_SALE || 
             showtime.status === this.SHOWTIME_STATUS.NOT_STARTED);
  }

  deleteShowtime(id: string) {
    const showtime = this.showtimes.find(s => s.id === id);
    if (!showtime || !this.canDeleteShowtime(showtime)) {
      Swal.fire({
        icon: 'warning',
        title: 'Không thể xóa!',
        text: 'Không thể xóa suất chiếu đang chiếu hoặc chưa bắt đầu.',
        confirmButtonText: 'OK'
      });
      return;
    }

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
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire({
                icon: 'success',
                title: 'Đã xóa!',
                text: 'Suất chiếu đã được xóa thành công.',
                confirmButtonText: 'OK'
              });
              // Reload danh sách showtime
              this.loadShowtimes();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: response.message || 'Không thể xóa suất chiếu. Vui lòng thử lại!',
                confirmButtonText: 'OK'
              });
            }
          },
          error: (error) => {
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
      introTime: 10,
      cleanupTime: 15,
      status: this.SHOWTIME_STATUS.UPCOMING_SALE
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
    this.loadShowtimes();
  }

  onRoomChange() {
    this.currentPage = 1;
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

  getShowtimeStatusText(status: number): string {
    switch (status) {
      case this.SHOWTIME_STATUS.UPCOMING_SALE:
        return 'Sắp chiếu';
      case this.SHOWTIME_STATUS.NOT_STARTED:
        return 'Chưa bắt đầu';
      case this.SHOWTIME_STATUS.ON_SALE:
        return 'Đang chiếu';
      case this.SHOWTIME_STATUS.ENDED:
        return 'Đã kết thúc';
      case this.SHOWTIME_STATUS.MAINTENANCE:
        return 'Đang bảo trì';
      default:
        return 'Không xác định';
    }
  }

  getShowtimeStatusClass(status: number): string {
    switch (status) {
      case this.SHOWTIME_STATUS.UPCOMING_SALE:
        return 'bg-info';
      case this.SHOWTIME_STATUS.NOT_STARTED:
        return 'bg-warning';
      case this.SHOWTIME_STATUS.ON_SALE:
        return 'bg-success';
      case this.SHOWTIME_STATUS.ENDED:
        return 'bg-secondary';
      case this.SHOWTIME_STATUS.MAINTENANCE:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  showtimeMatchesStatusFilter(showtime: Showtime): boolean {
    if (!this.selectedStatus || this.selectedStatus === this.STATUS_TYPES.ALL) {
      return true;
    }

    switch (this.selectedStatus) {
      case this.STATUS_TYPES.UPCOMING:
        return showtime.status === this.SHOWTIME_STATUS.NOT_STARTED;
      case this.STATUS_TYPES.PLAYING:
        return showtime.status === this.SHOWTIME_STATUS.ON_SALE;
      case this.STATUS_TYPES.ENDED:
        return showtime.status === this.SHOWTIME_STATUS.ENDED;
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
    this.loadShowtimes();
  }

  clearDateFilters(): void {
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.loadShowtimes();
  }

  clearAllFilters(): void {
    this.selectedMovieId = '';
    this.selectedRoomId = '';
    this.selectedStatus = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadShowtimes();
  }

  openReportIssueModal(): void {
    // Load dữ liệu cho các tab
    this.loadUpcomingShowtimes();
    this.loadPlayingShowtimes();
    this.loadMaintenanceShowtimes();

    // Mở modal
    const modalEl = document.getElementById('reportIssueModal');
    if (modalEl) {
      this.reportIssueModalInstance = new bootstrap.Modal(modalEl);
      this.reportIssueModalInstance.show();
    }
  }

  closeReportIssueModal(): void {
    if (this.reportIssueModalInstance) {
      this.reportIssueModalInstance.hide();
    }
  }

  loadUpcomingShowtimes(): void {
    this.showtimeService.getShowtimes({ currentPage: 1, recordPerPage: 100 })
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            // Lọc các suất chiếu có status là NOT_STARTED
            this.upcomingShowtimes = response.data.filter(showtime => 
              showtime.status === this.SHOWTIME_STATUS.NOT_STARTED && !showtime.isDeleted
            );
          }
        },
        error: (error) => {
          console.error('Error loading upcoming showtimes:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Không thể tải danh sách suất chiếu sắp tới'
          });
        }
      });
  }

  loadPlayingShowtimes(): void {
    this.showtimeService.getShowtimes({ currentPage: 1, recordPerPage: 100 })
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            // Lọc các suất chiếu có status là ON_SALE
            this.playingShowtimes = response.data.filter(showtime => 
              showtime.status === this.SHOWTIME_STATUS.ON_SALE && !showtime.isDeleted
            );
          }
        },
        error: (error) => {
          console.error('Error loading playing showtimes:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Không thể tải danh sách suất chiếu đang diễn ra'
          });
        }
      });
  }

  loadMaintenanceShowtimes(): void {
    this.showtimeService.getShowtimes({ currentPage: 1, recordPerPage: 100 })
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            // Lọc các suất chiếu có status là MAINTENANCE
            this.maintenanceShowtimes = response.data.filter(showtime => 
              showtime.status === this.SHOWTIME_STATUS.MAINTENANCE && !showtime.isDeleted
            );
          }
        },
        error: (error) => {
          console.error('Error loading maintenance showtimes:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Không thể tải danh sách suất chiếu đang bảo trì'
          });
        }
      });
  }

  reportIssue(showtimeId: string): void {
    Swal.fire({
      title: 'Xác nhận báo sự cố?',
      text: 'Bạn có chắc chắn muốn báo sự cố cho suất chiếu này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Có, báo sự cố',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimeService.updateShowtimeStatus(showtimeId, this.SHOWTIME_STATUS.MAINTENANCE)
          .subscribe({
            next: (response) => {
              if (response.responseCode === 200) {
                Swal.fire({
                  icon: 'success',
                  title: 'Thành công!',
                  text: 'Đã báo sự cố thành công',
                  timer: 2000,
                  showConfirmButton: false
                });
                // Cập nhật lại danh sách
                this.loadUpcomingShowtimes();
                this.loadPlayingShowtimes();
                this.loadMaintenanceShowtimes();
                this.loadShowtimes(); // Cập nhật danh sách chính
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Lỗi!',
                  text: response.message || 'Không thể báo sự cố'
                });
              }
            },
            error: (error) => {
              console.error('Error reporting issue:', error);
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể báo sự cố'
              });
            }
          });
      }
    });
  }

  removeMaintenance(showtime: Showtime): void {
    const now = new Date();
    const startTime = new Date(showtime.startTime);
    const endTime = new Date(showtime.endTime);
    
    let newStatus: number;
    
    // Xác định trạng thái mới dựa vào thời gian
    if (now.getTime() < startTime.getTime()) {
      newStatus = this.SHOWTIME_STATUS.UPCOMING_SALE;
    } else if (now.getTime() > endTime.getTime()) {
      newStatus = this.SHOWTIME_STATUS.ENDED;
    } else {
      newStatus = this.SHOWTIME_STATUS.ON_SALE;
    }

    Swal.fire({
      title: 'Xác nhận gỡ bỏ bảo trì?',
      text: `Suất chiếu sẽ được chuyển sang trạng thái: ${this.getShowtimeStatusText(newStatus)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Có, gỡ bỏ bảo trì',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimeService.updateShowtimeStatus(showtime.id, newStatus)
          .subscribe({
            next: (response) => {
              if (response.responseCode === 200) {
                Swal.fire({
                  icon: 'success',
                  title: 'Thành công!',
                  text: 'Đã gỡ bỏ bảo trì thành công',
                  timer: 2000,
                  showConfirmButton: false
                });
                // Cập nhật lại danh sách
                this.loadMaintenanceShowtimes();
                this.loadShowtimes(); // Cập nhật danh sách chính
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Lỗi!',
                  text: response.message || 'Không thể gỡ bỏ bảo trì'
                });
              }
            },
            error: (error) => {
              console.error('Error removing maintenance:', error);
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể gỡ bỏ bảo trì'
              });
            }
          });
      }
    });
  }

  calculateEndTime(): void {
    const startTime = this.showtimeForm.get('startTime')?.value;
    const introTime = this.showtimeForm.get('introTime')?.value || 0;
    const cleanupTime = this.showtimeForm.get('cleanupTime')?.value || 0;
    const movieId = this.showtimeForm.get('movieId')?.value;
    
    if (startTime && movieId) {
      const selectedMovie = this.movies.find(movie => movie.id === movieId);
      
      if (!selectedMovie) {
        return;
      }

      const movieDuration = selectedMovie.duration;
      
      if (!movieDuration) {
        return;
      }
      
      const totalMinutes = Number(introTime) + Number(movieDuration) + Number(cleanupTime);
      
      try {
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(startDateTime.getTime());
        endDateTime.setMinutes(startDateTime.getMinutes() + totalMinutes);
        
        const year = endDateTime.getFullYear();
        const month = String(endDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(endDateTime.getDate()).padStart(2, '0');
        const hours = String(endDateTime.getHours()).padStart(2, '0');
        const minutes = String(endDateTime.getMinutes()).padStart(2, '0');
        
        const endTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        this.showtimeForm.patchValue({
          endTime: endTimeString
        }, { emitEvent: false });
      } catch (error) {
        // Handle error
      }
    }
  }

  get selectedMovieName(): string {
    const movieId = this.showtimeForm.get('movieId')?.value;
    const movie = this.movies.find(m => m.id === movieId);
    return movie ? movie.movieName : '';
  }
}