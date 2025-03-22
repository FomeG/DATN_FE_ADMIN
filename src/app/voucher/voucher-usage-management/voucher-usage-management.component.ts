import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VoucherService, VoucherUsage } from '../../services/voucher.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-voucher-usage-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voucher-usage-management.component.html',
  styleUrl: './voucher-usage-management.component.css'
})
export class VoucherUsageManagementComponent implements OnInit {
  voucherUsages: VoucherUsage[] = [];
  filteredUsages: VoucherUsage[] = [];
  searchTerm = '';
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  isLoading = false;
  voucherId: string | null = null;
  voucherInfo: any = null;
  Math = Math;
  statusLabels = ['Không xác định', 'Đã sử dụng', 'Đã hủy', 'Đã hoàn tiền'];

  constructor(
    private voucherService: VoucherService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if we need to filter by specific voucher
    this.route.queryParams.subscribe(params => {
      this.voucherId = params['voucherId'] || null;
      if (this.voucherId) {
        this.loadVoucherInfo(this.voucherId);
      }
      this.loadVoucherUsages();
    });
  }

  loadVoucherInfo(voucherId: string): void {
    this.voucherService.getVoucherById(voucherId)
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.voucherInfo = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading voucher info:', error);
        }
      });
  }

  loadVoucherUsages(): void {
    this.isLoading = true;
    
    let observable;
    if (this.voucherId) {
      // Load usage history for specific voucher
      observable = this.voucherService.getVoucherUsageHistory(this.voucherId, this.currentPage, this.recordPerPage);
    } else {
      // Load all usage history
      observable = this.voucherService.getAllVoucherUsage(this.currentPage, this.recordPerPage);
    }
    
    observable.subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.voucherUsages = response.data;
          this.filteredUsages = [...this.voucherUsages];
          this.totalRecords = response.totalRecord;
          this.calculatePagination();
        } else {
          Swal.fire('Lỗi', response.message || 'Không thể tải lịch sử sử dụng voucher', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading voucher usages:', error);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi tải lịch sử sử dụng voucher', 'error');
        this.isLoading = false;
      }
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = [];
    
    // Hiển thị tối đa 5 trang
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadVoucherUsages();
  }

  search(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsages = [...this.voucherUsages];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsages = this.voucherUsages.filter(usage => 
      (usage.voucherCode && usage.voucherCode.toLowerCase().includes(term)) || 
      (usage.userName && usage.userName.toLowerCase().includes(term)) ||
      (usage.orderCode && usage.orderCode.toLowerCase().includes(term))
    );
  }

  clearVoucherFilter(): void {
    // Navigate to the same page without the voucher ID parameter
    this.router.navigate(['/voucher-usage']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  getStatusLabel(status: number): string {
    return this.statusLabels[status] || 'Không xác định';
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1: return 'bg-success'; // Đã sử dụng
      case 2: return 'bg-warning'; // Đã hủy
      case 3: return 'bg-info';    // Đã hoàn tiền
      default: return 'bg-secondary';
    }
  }

  viewOrderDetails(orderId: string): void {
    if (!orderId) return;
    this.router.navigate(['/orders', orderId]);
  }

  viewUserDetails(userId: string): void {
    if (!userId) return;
    this.router.navigate(['/users', userId]);
  }
}