import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingRuleService, PricingRule } from '../../services/pricing-rule.service';
import { AddPricingRuleModalComponent } from '../add-pricing-rule-modal/add-pricing-rule-modal.component';
import { EditPricingRuleModalComponent } from '../edit-pricing-rule-modal/edit-pricing-rule-modal.component';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-pricing-rule',
  standalone: true,
  imports: [CommonModule, FormsModule, AddPricingRuleModalComponent, EditPricingRuleModalComponent],
  templateUrl: './pricing-rule.component.html',
  styleUrl: './pricing-rule.component.css'
})
export class PricingRuleComponent implements OnInit {
  rules: PricingRule[] = [];
  filteredRules: PricingRule[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];
  selectedRule: PricingRule | null = null;

  // Bộ lọc
  searchTerm = '';
  filterType = 'all';
  filterMonth = 'all';

  constructor(private pricingRuleService: PricingRuleService) { }

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    // Khi tải dữ liệu mới, luôn lấy từ trang 1
    this.pricingRuleService.getAllRules(1, 1000) // Lấy nhiều bản ghi để có thể lọc phía client
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.filteredRules = response.data;
            this.totalRecords = response.totalRecord;
            this.calculateTotalPages();
            this.currentPage = 1; // Reset về trang 1 khi tải dữ liệu mới
            this.updateDisplayedRules(); // Cập nhật rules hiển thị
          } else {
            Swal.fire('Lỗi', response.message, 'error');
          }
        },
        error: (error) => {
          console.error('Error loading rules:', error);
          Swal.fire('Lỗi', 'Không thể tải danh sách quy tắc giá', 'error');
        }
      });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);

    // Giới hạn số trang hiển thị để tránh quá nhiều nút phân trang
    if (this.totalPages <= 5) {
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      // Hiển thị 5 trang gồm trang hiện tại và các trang xung quanh
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + 4);
      this.pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    }
  }

  applyFilters(): void {
    let filtered = [...this.filteredRules];

    // Lọc theo tên
    if (this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(rule =>
        rule.ruleName.toLowerCase().includes(searchLower)
      );
    }

    // Lọc theo loại
    if (this.filterType !== 'all') {
      switch (this.filterType) {
        case 'time':
          filtered = filtered.filter(rule => rule.startTime && rule.endTime);
          break;
        case 'special_day':
          filtered = filtered.filter(rule => rule.specialDay !== null && rule.specialMonth !== null);
          break;
        case 'day_of_week':
          filtered = filtered.filter(rule => rule.dayOfWeek !== null);
          break;
        case 'discount':
          filtered = filtered.filter(rule => rule.isDiscount);
          break;
      }
    }

    // Lọc theo tháng
    if (this.filterMonth !== 'all') {
      const month = parseInt(this.filterMonth, 10);
      filtered = filtered.filter(rule => {
        // Lọc theo tháng đặc biệt
        if (rule.specialMonth && parseInt(rule.specialMonth, 10) === month) return true;

        // Lọc theo ngày bắt đầu hoặc kết thúc
        if (rule.startDate) {
          const startDate = new Date(rule.startDate);
          if (startDate.getMonth() + 1 === month) return true;
        }

        if (rule.endDate) {
          const endDate = new Date(rule.endDate);
          if (endDate.getMonth() + 1 === month) return true;
        }

        return false;
      });
    }

    this.filteredRules = filtered;
    this.totalRecords = this.filteredRules.length; // Cập nhật tổng số bản ghi sau khi lọc
    this.currentPage = 1; // Reset về trang 1 khi áp dụng bộ lọc mới

    // Cập nhật lại rules hiển thị theo phân trang
    this.updateDisplayedRules();
    this.calculateTotalPages();
  }

  updateDisplayedRules(): void {
    const startIndex = (this.currentPage - 1) * this.recordPerPage;
    const endIndex = Math.min(startIndex + this.recordPerPage, this.filteredRules.length);
    this.rules = this.filteredRules.slice(startIndex, endIndex);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterType = 'all';
    this.filterMonth = 'all';
    this.currentPage = 1;
    this.loadRules();
  }

  openEditModal(rule: PricingRule): void {
    this.selectedRule = rule;
    const modalEl = document.getElementById('editPricingRuleModal');
    if (modalEl) {
      const modalInstance = new bootstrap.Modal(modalEl);
      modalInstance.show();
    }
  }

  deleteRule(ruleId: string): void {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn không thể hoàn tác sau khi xóa!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pricingRuleService.deleteRule(ruleId)
          .subscribe({
            next: (response) => {
              if (response.responseCode === 200) {
                Swal.fire('Đã xóa!', 'Quy tắc giá đã được xóa.', 'success');
                this.loadRules();
              } else {
                Swal.fire('Lỗi', response.message, 'error');
              }
            },
            error: (error) => {
              console.error('Error deleting rule:', error);
              Swal.fire('Lỗi', 'Không thể xóa quy tắc giá', 'error');
            }
          });
      }
    });
  }

  onPageChange(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedRules();
      this.calculateTotalPages(); // Cập nhật lại danh sách trang hiển thị
    }
  }

  onRecordsPerPageChange(): void {
    // Reset về trang 1 khi thay đổi số bản ghi trên trang
    this.currentPage = 1;

    // Tính toán lại tổng số trang
    this.calculateTotalPages();

    // Cập nhật lại danh sách hiển thị
    this.updateDisplayedRules();
  }

  // Helper methods for display
  getRuleTypeText(rule: PricingRule): string {
    if (rule.startTime && rule.endTime) {
      return 'Theo giờ';
    } else if (rule.specialDay && rule.specialMonth) {
      return 'Ngày đặc biệt';
    } else if (rule.dayOfWeek !== null) {
      return 'Ngày trong tuần';
    } else if (rule.startDate && rule.endDate) {
      return 'Khoảng thời gian';
    } else if (rule.date) {
      return 'Ngày cụ thể';
    } else {
      return 'Khác';
    }
  }

  getRuleTypeBadgeClass(rule: PricingRule): string {
    if (rule.startTime && rule.endTime) {
      return 'badge-time'; // Màu xanh dương nhạt
    } else if (rule.specialDay && rule.specialMonth) {
      return 'badge-special-day'; // Màu cam
    } else if (rule.dayOfWeek !== null) {
      return 'badge-weekday'; // Màu tím
    } else if (rule.startDate && rule.endDate) {
      return 'badge-date-range'; // Màu xanh dương đậm
    } else if (rule.date) {
      return 'badge-specific-date'; // Màu xanh lá
    } else {
      return 'badge-other'; // Màu xám đậm
    }
  }

  getDayOfWeekText(dayOfWeek: string | number): string {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const index = typeof dayOfWeek === 'string' ? parseInt(dayOfWeek, 10) : dayOfWeek;
    return days[index];
  }

  // Trả về icon tương ứng với loại quy tắc
  getRuleTypeIcon(rule: PricingRule): string {
    if (rule.startTime && rule.endTime) {
      return 'fa-clock'; // Theo giờ
    } else if (rule.specialDay && rule.specialMonth) {
      return 'fa-calendar-day'; // Ngày đặc biệt
    } else if (rule.dayOfWeek !== null) {
      return 'fa-calendar-week'; // Ngày trong tuần
    } else if (rule.startDate && rule.endDate) {
      return 'fa-calendar-alt'; // Khoảng thời gian
    } else if (rule.date) {
      return 'fa-calendar-check'; // Ngày cụ thể
    } else {
      return 'fa-tag'; // Khác
    }
  }
}