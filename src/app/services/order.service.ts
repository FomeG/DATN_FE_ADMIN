import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface cho danh sách đơn hàng
export interface OrderManagement {
  id: string;
  userId: string | null;
  email: string;
  orderCode: string;
  totalPrice: number;
  status: number;
  isAnonymous: boolean;
  discountPrice: number;
  createdDate: Date;
  updatedDate: Date | null;
  statusText: string;
  formattedTotalPrice: string;
  formattedCreatedDate: string;
}

export interface OrderManagementResponse {
  data: OrderManagement[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

// Interface cho chi tiết vé trong đơn hàng
export interface OrderTicketDetail {
  id: string;
  ticketCode: string;
  movieName: string;
  roomName: string;
  seatName: string;
  showTime: string;
  duration: number;
  cinemaName: string;
  address: string;
  createdDate: Date;
  price: number;
  formattedPrice: string;
}

// Interface cho chi tiết dịch vụ trong đơn hàng
export interface OrderServiceDetail {
  id: string;
  serviceName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  formattedPrice: string;
  formattedTotalPrice: string;
}

// Interface cho chi tiết đơn hàng
export interface OrderManagementDetail {
  id: string;
  email: string;
  orderCode: string;
  totalPrice: number;
  status: number;
  statusText: string;
  createdDate: Date;
  updatedDate: Date | null;
  formattedCreatedDate: string;
  formattedTotalPrice: string;
  tickets: OrderTicketDetail[];
  services: OrderServiceDetail[];
}

export interface OrderManagementDetailResponse {
  data: OrderManagementDetail;
  message: string;
  responseCode: number;
}

// Giữ lại các interface cũ để tương thích ngược
export interface OrderList {
  id: string;
  orderCode: string;
  totalPrice: number;
  status: number;
  createdDate: Date;
  email: string;
  isAnonymous: boolean;
  userName: string;
  userId: string;
  ticketCount: number;
  serviceCount: number;
}

export interface OrderListResponse {
  data: OrderList[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

export interface OrderDetail {
  id: string;
  movieName: string;
  duration: string;
  description: string;
  orderCode: string;
  cinemaName: string;
  address: string;
  thumbnail: string;
  discountPrice: number;
  pointChange: number;
  totalPriceTicket: number;
  sessionTime: string;
  sessionDate: string;
  roomName: string;
  seatList: string[];
  serviceList: ServiceInfo[];
  concessionAmount: number;
  totalPrice: number;
  email: string;
  createdDate: Date;
}

export interface ServiceInfo {
  serviceTypeName: string;
  name: string;
  quantity: number;
  totalPrice: number;
}

export interface OrderDetailResponse {
  data: OrderDetail;
  message: string;
  responseCode: number;
}

export interface TicketItem {
  ticketId: string;
  tickeCode: string;
  ticketStatus: number;
  seatName: string;
  showTimeId: string;
  startTime: Date;
  movieName: string;
  roomName: string;
  cinemaName: string;
  seatPrice: number;
}

export interface ServiceItem {
  orderServiceId: string;
  serviceId: string;
  serviceName: string;
  serviceTypeName: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  imageUrl: string;
}

export interface OrderItems {
  tickets: TicketItem[];
  services: ServiceItem[];
}

export interface OrderItemsResponse {
  data: OrderItems;
  message: string;
  responseCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Phương thức lấy danh sách đơn hàng với bộ lọc theo ngày
  getOrderList(fromDate?: Date, toDate?: Date, currentPage: number = 1, recordPerPage: number = 10): Observable<OrderManagementResponse> {
    let url = `${this.apiUrl}OrderManagement/GetList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`;

    if (fromDate) {
      url += `&fromDate=${fromDate.toISOString()}`;
    }

    if (toDate) {
      url += `&toDate=${toDate.toISOString()}`;
    }

    return this.http.get<OrderManagementResponse>(url);
  }

  // Phương thức lấy chi tiết đơn hàng
  getOrderDetail(orderId: string): Observable<OrderManagementDetailResponse> {
    return this.http.get<OrderManagementDetailResponse>(`${this.apiUrl}OrderManagement/GetDetail?orderId=${orderId}`);
  }

  // Giữ lại phương thức cũ để tương thích ngược
  getOrderItems(orderId: string): Observable<OrderItemsResponse> {
    return this.http.get<OrderItemsResponse>(`${this.apiUrl}OrderManagement/GetOrderItems?orderId=${orderId}`);
  }
}
