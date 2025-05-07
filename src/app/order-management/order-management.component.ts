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
  allOrders: OrderManagement[] = []; // Tất cả đơn hàng để lọc

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
    REFUNDED: 0,    // Đã hoàn tiền
    CONFIRMED: 1,   // Đã xác nhận/thanh toán
    USED: 2         // Đã sử dụng
  };

  constructor(
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
    this.loadAllOrders(); // Tải tất cả đơn hàng để lọc

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

  // Tải tất cả đơn hàng để sử dụng cho bộ lọc
  loadAllOrders(): void {
    this.isLoading = true;

    // Tải với số lượng lớn để lấy tất cả đơn hàng
    this.orderService.getOrderList(undefined, undefined, 1, 1000)
      .subscribe({
        next: (response) => {
          this.allOrders = response.data;
          console.log('Đã tải tất cả đơn hàng:', this.allOrders.length);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải tất cả đơn hàng:', error);
          this.isLoading = false;
        }
      });
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

  // Xóa tất cả bộ lọc
  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = -1;
    this.fromDate = null;
    this.toDate = null;
    this.currentPage = 1;

    // Tải lại tất cả dữ liệu
    this.loadAllOrders();

    // Đợi một chút để dữ liệu được tải xong rồi áp dụng bộ lọc
    setTimeout(() => {
      this.applyFilters();
    }, 200);
  }

  // Lọc đơn hàng theo từ khóa
  applySearchFilter(): void {
    this.applyFilters();
  }

  // Lọc đơn hàng theo trạng thái
  applyStatusFilter(): void {
    this.applyFilters();
  }

  // Áp dụng tất cả các bộ lọc
  applyFilters(): void {
    // Kiểm tra xem allOrders có dữ liệu không
    if (!this.allOrders || this.allOrders.length === 0) {
      console.log('Không có dữ liệu để lọc');
      return;
    }

    console.log('Bắt đầu lọc dữ liệu...');
    console.log('Tổng số đơn hàng trước khi lọc:', this.allOrders.length);

    // Bắt đầu với tất cả dữ liệu
    let filtered = [...this.allOrders];

    // Lọc theo trạng thái
    if (this.selectedStatus !== -1) {
      console.log('Lọc theo trạng thái:', this.selectedStatus);
      filtered = filtered.filter(order => order.status === this.selectedStatus);
      console.log('Sau khi lọc theo trạng thái:', filtered.length);
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      console.log('Lọc theo từ khóa:', searchTermLower);
      filtered = filtered.filter(order =>
        order.orderCode.toLowerCase().includes(searchTermLower) ||
        order.email.toLowerCase().includes(searchTermLower)
      );
      console.log('Sau khi lọc theo từ khóa:', filtered.length);
    }

    // Cập nhật tổng số bản ghi và tính toán phân trang
    this.totalRecords = filtered.length;
    this.calculateTotalPages();

    // Nếu trang hiện tại lớn hơn tổng số trang, quay lại trang 1
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }

    // Phân trang kết quả
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = startIndex + this.recordPerPage;
    this.filteredOrders = filtered.slice(startIndex, endIndex);

    console.log('Kết quả cuối cùng:', this.filteredOrders.length);
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
      case this.ORDER_STATUS.REFUNDED:
        return 'Đã hoàn tiền';
      case this.ORDER_STATUS.CONFIRMED:
        return 'Đã xác nhận';
      case this.ORDER_STATUS.USED:
        return 'Đã sử dụng';
      default:
        return 'Không xác định';
    }
  }

  // Lấy class CSS cho trạng thái
  getStatusClass(status: number): string {
    switch (status) {
      case this.ORDER_STATUS.REFUNDED:
        return 'bg-success';
      case this.ORDER_STATUS.CONFIRMED:
        return 'bg-primary';
      case this.ORDER_STATUS.USED:
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }
}

