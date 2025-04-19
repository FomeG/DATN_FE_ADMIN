import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VoucherUI {
  id: string;
  voucherId: string;
  title: string;
  content: string;
  imageUrl: string;
  displayOrder: number;
  startTime: string;
  endTime: string;
  status: number;
  createdAt: string;
  updatedAt: string | null;
  // Thông tin bổ sung từ Voucher
  voucherCode?: string;
  voucherDescription?: string;
  discountType?: string;
  discountValue?: number;
  maxUsage?: number;
  usedCount?: number;
  claimedCount?: number;
  maxClaimCount?: number;
  isStackable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoucherUIService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // VoucherUI Management
  getVoucherUIs(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}VoucherUI/GetList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getVoucherUIById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}VoucherUI/GetById?id=${id}`);
  }

  createVoucherUI(voucherUI: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}VoucherUI/Create`, voucherUI);
  }

  updateVoucherUI(id: string, voucherUI: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}VoucherUI/Update?id=${id}`, voucherUI);
  }

  deleteVoucherUI(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}VoucherUI/Delete?id=${id}`, {});
  }

  // Lấy danh sách voucher có sẵn để chọn khi tạo VoucherUI
  getAvailableVouchers(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Voucher/GetList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }
}
