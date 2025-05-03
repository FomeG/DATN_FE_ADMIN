import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovieService } from '../../services/movie.service';
import { RoomService } from '../../services/room.service';
import { ShowtimeService, Showtime, ShowtimeResponse, ShowtimeAutoDateRequest, ShowtimeParams } from '../../services/showtime.service';
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
  showtimes: Showtime[] = []; // Dữ liệu hiển thị sau khi phân trang
  originalShowtimes: Showtime[] = []; // Lưu trữ dữ liệu gốc từ API
  allShowtimes: Showtime[] = []; // Lưu trữ tất cả dữ liệu
  filteredShowtimes: Showtime[] = []; // Dữ liệu sau khi lọc
  movies: any[] = [];
  rooms: any[] = [];
  cinemas: any[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  isLoading = false;
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
  selectedMovie: any = null;
  roomTypes: any[] = [];

  // Biến cho sắp xếp
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

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


  constructor(
    private showtimeService: ShowtimeService,
    private movieService: MovieService,
    private roomService: RoomService,
    private cinemaService: CinemaService,
    private fb: FormBuilder,
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
    this.loadAllShowtimes(); // Thay đổi từ loadShowtimes() sang loadAllShowtimes()
    this.addBackdropFixStylesheet();
    this.initForm();
    this.loadCinemas();
    this.loadRoomTypes();

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
    // Lấy ngày hiện tại của Việt Nam
    const now = new Date();

    // Định dạng date yêu cầu chuỗi có dạng: YYYY-MM-DD
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.showtimeForm = this.fb.group({
      movieId: ['', Validators.required],
      showtimeDate: [
        formattedDate,
        [Validators.required, this.dateNotInPastValidator()]
      ],
      introTime: [10],
      cleanupTime: [15]
    });
  }

  // Validator để kiểm tra ngày không được nhỏ hơn ngày hiện tại
  dateNotInPastValidator() {
    return (control: any) => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const now = new Date();

      // Đặt giờ về 00:00:00 để chỉ so sánh ngày
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Kiểm tra ngày trong quá khứ
      if (selectedDate < today) {
        return { dateInPast: true };
      }

      return null;
    };
  }

  // Kiểm tra thời gian bắt đầu nằm trong khoảng 9h-22h
  isValidTimeRange(dateTimeStr: string): boolean {
    if (!dateTimeStr) return false;

    try {
      const dateTime = new Date(dateTimeStr);
      const hours = dateTime.getHours();

      // Thời gian hợp lệ: 9h sáng đến 22h tối
      return hours >= 9 && hours < 22;
    } catch (error) {
      console.error('Lỗi khi kiểm tra thời gian hợp lệ:', error);
      return false;
    }
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




  // Phương thức lọc theo phòng
  onFilterRoomChange(): void {
    // Đặt lại trang về 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterAndPaginate();
  }

  // Phương thức xử lý khi chọn phòng trong form thêm/sửa suất chiếu
  async onRoomChange(cinemaIndex: number, roomIndex: number): Promise<void> {
    const cinema = this.cinemaList[cinemaIndex];
    const room = cinema.rooms[roomIndex];

    // Xóa các thông báo trước đó
    room.errorMessage = '';
    room.successMessage = '';

    if (!room.id) return;

    // Tìm tên phòng
    const selectedRoom = cinema.availableRooms.find(r => r.id === room.id);
    if (selectedRoom) {
      room.name = selectedRoom.name;
    }

    // Lấy ID phim từ form
    const movieId = this.showtimeForm.get('movieId')?.value;
    if (!movieId) {
      room.errorMessage = 'Vui lòng chọn phim trước.';
      return;
    }

    // Lấy ngày chiếu từ form
    const showtimeDate = this.showtimeForm.get('showtimeDate')?.value;
    if (!showtimeDate) {
      room.errorMessage = 'Vui lòng chọn ngày chiếu trước.';
      return;
    }

    console.log('Ngày chiếu được chọn:', showtimeDate);

    // Đặt trạng thái đang tải
    room.loading = true;

    try {
      // Lấy ngày từ form và giờ hiện tại của Việt Nam
      const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);
      const now = new Date();

      // Định dạng ngày theo yyyy-MM-dd để gửi đến API
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      console.log('Ngày được chọn gửi đến API:', formattedDate);
      console.log('Thời gian hiện tại:', now.toLocaleTimeString());

      const request: ShowtimeAutoDateRequest = {
        cinemasId: cinema.id,
        roomId: room.id,
        date: formattedDate, // Sử dụng ngày đã chọn từ form
        movieId: movieId
      };

      this.showtimeService.showtimeAutoDate(request).subscribe({
        next: (response) => {
          room.loading = false;

          if (response.responseCode === 200 || response.responseCode === -999901) {
            if (response.responseCode === 200) {
              // Thành công
              room.successMessage = 'Có thể tạo suất chiếu cho phòng này.';
              let startTimeDate: Date;

              // Lấy ngày từ form
              const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);

              if (response.data) {
                // Nếu có dữ liệu từ API, sử dụng endTime + 20 phút
                const endTimeFromApi = new Date(response.data.endTime);
                endTimeFromApi.setMinutes(endTimeFromApi.getMinutes() + 20);
                startTimeDate = endTimeFromApi;

                // Đặt ngày theo ngày đã chọn từ form
                startTimeDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              } else {
                // Nếu không có dữ liệu (responseCode = 200, data = null)
                // Đây là ngày chưa có suất chiếu, luôn đặt thời gian bắt đầu từ 9 giờ sáng
                startTimeDate = new Date();
                startTimeDate.setHours(9, 0, 0, 0);

                // Đặt ngày theo ngày đã chọn từ form
                startTimeDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

                console.log('Đặt thời gian bắt đầu từ 9 giờ sáng cho ngày chưa có suất chiếu:', startTimeDate);
              }

              // Kiểm tra nếu thời gian bắt đầu nhỏ hơn thời gian hiện tại
              if (this.isStartTimeBeforeNow(startTimeDate)) {
                room.errorMessage = 'Thời gian bắt đầu không thể nhỏ hơn thời gian hiện tại.';

                // Vẫn định dạng thời gian để hiển thị
                room.startTime = this.formatDateTimeForInput(startTimeDate);
                return;
              } else {
                // Xóa thông báo lỗi nếu thời gian hợp lệ
                if (room.errorMessage === 'Thời gian bắt đầu không thể nhỏ hơn thời gian hiện tại.') {
                  room.errorMessage = '';
                }
              }

              // Định dạng thời gian
              room.startTime = this.formatDateTimeForInput(startTimeDate);

            } else if (response.responseCode === -999901) {
              // Đã có suất chiếu trong ngày này
              room.errorMessage = 'Phim này đã có suất chiếu ngày hôm nay trong phòng này.';

              // Xóa thời gian đã chọn
              room.startTime = '';
              room.endTime = '';

              // Hiển thị thông báo
              Swal.fire({
                icon: 'warning',
                title: 'Không thể tạo suất chiếu!',
                text: 'Phim này đã có suất chiếu ngày hôm nay trong phòng này.',
                confirmButtonText: 'Đồng ý'
              });

              // Trả về sớm để tránh tính toán thời gian kết thúc
              return;
            }

            // Tính thời gian kết thúc nếu có thời gian bắt đầu
            if (room.startTime) {
              this.calculateEndTime(cinemaIndex, roomIndex);
            }

          } else {
            // Lỗi khác
            room.errorMessage = response.message || 'Không thể tạo suất chiếu cho phòng này.';

            // Đặt lại thời gian
            room.startTime = '';
            room.endTime = '';
          }
        },
        error: (error) => {
          room.loading = false;
          room.errorMessage = 'Lỗi khi kiểm tra lịch chiếu. Vui lòng thử lại.';
          console.error('Error getting auto date:', error);

          // Khi có lỗi, luôn đặt thời gian bắt đầu từ 9 giờ sáng
          const defaultDate = new Date();
          defaultDate.setHours(9, 0, 0, 0);

          // Lấy ngày từ form và đặt ngày cho thời gian mặc định
          const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);
          defaultDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

          console.log('Thời gian mặc định khi có lỗi (đặt 9 giờ sáng):', defaultDate);

          // Kiểm tra nếu thời gian mặc định nhỏ hơn thời gian hiện tại
          if (this.isStartTimeBeforeNow(defaultDate)) {
            room.errorMessage = 'Thời gian bắt đầu không thể nhỏ hơn thời gian hiện tại.';
          }

          room.startTime = this.formatDateTimeForInput(defaultDate);

          // Tính thời gian kết thúc
          this.calculateEndTime(cinemaIndex, roomIndex);
        }
      });
    } catch (error) {
      room.loading = false;
      room.errorMessage = 'Lỗi khi kiểm tra lịch chiếu. Vui lòng thử lại.';
      console.error('Error in onRoomChange:', error);

      // Khi có lỗi, luôn đặt thời gian bắt đầu từ 9 giờ sáng
      const defaultDate = new Date();
      defaultDate.setHours(9, 0, 0, 0);

      // Lấy ngày từ form và đặt ngày cho thời gian mặc định
      const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);
      defaultDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

      console.log('Thời gian mặc định khi có lỗi (catch, đặt 9 giờ sáng):', defaultDate);

      // Kiểm tra nếu thời gian mặc định nhỏ hơn thời gian hiện tại
      if (this.isStartTimeBeforeNow(defaultDate)) {
        room.errorMessage = 'Thời gian bắt đầu không thể nhỏ hơn thời gian hiện tại.';
      }

      room.startTime = this.formatDateTimeForInput(defaultDate);

      // Tính thời gian kết thúc
      this.calculateEndTime(cinemaIndex, roomIndex);
    }

    this.changeDetectorRef.detectChanges();
  }

  // Utility function to format time for time input
  formatDateTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }


  isFormValid(): boolean {
    // Check if the form is valid
    if (!this.showtimeForm.valid) return false;

    // Check if at least one cinema is added
    if (this.cinemaList.length === 0) return false;

    // Kiểm tra xem có phòng nào có thời gian không hợp lệ không
    let hasInvalidTimeRange = false;
    let hasErrorMessage = false;

    for (const cinema of this.cinemaList) {
      for (const room of cinema.rooms) {
        // Kiểm tra thông báo lỗi
        if (room.errorMessage) {
          hasErrorMessage = true;
        }

        // Kiểm tra thời gian bắt đầu nằm trong khoảng 9h-22h
        if (room.startTime) {
          const startTime = new Date(room.startTime);
          const hours = startTime.getHours();

          if (hours < 9 || hours >= 22) {
            hasInvalidTimeRange = true;
            room.errorMessage = 'Giờ chiếu phải nằm trong khoảng từ 9:00 đến 21:59.';
          }
        }
      }
    }

    if (hasErrorMessage || hasInvalidTimeRange) {
      return false;
    }

    // Check if each cinema has a valid ID and valid times
    const validCinemas = this.cinemaList.filter(cinema =>
      cinema.id && cinema.rooms.some(room =>
        room.id && room.startTime && room.endTime && !room.errorMessage
      )
    );

    return validCinemas.length > 0;
  }

  //#region THÊM SHOWTIME
  createShowtimes(): void {
    // Kiểm tra lại form trước khi tạo suất chiếu
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Vui lòng kiểm tra lại thông tin suất chiếu. Đảm bảo thời gian bắt đầu nằm trong khoảng từ 9:00 đến 21:59.'
      });
      return;
    }

    // Lấy ID phim từ form
    const movieId = this.showtimeForm.get('movieId')?.value;
    if (!movieId) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Vui lòng chọn phim trước khi tạo lịch chiếu.'
      });
      return;
    }

    // Kiểm tra trạng thái của phim
    const selectedMovie = this.movies.find(m => m.id === movieId);
    if (selectedMovie && selectedMovie.status === 2) {
      // Phim đã kết thúc, hiển thị thông báo và không cho phép tạo lịch chiếu
      Swal.fire({
        icon: 'error',
        title: 'Không thể tạo lịch chiếu!',
        text: 'Phim này đã kết thúc, không thể tạo lịch chiếu mới.',
        confirmButtonText: 'Đồng ý'
      });
      return;
    }

    // Prepare an array of showtime requests
    const showtimeRequests: any[] = [];

    // Lấy ngày từ form
    const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);

    for (const cinema of this.cinemaList) {
      for (const room of cinema.rooms) {
        if (room.id && room.startTime && room.endTime) {
          // Phân tích thời gian bắt đầu (định dạng HH:MM)
          const [startHours, startMinutes] = room.startTime.split(':').map(Number);

          // Tạo đối tượng Date đầy đủ với ngày từ form và giờ từ input
          const startTimeDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            startHours,
            startMinutes,
            0
          );

          // Kiểm tra thời gian bắt đầu nằm trong khoảng 9h-22h
          const hours = startTimeDate.getHours();

          if (hours < 9 || hours >= 22) {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Giờ chiếu phải nằm trong khoảng từ 9:00 đến 21:59.'
            });
            return;
          }

          // Phân tích thời gian kết thúc (định dạng HH:MM)
          const [endHours, endMinutes] = room.endTime.split(':').map(Number);

          // Tạo đối tượng Date đầy đủ với ngày từ form và giờ từ input
          const endTimeDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            endHours,
            endMinutes,
            0
          );

          // Chuyển đổi sang ISO string để gửi đến API, giữ nguyên múi giờ địa phương
          // Lấy offset múi giờ (phút)
          const tzOffset = startTimeDate.getTimezoneOffset();

          // Tạo bản sao và điều chỉnh thời gian để bù đắp cho việc chuyển đổi sang UTC
          const startTimeAdjusted = new Date(startTimeDate.getTime() - tzOffset * 60000);
          const endTimeAdjusted = new Date(endTimeDate.getTime() - tzOffset * 60000);

          // Chuyển đổi sang ISO string
          const startTimeISO = startTimeAdjusted.toISOString();
          const endTimeISO = endTimeAdjusted.toISOString();

          console.log('Múi giờ offset (phút):', tzOffset);
          console.log('Thời gian gốc:', startTimeDate);
          console.log('Thời gian đã điều chỉnh:', startTimeAdjusted);

          console.log('Thời gian bắt đầu gửi đến API:', startTimeISO);
          console.log('Thời gian kết thúc gửi đến API:', endTimeISO);

          showtimeRequests.push({
            movieId: movieId,
            roomId: room.id,
            startTime: startTimeISO,
            endTime: endTimeISO,
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
    // Kiểm tra lại form trước khi cập nhật suất chiếu
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Vui lòng kiểm tra lại thông tin suất chiếu. Đảm bảo thời gian bắt đầu nằm trong khoảng từ 9:00 đến 21:59.'
      });
      return;
    }

    if (!this.selectedShowtime) return;

    // Lấy ID phim từ form
    const movieId = this.showtimeForm.get('movieId')?.value;
    if (!movieId) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Vui lòng chọn phim trước khi cập nhật lịch chiếu.'
      });
      return;
    }

    // Kiểm tra trạng thái của phim
    const selectedMovie = this.movies.find(m => m.id === movieId);
    if (selectedMovie && selectedMovie.status === 2) {
      // Phim đã kết thúc, hiển thị thông báo và không cho phép cập nhật lịch chiếu
      Swal.fire({
        icon: 'error',
        title: 'Không thể cập nhật lịch chiếu!',
        text: 'Phim này đã kết thúc, không thể cập nhật lịch chiếu.',
        confirmButtonText: 'Đồng ý'
      });
      return;
    }

    // In case of editing, we only allow updating the first room
    const cinema = this.cinemaList[0];
    if (!cinema || cinema.rooms.length === 0) return;

    const room = cinema.rooms[0];
    if (!room.id || !room.startTime || !room.endTime) return;

    // Lấy ngày từ form
    const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);

    // Phân tích thời gian bắt đầu (định dạng HH:MM)
    const [startHours, startMinutes] = room.startTime.split(':').map(Number);

    // Tạo đối tượng Date đầy đủ với ngày từ form và giờ từ input
    const startTimeDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      startHours,
      startMinutes,
      0
    );

    // Kiểm tra thời gian bắt đầu nằm trong khoảng 9h-22h
    const hours = startTimeDate.getHours();

    if (hours < 9 || hours >= 22) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Giờ chiếu phải nằm trong khoảng từ 9:00 đến 21:59.'
      });
      return;
    }

    // Phân tích thời gian kết thúc (định dạng HH:MM)
    const [endHours, endMinutes] = room.endTime.split(':').map(Number);

    // Tạo đối tượng Date đầy đủ với ngày từ form và giờ từ input
    const endTimeDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      endHours,
      endMinutes,
      0
    );

    // Chuyển đổi sang ISO string để gửi đến API, giữ nguyên múi giờ địa phương
    // Lấy offset múi giờ (phút)
    const tzOffset = startTimeDate.getTimezoneOffset();

    // Tạo bản sao và điều chỉnh thời gian để bù đắp cho việc chuyển đổi sang UTC
    const startTimeAdjusted = new Date(startTimeDate.getTime() - tzOffset * 60000);
    const endTimeAdjusted = new Date(endTimeDate.getTime() - tzOffset * 60000);

    // Chuyển đổi sang ISO string
    const startTimeISO = startTimeAdjusted.toISOString();
    const endTimeISO = endTimeAdjusted.toISOString();

    console.log('Múi giờ offset (phút):', tzOffset);
    console.log('Thời gian gốc:', startTimeDate);
    console.log('Thời gian đã điều chỉnh:', startTimeAdjusted);

    console.log('Thời gian bắt đầu gửi đến API (update):', startTimeISO);
    console.log('Thời gian kết thúc gửi đến API (update):', endTimeISO);

    const updateRequest = {
      roomId: room.id,
      movieId: movieId,
      startTime: startTimeISO,
      endTime: endTimeISO
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



  // Đã được chuyển lên trên


  onMovieFormChange(movieId: string): void {
    console.log("Phim đã thay đổi trong form:", movieId);

    try {
      if (!movieId) {
        this.selectedMovie = null;
        return;
      }

      // Tìm thông tin phim đã chọn
      this.selectedMovie = this.movies.find(m => m.id === movieId);
      if (!this.selectedMovie) return;

      // Kiểm tra trạng thái của phim
      if (this.selectedMovie.status === 2) {
        // Phim đã kết thúc, hiển thị thông báo và không cho phép thêm lịch chiếu
        Swal.fire({
          icon: 'error',
          title: 'Không thể tạo lịch chiếu!',
          text: 'Phim này đã kết thúc, không thể tạo lịch chiếu mới.',
          confirmButtonText: 'Đồng ý'
        });

        // Xóa lựa chọn phim
        this.showtimeForm.get('movieId')?.setValue('');
        this.selectedMovie = null;
        return;
      }

      // Kiểm tra xem có phòng nào không phù hợp với format của phim không
      let hasIncompatibleRooms = false;

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

                // Kiểm tra tính tương thích của phòng với phim
                const selectedRoom = this.getRoomById(room.id);
                if (selectedRoom && !this.isRoomCompatible(selectedRoom)) {
                  hasIncompatibleRooms = true;
                  room.errorMessage = 'Phòng này không phù hợp với định dạng của phim!';
                } else {
                  // Xóa thông báo lỗi
                  room.errorMessage = '';
                }
              }
            });
          }
        });
      }

      // Hiển thị cảnh báo nếu có phòng không phù hợp
      if (hasIncompatibleRooms) {
        Swal.fire({
          icon: 'warning',
          title: 'Cảnh báo!',
          text: 'Một số phòng đã chọn không phù hợp với định dạng của phim. Vui lòng kiểm tra lại.',
          confirmButtonText: 'Đồng ý'
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

    // Kiểm tra ngày không được nhỏ hơn ngày hiện tại
    const selectedDate = new Date(showtimeDate);
    const now = new Date();

    // Đặt giờ về 00:00:00 để chỉ so sánh ngày
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      // Đánh dấu control là đã chạm vào để hiển thị lỗi
      this.showtimeForm.get('showtimeDate')?.markAsTouched();
      this.showtimeForm.get('showtimeDate')?.setErrors({ dateInPast: true });
      return;
    }

    // Xử lý cho tất cả các rạp và phòng đã chọn
    if (this.cinemaList && this.cinemaList.length > 0) {
      this.cinemaList.forEach((cinema, cinemaIndex) => {
        if (cinema.rooms && cinema.rooms.length > 0) {
          cinema.rooms.forEach((room, roomIndex) => {
            if (room.id) {
              // Gọi API để kiểm tra lịch chiếu và cập nhật thời gian
              if (cinema.id && room.id) {
                // Gọi lại onRoomChange để cập nhật thời gian bắt đầu và kết thúc
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

    // Return only rooms that are not selected in other dropdowns and not in maintenance (status != 2)
    return cinema.availableRooms.filter((room: { id: any; status: number; }) =>
      !selectedRoomIds.includes(room.id) && room.status !== 2);
  }























































  //endregion

  private updateShowtimeStatuses(): void {
    const now = new Date();

    // Cập nhật trạng thái cho cả dữ liệu gốc và dữ liệu đã lọc
    const updateStatus = (showtime: Showtime) => {
      if (showtime.status === this.SHOWTIME_STATUS.MAINTENANCE) {
        return; // Không cập nhật trạng thái cho suất chiếu đang bảo trì
      }

      try {
        const startTime = new Date(showtime.startTime);
        const endTime = new Date(showtime.endTime);

        // Xác định trạng thái mới dựa trên thời gian hiện tại
        if (now.getTime() < startTime.getTime()) {
          // Giữ nguyên trạng thái UPCOMING (2) nếu đã có, chỉ đổi UPCOMING_SALE (1) nếu trạng thái khác
          if (showtime.status !== this.SHOWTIME_STATUS.UPCOMING) {
            showtime.status = this.SHOWTIME_STATUS.UPCOMING_SALE;
          }
        } else if (now.getTime() > endTime.getTime()) {
          showtime.status = this.SHOWTIME_STATUS.ENDED;
        } else {
          showtime.status = this.SHOWTIME_STATUS.PLAYING;
        }
      } catch (error) {
        console.error(`Error processing showtime ${showtime.id}:`, error);
      }
    };

    // Cập nhật trạng thái cho tất cả các suất chiếu
    this.allShowtimes.forEach(updateStatus);

    // Cập nhật trạng thái cho các suất chiếu đã lọc
    this.filteredShowtimes.forEach(updateStatus);

    // Cập nhật trạng thái cho các suất chiếu đang hiển thị
    this.showtimes.forEach(updateStatus);

    // Lọc và phân trang lại để cập nhật giao diện
    this.filterAndPaginate();

    // Cập nhật các danh sách cho modal báo cáo sự cố
    this.updateReportModalLists();
  }

  // Phương thức lấy tất cả dữ liệu showtime
  loadAllShowtimes(): void {
    console.log('Loading all showtimes...');
    this.isLoading = true;

    this.showtimeService.getAllShowtimes().subscribe({
      next: (response: ShowtimeResponse) => {
        if (response.responseCode === 200) {
          // Lưu trữ tất cả dữ liệu
          this.allShowtimes = [...response.data];
          console.log(`Loaded ${this.allShowtimes.length} showtimes`);

          // Lọc và phân trang dữ liệu
          this.filterAndPaginate();

          // Phân loại các suất chiếu cho modal báo cáo sự cố
          this.updateReportModalLists();
          this.calculateTotalPages();
          this.isLoading = false;
        } else {
          console.error('Error loading all showtimes:', response.message);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading all showtimes:', error);
        this.isLoading = false;
      }
    });
  }

  // Phương thức cập nhật danh sách cho modal báo cáo sự cố
  updateReportModalLists(): void {
    // Sử dụng dữ liệu đã lọc để cập nhật các danh sách
    this.upcomingShowtimes = this.filteredShowtimes.filter(s =>
      s.status === this.SHOWTIME_STATUS.UPCOMING ||
      s.status === this.SHOWTIME_STATUS.UPCOMING_SALE);

    this.playingShowtimes = this.filteredShowtimes.filter(s =>
      s.status === this.SHOWTIME_STATUS.PLAYING);

    this.maintenanceShowtimes = this.filteredShowtimes.filter(s =>
      s.status === this.SHOWTIME_STATUS.MAINTENANCE);
  }

  // Phương thức lọc và phân trang dữ liệu ở client
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);

    // Giới hạn hiển thị tối đa 5 trang
    if (this.totalPages <= 5) {
      // Nếu tổng số trang <= 5, hiển thị tất cả các trang
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      // Nếu tổng số trang > 5, hiển thị 5 trang xung quanh trang hiện tại
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + 4);

      // Điều chỉnh lại startPage nếu endPage đã đạt giới hạn
      const adjustedStartPage = Math.max(1, endPage - 4);

      this.pages = Array.from({ length: 5 }, (_, i) => adjustedStartPage + i).filter(p => p <= this.totalPages);
    }
  }

  filterAndPaginate(): void {
    console.log('Filtering and paginating data...');
    this.isLoading = true;

    // Bắt đầu với tất cả dữ liệu
    let filtered = [...this.allShowtimes];

    // Lọc theo phim
    if (this.selectedMovieId) {
      console.log('Filtering by movie ID:', this.selectedMovieId);
      filtered = filtered.filter(s => s.movieId === this.selectedMovieId);
    }

    // Lọc theo phòng
    if (this.selectedRoomId) {
      console.log('Filtering by room ID:', this.selectedRoomId);
      filtered = filtered.filter(s => s.roomId === this.selectedRoomId);
    }

    // Lọc theo trạng thái
    if (this.selectedStatus !== -1) {
      console.log('Filtering by status:', this.selectedStatus);

      // Xử lý trạng thái dựa trên giá trị từ HTML
      switch (this.selectedStatus) {
        case 1: // Sắp chiếu
          filtered = filtered.filter(s =>
            s.status === this.SHOWTIME_STATUS.UPCOMING_SALE ||
            s.status === this.SHOWTIME_STATUS.UPCOMING);
          break;
        case 2: // Chuẩn bị chiếu
          filtered = filtered.filter(s => s.status === this.SHOWTIME_STATUS.UPCOMING);
          break;
        case 3: // Đang chiếu
          filtered = filtered.filter(s => s.status === this.SHOWTIME_STATUS.PLAYING);
          break;
        case 4: // Đã kết thúc
          filtered = filtered.filter(s => s.status === this.SHOWTIME_STATUS.ENDED);
          break;
        case 5: // Đang bảo trì
          filtered = filtered.filter(s => s.status === this.SHOWTIME_STATUS.MAINTENANCE);
          break;
        default:
          // Không có trường hợp mặc định, vì đã kiểm tra selectedStatus !== -1
          break;
      }
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      console.log('Filtering by search term:', this.searchTerm);
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        (s.movieName && s.movieName.toLowerCase().includes(term)) ||
        (s.roomName && s.roomName.toLowerCase().includes(term))
      );
    }

    // Lọc theo khoảng thời gian
    if (this.startDateFilter) {
      try {
        const startDate = new Date(this.startDateFilter);
        console.log('Filtering by start date:', startDate);
        filtered = filtered.filter(s => {
          try {
            const showtimeStart = new Date(s.startTime);
            return showtimeStart >= startDate;
          } catch (error) {
            console.error('Error parsing showtime start time:', s.startTime, error);
            return false;
          }
        });
      } catch (error) {
        console.error('Error parsing start date filter:', this.startDateFilter, error);
      }
    }

    if (this.endDateFilter) {
      try {
        const endDate = new Date(this.endDateFilter);
        // Đặt thời gian kết thúc là cuối ngày (23:59:59.999)
        endDate.setHours(23, 59, 59, 999);
        console.log('Filtering by end date:', endDate);
        filtered = filtered.filter(s => {
          try {
            const showtimeStart = new Date(s.startTime);
            return showtimeStart <= endDate;
          } catch (error) {
            console.error('Error parsing showtime start time:', s.startTime, error);
            return false;
          }
        });
      } catch (error) {
        console.error('Error parsing end date filter:', this.endDateFilter, error);
      }
    }

    // Lưu kết quả lọc
    this.filteredShowtimes = filtered;

    // Áp dụng sắp xếp nếu có
    if (this.sortColumn) {
      this.applySort();
    }

    // Cập nhật tổng số bản ghi
    this.totalRecords = this.filteredShowtimes.length;
    console.log('Total filtered records:', this.totalRecords);

    // Phân trang
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = Math.min(startIndex + this.recordPerPage, this.filteredShowtimes.length);
    this.showtimes = this.filteredShowtimes.slice(startIndex, endIndex);
    console.log(`Showing records ${startIndex + 1} to ${endIndex} of ${this.filteredShowtimes.length}`);

    // Lưu trữ dữ liệu gốc cho các tính năng khác
    this.originalShowtimes = [...this.filteredShowtimes];
    this.isLoading = false;
  }

  // Giữ lại phương thức loadShowtimes cũ để tương thích ngược
  loadShowtimes(): void {
    // Chuyển hướng sang phương thức mới
    this.loadAllShowtimes();
  }

  // Phương thức filterShowtimes cũ đã được thay thế bằng filterAndPaginate

  loadMovies() {
    this.movieService.getMovies(1, 100).subscribe({
      next: (response) => {
        this.movies = response.data;
      },
      error: () => {
        console.error('Lỗi khi tải danh sách phim');
      }
    });
  }

  loadRooms() {
    this.roomService.getRooms(1, 10).subscribe({
      next: (response) => {
        this.rooms = response.data;
      },
      error: () => {
        console.error('Lỗi khi tải danh sách phòng');
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

    // Kiểm tra tính tương thích của phòng với phim trước khi submit
    let hasIncompatibleRooms = false;
    let incompatibleRoomNames: string[] = [];

    for (const cinema of this.cinemaList) {
      for (const room of cinema.rooms) {
        if (room.id) {
          const selectedRoom = this.getRoomById(room.id);
          if (selectedRoom && !this.isRoomCompatible(selectedRoom)) {
            hasIncompatibleRooms = true;
            incompatibleRoomNames.push(selectedRoom.name);
          }
        }
      }
    }

    if (hasIncompatibleRooms) {
      Swal.fire({
        icon: 'error',
        title: 'Không thể tạo suất chiếu!',
        html: `Các phòng sau không phù hợp với định dạng của phim:<br><strong>${incompatibleRoomNames.join(', ')}</strong><br><br>Vui lòng chọn phòng khác hoặc thay đổi phim.`,
        confirmButtonText: 'Đồng ý'
      });
      return;
    }

    if (!this.isEditing) {
      this.createShowtimes();
    } else {
      this.updateShowtime();
    }
  }

  canDeleteShowtime(showtime: Showtime): boolean {
    return showtime.status !== this.SHOWTIME_STATUS.PLAYING &&
      showtime.status !== this.SHOWTIME_STATUS.UPCOMING_SALE;
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
    // Chỉ cần phân trang lại, không cần lọc lại
    this.filterAndPaginate();
  }

  onRecordsPerPageChange(): void {
    this.currentPage = 1; // Reset về trang đầu tiên khi thay đổi số bản ghi mỗi trang
    this.filterAndPaginate();
  }

  onMovieChange(): void {
    // Đặt lại trang về 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterAndPaginate();
  }

  onSearch(): void {
    // Đặt lại trang về 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterAndPaginate();
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
    if (!this.selectedStatus || this.selectedStatus === -1) {
      return true;
    }

    // Xử lý trạng thái dựa trên giá trị từ HTML
    switch (this.selectedStatus) {
      case 1: // Sắp chiếu
        return showtime.status === this.SHOWTIME_STATUS.UPCOMING_SALE ||
               showtime.status === this.SHOWTIME_STATUS.UPCOMING;
      case 2: // Chuẩn bị chiếu
        return showtime.status === this.SHOWTIME_STATUS.UPCOMING;
      case 3: // Đang chiếu
        return showtime.status === this.SHOWTIME_STATUS.PLAYING;
      case 4: // Đã kết thúc
        return showtime.status === this.SHOWTIME_STATUS.ENDED;
      case 5: // Đang bảo trì
        return showtime.status === this.SHOWTIME_STATUS.MAINTENANCE;
      default:
        return false;
    }
  }

  onStatusChange(): void {
    console.log('Status changed to:', this.selectedStatus);
    // Đặt lại trang về 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterAndPaginate();
  }

  // Phương thức sắp xếp
  sort(column: string): void {
    console.log('Sorting by column:', column);

    // Nếu đang sắp xếp theo cột này rồi thì đổi hướng sắp xếp
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nếu chọn cột mới, mặc định sắp xếp tăng dần
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Áp dụng sắp xếp và cập nhật dữ liệu
    this.applySort();

    // Cập nhật phân trang
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = Math.min(startIndex + this.recordPerPage, this.filteredShowtimes.length);
    this.showtimes = this.filteredShowtimes.slice(startIndex, endIndex);
  }

  // Áp dụng sắp xếp cho danh sách
  applySort(): void {
    if (!this.sortColumn) return;

    console.log(`Applying sort: ${this.sortColumn} ${this.sortDirection}`);

    this.filteredShowtimes.sort((a: any, b: any) => {
      let valueA: any;
      let valueB: any;

      // Lấy giá trị cần so sánh dựa trên cột sắp xếp
      switch(this.sortColumn) {
        case 'movieName':
          valueA = a.movieName || '';
          valueB = b.movieName || '';
          break;
        case 'duration':
          valueA = parseInt(a.duration) || 0;
          valueB = parseInt(b.duration) || 0;
          break;
        case 'roomName':
          valueA = a.roomName || '';
          valueB = b.roomName || '';
          break;
        case 'startTime':
          valueA = new Date(a.startTime).getTime();
          valueB = new Date(b.startTime).getTime();
          break;
        case 'endTime':
          valueA = new Date(a.endTime).getTime();
          valueB = new Date(b.endTime).getTime();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a[this.sortColumn];
          valueB = b[this.sortColumn];
      }

      // So sánh giá trị
      let comparison = 0;
      if (typeof valueA === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA - valueB;
      }

      // Áp dụng hướng sắp xếp
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Lấy icon cho cột đang sắp xếp
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort'; // Icon mặc định
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onDateFilterChange(): void {
    console.log('Date filter changed - Start:', this.startDateFilter, 'End:', this.endDateFilter);

    // Kiểm tra định dạng ngày tháng
    if (this.startDateFilter) {
      try {
        const startDate = new Date(this.startDateFilter);
        console.log('Parsed start date:', startDate);
        console.log('Start date year:', startDate.getFullYear());
      } catch (error) {
        console.error('Error parsing start date:', error);
      }
    }

    if (this.endDateFilter) {
      try {
        const endDate = new Date(this.endDateFilter);
        console.log('Parsed end date:', endDate);
        console.log('End date year:', endDate.getFullYear());
      } catch (error) {
        console.error('Error parsing end date:', error);
      }
    }

    // Đặt lại trang về 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterAndPaginate();
  }

  clearDateFilters(): void {
    this.startDateFilter = null;
    this.endDateFilter = null;
    // Đặt lại trang về 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterAndPaginate();
  }

  // Phương thức kiểm tra API lọc theo ngày
  testDateFilter(): void {
    if (!this.startDateFilter && !this.endDateFilter) {
      console.log('No date filters to test');
      return;
    }

    let startDateStr = '';
    let endDateStr = '';
    let startTimeStr = '';
    let endTimeStr = '';

    if (this.startDateFilter) {
      try {
        const startDate = new Date(this.startDateFilter);
        // Điều chỉnh múi giờ
        const tzOffset = startDate.getTimezoneOffset();
        const startDateAdjusted = new Date(startDate.getTime() - tzOffset * 60000);

        startDateStr = startDateAdjusted.toISOString().split('T')[0]; // YYYY-MM-DD
        startTimeStr = startDateAdjusted.toISOString(); // Full ISO datetime
      } catch (error) {
        console.error('Error formatting start date for test:', error);
        return;
      }
    }

    if (this.endDateFilter) {
      try {
        const endDate = new Date(this.endDateFilter);
        // Đặt thời gian kết thúc là cuối ngày (23:59:59.999)
        endDate.setHours(23, 59, 59, 999);

        // Điều chỉnh múi giờ
        const tzOffset = endDate.getTimezoneOffset();
        const endDateAdjusted = new Date(endDate.getTime() - tzOffset * 60000);

        endDateStr = endDateAdjusted.toISOString().split('T')[0]; // YYYY-MM-DD
        endTimeStr = endDateAdjusted.toISOString(); // Full ISO datetime
      } catch (error) {
        console.error('Error formatting end date for test:', error);
        return;
      }
    }

    console.log('Testing date filter with:', startDateStr, endDateStr);
    console.log('Testing time filter with:', startTimeStr, endTimeStr);

    // Kiểm tra lọc theo ngày (YYYY-MM-DD)
    this.showtimeService.testDateFilter(startDateStr, endDateStr).subscribe({
      next: (response) => {
        console.log('Date filter test response:', response);
        if (response.data && response.data.length > 0) {
          console.log('First showtime in response:', response.data[0]);
          console.log('Last showtime in response:', response.data[response.data.length - 1]);

          // Kiểm tra xem có suất chiếu nào nằm ngoài khoảng thời gian không
          if (startTimeStr && endTimeStr) {
            const startTime = new Date(startTimeStr).getTime();
            const endTime = new Date(endTimeStr).getTime();

            const outsideRange = response.data.filter(showtime => {
              const showtimeStart = new Date(showtime.startTime).getTime();
              return showtimeStart < startTime || showtimeStart > endTime;
            });

            if (outsideRange.length > 0) {
              console.log('WARNING: Found showtimes outside the specified time range:', outsideRange.length);
              console.log('Example outside range:', outsideRange[0]);
            } else {
              console.log('All showtimes are within the specified time range');
            }
          }
        } else {
          console.log('No showtimes found with date filter');
        }
      },
      error: (error) => {
        console.error('Error testing date filter:', error);
      }
    });

    // Kiểm tra lọc theo thời gian đầy đủ (ISO datetime)
    if (startTimeStr || endTimeStr) {
      const params: ShowtimeParams = {
        currentPage: 1,
        recordPerPage: 100
      };

      if (startTimeStr) {
        params.startTimeFilter = startTimeStr;
      }

      if (endTimeStr) {
        params.endTimeFilter = endTimeStr;
      }

      this.showtimeService.getShowtimes(params).subscribe({
        next: (response) => {
          console.log('Time filter test response:', response);
          if (response.data && response.data.length > 0) {
            console.log('First showtime in time filter response:', response.data[0]);
            console.log('Last showtime in time filter response:', response.data[response.data.length - 1]);
          } else {
            console.log('No showtimes found with time filter');
          }
        },
        error: (error) => {
          console.error('Error testing time filter:', error);
        }
      });
    }
  }

  clearAllFilters(): void {
    console.log('Clearing all filters');
    this.searchTerm = '';
    this.selectedMovieId = '';
    this.selectedRoomId = '';
    this.selectedStatus = -1; // Tất cả trạng thái
    this.startDateFilter = null;
    this.endDateFilter = null;

    // Đặt lại trang về 1 và lọc/phân trang lại dữ liệu
    this.currentPage = 1;
    this.filterAndPaginate();

    // Thông báo cho người dùng
    Swal.fire({
      icon: 'success',
      title: 'Đã xóa tất cả bộ lọc',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500
    });
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
            // Lọc các suất chiếu có status là UPCOMING hoặc UPCOMING_SALE
            this.upcomingShowtimes = response.data.filter(showtime =>
              (showtime.status === this.SHOWTIME_STATUS.UPCOMING ||
                showtime.status === this.SHOWTIME_STATUS.UPCOMING_SALE) &&
              !showtime.isDeleted
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
            // Lọc các suất chiếu có status là PLAYING
            this.playingShowtimes = response.data.filter(showtime =>
              showtime.status === this.SHOWTIME_STATUS.PLAYING && !showtime.isDeleted
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



  // Kiểm tra thời gian bắt đầu có nhỏ hơn thời gian hiện tại không
  isStartTimeBeforeNow(startTimeDate: Date): boolean {
    // Lấy thời gian hiện tại (múi giờ Việt Nam)
    const now = new Date();

    // So sánh thời gian bắt đầu với thời gian hiện tại
    return startTimeDate < now;
  }

  calculateEndTime(cinemaIndex?: number, roomIndex?: number): void {
    if (cinemaIndex !== undefined && roomIndex !== undefined) {
      const cinema = this.cinemaList[cinemaIndex];
      const room = cinema.rooms[roomIndex];

      if (!room.startTime) return;

      // Lấy ngày từ form
      const selectedDate = new Date(this.showtimeForm.get('showtimeDate')?.value);

      // Phân tích thời gian bắt đầu (định dạng HH:MM)
      const [startHours, startMinutes] = room.startTime.split(':').map(Number);

      // Tạo đối tượng Date với ngày từ form và giờ từ input
      const startTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        startHours,
        startMinutes,
        0
      );

      // Kiểm tra nếu thời gian bắt đầu nhỏ hơn thời gian hiện tại
      if (this.isStartTimeBeforeNow(startTime)) {
        room.errorMessage = 'Thời gian bắt đầu không thể nhỏ hơn thời gian hiện tại.';
        return;
      } else {
        // Xóa thông báo lỗi nếu thời gian hợp lệ
        if (room.errorMessage === 'Thời gian bắt đầu không thể nhỏ hơn thời gian hiện tại.') {
          room.errorMessage = '';
        }
      }

      // Kiểm tra thời gian bắt đầu nằm trong khoảng 9h-22h
      const hours = startTime.getHours();

      if (hours < 9 || hours >= 22) {
        room.errorMessage = 'Giờ chiếu phải nằm trong khoảng từ 9:00 đến 21:59.';
        room.endTime = '';
        return;
      } else {
        // Xóa thông báo lỗi nếu thời gian hợp lệ
        if (room.errorMessage === 'Giờ chiếu phải nằm trong khoảng từ 9:00 đến 21:59.') {
          room.errorMessage = '';
        }
      }

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
      const endTime = new Date(startTime);

      // Thời gian giới thiệu trước phim (phút)
      const introTime = this.showtimeForm.get('introTime')?.value || 10;
      endTime.setMinutes(endTime.getMinutes() + introTime);

      // Cộng thời lượng phim (phút)
      endTime.setMinutes(endTime.getMinutes() + selectedMovie.duration);

      // Cộng thêm thời gian dọn dẹp (phút)
      const cleanupTime = this.showtimeForm.get('cleanupTime')?.value || 15;
      endTime.setMinutes(endTime.getMinutes() + cleanupTime);

      // Cập nhật thời gian kết thúc (chỉ lấy giờ và phút)
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

  // Phương thức lấy thông tin phòng từ ID
  getRoomById(roomId: string): any {
    return this.rooms.find(room => room.id === roomId);
  }

  // Phương thức lấy tên loại phòng từ ID loại phòng
  getRoomTypeName(roomTypeId: string): string {
    const roomType = this.roomTypes.find(rt => rt.roomTypeId === roomTypeId);
    return roomType ? roomType.name : 'Không xác định';
  }

  // Phương thức kiểm tra tính tương thích của phòng với phim
  isRoomCompatible(room: any): boolean {
    if (!this.selectedMovie || !room) return true; // Nếu không có phim hoặc phòng, coi như hợp lệ

    // Lấy loại phòng
    const roomType = this.roomTypes.find(rt => rt.roomTypeId === room.roomTypeId);
    if (!roomType) return true; // Nếu không tìm thấy loại phòng, coi như hợp lệ

    // Lấy các format của phim
    const movieFormats = this.selectedMovie.formats || [];
    if (movieFormats.length === 0) return true; // Nếu phim không có format, coi như hợp lệ

    // Kiểm tra xem có ít nhất một format của phim trùng với tên loại phòng không
    // Ví dụ: Phim có format 2D, 3D và phòng có loại 3D -> hợp lệ
    const roomTypeName = roomType.name.toUpperCase();
    return movieFormats.some((format: { name: string }) => {
      const formatName = format.name.toUpperCase();
      return roomTypeName.includes(formatName) || formatName.includes(roomTypeName);
    });
  }

  // Phương thức tải danh sách loại phòng
  loadRoomTypes(): void {
    // Gọi API để lấy danh sách loại phòng
    this.roomService.getRoomTypes(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.roomTypes = response.data;
        } else {
          console.error('Error loading room types:', response.message);
        }
      },
      error: (error) => {
        console.error('Error loading room types:', error);
      }
    });
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

            // Tìm thông tin phim để kiểm tra trạng thái
            const selectedMovie = this.movies.find(m => m.id === detailedShowtime.movieId);
            if (selectedMovie && selectedMovie.status === 2) {
              // Phim đã kết thúc, hiển thị thông báo và không cho phép chỉnh sửa lịch chiếu
              Swal.fire({
                icon: 'error',
                title: 'Không thể chỉnh sửa lịch chiếu!',
                text: 'Phim này đã kết thúc, không thể chỉnh sửa lịch chiếu.',
                confirmButtonText: 'Đồng ý'
              });
              this.isEditing = false;
              this.selectedShowtime = null;
              return;
            }

            // Update the form with movie and datetime details first
            const startDateTime = new Date(detailedShowtime.startTime);

            // Định dạng ngày theo yyyy-MM-dd để đặt vào input type="date"
            const formattedDate = `${startDateTime.getFullYear()}-${String(startDateTime.getMonth() + 1).padStart(2, '0')}-${String(startDateTime.getDate()).padStart(2, '0')}`;

            this.showtimeForm.patchValue({
              movieId: detailedShowtime.movieId,
              showtimeDate: formattedDate,
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
