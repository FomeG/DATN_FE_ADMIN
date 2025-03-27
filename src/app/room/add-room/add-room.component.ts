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
      seatPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.isFormSubmitted = false;
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
}