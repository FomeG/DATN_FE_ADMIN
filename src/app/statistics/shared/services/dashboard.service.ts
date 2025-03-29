import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  label: string; // 'custom', 'today', 'thisWeek', 'thisMonth', 'thisYear'
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Khoảng thời gian mặc định là tháng hiện tại
  private defaultDateRange: DateRange = this.getMonthDateRange();
  
  // BehaviorSubject để lưu trữ và phát tán khoảng thời gian hiện tại
  private dateRangeSubject = new BehaviorSubject<DateRange>(this.defaultDateRange);
  
  // Observable để các component có thể subscribe
  public dateRange$ = this.dateRangeSubject.asObservable();
  
  constructor() { }
  
  /**
   * Cập nhật khoảng thời gian
   */
  updateDateRange(range: DateRange): void {
    this.dateRangeSubject.next(range);
  }
  
  /**
   * Lấy khoảng thời gian hiện tại
   */
  getCurrentDateRange(): DateRange {
    return this.dateRangeSubject.value;
  }
  
  /**
   * Đặt khoảng thời gian theo loại
   */
  setDateRangeByType(type: 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom'): void {
    let range: DateRange;
    
    switch (type) {
      case 'today':
        range = this.getTodayDateRange();
        break;
      case 'thisWeek':
        range = this.getWeekDateRange();
        break;
      case 'thisMonth':
        range = this.getMonthDateRange();
        break;
      case 'thisYear':
        range = this.getYearDateRange();
        break;
      default:
        // Giữ nguyên khoảng thời gian hiện tại nhưng đổi nhãn
        const current = this.getCurrentDateRange();
        range = {
          startDate: current.startDate,
          endDate: current.endDate,
          label: 'custom'
        };
        break;
    }
    
    this.updateDateRange(range);
  }
  
  /**
   * Tạo khoảng thời gian cho ngày hôm nay
   */
  private getTodayDateRange(): DateRange {
    const today = new Date();
    
    // Bắt đầu ngày hôm nay, 00:00:00
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Kết thúc ngày hôm nay, 23:59:59
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`Hôm nay: từ ${startOfDay.toLocaleString()} đến ${endOfDay.toLocaleString()}`);
    
    return {
      startDate: startOfDay,
      endDate: endOfDay,
      label: 'today'
    };
  }
  
  /**
   * Tạo khoảng thời gian cho tuần này
   */
  private getWeekDateRange(): DateRange {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    
    // Tính toán ngày đầu tiên trong tuần (Thứ 2)
    // Nếu hôm nay là Chủ nhật (0), thì đầu tuần là thứ 2 tuần trước (-6 ngày)
    // Nếu hôm nay là thứ 2-7 (1-6), thì đầu tuần là thứ 2 tuần này (1-currentDay ngày)
    const firstDay = new Date(today);
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    firstDay.setDate(today.getDate() - daysSinceMonday);
    firstDay.setHours(0, 0, 0, 0);
    
    // Tính toán ngày cuối cùng trong tuần (Chủ nhật)
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);
    
    console.log(`Tuần này: từ ${firstDay.toLocaleString()} đến ${lastDay.toLocaleString()}`);
    
    return {
      startDate: firstDay,
      endDate: lastDay,
      label: 'thisWeek'
    };
  }
  
  /**
   * Tạo khoảng thời gian cho tháng này
   */
  private getMonthDateRange(): DateRange {
    const today = new Date();
    
    // Ngày đầu tiên của tháng
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    
    // Ngày cuối cùng của tháng
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    
    console.log(`Tháng này: từ ${firstDay.toLocaleString()} đến ${lastDay.toLocaleString()}`);
    
    return {
      startDate: firstDay,
      endDate: lastDay,
      label: 'thisMonth'
    };
  }
  
  /**
   * Tạo khoảng thời gian cho năm này
   */
  private getYearDateRange(): DateRange {
    const today = new Date();
    
    // Ngày đầu tiên của năm
    const firstDay = new Date(today.getFullYear(), 0, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    // Ngày cuối cùng của năm
    const lastDay = new Date(today.getFullYear(), 11, 31);
    lastDay.setHours(23, 59, 59, 999);
    
    console.log(`Năm này: từ ${firstDay.toLocaleString()} đến ${lastDay.toLocaleString()}`);
    
    return {
      startDate: firstDay,
      endDate: lastDay,
      label: 'thisYear'
    };
  }
  
  /**
   * Format ngày tháng để hiển thị
   */
  formatDateToDisplay(date: Date | null): string {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Lấy tên hiển thị cho khoảng thời gian
   */
  getDateRangeDisplayName(range: DateRange): string {
    switch (range.label) {
      case 'today':
        return 'Hôm nay';
      case 'thisWeek':
        return 'Tuần này';
      case 'thisMonth':
        return 'Tháng này';
      case 'thisYear':
        return 'Năm nay';
      case 'custom':
        return `${this.formatDateToDisplay(range.startDate)} - ${this.formatDateToDisplay(range.endDate)}`;
      default:
        return 'Khoảng thời gian';
    }
  }
} 