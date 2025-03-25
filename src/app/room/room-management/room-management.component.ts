import { Component, OnInit, ViewChild } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import { CinemaService, Cinema } from '../../services/cinema.service';
import Swal from 'sweetalert2';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddRoomComponent } from "../add-room/add-room.component";
import { EditRoomComponent } from '../edit-room/edit-room.component';

@Component({
  selector: 'app-room-management',
  templateUrl: './room-management.component.html',
  styleUrls: ['./room-management.component.css'],
  standalone: true,
  imports: [AddRoomComponent, HttpClientModule, CommonModule, FormsModule, EditRoomComponent]
})
export class RoomManagementComponent implements OnInit {
  @ViewChild(EditRoomComponent) editRoomComponent!: EditRoomComponent;

  rooms: Room[] = [];
  allRooms: Room[] = []; // Lưu trữ tất cả phòng để lọc
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  
  // Bộ lọc
  searchTerm = '';
  statusFilter = '-1';
  cinemaFilter = '-1';
  cinemas: Cinema[] = [];

  constructor(
    private roomService: RoomService, 
    private cinemaService: CinemaService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadRooms();
    this.loadCinemas();
  }

  loadRooms() {
    // Tải tất cả phòng, sau đó sẽ lọc ở client
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

  applyFilters() {
    let filteredRooms = [...this.allRooms];
    
    // Lọc theo tên phòng
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      filteredRooms = filteredRooms.filter(room => 
        room.name.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Lọc theo trạng thái
    if (this.statusFilter !== '-1') {
      const status = parseInt(this.statusFilter, 10);
      filteredRooms = filteredRooms.filter(room => room.status === status);
    }
    
    // Lọc theo rạp phim
    if (this.cinemaFilter !== '-1') {
      filteredRooms = filteredRooms.filter(room => room.cinemaId === this.cinemaFilter);
    }
    
    // Cập nhật kết quả và phân trang
    this.totalRecords = filteredRooms.length;
    this.calculateTotalPages();
    
    // Nếu trang hiện tại lớn hơn tổng số trang, quay lại trang 1
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    // Phân trang kết quả
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = startIndex + this.recordPerPage;
    this.rooms = filteredRooms.slice(startIndex, endIndex);
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '-1';
    this.cinemaFilter = '-1';
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
    // Kiểm tra editRoomComponent có tồn tại không
    if (this.editRoomComponent) {
      try {
        // Gọi phương thức openModal từ EditRoomComponent
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
        return 'Đang hoạt động';
      case 2:
        return 'Đang bảo trì';
      case 3:
        return 'Không hoạt động';
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
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
  
  getCinemaName(cinemaId: string): string {
    const cinema = this.cinemas.find(c => c.cinemasId === cinemaId);
    return cinema ? cinema.name : 'Không xác định';
  }
}
