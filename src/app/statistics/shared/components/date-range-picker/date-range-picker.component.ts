import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DateRange } from '../../services/dashboard.service';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.css']
})
export class DateRangePickerComponent implements OnInit {
  dateRange: DateRange;
  isCustomRange = false;
  customStartDate: string = '';
  customEndDate: string = '';

  constructor(private dashboardService: DashboardService) {
    this.dateRange = this.dashboardService.getCurrentDateRange();
  }

  ngOnInit(): void {
    // Subscribe để cập nhật khi có thay đổi từ service
    this.dashboardService.dateRange$.subscribe(range => {
      this.dateRange = range;
      this.isCustomRange = range.label === 'custom';
      
      if (this.isCustomRange && range.startDate && range.endDate) {
        this.customStartDate = this.formatDateForInput(range.startDate);
        this.customEndDate = this.formatDateForInput(range.endDate);
      }
    });
  }

  /**
   * Xử lý khi chọn loại khoảng thời gian
   */
  onRangeTypeChange(type: 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom'): void {
    this.dashboardService.setDateRangeByType(type);
  }

  /**
   * Áp dụng khoảng thời gian tùy chỉnh
   */
  applyCustomRange(): void {
    if (!this.customStartDate || !this.customEndDate) {
      return;
    }

    const startDate = new Date(this.customStartDate);
    const endDate = new Date(this.customEndDate);

    // Đặt giờ cho startDate là 00:00:00
    startDate.setHours(0, 0, 0, 0);
    
    // Đặt giờ cho endDate là 23:59:59
    endDate.setHours(23, 59, 59, 999);

    const customRange: DateRange = {
      startDate,
      endDate,
      label: 'custom'
    };

    this.dashboardService.updateDateRange(customRange);
  }

  /**
   * Format ngày tháng để hiển thị trong input
   */
  private formatDateForInput(date: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Lấy tên hiển thị cho khoảng thời gian
   */
  getDateRangeDisplayName(): string {
    return this.dashboardService.getDateRangeDisplayName(this.dateRange);
  }
} 