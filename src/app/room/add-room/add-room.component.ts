import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoomService, RoomType, CreateRoomRequest } from '../../services/room.service';
import { CinemaService, Cinema } from '../../services/cinema.service';
import { SeatService } from '../../services/seat.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-room.component.html',
  styleUrls: ['./add-room.component.css']
})
export class AddRoomComponent implements OnInit {

  @Output() roomAdded = new EventEmitter<void>();
  @ViewChild('closeBtn') closeModal!: ElementRef;

  roomForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isFormSubmitted = false;
  cinemas: Cinema[] = [];
  roomTypes: RoomType[] = [];
  totalSeats: number = 0;
  selectedCinema: Cinema | null = null;
  currentRoomCount: number = 0;

  showSuccessMessage = false; // Biến để hiển thị thông báo thành công

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private cinemaService: CinemaService,
    private modalService: NgbModal // Inject NgbModal
  ) {
    this.roomForm = this.fb.group({
      cinemaId: ['', Validators.required],
      roomTypeId: ['', Validators.required],
      name: ['', Validators.required],
      totalColNumber: [1, [Validators.required, Validators.min(1)]],
      totalRowNumber: [1, [Validators.required, Validators.min(1)]],
      seatPrice: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.isFormSubmitted = false;
    this.selectedCinema = null;
    this.currentRoomCount = 0;
    this.loadCinemas();
    this.loadRoomTypes();
  }

  loadCinemas() {
    this.cinemaService.getCinemas(1, 1000).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.cinemas = response.data;
        } else {
          Swal.fire('Lỗi', 'Không thể tải danh sách rạp', 'error');
        }
      },
      error: (error) => {
        console.error('Error loading cinemas:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách rạp', 'error');
      }
    });
  }

  loadRoomTypes() {
    this.roomService.getRoomTypes(1, 100).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.roomTypes = response.data;
        } else {
          Swal.fire('Lỗi', 'Không thể tải danh sách loại phòng', 'error');
        }
      },
      error: (error) => {
        console.error('Error loading room types:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách loại phòng', 'error');
      }
    });
  }

  createRoom() {
    if (this.roomForm.invalid) {
      Object.keys(this.roomForm.controls).forEach(key => {
        const control = this.roomForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isLoading = true;
    const roomData: CreateRoomRequest = this.roomForm.value;

    this.roomService.createRoom(roomData).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          Swal.fire('Thành công', 'Thêm mới phòng thành công', 'success');
          this.roomForm.reset();
          this.closeModal.nativeElement.click();
          this.roomAdded.emit();
        } else if (response.responseCode === -2001) {
          // Xử lý lỗi khi rạp đã đạt số phòng tối đa
          Swal.fire({
            icon: 'error',
            title: 'Không thể thêm phòng',
            text: response.message || 'Rạp đã đạt số phòng tối đa, không thể thêm phòng mới',
            confirmButtonText: 'Đóng'
          });
        } else {
          Swal.fire('Lỗi', response.message || 'Có lỗi xảy ra khi thêm phòng', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating room:', error);
        Swal.fire('Lỗi', 'Không thể thêm phòng mới', 'error');
        this.isLoading = false;
      }
    });
  }

  calculateTotalSeats() {
    const cols = this.roomForm.get('totalColNumber')?.value || 0;
    const rows = this.roomForm.get('totalRowNumber')?.value || 0;
    this.totalSeats = cols * rows;
  }

  onCinemaChange() {
    const cinemaId = this.roomForm.get('cinemaId')?.value;
    if (!cinemaId) {
      this.selectedCinema = null;
      this.currentRoomCount = 0;
      return;
    }

    // Tìm thông tin rạp được chọn
    this.selectedCinema = this.cinemas.find(cinema => cinema.cinemasId === cinemaId) || null;

    if (this.selectedCinema) {
      // Lấy danh sách phòng của rạp để đếm số phòng hiện tại
      this.roomService.getRoomsByCinema(cinemaId).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.currentRoomCount = response.data.length;

            // Kiểm tra nếu đã đạt số phòng tối đa thì hiển thị cảnh báo
            if (this.selectedCinema && this.currentRoomCount >= this.selectedCinema.totalRooms) {
              Swal.fire({
                icon: 'warning',
                title: 'Cảnh báo',
                text: 'Rạp này đã đạt số phòng tối đa, không thể thêm phòng mới!',
                confirmButtonText: 'Đã hiểu'
              });
            }
          } else {
            this.currentRoomCount = 0;
          }
        },
        error: (error) => {
          console.error('Error loading rooms by cinema:', error);
          this.currentRoomCount = 0;
        }
      });
    }
  }
}