import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, Room, RoomType } from '../../services/room.service';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-edit-room-info',
  templateUrl: './edit-room-info.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-content {
      background-color: #191c24;
      color: #ffffff;
    }
    .modal-header {
      border-bottom: 1px solid #2c2e33;
    }
    .modal-footer {
      border-top: 1px solid #2c2e33;
    }
    .form-control, .form-select {
      background-color: #2A3038;
      border-color: #2c2e33;
      color: #ffffff;
    }
    .form-control:focus, .form-select:focus {
      background-color: #2A3038;
      border-color: #0090e7;
      color: #ffffff;
      box-shadow: 0 0 0 0.2rem rgba(0, 144, 231, 0.25);
    }
  `]
})
export class EditRoomInfoComponent implements OnInit {
  @Input() roomId: string = '';
  @Input() totalSeats: number = 0;

  room: Room | null = null;
  roomTypes: RoomType[] = [];
  selectedRoomType: string = '';
  roomName: string = '';
  seatPrice: number = 0;
  status: number = 1;

  constructor(private roomService: RoomService) { }

  ngOnInit() {
    this.loadRoomTypes();
  }

  loadRoomTypes() {
    this.roomService.getRoomTypes(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.roomTypes = response.data;
        }
      },
      error: (error) => console.error('Error loading room types:', error)
    });
  }

  openModal(roomId: string, totalSeats: number) {
    this.roomId = roomId;
    this.totalSeats = totalSeats;
    
    // Find room in the list
    const room = this.roomService.getRooms(1, 1000).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.room = response.data.find(r => r.id === roomId) || null;
          if (this.room) {
            this.selectedRoomType = this.room.roomTypeId;
            this.roomName = this.room.name;
            this.seatPrice = Number(this.room.seatPrice);
            this.status = this.room.status;
          }
        }
      }
    });
  }

  onSubmit() {
    if (!this.room) return;

    const updateData = {
      id: this.roomId,
      roomTypeId: this.selectedRoomType,
      name: this.roomName,
      seatPrice: this.seatPrice,
      status: this.status
    };

    this.roomService.updateRoom(updateData).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          Swal.fire('Thành công', 'Cập nhật thông tin phòng thành công', 'success');
          // Close modal
          const modal = document.getElementById('editRoomInfoModal');
          if (modal) {
            const modalInstance = Modal.getInstance(modal);
            if (modalInstance) {
              modalInstance.hide();
            }
          }
        } else {
          Swal.fire('Lỗi', response.message || 'Có lỗi xảy ra khi cập nhật thông tin phòng', 'error');
        }
      },
      error: (error) => {
        Swal.fire('Lỗi', 'Không thể cập nhật thông tin phòng', 'error');
      }
    });
  }
} 