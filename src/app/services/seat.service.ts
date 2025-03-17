import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface cho Seat
export interface Seat {
  id: string;
  roomId: string;
  seatTypeId: string;
  pairId: string;
  seatName: string;
  colNumber: number;
  rowNumber: number;
  seatPrice: number;
  status: number;
}

// Interface cho phản hồi từ API Seat
export interface SeatResponse {
  roomId: string;
  responseCode: number;
  message: string;
  data: Seat[];
  totalRecord: number;
}

// Interface cho SeatType
export interface SeatType {
  id: string;
  seatTypeName: string;
  multiplier: number;
  isDoubleType?: boolean; // Thêm thuộc tính này
}


// Interface cho phản hồi từ API SeatType
export interface SeatTypeResponse {
  responseCode: number;
  message: string;
  data: SeatType[];
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Lấy danh sách ghế theo phòng
  getSeatsByRoom(roomid: string, recordPerPage: number): Observable<SeatResponse> {
    return this.http.get<SeatResponse>(`${this.apiUrl}Seat/GetAllSeat?id=${roomid}&currentPage=1&recordPerPage=${recordPerPage}`);
  }

  // Setup ghế đôi
  setupPairSeats(body: { seatid1: string, seatid2: string, roomId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}Seat/SetupPair`, body);
  }

  // Hủy setup ghế đôi
  unsetupPairSeats(id1: string, id2: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Seat/UnSetupPair?id1=${id1}&id2=${id2}`, {});
  }

  // Lấy danh sách loại ghế
  getAllSeatTypes(currentPage: number, recordPerPage: number): Observable<SeatTypeResponse> {
    const url = `${this.apiUrl}SeatType/GetAllSeatType?currentPage=${currentPage}&recordPerPage=${recordPerPage}`;
    return this.http.get<SeatTypeResponse>(url);
  }

  updateStatusSeat(id: string, status: number): Observable<any> {
    const url = `${this.apiUrl}Seat/UpdateStatusSeat`;
    const body = { 
      id, 
      status,
    };
    return this.http.post(url, body);
  }

  updateTypeSeat(id: string, seatTypeId: string): Observable<any> {
    const url = `${this.apiUrl}Seat/UpdateTypeSeat`;
    const body = { id ,seatTypeId};
    return this.http.post(url, body);
  }

  // Thêm mới loại ghế
  createSeatType(seatType: { seatTypeName: string, multiplier: number }): Observable<any> {
    const url = `${this.apiUrl}SeatType/CreateSeatType`;
    return this.http.post(url, seatType);
  }

  // Cập nhật hệ số nhân của loại ghế
  updateSeatTypeMultiplier(id: string, multiplier: number): Observable<any> {
    const url = `${this.apiUrl}SeatType/UpdateSeatTypeMultiplier`;
    const body = { id, multiplier };
    return this.http.post(url, body);
  }

  // Xóa loại ghế
  deleteSeatType(id: string): Observable<any> {
    const url = `${this.apiUrl}SeatType/DeleteSeatType?id=${id}`;
    return this.http.post(url,"");
  }
}