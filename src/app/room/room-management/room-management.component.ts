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

  rooms: Room[] = [];
  allRooms: Room[] = [];
  roomTypes: RoomType[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  
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
    
    // Kiểm tra trạng thái phòng mỗi 5 phút
    setInterval(() => {
      this.rooms.forEach(room => {
        if (room.status !== 2) { // Không kiểm tra nếu phòng đang bảo trì
          this.checkRoomStatus(room.id);
        }
      });
    }, 5 * 60 * 1000);
  }

  loadRooms() {
    this.roomService.getRooms(1, 1000).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.allRooms = response.data.filter(room => !room.isdeleted);
          this.applyFilters();
        } else {
          Swal.fire('Lỗi', response.message || 'Có lỗi xảy ra khi tải danh sách phòng', 'error');
        }
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách phòng', 'error');
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

  checkRoomStatus(roomId: string): void {
    this.http.get(`${environment.apiUrl}ShowTime/GetList?currentPage=1&recordPerPage=1000`).subscribe({
      next: (response: any) => {
        if (response.responseCode === 200) {
          const showTimes = response.data.filter((showTime: any) => showTime.roomId === roomId);
          const currentTime = new Date();
          
          const hasActiveShowTime = showTimes.some((showTime: any) => {
            const startTime = new Date(showTime.startTime);
            const endTime = new Date(showTime.endTime);
            return currentTime >= startTime && currentTime <= endTime;
          });

          // Chỉ cập nhật trạng thái nếu phòng không đang trong trạng thái bảo trì
          const room = this.rooms.find(r => r.id === roomId);
          if (room && room.status !== 2) {
            this.updateRoomStatus(roomId, hasActiveShowTime ? 4 : 1);
          }
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
    let filteredRooms = [...this.allRooms];
    
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      filteredRooms = filteredRooms.filter(room => 
        room.name.toLowerCase().includes(searchTermLower)
      );
    }
    
    if (this.statusFilter !== '-1') {
      const status = parseInt(this.statusFilter, 10);
      filteredRooms = filteredRooms.filter(room => room.status === status);
    }
    
    if (this.cinemaFilter !== '-1') {
      filteredRooms = filteredRooms.filter(room => room.cinemaId === this.cinemaFilter);
    }

    if (this.roomTypeFilter !== '-1') {
      filteredRooms = filteredRooms.filter(room => room.roomTypeId === this.roomTypeFilter);
    }
    
    this.totalRecords = filteredRooms.length;
    this.calculateTotalPages();
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = startIndex + this.recordPerPage;
    this.rooms = filteredRooms.slice(startIndex, endIndex);
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '-1';
    this.cinemaFilter = '-1';
    this.roomTypeFilter = '-1';
    this.currentPage = 1;
    this.applyFilters();
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onRoomAdded() {
    Swal.fire('Thành công', 'Thêm mới phòng thành công.', 'success');
    this.loadRooms();
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
          next: (response) => {
            Swal.fire('Thành công', 'Xóa phòng thành công.', 'success');
            this.loadRooms();
          },
          error: (error) => {
            Swal.fire('Lỗi', 'Lỗi khi xóa phòng: ' + error.message, 'error');
          }
        });
      }
    });
  }

  fetchSeats(roomId: string, totalSeats: number) {
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
    const cinema = this.cinemas.find(c => c.cinemasId === cinemaId);
    return cinema ? cinema.name : 'Không xác định';
  }

  getRoomTypeName(roomTypeId: string): string {
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
}
