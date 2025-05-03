import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  maxUsage: number;
  maxClaimCount: number;
  usedCount: number;
  claimedCount?: number;
  status: number;
  isStackable: boolean;
  voucherType: number;
  minOrderValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherUsage {
  id: string;
  voucherId: string;
  userId: string | null;
  orderId: string | null;
  usedAt: string;
  status: number;
  voucherCode: string;
  userName: string;
  orderCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Voucher Management
  getVouchers(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Voucher/GetList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getVoucherById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Voucher/GetById?id=${id}`);
  }

  getVoucherByCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Voucher/GetByCode?code=${code}`);
  }

  createVoucher(voucher: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Voucher/Create`, voucher);
  }

  updateVoucher(id: string, voucher: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Voucher/Update?id=${id}`, voucher);
  }

  deleteVoucher(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Voucher/Delete?id=${id}`, {});
  }

  // Voucher Usage Management
  getVoucherUsageHistory(voucherId: string, currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Voucher/GetUsageHistory?voucherId=${voucherId}&currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getAllVoucherUsage(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Voucher/GetAllUsage?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  useVoucher(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Voucher/UseVoucher`, request);
  }
}