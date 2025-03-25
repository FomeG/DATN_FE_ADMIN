import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoomService } from '../../services/room.service';
import { CinemaService } from '../../services/cinema.service';
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
  cinemas: any[] = [];
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
      roomName: ['', Validators.required],
      totalRows: [1, [Validators.required, Validators.min(1)]],
      totalColumns: [1, [Validators.required, Validators.min(1)]],
      seatPrice: [0, [Validators.required, Validators.min(0)]],
      status: [1]
    });
  }

  ngOnInit() {
    this.isFormSubmitted = false;
    this.loadCinemas();
  }

  loadCinemas() {
    this.cinemaService.getCinemas(1, 1000).subscribe({
      next: (cinemas) => {
        this.cinemas = cinemas.data;
      },
      error: (error) => {
        Swal.fire('Lỗi', 'Lỗi khi tải danh sách rạp: ' + error.message, 'error');
      }
    });
  }

  createRoom() {
    if (!this.validateRoomForm()) {
      Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin phòng.', 'error');
      return;
    }

    // Tính totalSeats từ totalColNumber và totalRowNumber
    this.roomForm.patchValue({
      totalSeats: this.roomForm.value.totalColNumber * this.roomForm.value.totalRowNumber
    });

    this.roomService.createRoom(this.roomForm.value).subscribe({
      next: (response) => {
        Swal.fire('Thành công', 'Thêm mới phòng thành công.', 'success');
        this.roomForm.reset();
        if (this.closeModal) {
          this.closeModal.nativeElement.click();
        }
        this.roomAdded.emit();
      },
      error: (error) => {
        Swal.fire('Lỗi', 'Lỗi khi thêm mới phòng: ' + error.message, 'error');
      }
    });
  }

  validateRoomForm(): boolean {
    if (!this.roomForm.value.roomName || 
        !this.roomForm.value.seatPrice || 
        !this.roomForm.value.totalColNumber || 
        !this.roomForm.value.totalRowNumber || 
        !this.roomForm.value.cinemaId) {
      return false;
    }
    return true;
  }

  // Tự động tính toán tổng số ghế khi thay đổi số hàng hoặc số cột
  calculateTotalSeats() {
    const cols = this.roomForm.value.totalColNumber || 0;
    const rows = this.roomForm.value.totalRowNumber || 0;
    this.totalSeats = cols * rows;
  }
}