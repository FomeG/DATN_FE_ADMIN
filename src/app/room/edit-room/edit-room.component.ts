import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeatService, SeatType, SeatTypeResponse } from '../../services/seat.service';
import { Modal } from 'bootstrap';
import { Observable, concat } from 'rxjs';
import { Observer } from 'rxjs'; // Để khai báo kiểu cho 'observer'
import { error } from 'jquery';

export interface SeatInfo {
  id: string;
  roomId: string;
  seatTypeId: string;
  seatName: string;
  colNumber: number;
  rowNumber: number;
  seatPrice: number;
  status: number;
  pairId: string;
  isDouble?: boolean;
  isMerged?: boolean;
  isClicked?: boolean;
}
@Component({
  selector: 'app-edit-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-room.component.html',
  styleUrls: ['./edit-room.component.css']
})
export class EditRoomComponent implements OnInit {
  @ViewChild('editRoomModal', { static: false }) editRoomModal!: ElementRef;
  @ViewChild('addSeatTypeModal', { static: false }) addSeatTypeModal!: ElementRef;
  @ViewChild('seatTypeDetailModal', { static: false }) seatTypeDetailModal!: ElementRef;

  seats: SeatInfo[] = [];
  seatRows: SeatInfo[][] = [];
  selectedRoomId: string = '';
  selectedTotalSeats: number = 0;
  selectedSeat: SeatInfo | null = null;
  selectedSeats: SeatInfo[] = [];
  seatTypes: SeatType[] = [];
  newSeatType = { seatTypeName: '', multiplier: 0 };
  selectedSeatType: any = { id: '', multiplier: 0 };

  seatStatuses = [
    { value: 0, label: 'Available' },
    { value: 1, label: 'UnAvailable' },
    { value: 2, label: 'None' }
  ];

  constructor(private seatService: SeatService) { }

  ngOnInit() {
    this.fetchSeatTypes();
    this.markDoubleSeatType(); // Đánh dấu loại ghế đôi
  }

  fetchSeatTypes() {
    this.seatService.getAllSeatTypes(1, 100).subscribe({
      next: (response: SeatTypeResponse) => {
        this.seatTypes = response.data;
        this.markDoubleSeatType(); // Đánh dấu loại ghế đôi sau khi lấy dữ liệu
      },
      error: (error) => {
        console.error('Lỗi khi lấy danh sách loại ghế:', error);
      }
    });
  }


  fetchSeats(roomId: string, totalSeats: number): void {
    this.seatService.getSeatsByRoom(roomId, 1000).subscribe({
      next: (response) => {
        this.seats = response.data;


        this.seats.sort((a, b) => a.rowNumber - b.rowNumber || a.colNumber - b.colNumber);
        this.groupSeatsByRow(this.seats);
        this.mergePairSeats();


      },
      error: (error) => console.error('Lỗi khi lấy danh sách ghế:', error)
    });
  }

  private groupSeatsByRow(seats: SeatInfo[]): void {
    const grouped: { [row: number]: SeatInfo[] } = {};
    seats.forEach(seat => {
      if (!grouped[seat.rowNumber]) grouped[seat.rowNumber] = [];
      grouped[seat.rowNumber].push(seat);
    });
    this.seatRows = Object.keys(grouped).sort((a, b) => +a - +b).map(key => grouped[+key]);
  }

  private mergePairSeats(): void {
    this.seatRows.forEach(row => {
      for (let i = 0; i < row.length; i++) {
        let seatA = row[i];
        if (seatA.isMerged || !seatA.pairId) continue;
        let seatBIndex = row.findIndex(s => s.id === seatA.pairId);
        if (seatBIndex !== -1) {
          let seatB = row[seatBIndex];
          if (seatB.pairId === seatA.id) {
            seatA.isDouble = true;
            seatA.seatName = `${seatA.seatName}-${seatB.seatName}`;
            seatA.seatPrice = seatA.seatPrice + seatB.seatPrice;
            seatB.isMerged = true;
            row.splice(seatBIndex, 1);
            if (seatBIndex < i) i--;
          }
        }
      }
    });
  }

  openModal(roomId: string, totalSeats: number): void {
    this.selectedRoomId = roomId;
    this.selectedTotalSeats = totalSeats;
    this.fetchSeats(roomId, totalSeats);

    // Đợi 1 giây để đảm bảo dữ liệu ghế được tải xong
    setTimeout(() => {
      if (this.editRoomModal?.nativeElement) {
        const modal = new Modal(this.editRoomModal.nativeElement);
        modal.show();
      }
    }, 1000); // Tăng thời gian đợi nếu cần
  }

  async updateSeat() {
    if (this.selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế để cập nhật.');
      return;
    }

    try {
      // Tạo một mảng các promise để xử lý bất đồng bộ
      const updatePromises: Promise<any>[] = [];

      // Thêm các yêu cầu cập nhật loại ghế vào mảng promise
      for (const seat of this.selectedSeats) {
        if (this.selectedSeat?.seatTypeId != null) {
          updatePromises.push(
            this.seatService.updateTypeSeat(seat.id, this.selectedSeat.seatTypeId).toPromise()
          );
        }
      }

      // Thêm các yêu cầu cập nhật trạng thái ghế vào mảng promise
      for (const seat of this.selectedSeats) {
        if (this.selectedSeat?.status != null) {
          updatePromises.push(
            this.seatService.updateStatusSeat(seat.id, Number(this.selectedSeat.status)).toPromise()
          );
        }
      }

      // Đợi tất cả các yêu cầu API hoàn thành
      await Promise.all(updatePromises);

      // Sau khi tất cả các yêu cầu hoàn thành, gọi lại API để lấy dữ liệu mới nhất
      this.fetchSeats(this.selectedRoomId, 1000);
      this.selectedSeats = [];
      alert("Cập nhật ghế thành công");
    } catch (error) {
      console.error('Lỗi khi cập nhật ghế:', error);
      alert('Có lỗi xảy ra khi cập nhật ghế. Vui lòng thử lại.');
    }
  }

  selectSeat(seat: SeatInfo) {

    seat.isClicked = !seat.isClicked;

    if (seat.isClicked) {
      if (seat.isDouble) {
        // Tìm ghế liên kết (pairId)
        const pairSeat = this.seats.find(s => s.id.trim() === seat.pairId.trim());


        if (pairSeat) {
          pairSeat.isClicked = true;
          this.selectedSeats = [seat, pairSeat];
        } else {
          this.selectedSeats = [seat];
        }
      } else {
        this.selectedSeats.push(seat);
      }
    } else {
      this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id && s.id !== seat.pairId);
      if (seat.isDouble) {
        const pairSeat = this.seats.find(s => s.id === seat.pairId);
        if (pairSeat) {
          pairSeat.isClicked = false;
        }
      }
    }

    this.selectedSeat = seat.isClicked ? { ...seat } : null;
    console.log(this.selectedSeats);

  }

  updateSelectedSeat(field: keyof SeatInfo, value: any) {
    if (this.selectedSeat) {
      if (field === 'isDouble' && value === true) {
        const pairSeat = this.seats.find(s => s.pairId === this.selectedSeat?.id);
        if (pairSeat) {
          this.selectedSeat.seatPrice += pairSeat.seatPrice;
        }
      } else if (field === 'isDouble' && value === false) {
        const pairSeat = this.seats.find(s => s.pairId === this.selectedSeat?.id);
        if (pairSeat) {
          this.selectedSeat.seatPrice -= pairSeat.seatPrice;
        }
      }
      (this.selectedSeat as any)[field] = value;
    }
  }

  setupPairSeats() {
    if (this.selectedSeats.length !== 2) {
      alert('Vui lòng chọn đúng 2 ghế để setup ghế đôi.');
      return;
    }

    const seat1 = this.selectedSeats[0];
    const seat2 = this.selectedSeats[1];

    if (seat1.isDouble || seat2.isDouble) {
      alert('Một trong hai ghế đã được setup ghế đôi.');
      return;
    }

    if (seat1.rowNumber !== seat2.rowNumber || Math.abs(seat1.colNumber - seat2.colNumber) !== 1) {
      alert('Hai ghế phải liền kề nhau và cùng hàng.');
      return;
    }

    const body = {
      seatid1: seat1.id,
      seatid2: seat2.id,
      roomId: this.selectedRoomId
    };

    this.seatService.setupPairSeats(body).subscribe({
      next: (response) => {
        alert('Setup ghế đôi thành công.');
        this.fetchSeats(this.selectedRoomId, this.selectedTotalSeats);
        this.selectedSeats = [];
      },
      error: (error) => {
        alert('Lỗi khi setup ghế đôi: ' + error.message);
      }
    });
  }

  unsetupPairSeats() {
    if (this.selectedSeats.length !== 2) {
      alert('Vui lòng chọn một ghế đôi để hủy setup.');
      return;
    }

    const seat = this.selectedSeats[0];
    const seat1Id = seat.id;
    const seat2Id = seat.pairId;

    this.seatService.unsetupPairSeats(seat1Id, seat2Id).subscribe({
      next: (response) => {
        alert('Hủy setup ghế đôi thành công.');
        this.fetchSeats(this.selectedRoomId, 1000);
        this.selectedSeats = [];
      },
      error: (error) => {
        alert('Lỗi khi hủy setup ghế đôi: ' + error.message);
      }
    });
  }

  validateSelectedSeats(selectedSeats: SeatInfo[]): boolean {
    if (selectedSeats.length !== 2) {
      alert('Vui lòng chọn đúng 2 ghế.');
      return false;
    }

    const seat1 = selectedSeats[0];
    const seat2 = selectedSeats[1];

    if (seat1.rowNumber !== seat2.rowNumber) {
      alert('Hai ghế phải cùng hàng.');
      return false;
    }

    if (Math.abs(seat1.colNumber - seat2.colNumber) !== 1) {
      alert('Hai ghế phải liền kề nhau.');
      return false;
    }

    return true;
  }

  openAddSeatTypeModal() {
    const modal = new Modal(this.addSeatTypeModal.nativeElement);
    modal.show();
  }

  openSeatTypeDetailModal() {
    const modal = new Modal(this.seatTypeDetailModal.nativeElement);
    modal.show();
  }

  createSeatType() {
    this.seatService.createSeatType(this.newSeatType).subscribe({
      next: (response) => {
        alert('Thêm mới loại ghế thành công.');
        this.fetchSeatTypes();
        const modal = Modal.getInstance(this.addSeatTypeModal.nativeElement);
        modal?.hide();
      },
      error: (error) => {
        alert('Lỗi khi thêm mới loại ghế: ' + error.message);
      }
    });
  }

  deleteSeatType(id: string) {
    this.seatService.deleteSeatType(id).subscribe({
      next: (response) => {
        alert('Xóa loại ghế thành công.');
        this.fetchSeatTypes();
      },
      error: (error) => {
        alert('Lỗi khi xóa loại ghế: ' + error.message);
      }
    });
  }

  updateSeatTypeMultiplier() {
    if (!this.selectedSeatType.id) {
        alert('Vui lòng chọn một loại ghế trước khi cập nhật');
        return;
    }

    this.seatService.updateSeatTypeMultiplier(
        this.selectedSeatType.id, 
        this.selectedSeatType.multiplier
    ).subscribe({
        next: (response) => {
            alert('Cập nhật hệ số nhân thành công.');
            this.fetchSeatTypes(); // Load lại danh sách
            this.selectedSeatType = { id: '', multiplier: 0 }; // Reset selection
        },
        error: (error) => {
            alert('Lỗi khi cập nhật hệ số nhân: ' + error.message);
        }
    });
}

  markDoubleSeatType() {
    const doubleSeatTypeName = 'Ghế Đôi'; // Tên loại ghế đôi
    this.seatTypes = this.seatTypes.map(seatType => ({
      ...seatType,
      isDoubleType: seatType.seatTypeName === doubleSeatTypeName // Đánh dấu loại ghế đôi
    }));
  }

  isVipSeat(seat: SeatInfo): boolean {
    const seatType = this.seatTypes.find(type => type.id === seat.seatTypeId);
    return seatType?.seatTypeName?.toLowerCase().includes('vip') || false;
  }

  // Trong class EditRoomComponent
  onSelectSeatType(seatType: SeatType): void {
    this.selectedSeatType = {
      id: seatType.id,
      multiplier: seatType.multiplier
    };
  }
}