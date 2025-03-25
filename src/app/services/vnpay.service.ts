// payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://localhost:7263/api/payment';

  constructor(private http: HttpClient) { }

  createPayment(orderInfo: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-payment`, orderInfo);
  }

  processPayment(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/process-payment/${orderId}`);
  }
}