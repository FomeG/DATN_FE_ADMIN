import { Component, OnInit, ViewChild } from '@angular/core';
import { Room, RoomService } from '../../services/room.service';
import Swal from 'sweetalert2';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AddRoomComponent } from "../add-room/add-room.component";
import { EditRoomComponent } from '../edit-room/edit-room.component';

@Component({
  selector: 'app-room-management',
  templateUrl: './room-management.component.html',
  styleUrls: ['./room-management.component.css'],
  standalone: true,
  imports: [AddRoomComponent, HttpClientModule, CommonModule, EditRoomComponent]
})
export class RoomManagementComponent implements OnInit {
  @ViewChild(EditRoomComponent) editRoomComponent!: EditRoomComponent;

  rooms: Room[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];

  constructor(private roomService: RoomService, private http: HttpClient) { }

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.roomService.getRooms(this.currentPage, this.recordPerPage).subscribe({
      next: (response) => {
        this.rooms = response.data;
        this.totalRecords = response.totalRecord;
        this.calculateTotalPages();
      },
      error: (error) => console.error('Error loading rooms:', error)
    });
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRooms();
    }
  }

  onRoomAdded() {
    this.loadRooms();
  }

  onEditRoom(roomId: string, totalSeats: number) {
    // Nếu có các bước gọi API lấy dữ liệu ghế, thực hiện ở đây
    // Ví dụ: this.fetchSeats(roomId, totalSeats);
    
    // Gọi phương thức mở modal từ EditRoomComponent
    if (this.editRoomComponent) {
      this.editRoomComponent.openModal(roomId, totalSeats);
    } else {
      console.error("EditRoomComponent không khả dụng.");
    }
  }

  onDeleteRoom(id: string) {
    Swal.fire({
      title: 'Bạn có chắc chắn xoá phòng này?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.roomService.deleteRoom(id).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire('Đã xóa!', 'Phòng đã được xóa thành công.', 'success');
              this.loadRooms();
            } else {
              Swal.fire('Lỗi!', response.message || 'Có lỗi xảy ra khi xóa phòng.', 'error');
            }
          },
          error: (error) => {
            Swal.fire('Lỗi!', 'Có lỗi xảy ra khi xóa phòng: ' + error.message, 'error');
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
}
