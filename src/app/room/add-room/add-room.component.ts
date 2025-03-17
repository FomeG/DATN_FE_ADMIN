import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoomService } from '../../services/room.service';
import { CinemaService } from '../../services/cinema.service';
import { SeatService } from '../../services/seat.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-room.component.html',
  styleUrls: ['./add-room.component.css']
})
export class AddRoomComponent implements OnInit {

  @Output() roomAdded = new EventEmitter<void>();
  roomForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isFormSubmitted = false;
  cinemas: any[] = [];

  showSuccessMessage = false; // Biến để hiển thị thông báo thành công
  closeModal = false;


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
    this.closeModal = false;
  }

  loadCinemas() {
    this.cinemaService.getCinemas(1, 10).subscribe({
      next: (response) => {
        this.cinemas = response.data;
      },
      error: (error) => {
        console.error('Lỗi khi tải rạp:', error);
        this.errorMessage = 'Có lỗi xảy ra khi lấy danh sách rạp';
      }
    });
  }



  onSubmit() {
    this.isFormSubmitted = true;
    if (this.roomForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const formData = {
      cinemaId: this.roomForm.value.cinemaId,
      name: this.roomForm.value.roomName,
      totalColNumber: this.roomForm.value.totalColumns,
      totalRowNumber: this.roomForm.value.totalRows,
      seatPrice: this.roomForm.value.seatPrice
    };

    this.roomService.createRoom(formData).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.roomForm.reset();
          this.roomForm.patchValue({
            cinemaId: '',
            totalRows: 1,
            totalColumns: 1,
            seatPrice: 0
          });
          this.roomAdded.emit();
          this.closeModal = true;
          this.showSuccessMessage = true; // Hiển thị thông báo thành công
          setTimeout(() => {
            this.showSuccessMessage = false; // Ẩn thông báo sau 3 giây
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Có lỗi xảy ra khi thêm phòng';
        }
      },
      error: (error) => {
        console.error('Lỗi khi tạo phòng:', error);
        this.errorMessage = 'Có lỗi xảy ra khi thêm phòng';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}