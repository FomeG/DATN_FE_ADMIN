import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovieService } from '../../services/movie.service';
import { RoomService } from '../../services/room.service';
import { ShowtimeService, Showtime, ShowtimeResponse, ShowtimeAutoDateRequest } from '../../services/showtime.service';
import { CinemaService } from '../../services/cinema.service';
import { DatePipe } from '@angular/common';

import Swal from 'sweetalert2';

declare var bootstrap: any; // Add this line to fix bootstrap error




interface CinemaItem {
  id: string;
  name: string;
  availableRooms: RoomItem[];
  rooms: RoomShowtime[];
}

interface RoomItem {
  id: string;
  name: string;
}

interface RoomShowtime {
  id: string;
  name?: string;
  startTime: string;
  endTime: string;
  loading: boolean;
  errorMessage: string;
  successMessage: string;
}

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
  `],
  providers: [DatePipe]
})
export class ShowtimeManagementComponent implements OnInit, OnDestroy {
  showtimes: Showtime[] = [];
  movies: any[] = [];
  rooms: any[] = [];
  cinemas: any[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  showtimeForm: FormGroup;
  selectedShowtime: Showtime | null = null;
  isEditing = false;
  selectedMovieId: string = '';
  selectedRoomId: string = '';
  searchTerm: string = '';
  selectedStatus: number = -1;
  startDateFilter: string | null = null;
  endDateFilter: string | null = null;
  selectedMovieName: string = '';
  upcomingShowtimes: Showtime[] = [];
  playingShowtimes: Showtime[] = [];
  maintenanceShowtimes: Showtime[] = [];
  private reportIssueModalInstance: any;



  cinemaList: CinemaItem[] = [];

  // Constants
  readonly STATUS_TYPES = {
    ALL: -1,
    UPCOMING: 1,
    PLAYING: 2,
    ENDED: 3,
    MAINTENANCE: 4
  };

  readonly SHOWTIME_STATUS = {
    UPCOMING_SALE: 1,
    UPCOMING: 2,
    PLAYING: 3,
    ENDED: 4,
    MAINTENANCE: 5
  };

  readonly INTRO_TIMES = [
    { value: 10, label: '10 phút' },
    { value: 15, label: '15 phút' },
    { value: 20, label: '20 phút' }
  ];

  readonly CLEANUP_TIMES = [
    { value: 10, label: '10 phút' },
    { value: 15, label: '15 phút' },
    { value: 20, label: '20 phút' }
  ];

  private modalInstance: any;
  isSubmitting = false;
  private updateInterval: any;

  private lastRoomChangeCall = 0;

  constructor(
    private showtimeService: ShowtimeService,
    private movieService: MovieService,
    private roomService: RoomService,
    private cinemaService: CinemaService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef
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

    // Subscribe to form value changes
    const formChanges = ['startTime', 'introTime', 'cleanupTime'];
    formChanges.forEach(controlName => {
      this.showtimeForm.get(controlName)?.valueChanges.subscribe(() => {
        // Only recalculate for active room if in edit mode
        if (this.isEditing && this.cinemaList.length > 0) {
          const cinema = this.cinemaList[0];
          const room = cinema.rooms[0];
          if (room && room.startTime) {
            this.calculateEndTime(0, 0);
          }
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadMovies();
    this.loadRooms();
    this.loadShowtimes();
    this.addBackdropFixStylesheet();
    this.initForm();
    this.loadCinemas();

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


  loadCinemas(): void {
    this.cinemaService.getCinemas(1, 100).subscribe({
      next: (response: any) => {
        if (response.responseCode === 200) {
          this.cinemas = response.data;
        } else {
          console.error('Error loading cinemas:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading cinemas:', error);
      }
    });
  }




  private startAutoUpdate(): void {
    // Update every 5 seconds
    this.updateInterval = setInterval(() => {
      this.updateShowtimeStatuses();
    }, 5000);
  }


  //region nghia
  initForm(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.showtimeForm = this.fb.group({
      movieId: ['', Validators.required],
      showtimeDate: [this.datePipe.transform(today, 'yyyy-MM-dd'), Validators.required],
      introTime: [10],
      cleanupTime: [15]
    });
  }


  loadRoomsForCinema(cinemaId: string): Promise<RoomItem[]> {
    return new Promise((resolve, reject) => {
      // Kiểm tra ID hợp lệ
      if (!cinemaId || cinemaId === 'undefined' || cinemaId === undefined) {
        reject('Cinema ID không hợp lệ');
        return;
      }

      console.log('Calling API with cinema ID:', cinemaId);

      this.roomService.getRoomsByCinema(cinemaId).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            resolve(response.data);
          } else {
            reject(response.message);
          }
        },
        error: (error) => {
          console.error('Error loading rooms for cinema:', error);
          reject('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
        }
      });
    });
  }




  addCinemaToList(): void {
    this.cinemaList.push({
      id: '',
      name: '',
      availableRooms: [],
      rooms: []
    });
  }




  removeCinema(index: number): void {
    this.cinemaList.splice(index, 1);
  }

  async onCinemaChange(cinemaIndex: number): Promise<void> {
    const cinema = this.cinemaList[cinemaIndex];
    if (!cinema.id) return;

    // Kiểm tra và đảm bảo id là string hợp lệ
    if (cinema.id === 'undefined' || cinema.id === undefined) {
      console.error('Cinema ID is undefined');
      return;
    }

    // Find cinema name
    const selectedCinema = this.cinemas.find(c => c.cinemasId === cinema.id);
    if (selectedCinema) {
      cinema.name = selectedCinema.name;
    }

    try {
      // Load rooms for this cinema
      cinema.availableRooms = await this.loadRoomsForCinema(cinema.id);

      // Nếu đang edit và thay đổi rạp, tạo một phòng trống mới
      if (this.isEditing) {
        const currentRooms = cinema.rooms;
        const firstRoom = currentRooms && currentRooms[0];

        cinema.rooms = [{
          id: '',
          name: '',
          startTime: firstRoom ? firstRoom.startTime : '',
          endTime: firstRoom ? firstRoom.endTime : '',
          loading: false,
          errorMessage: '',
          successMessage: ''
        }];
      } else {
        cinema.rooms = [];
      }

    } catch (error) {
      console.error('Error loading rooms for cinema:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải danh sách phòng cho rạp này.'
      });
    }
  }

  addRoomToCinema(cinemaIndex: number): void {
    const cinema = this.cinemaList[cinemaIndex];

    // Get available unselected rooms
    const availableRooms = this.getAvailableRoomsForDropdown(cinema, -1); // -1 to not exclude any room

    // Check if we've reached the limit (all available rooms are already selected)
    if (availableRooms.length === 0) {
      // Show error message
      Swal.fire({
        title: 'Không thể thêm phòng',
        text: 'Số lượng phòng đã đạt tối đa',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      return;
    }


    cinema.rooms.push({
      id: '',
      startTime: '',
      endTime: '',
      loading: false,
      errorMessage: '',
      successMessage: ''
    });
  }

  removeRoom(cinemaIndex: number, roomIndex: number): void {
    this.cinemaList[cinemaIndex].rooms.splice(roomIndex, 1);
  }




  async onRoomChange(cinemaIndex?: number, roomIndex?: number): Promise<void> {
    // Nếu không có tham số, áp dụng bộ lọc và trả về
    if (cinemaIndex === undefined || roomIndex === undefined) {
      this.filterShowtimes();
      return;
    }



    const cinema = this.cinemaList[cinemaIndex];
    const room = cinema.rooms[roomIndex];

    // Clear any previous messages
    room.errorMessage = '';
    room.successMessage = '';

    if (!room.id) return;

    // Tìm tên phòng
    const selectedRoom = cinema.availableRooms.find(r => r.id === room.id);
    if (selectedRoom) {
      room.name = selectedRoom.name;
    }

    // Get movie ID
    const movieId = this.showtimeForm.get('movieId')?.value;
    if (!movieId) {
      room.errorMessage = 'Vui lòng chọn phim trước.';
      return;
    }

    // Get date
    const date = this.showtimeForm.get('showtimeDate')?.value;
    if (!date) {
      room.errorMessage = 'Vui lòng chọn ngày chiếu trước.';
      return;
    }

    // Reset previous messages
    room.errorMessage = '';
    room.successMessage = '';
    room.loading = true;

    try {
      // Call API to get auto date
      const request: ShowtimeAutoDateRequest = {
        cinemasId: cinema.id,
        roomId: room.id,
        date: date,
        movieId: movieId
      };

      this.showtimeService.showtimeAutoDate(request).subscribe({
        next: (response) => {
          room.loading = false;

          if (response.responseCode === 200 || response.responseCode === -999901) {
            if (response.responseCode === 200) {
              // Success
              room.successMessage = 'Có thể tạo suất chiếu cho phòng này.';
              let startTimeDate: Date;

              if (response.data) {
                // Nếu có dữ liệu từ API, sử dụng endTime + 20 phút
                const endTimeFromApi = new Date(response.data.endTime);
                endTimeFromApi.setMinutes(endTimeFromApi.getMinutes() + 20);
                startTimeDate = endTimeFromApi;
              } else {
                // Nếu không có dữ liệu (responseCode = 200, data = null)
                // Sử dụng ngày từ form và giờ mặc định là 9:00
                startTimeDate = new Date(date);
                startTimeDate.setHours(9, 0, 0, 0);
              }

              // Format as yyyy-MM-ddTHH:mm
              room.startTime = this.formatDateTimeForInput(startTimeDate);

            } else if (response.responseCode === -999901) {
              // Đã có suất chiếu trong ngày này
              room.errorMessage = 'Phim này đã có suất chiếu ngày hôm nay trong phòng này.';

              // Xóa thời gian đã chọn
              room.startTime = '';
              room.endTime = '';

              // Hiển thị Swal alert
              Swal.fire({
                icon: 'warning',
                title: 'Không thể tạo suất chiếu!',
                text: 'Phim này đã có suất chiếu ngày hôm nay trong phòng này.',
                confirmButtonText: 'Đồng ý'
              });

              // Return early to prevent calculating end time
              return;
            }

            // Calculate end time if we have a start time
            if (room.startTime) {
              this.calculateEndTime(cinemaIndex, roomIndex);
            }

          } else {
            // Other errors
            room.errorMessage = response.message || 'Không thể tạo suất chiếu cho phòng này.';

            // Reset times
            room.startTime = '';
            room.endTime = '';
          }
        },
        error: (error) => {
          room.loading = false;
          room.errorMessage = 'Lỗi khi kiểm tra lịch chiếu. Vui lòng thử lại.';
          console.error('Error getting auto date:', error);

          // Khi có lỗi, vẫn hiển thị thời gian mặc định
          const defaultDate = new Date(date);
          defaultDate.setHours(9, 0, 0, 0);
          room.startTime = this.formatDateTimeForInput(defaultDate);

          // Tính thời gian kết thúc
          this.calculateEndTime(cinemaIndex, roomIndex);
        }
      });
    } catch (error) {
      room.loading = false;
      room.errorMessage = 'Lỗi khi kiểm tra lịch chiếu. Vui lòng thử lại.';
      console.error('Error in onRoomChange:', error);

      // Khi có lỗi, vẫn hiển thị thời gian mặc định
      const defaultDate = new Date(date);
      defaultDate.setHours(9, 0, 0, 0);
      room.startTime = this.formatDateTimeForInput(defaultDate);

      // Tính thời gian kết thúc
      this.calculateEndTime(cinemaIndex, roomIndex);
    }



    this.changeDetectorRef.detectChanges();
  }

  // Utility function to format date for datetime-local input
  formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }


  isFormValid(): boolean {
    // Check if the form is valid
    if (!this.showtimeForm.valid) return false;

    // Check if at least one cinema is added
    if (this.cinemaList.length === 0) return false;

    // Check if each cinema has a valid ID
    const validCinemas = this.cinemaList.filter(cinema => cinema.id && cinema.rooms.some(room => room.id && room.startTime && room.endTime));

    return validCinemas.length > 0;
  }

  //#region THÊM SHOWTIME
  createShowtimes(): void {
    // Prepare an array of showtime requests
    const showtimeRequests: any[] = [];

    for (const cinema of this.cinemaList) {
      for (const room of cinema.rooms) {
        if (room.id && room.startTime && room.endTime) {
          showtimeRequests.push({
            movieId: this.showtimeForm.get('movieId')?.value,
            roomId: room.id,
            startTime: room.startTime,
            endTime: room.endTime,
            status: 1
          });
        }
      }
    }

    if (showtimeRequests.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Chú ý!',
        text: 'Vui lòng thêm ít nhất một phòng chiếu với thời gian đã được cài đặt.'
      });
      return;
    }

    // Show confirmation dialog
    Swal.fire({
      title: 'Xác nhận',
      text: `Bạn có chắc muốn tạo ${showtimeRequests.length} suất chiếu mới không?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Create a promise array for all the API calls
        const promises = showtimeRequests.map(request => {
          return new Promise((resolve, reject) => {
            this.showtimeService.createShowtime(request).subscribe({
              next: (response) => {
                if (response.responseCode === 200) {
                  resolve(true);
                } else {
                  reject(response.message);
                }
              },
              error: (error) => {
                reject(error);
              }
            });
          });
        });

        // Use Promise.all to handle all the requests
        Promise.all(promises)
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Thành công!',
              text: 'Đã tạo các suất chiếu mới thành công.'
            });
            this.closeModal();
            this.loadShowtimes();
          })
          .catch((error) => {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: `Có lỗi xảy ra khi tạo suất chiếu: ${error}`
            });
          });
      }
    });
  }






  updateShowtime(): void {
    if (!this.selectedShowtime || !this.isFormValid()) return;

    // In case of editing, we only allow updating the first room
    const cinema = this.cinemaList[0];
    if (!cinema || cinema.rooms.length === 0) return;

    const room = cinema.rooms[0];
    if (!room.id || !room.startTime || !room.endTime) return;

    const updateRequest = {
      roomId: room.id,
      movieId: this.showtimeForm.get('movieId')?.value,
      startTime: room.startTime,
      endTime: room.endTime
    };


    console.log("MOVIE ID MOVIE ID MOVIE ID MOVIE ID MOvIE ID MOVIDMMDSAL<MSAKMD" + updateRequest.movieId)
    Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn cập nhật suất chiếu này không?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimeService.updateShowtime(this.selectedShowtime!.id, updateRequest).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã cập nhật suất chiếu thành công.'
              });
              this.closeModal();
              this.loadShowtimes();
            } else if (response.responseCode === -999902) {
              Swal.fire({
                icon: 'warning',
                title: 'Không thể cập nhật!',
                text: 'Không thể thay đổi thông tin suất chiếu vì đã có người đặt vé.',
                confirmButtonText: 'Đồng ý'
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: response.message || 'Có lỗi xảy ra khi cập nhật suất chiếu.'
              });
            }
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Có lỗi xảy ra khi cập nhật suất chiếu.'
            });
            console.error('Error updating showtime:', error);
          }
        });
      }
    });
  }



  onFilterRoomChange(): void {
    this.filterShowtimes();
  }


  onMovieFormChange(movieId: string): void {
    console.log("Phim đã thay đổi trong form:", movieId);

    try {
      if (!movieId) return;

      // Tìm thông tin phim đã chọn
      const selectedMovie = this.movies.find(m => m.id === movieId);
      if (!selectedMovie) return;

      if (this.cinemaList && this.cinemaList.length > 0) {
        // Cập nhật tất cả các phòng đã chọn
        this.cinemaList.forEach((cinema, cinemaIndex) => {
          if (cinema.rooms && cinema.rooms.length > 0) {
            cinema.rooms.forEach((room, roomIndex) => {
              if (room.id) {
                // Nếu đã có thời gian bắt đầu, tính lại thời gian kết thúc
                if (room.startTime) {
                  this.calculateEndTime(cinemaIndex, roomIndex);
                }

                // Xóa thông báo lỗi
                room.errorMessage = '';
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error in onMovieFormChange:', error);
    }
  }

  onShowtimeDateChange(): void {
    console.log("Ngày chiếu đã thay đổi");

    const showtimeDate = this.showtimeForm.get('showtimeDate')?.value;
    if (!showtimeDate) return;

    // Xử lý cho tất cả các rạp và phòng đã chọn
    if (this.cinemaList && this.cinemaList.length > 0) {
      this.cinemaList.forEach((cinema, cinemaIndex) => {
        if (cinema.rooms && cinema.rooms.length > 0) {
          cinema.rooms.forEach((room, roomIndex) => {
            if (room.id) {
              // Cập nhật thời gian bắt đầu dựa trên ngày mới
              const selectedDate = new Date(showtimeDate);

              // Nếu đã có thời gian bắt đầu, giữ lại giờ:phút cũ nhưng cập nhật ngày mới
              if (room.startTime) {
                const currentStartTime = new Date(room.startTime);
                selectedDate.setHours(currentStartTime.getHours());
                selectedDate.setMinutes(currentStartTime.getMinutes());
              } else {
                // Nếu chưa có thời gian bắt đầu, đặt giờ mặc định (ví dụ: 9:00)
                selectedDate.setHours(9, 0, 0, 0);
              }

              // Cập nhật thời gian bắt đầu mới
              room.startTime = this.formatDateTimeForInput(selectedDate);

              // Tính lại thời gian kết thúc
              this.calculateEndTime(cinemaIndex, roomIndex);

              // Gọi API để kiểm tra lịch chiếu nếu cần
              if (cinema.id && room.id) {
                this.onRoomChange(cinemaIndex, roomIndex);
              }
            }
          });
        }
      });
    }
  }

  getAvailableRoomsForDropdown(cinema: any, currentRoomIndex: number): any[] {
    if (!cinema || !cinema.availableRooms) return [];

    // Get all selected room IDs from this cinema except the current one
    const selectedRoomIds = cinema.rooms
      .filter((_: { id: any; }, index: number) => index !== currentRoomIndex && _.id) // Exclude current room and empty selections
      .map((room: { id: any; }) => room.id);

    // Return only rooms that are not selected in other dropdowns
    return cinema.availableRooms.filter((room: { id: any; }) => !selectedRoomIds.includes(room.id));
  }























































  //endregion

  private updateShowtimeStatuses(): void {
    const now = new Date();

    this.showtimes.forEach(showtime => {
      if (showtime.status === this.SHOWTIME_STATUS.MAINTENANCE) {
        return;
      }

      try {
        const startTime = new Date(showtime.startTime);
        const endTime = new Date(showtime.endTime);
        let newStatus: number;

        if (now.getTime() < startTime.getTime()) {
          newStatus = this.SHOWTIME_STATUS.UPCOMING_SALE;
        } else if (now.getTime() > endTime.getTime()) {
          newStatus = this.SHOWTIME_STATUS.ENDED;
        } else {
          newStatus = this.SHOWTIME_STATUS.PLAYING; // Thay ON_SALE bằng PLAYING
        }

        // Phần còn lại giữ nguyên
      } catch (error) {
        console.error(`Error processing showtime ${showtime.id}:`, error);
      }
    });
  }

  loadShowtimes(): void {
    const params = {
      currentPage: this.currentPage,
      recordPerPage: this.recordPerPage
    };

    this.showtimeService.getShowtimes(params).subscribe({
      next: (response: ShowtimeResponse) => {
        if (response.responseCode === 200) {
          this.showtimes = response.data;
          this.totalRecords = response.totalRecord;
          this.filterShowtimes();
        } else {
          console.error('Error loading showtimes:', response.message);
        }
      },
      error: (error) => {
        console.error('Error loading showtimes:', error);
      }
    });
  }

  filterShowtimes(): void {
    // Filter by movie
    let filtered = [...this.showtimes];

    if (this.selectedMovieId) {
      filtered = filtered.filter(s => s.movieId === this.selectedMovieId);
    }

    // Filter by room
    if (this.selectedRoomId) {
      filtered = filtered.filter(s => s.roomId === this.selectedRoomId);
    }

    // Filter by status
    if (this.selectedStatus !== this.STATUS_TYPES.ALL) {
      filtered = filtered.filter(s => s.status === this.selectedStatus);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.movieName.toLowerCase().includes(term) ||
        s.roomName.toLowerCase().includes(term)
      );
    }

    // Filter by date range
    if (this.startDateFilter) {
      const startDate = new Date(this.startDateFilter).getTime();
      filtered = filtered.filter(s => new Date(s.startTime).getTime() >= startDate);
    }

    if (this.endDateFilter) {
      const endDate = new Date(this.endDateFilter).getTime();
      filtered = filtered.filter(s => new Date(s.startTime).getTime() <= endDate);
    }

    // Separate showtimes based on status for the issue reporting modal
    this.upcomingShowtimes = this.showtimes.filter(s => s.status === this.SHOWTIME_STATUS.UPCOMING || s.status === this.SHOWTIME_STATUS.UPCOMING_SALE);
    this.playingShowtimes = this.showtimes.filter(s => s.status === this.SHOWTIME_STATUS.PLAYING);
    this.maintenanceShowtimes = this.showtimes.filter(s => s.status === this.SHOWTIME_STATUS.MAINTENANCE);

    // Replace this.showtimes with filtered result
    this.showtimes = filtered;
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
    this.roomService.getRooms(1, 10).subscribe({
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
    // Remove backdrop if it exists
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Reset body styles
    document.body.classList.remove('modal-open');
    document.body.removeAttribute('data-bs-overflow');
    document.body.removeAttribute('data-bs-padding-right');
  }




  openAddModal(): void {
    try {
      this.cleanupModalEffects();
      this.isEditing = false;
      this.selectedShowtime = null;
      this.initForm();
      this.cinemaList = [];

      const modalEl = document.getElementById('showtimeModal');
      if (modalEl) {
        this.modalInstance = new bootstrap.Modal(modalEl, {
          backdrop: 'static',
          keyboard: true,
          focus: true
        });

        modalEl.addEventListener('shown.bs.modal', () => {
          modalEl.removeAttribute('aria-hidden');
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => {
          modalEl.setAttribute('aria-hidden', 'true');
          this.cleanupModalEffects();
        }, { once: true });

        this.modalInstance.show();
      }
    } catch (error) {
      this.cleanupModalEffects();
      console.error('Error opening modal:', error);
    }
  }

  canEditShowtime(showtime: Showtime): boolean {
    return showtime.status === this.SHOWTIME_STATUS.UPCOMING_SALE ||
      showtime.status === this.SHOWTIME_STATUS.UPCOMING;
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

      this.initForm();
      this.cinemaList = [];

      setTimeout(() => {
        this.cleanupModalEffects();
      }, 100);
    } catch (error) {
      this.cleanupModalEffects();
      console.error('Error closing modal:', error);
    }
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    if (!this.isEditing) {
      this.createShowtimes();
    } else {
      this.updateShowtime();
    }
  }

  canDeleteShowtime(showtime: Showtime): boolean {
    return showtime.status !== this.SHOWTIME_STATUS.PLAYING &&
      showtime.status !== this.SHOWTIME_STATUS.UPCOMING;
  }

  deleteShowtime(id: string): void {
    Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn xóa suất chiếu này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimeService.deleteShowtime(id).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã xóa suất chiếu thành công.'
              });
              this.loadShowtimes();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: response.message || 'Có lỗi xảy ra khi xóa suất chiếu.'
              });
            }
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Có lỗi xảy ra khi xóa suất chiếu.'
            });
            console.error('Error deleting showtime:', error);
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

  onPageChange(page: number): void {
    if (page < 1 || (page - 1) * this.recordPerPage >= this.totalRecords) return;

    this.currentPage = page;
    this.loadShowtimes();
  }

  onMovieChange(): void {
    this.filterShowtimes();
    // this.onRoomChange();


  }

  onSearch(): void {
    this.filterShowtimes();
  }

  getShowtimeStatus(startTime: Date, endTime: Date): { class: string, text: string } {
    try {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (now < start) {
        return { class: 'bg-info', text: 'Sắp chiếu' };
      } else if (now > end) {
        return { class: 'bg-warning', text: 'Đã chiếu' };
      } else {
        return { class: 'bg-success', text: 'Đang chiếu' };
      }
    } catch (error) {
      console.error('Error calculating showtime status:', error);
      return { class: 'bg-danger', text: 'Không xác định' };
    }
  }

  getShowtimeStatusText(status: number): string {
    switch (status) {
      case this.SHOWTIME_STATUS.UPCOMING_SALE:
        return 'Sắp chiếu';
      case this.SHOWTIME_STATUS.UPCOMING:
        return 'Chưa bắt đầu';
      case this.SHOWTIME_STATUS.PLAYING:
        return 'Đang chiếu';
      case this.SHOWTIME_STATUS.ENDED:
        return 'Đã chiếu';
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
      case this.SHOWTIME_STATUS.UPCOMING:
        return 'bg-primary';
      case this.SHOWTIME_STATUS.PLAYING:
        return 'bg-success';
      case this.SHOWTIME_STATUS.ENDED:
        return 'bg-warning';
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
        return showtime.status === this.SHOWTIME_STATUS.UPCOMING; // Thay NOT_STARTED bằng UPCOMING
      case this.STATUS_TYPES.PLAYING:
        return showtime.status === this.SHOWTIME_STATUS.PLAYING; // Thay ON_SALE bằng PLAYING
      case this.STATUS_TYPES.ENDED:
        return showtime.status === this.SHOWTIME_STATUS.ENDED;
      default:
        return true;
    }
  }

  onStatusChange(): void {
    this.filterShowtimes();
  }

  onDateFilterChange(): void {
    this.filterShowtimes();
  }

  clearDateFilters(): void {
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.loadShowtimes();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedMovieId = '';
    this.selectedRoomId = '';
    this.selectedStatus = this.STATUS_TYPES.ALL;
    this.startDateFilter = null;
    this.endDateFilter = null;
    this.loadShowtimes();
  }

  openReportIssueModal(): void {
    const modalEl = document.getElementById('reportIssueModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  closeReportIssueModal(): void {
    const modalEl = document.getElementById('reportIssueModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
  }

  loadUpcomingShowtimes(): void {
    this.showtimeService.getShowtimes({ currentPage: 1, recordPerPage: 100 })
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            // Lọc các suất chiếu có status là NOT_STARTED
            this.upcomingShowtimes = response.data.filter(showtime =>
              showtime.status === this.SHOWTIME_STATUS.UPCOMING && !showtime.isDeleted
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
              showtime.status === this.SHOWTIME_STATUS.UPCOMING_SALE && !showtime.isDeleted
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
      title: 'Xác nhận',
      text: 'Báo cáo sự cố sẽ đánh dấu suất chiếu này là đang bảo trì. Tiếp tục?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Tiếp tục',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimeService.updateShowtimeStatus(showtimeId, this.SHOWTIME_STATUS.MAINTENANCE).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã cập nhật trạng thái suất chiếu thành đang bảo trì.'
              });
              this.loadShowtimes();
              this.closeReportIssueModal();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: response.message || 'Có lỗi xảy ra khi cập nhật trạng thái suất chiếu.'
              });
            }
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Có lỗi xảy ra khi cập nhật trạng thái suất chiếu.'
            });
            console.error('Error updating showtime status:', error);
          }
        });
      }
    });
  }

  removeMaintenance(showtime: Showtime): void {
    Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn gỡ bỏ trạng thái bảo trì cho suất chiếu này không?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Determine the appropriate status to revert to
        const currentTime = new Date().getTime();
        const startTime = new Date(showtime.startTime).getTime();
        const endTime = new Date(showtime.endTime).getTime();

        let newStatus: number;

        if (currentTime < startTime) {
          newStatus = this.SHOWTIME_STATUS.UPCOMING_SALE;
        } else if (currentTime >= startTime && currentTime <= endTime) {
          newStatus = this.SHOWTIME_STATUS.PLAYING;
        } else {
          newStatus = this.SHOWTIME_STATUS.ENDED;
        }

        this.showtimeService.updateShowtimeStatus(showtime.id, newStatus).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã gỡ bỏ trạng thái bảo trì cho suất chiếu.'
              });
              this.loadShowtimes();
              this.closeReportIssueModal();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: response.message || 'Có lỗi xảy ra khi cập nhật trạng thái suất chiếu.'
              });
            }
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Có lỗi xảy ra khi cập nhật trạng thái suất chiếu.'
            });
            console.error('Error updating showtime status:', error);
          }
        });
      }
    });
  }



  calculateEndTime(cinemaIndex?: number, roomIndex?: number): void {
    if (cinemaIndex !== undefined && roomIndex !== undefined) {
      const cinema = this.cinemaList[cinemaIndex];
      const room = cinema.rooms[roomIndex];

      if (!room.startTime) return;

      // Lấy ID phim từ form
      const movieId = this.showtimeForm.get('movieId')?.value;
      if (!movieId) {
        room.errorMessage = 'Vui lòng chọn phim trước.';
        return;
      }

      // Tìm phim để lấy thời lượng
      const selectedMovie = this.movies.find(m => m.id === movieId);
      if (!selectedMovie) return;

      // Tính toán thời gian kết thúc
      const startTime = new Date(room.startTime);
      const endTime = new Date(startTime);

      // Thời gian giới thiệu trước phim (phút)
      const introTime = this.showtimeForm.get('introTime')?.value || 10;
      endTime.setMinutes(endTime.getMinutes() + introTime);

      // Cộng thời lượng phim (phút)
      endTime.setMinutes(endTime.getMinutes() + selectedMovie.duration);

      // Cộng thêm thời gian dọn dẹp (phút)
      const cleanupTime = this.showtimeForm.get('cleanupTime')?.value || 15;
      endTime.setMinutes(endTime.getMinutes() + cleanupTime);

      // Cập nhật thời gian kết thúc
      room.endTime = this.formatDateTimeForInput(endTime);

      // Kiểm tra xem có đang ở chế độ edit không
      if (this.isEditing) {
        // Trigger kiểm tra lịch chiếu
        this.onRoomChange(cinemaIndex, roomIndex);
      }
    }
  }

  get selectedMovieNames(): string {
    const movieId = this.showtimeForm.get('movieId')?.value;
    const movie = this.movies.find(m => m.id === movieId);
    return movie ? movie.movieName : '';
  }












  editShowtime(showtime: Showtime) {
    if (!this.canEditShowtime(showtime)) {
      Swal.fire({
        icon: 'warning',
        title: 'Không thể sửa!',
        text: 'Chỉ có thể sửa suất chiếu chưa bắt đầu hoặc sắp bán vé.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      // Clean up any existing modal effects
      this.cleanupModalEffects();

      this.isEditing = true;
      this.selectedShowtime = showtime;

      // Reset the form to update defaults
      this.initForm();

      // Get detailed showtime information
      this.showtimeService.getShowtimeById(showtime.id).subscribe({
        next: async (response: any) => {
          if (response.responseCode === 200 && response.data) {
            const detailedShowtime = response.data;

            // Update the form with movie and date details first
            this.showtimeForm.patchValue({
              movieId: detailedShowtime.movieId,
              showtimeDate: new Date(detailedShowtime.startTime).toISOString().split('T')[0],
              introTime: 10,
              cleanupTime: 15
            });

            // Initialize cinema list with the cinema containing this room
            this.cinemaList = [{
              id: detailedShowtime.cinemasId,
              name: '',
              availableRooms: [],
              rooms: [{
                id: detailedShowtime.roomId,
                name: detailedShowtime.roomName,
                startTime: this.formatDateTimeForInput(new Date(detailedShowtime.startTime)),
                endTime: this.formatDateTimeForInput(new Date(detailedShowtime.endTime)),
                loading: false,
                errorMessage: '',
                successMessage: ''
              }]
            }];

            try {
              // Load rooms for the cinema
              const rooms = await this.loadRoomsForCinema(detailedShowtime.cinemasId);
              this.cinemaList[0].availableRooms = rooms;

              // Find cinema name
              const cinema = this.cinemas.find(c => c.cinemasId === detailedShowtime.cinemasId);
              if (cinema) {
                this.cinemaList[0].name = cinema.name;
              }

              // Open the modal after data is loaded
              const modalEl = document.getElementById('showtimeModal');
              if (modalEl) {
                this.modalInstance = new bootstrap.Modal(modalEl, {
                  backdrop: 'static',
                  keyboard: true,
                  focus: true
                });

                modalEl.addEventListener('shown.bs.modal', () => {
                  modalEl.removeAttribute('aria-hidden');
                }, { once: true });

                modalEl.addEventListener('hidden.bs.modal', () => {
                  modalEl.setAttribute('aria-hidden', 'true');
                  this.cleanupModalEffects();
                }, { once: true });

                this.modalInstance.show();
              }
            } catch (error) {
              console.error('Error loading rooms:', error);
              Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể tải danh sách phòng cho rạp này.'
              });
            }
          }
        },
        error: (error: any) => {
          console.error('Error fetching showtime details:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Không thể tải thông tin chi tiết của suất chiếu.'
          });
        }
      });
    } catch (error) {
      console.error('Error in editShowtime:', error);
      this.cleanupModalEffects();
    }
  }







}
