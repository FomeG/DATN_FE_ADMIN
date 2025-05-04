import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderService, OrderManagement, OrderManagementDetail } from '../services/order.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css'
})
export class OrderManagementComponent implements OnInit {
  // Danh sách đơn hàng
  orders: OrderManagement[] = [];
  filteredOrders: OrderManagement[] = [];

  // Phân trang
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];

  // Trạng thái loading
  isLoading = false;

  // Bộ lọc
  fromDate: string | null = null;
  toDate: string | null = null;
  searchTerm: string = '';
  selectedStatus: number = -1;

  // Chi tiết đơn hàng
  selectedOrder: OrderManagementDetail | null = null;

  // Modal
  orderDetailModal: any;

  // Sắp xếp
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Hằng số trạng thái đơn hàng
  readonly ORDER_STATUS = {
    COMPLETED: 0,    // Đã hoàn thành
    PAID: 1,         // Đã thanh toán
    USED: 2          // Đã sử dụng
  };

  constructor(
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.loadOrders();

    // Khởi tạo modal
    setTimeout(() => {
      const modalElement = document.getElementById('orderDetailModal');
      if (modalElement) {
        this.orderDetailModal = new bootstrap.Modal(modalElement, {
          backdrop: 'static',
          keyboard: false
        });

        // Thêm sự kiện khi modal đóng
        modalElement.addEventListener('hidden.bs.modal', () => {
          this.selectedOrder = null;
        });
      }
    }, 500);

    // Thêm style để sửa lỗi backdrop
    this.addBackdropFixStylesheet();
  }

  // Thêm stylesheet để sửa lỗi backdrop modal
  private addBackdropFixStylesheet(): void {
    try {
      // Kiểm tra xem style đã tồn tại chưa
      if (!document.getElementById('order-backdrop-fix-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'order-backdrop-fix-style';
        styleEl.innerHTML = `
          body.modal-open {
            overflow: auto !important;
            padding-right: 0 !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    } catch (error) {
      console.error('Lỗi khi thêm style fix backdrop:', error);
    }
  }

  // Tải danh sách đơn hàng
  loadOrders(): void {
    this.isLoading = true;

    // Chuyển đổi chuỗi ngày thành đối tượng Date
    const fromDateObj = this.fromDate ? new Date(this.fromDate) : undefined;
    const toDateObj = this.toDate ? new Date(this.toDate) : undefined;

    this.orderService.getOrderList(fromDateObj, toDateObj, this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.orders = response.data;
          this.filteredOrders = [...this.orders];
          this.totalRecords = response.totalRecord;
          this.calculateTotalPages();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải danh sách đơn hàng:', error);
          this.isLoading = false;
          Swal.fire('Lỗi', 'Không thể tải danh sách đơn hàng', 'error');
        }
      });
  }

  // Tính toán tổng số trang
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Chuyển trang
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  // Lọc đơn hàng theo ngày
  applyDateFilter(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  // Xóa bộ lọc ngày
  clearDateFilter(): void {
    this.fromDate = null;
    this.toDate = null;
    this.currentPage = 1;
    this.loadOrders();
  }

  // Lọc đơn hàng theo từ khóa
  applySearchFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredOrders = [...this.orders];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase().trim();
    this.filteredOrders = this.orders.filter(order =>
      order.orderCode.toLowerCase().includes(searchTermLower) ||
      order.email.toLowerCase().includes(searchTermLower)
    );
  }

  // Lọc đơn hàng theo trạng thái
  applyStatusFilter(): void {
    if (this.selectedStatus === -1) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order =>
      order.status === this.selectedStatus
    );
  }

  // Xem chi tiết đơn hàng
  viewOrderDetail(orderId: string): void {
    this.isLoading = true;
    this.orderService.getOrderDetail(orderId)
      .subscribe({
        next: (response) => {
          this.selectedOrder = response.data;
          this.isLoading = false;
          this.orderDetailModal.show();
        },
        error: (error) => {
          console.error('Lỗi khi tải chi tiết đơn hàng:', error);
          this.isLoading = false;
          Swal.fire('Lỗi', 'Không thể tải chi tiết đơn hàng', 'error');
        }
      });
  }

  // Sắp xếp đơn hàng
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredOrders.sort((a: any, b: any) => {
      const valueA = a[column];
      const valueB = b[column];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return this.sortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }
    });
  }

  // Lấy icon sắp xếp
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // Lấy tên trạng thái đơn hàng
  getStatusText(status: number): string {
    switch (status) {
      case this.ORDER_STATUS.COMPLETED:
        return 'Đã hoàn thành';
      case this.ORDER_STATUS.PAID:
        return 'Đã thanh toán';
      case this.ORDER_STATUS.USED:
        return 'Đã sử dụng';
      default:
        return 'Không xác định';
    }
  }

  // Lấy class CSS cho trạng thái
  getStatusClass(status: number): string {
    switch (status) {
      case this.ORDER_STATUS.COMPLETED:
        return 'bg-success';
      case this.ORDER_STATUS.PAID:
        return 'bg-primary';
      case this.ORDER_STATUS.USED:
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }
}

