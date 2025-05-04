import { Component, OnInit, ViewChild } from '@angular/core';
import { Room, RoomService, RoomType } from '../../services/room.service';
import { CinemaService, Cinema } from '../../services/cinema.service';
import Swal from 'sweetalert2';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddRoomComponent } from "../add-room/add-room.component";
import { EditRoomComponent } from '../edit-room/edit-room.component';
import { EditRoomInfoComponent } from '../edit-room-info/edit-room-info.component';
import { environment } from '../../../environments/environment';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-room-management',
  templateUrl: './room-management.component.html',
  styleUrls: ['./room-management.component.css'],
  standalone: true,
  imports: [AddRoomComponent, HttpClientModule, CommonModule, FormsModule, EditRoomComponent, EditRoomInfoComponent]
})
export class RoomManagementComponent implements OnInit {
  @ViewChild(EditRoomComponent) editRoomComponent!: EditRoomComponent;
  @ViewChild(EditRoomInfoComponent) editRoomInfoComponent!: EditRoomInfoComponent;

  Math = Math;
  rooms: Room[] = [];
  allRooms: Room[] = [];
  roomTypes: RoomType[] = [];
  // Thêm biến để lưu vị trí scroll
  private scrollPosition: number = 0;

  // Các thuộc tính
  currentPage: number = 1;
  totalPages: number = 0;
  pages: number[] = [];
  recordPerPage: number = 10;
  totalRecords: number = 0;
  isLoading: boolean = false;


  // Filters
  searchTerm = '';
  statusFilter = '-1';
  cinemaFilter = '-1';
  roomTypeFilter = '-1';
  cinemas: Cinema[] = [];

  constructor(
    private roomService: RoomService,
    private cinemaService: CinemaService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadRooms();
    this.loadCinemas();
    this.loadRoomTypes();
    this.loadAllRooms(); // Tải tất cả phòng để lọc

    // Kiểm tra trạng thái phòng mỗi 30 giây
    setInterval(() => {
      this.checkAllRoomsStatus();
    }, 30 * 1000);
  }

  // Tải tất cả phòng để sử dụng cho bộ lọc
  loadAllRooms(): void {
    this.roomService.getRooms(1, 1000).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.allRooms = response.data;
          console.log('Đã tải tất cả phòng:', this.allRooms.length);
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải tất cả phòng:', error);
      }
    });
  }


  loadRooms(): void {
    this.isLoading = true;

    // Gọi API với tham số phân trang
    this.roomService.getRooms(this.currentPage, this.recordPerPage).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.rooms = response.data;
          // Không ghi đè lên allRooms ở đây, vì nó được tải riêng trong loadAllRooms()
          this.totalRecords = response.totalRecord;
          this.calculatePagination();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách phòng', 'error');
        this.isLoading = false;
      }
    });
  }

  loadRoomTypes() {
    this.roomService.getRoomTypes(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.roomTypes = response.data;
        } else {
          console.error('Error loading room types:', response.message);
        }
      },
      error: (error) => console.error('Error loading room types:', error)
    });
  }

  loadCinemas() {
    this.cinemaService.getCinemas(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.cinemas = response.data;
        } else {
          console.error('Error loading cinemas:', response.message);
        }
      },
      error: (error) => console.error('Error loading cinemas:', error)
    });
  }

  checkAllRoomsStatus() {
    // Chỉ kiểm tra các phòng không đang bảo trì
    const roomsToCheck = this.rooms.filter(room => room.status !== 2);

    // Gọi API một lần để lấy tất cả lịch chiếu
    this.http.get(`${environment.apiUrl}ShowTime/GetList?currentPage=1&recordPerPage=1000`).subscribe({
      next: (response: any) => {
        if (response.responseCode === 200) {
          const showTimes = response.data;
          const currentTime = new Date();

          // Cập nhật trạng thái cho từng phòng
          roomsToCheck.forEach(room => {
            const roomShowTimes = showTimes.filter((showTime: any) => showTime.roomId === room.id);
            const hasActiveShowTime = roomShowTimes.some((showTime: any) => {
              const startTime = new Date(showTime.startTime);
              const endTime = new Date(showTime.endTime);
              return currentTime >= startTime && currentTime <= endTime;
            });

            // Chỉ cập nhật nếu trạng thái thay đổi
            const newStatus = hasActiveShowTime ? 4 : 1;
            if (room.status !== newStatus) {
              this.updateRoomStatus(room.id, newStatus);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error checking room status:', error);
      }
    });
  }

  updateRoomStatus(roomId: string, status: number): void {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || room.status === 2) return; // Don't update if room is in maintenance

    const updateData = {
      id: roomId,
      roomTypeId: room.roomTypeId,
      name: room.name,
      seatPrice: Number(room.seatPrice),
      status: status
    };

    this.roomService.updateRoom(updateData).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          // Cập nhật trạng thái trong danh sách phòng
          room.status = status;
          // Cập nhật UI
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error updating room status:', error);
      }
    });
  }

  applyFilters() {
    // Kiểm tra xem allRooms có dữ liệu không
    if (!this.allRooms || this.allRooms.length === 0) {
      console.log('Không có dữ liệu để lọc');
      return;
    }

    let filteredRooms = [...this.allRooms];
    console.log('Tổng số phòng trước khi lọc:', filteredRooms.length);

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      filteredRooms = filteredRooms.filter(room =>
        room.name.toLowerCase().includes(searchTermLower)
      );
      console.log('Sau khi lọc theo tên:', filteredRooms.length);
    }

    if (this.statusFilter !== '-1') {
      const status = parseInt(this.statusFilter, 10);
      filteredRooms = filteredRooms.filter(room => room.status === status);
      console.log('Sau khi lọc theo trạng thái:', filteredRooms.length);
    }

    if (this.cinemaFilter !== '-1') {
      filteredRooms = filteredRooms.filter(room => room.cinemaId === this.cinemaFilter);
      console.log('Sau khi lọc theo rạp:', filteredRooms.length);
    }

    if (this.roomTypeFilter !== '-1') {
      filteredRooms = filteredRooms.filter(room => room.roomTypeId === this.roomTypeFilter);
      console.log('Sau khi lọc theo loại phòng:', filteredRooms.length);
    }

    this.totalRecords = filteredRooms.length;
    this.calculateTotalPages();

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = startIndex + this.recordPerPage;
    this.rooms = filteredRooms.slice(startIndex, endIndex);
    console.log('Kết quả cuối cùng:', this.rooms.length);
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '-1';
    this.cinemaFilter = '-1';
    this.roomTypeFilter = '-1';
    this.currentPage = 1;

    // Tải lại tất cả dữ liệu
    this.loadAllRooms();

    // Đợi một chút để dữ liệu được tải xong rồi áp dụng bộ lọc
    setTimeout(() => {
      this.applyFilters();
    }, 200);
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }



  onSearch() {
    this.currentPage = 1;

    // Đảm bảo rằng allRooms đã được tải
    if (!this.allRooms || this.allRooms.length === 0) {
      this.loadAllRooms();
      setTimeout(() => this.applyFilters(), 200);
    } else {
      this.applyFilters();
    }
  }

  onRoomAdded() {
    this.loadRooms();
    this.loadAllRooms(); // Cập nhật lại danh sách tất cả phòng
  }

  onRoomUpdated() {
    this.loadRooms();
    this.loadAllRooms(); // Cập nhật lại danh sách tất cả phòng
  }

  onEditRoom(roomId: string, totalSeats: number) {
    if (this.editRoomComponent) {
      try {
        this.editRoomComponent.openModal(roomId, totalSeats);
      } catch (error) {
        console.error('Lỗi khi mở modal chỉnh sửa phòng:', error);
        Swal.fire('Lỗi', 'Không thể mở form chỉnh sửa phòng.', 'error');
      }
    } else {
      console.error('EditRoomComponent không được tìm thấy!');
      Swal.fire('Lỗi', 'Component chỉnh sửa phòng không được tìm thấy.', 'error');
    }
  }

  deleteRoom(id: string) {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn có chắc chắn muốn xóa phòng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.roomService.deleteRoom(id).subscribe({
          next: (_) => { // Sử dụng _ để chỉ ra rằng tham số không được sử dụng
            Swal.fire('Thành công', 'Xóa phòng thành công.', 'success');
            this.loadRooms();
            this.loadAllRooms(); // Cập nhật lại danh sách tất cả phòng
          },
          error: (error) => {
            Swal.fire('Lỗi', 'Lỗi khi xóa phòng: ' + error.message, 'error');
          }
        });
      }
    });
  }

  // Phương thức này hiện không được sử dụng, nhưng giữ lại để tham khảo trong tương lai
  fetchSeats(roomId: string) {
    // Ví dụ: gọi API lấy danh sách ghế của phòng
    this.http.get(`/api/rooms/${roomId}/seats`).subscribe({
      next: (response) => {
        console.log('Seats:', response);
      },
      error: (error) => {
        console.error("Lỗi khi lấy danh sách ghế:", error);
      }
    });
  }

  getStatusText(status: number): string {
    switch (status) {
      case 1:
        return 'Có sẵn';
      case 2:
        return 'Đang bảo trì';
      case 3:
        return 'Đang dọn dẹp';
      case 4:
        return 'Đang sử dụng';
      default:
        return 'Không xác định';
    }
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 1:
        return 'badge bg-success';
      case 2:
        return 'badge bg-warning';
      case 3:
        return 'badge bg-info';
      case 4:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getCinemaName(cinemaId: string): string {
    // Kiểm tra xem cinemaId có tồn tại không
    if (!cinemaId) return 'Không xác định';

    const cinema = this.cinemas.find(c => c.cinemasId === cinemaId);
    return cinema ? cinema.name : 'Không xác định';
  }

  getRoomTypeName(roomTypeId: string): string {
    // Kiểm tra xem roomTypeId có tồn tại không
    if (!roomTypeId) return 'Chưa phân loại';

    const roomType = this.roomTypes.find(rt => rt.roomTypeId === roomTypeId);
    return roomType ? roomType.name : 'Chưa phân loại';
  }

  canUpdateStatus(room: Room): boolean {
    return room.status !== 4; // Can't update if room is in use
  }

  editRoomv2(roomId: string) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;

    if (!this.canUpdateStatus(room)) {
      Swal.fire('Lỗi', 'Không thể cập nhật trạng thái phòng đang sử dụng', 'error');
      return;
    }

    // Open edit room info modal
    if (this.editRoomInfoComponent) {
      this.editRoomInfoComponent.openModal(roomId, room.totalSeats);
      // Show modal using Bootstrap
      const modal = document.getElementById('editRoomInfoModal');
      if (modal) {
        const modalInstance = new Modal(modal);
        modalInstance.show();
      }
    }
  }






  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = [];

    // Hiển thị tối đa 5 trang
    if (this.totalPages <= 5) {
      // Nếu tổng số trang <= 5, hiển thị tất cả các trang
      for (let i = 1; i <= this.totalPages; i++) {
        this.pages.push(i);
      }
    } else {
      // Nếu tổng số trang > 5, hiển thị 5 trang xung quanh trang hiện tại
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + 4);

      // Điều chỉnh lại startPage nếu endPage đã đạt giới hạn
      const adjustedStartPage = Math.max(1, endPage - 4);

      for (let i = adjustedStartPage; i <= endPage; i++) {
        this.pages.push(i);
      }
    }
  }



  // Xử lý khi thay đổi số bản ghi mỗi trang
  onRecordsPerPageChange(): void {
    this.currentPage = 1; // Reset về trang đầu tiên
    this.loadRooms();
    // Áp dụng bộ lọc sau khi tải dữ liệu
    setTimeout(() => this.applyFilters(), 100);
  }


  // Xử lý khi thay đổi trang
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadRooms();
    // Áp dụng bộ lọc sau khi tải dữ liệu
    setTimeout(() => this.applyFilters(), 100);
  }


}
