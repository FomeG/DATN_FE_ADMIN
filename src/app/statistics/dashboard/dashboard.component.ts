import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateRangePickerComponent } from '../shared/components/date-range-picker/date-range-picker.component';
import { DashboardService, DateRange } from '../shared/services/dashboard.service';
import { RevenueChartComponent } from '../charts/revenue-chart/revenue-chart.component';
import { SeatProfitabilityChartComponent } from '../charts/seat-profitability-chart/seat-profitability-chart.component';
import { CustomerGenderChartComponent } from '../charts/customer-chart/customer-gender-chart.component';
import { PeakHoursChartComponent } from '../charts/customer-chart/peak-hours-chart.component';
import { SeatOccupancyChartComponent } from '../charts/customer-chart/seat-occupancy-chart.component';
import { TopServicesChartComponent } from '../charts/service-chart/top-services-chart.component';
import { PopularGenresChartComponent } from '../charts/service-chart/popular-genres-chart.component';
import { BundledServicesChartComponent } from '../charts/service-chart/bundled-services-chart.component';
import { TicketStatisticsChartComponent } from '../charts/ticket-chart/ticket-statistics-chart.component';
import { SyncChartsComponent } from '../charts/sync-charts/sync-charts.component';
import { SeatOccupancyHeatmapComponent } from '../charts/seat-occupancy-heatmap/seat-occupancy-heatmap.component';
import { ExportService } from '../shared/services/export.service';
import { StatisticService, StatisticSummaryDateRange, MovieStatisticSummaryDateRange, CinemaRevenueData } from '../../services/statistic.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DateRangePickerComponent,
    TicketStatisticsChartComponent,
    SyncChartsComponent,
    SeatOccupancyHeatmapComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  activeTab: string = 'content2'; // 'revenue', 'customer', 'content', 'content2'
  dateRange: DateRange;
  isLoading: boolean = false;

  // Add to your component class
  summaryData: StatisticSummaryDateRange | null = null;
  movieData: MovieStatisticSummaryDateRange[] = [];
  cinemaData: CinemaRevenueData[] = [];


  @ViewChild(RevenueChartComponent) revenueChartComponent!: RevenueChartComponent;
  @ViewChild(SeatProfitabilityChartComponent) seatProfitabilityChartComponent!: SeatProfitabilityChartComponent;
  @ViewChild(CustomerGenderChartComponent) customerGenderChartComponent!: CustomerGenderChartComponent;
  @ViewChild(PeakHoursChartComponent) peakHoursChartComponent!: PeakHoursChartComponent;
  @ViewChild(SeatOccupancyChartComponent) seatOccupancyChartComponent!: SeatOccupancyChartComponent;
  @ViewChild(TopServicesChartComponent) topServicesChartComponent!: TopServicesChartComponent;
  @ViewChild(PopularGenresChartComponent) popularGenresChartComponent!: PopularGenresChartComponent;
  @ViewChild(BundledServicesChartComponent) bundledServicesChartComponent!: BundledServicesChartComponent;
  @ViewChild(TicketStatisticsChartComponent) ticketStatisticsChartComponent!: TicketStatisticsChartComponent;

  private dashboardService = inject(DashboardService);
  private exportService = inject(ExportService);

  constructor(
    private statisticService: StatisticService
  ) {
    this.dateRange = this.dashboardService.getCurrentDateRange();
  }

  ngOnInit(): void {
    // Subscribe to date range changes
    this.dashboardService.dateRange$.subscribe(range => {
      this.dateRange = range;
      this.loadSummaryData();

      // Tải dữ liệu tương ứng với tab đang hiển thị
      if (this.activeTab === 'revenue') {
        this.loadCinemaData();
      } else if (this.activeTab === 'content') {
        this.loadMovieData();
      }
      // Tab content2 (Thống kê chi tiết theo thời gian) không cần tải dữ liệu đặc biệt
    });

    // Initial load
    this.loadSummaryData();
    this.loadMovieData();
    this.loadCinemaData();
  }

  loadSummaryData(): void {
    this.isLoading = true;
    this.statisticService.getSummaryDateRange(
      this.dateRange.startDate || undefined,
      this.dateRange.endDate || undefined
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data && response.data.length > 0) {
          this.summaryData = response.data[0];
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading summary data:', error);
      }
    });
  }


  loadMovieData(): void {
    this.isLoading = true;
    this.statisticService.getMovieSummaryDateRange(
      this.dateRange.startDate || undefined,
      this.dateRange.endDate || undefined
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.movieData = response.data;
          // Sort movies by revenue in descending order
          this.movieData.sort((a, b) => b.totalRevenue - a.totalRevenue);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading movie data:', error);
        this.isLoading = false;
      }
    });
  }

  loadCinemaData(): void {
    this.isLoading = true;
    this.statisticService.getCinemaRevenue(
      this.dateRange.startDate || undefined,
      this.dateRange.endDate || undefined
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.cinemaData = response.data;
          // Sort cinemas by revenue in descending order
          this.cinemaData.sort((a, b) => b.totalRevenue - a.totalRevenue);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cinema revenue data:', error);
        this.isLoading = false;
      }
    });
  }


  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  }
























  /**
   * Chuyển đổi tab
   */
  changeTab(tabId: string): void {
    this.activeTab = tabId;

    // Tải dữ liệu tương ứng với tab được chọn
    if (tabId === 'revenue') {
      this.loadCinemaData();
    } else if (tabId === 'content') {
      this.loadMovieData();
    }
    // Tab content2 (Thống kê chi tiết theo thời gian) và content3 (Tỷ lệ lấp đầy ghế)
    // không cần tải dữ liệu đặc biệt, các component con sẽ tự tải dữ liệu

    // Khi chuyển tab, kích hoạt việc cập nhật dữ liệu
    // bằng cách sử dụng lại khoảng thời gian hiện tại
    // Tất cả các chart component đều lắng nghe sự kiện này
    setTimeout(() => {
      // Lấy khoảng thời gian hiện tại và phát lại sự kiện
      // để tất cả các component đều cập nhật lại dữ liệu
      const currentRange = { ...this.dateRange };
      this.dashboardService.updateDateRange(currentRange);
    }, 100); // Trì hoãn nhỏ để đảm bảo component đã được render
  }

  /**
   * Lấy class cho tab
   */
  getTabClass(tabId: string): string {
    return this.activeTab === tabId ? 'nav-link active' : 'nav-link';
  }

  /**
   * Lấy tên hiển thị cho khoảng thời gian
   */
  getDateRangeDisplayName(): string {
    return this.dashboardService.getDateRangeDisplayName(this.dateRange);
  }

  /**
   * Export tất cả dữ liệu dưới dạng PDF
   */
  exportAllToPdf(): void {
    alert('Chức năng xuất PDF đang được phát triển');
  }

  /**
   * Export tất cả dữ liệu thống kê ra Excel
   * Thu thập dữ liệu từ tất cả các biểu đồ và tạo file Excel tổng hợp
   */
  exportAllToExcel(): void {
    // Kiểm tra tab hiện tại và thu thập dữ liệu tương ứng
    if (this.activeTab === 'revenue') {
      this.exportAllRevenueData();
    } else if (this.activeTab === 'customer') {
      this.exportAllCustomerData();
    } else if (this.activeTab === 'content') {
      this.exportAllContentData();
    }
  }

  /**
   * Xuất tất cả dữ liệu doanh thu
   */
  private exportAllRevenueData(): void {
    try {
      // Thu thập dữ liệu từ biểu đồ doanh thu thời gian
      const timeRevenueData = this.getTimeRevenueData();

      // Thu thập dữ liệu từ biểu đồ doanh thu theo rạp
      const cinemaRevenueData = this.getCinemaRevenueData();

      // Thu thập dữ liệu từ biểu đồ lợi nhuận ghế
      const seatProfitabilityData = this.getSeatProfitabilityData();

      // Tạo sheets khác nhau cho từng loại dữ liệu
      const workbookData: Record<string, any[]> = {
        'Doanh thu theo thời gian': timeRevenueData,
        'Doanh thu theo rạp': cinemaRevenueData,
        'Lợi nhuận ghế': seatProfitabilityData
      };
      // Tạo metadata thông tin báo cáo
      const reportInfo = [
        { 'Thông tin báo cáo': 'Giá trị' },
        { 'Thông tin báo cáo': 'Báo cáo thống kê doanh thu' },
        { 'Thông tin báo cáo': '' },
        { 'Thông tin báo cáo': 'Thời gian báo cáo' },
        { 'Thông tin báo cáo': `Từ: ${this.formatDate(this.dateRange.startDate)}` },
        { 'Thông tin báo cáo': `Đến: ${this.formatDate(this.dateRange.endDate)}` },
        { 'Thông tin báo cáo': '' },
        { 'Thông tin báo cáo': 'Ngày xuất báo cáo' },
        { 'Thông tin báo cáo': this.formatDate(new Date()) }
      ];

      // Thêm sheet thông tin báo cáo
      workbookData['Thông tin báo cáo'] = reportInfo;

      // Xuất dữ liệu ra file Excel
      this.exportService.exportMultiSheetExcel(
        workbookData,
        'bao_cao_thong_ke_doanh_thu',
        this.dateRange
      );
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu doanh thu:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu. Vui lòng thử lại sau.');
    }
  }

  /**
   * Lấy dữ liệu doanh thu theo thời gian
   */
  private getTimeRevenueData(): any[] {
    if (!this.revenueChartComponent || !this.revenueChartComponent.chartOptions || !this.revenueChartComponent.hasData) {
      return [{ 'Thông báo': 'Không có dữ liệu doanh thu theo thời gian để xuất' }];
    }
    return this.revenueChartComponent.chartOptions.series[0].data.map((value, index) => {
      return {
        'Thời gian': this.revenueChartComponent.chartOptions.xaxis.categories[index],
        'Doanh thu (VNĐ)': value
      };
    });
  }
  /**
   * Lấy dữ liệu doanh thu theo rạp
   */
  private getCinemaRevenueData(): any[] {
    if (!this.revenueChartComponent || !this.revenueChartComponent.cinemaChartOptions || !this.revenueChartComponent.hasCinemaData) {
      return [{ 'Thông báo': 'Không có dữ liệu doanh thu theo rạp để xuất' }];
    }
    return this.revenueChartComponent.cinemaChartOptions.series[0].data.map((value, index) => {
      return {
        'Rạp chiếu phim': this.revenueChartComponent.cinemaChartOptions.xaxis.categories[index],
        'Doanh thu (VNĐ)': value
      };
    });
  }

  /**
   * Lấy dữ liệu lợi nhuận ghế
   */
  private getSeatProfitabilityData(): any[] {
    if (!this.seatProfitabilityChartComponent || !this.seatProfitabilityChartComponent.chartOptions || !this.seatProfitabilityChartComponent.hasData) {
      return [{ 'Thông báo': 'Không có dữ liệu lợi nhuận ghế để xuất' }];
    }
    return this.seatProfitabilityChartComponent.chartOptions.xaxis.categories.map((category: string, index: number) => {
      return {
        'Loại ghế': category,
        'Số lượng vé (Chiếc)': this.seatProfitabilityChartComponent.chartOptions.series[0].data[index],
        'Doanh thu (VNĐ)': this.seatProfitabilityChartComponent.chartOptions.series[1].data[index]
      };
    });
  }

  /**
   * Xuất tất cả dữ liệu khách hàng
   */
  private exportAllCustomerData(): void {
    try {
      // Thu thập dữ liệu từ biểu đồ giới tính khách hàng
      const genderData = this.getCustomerGenderData();

      // Thu thập dữ liệu từ biểu đồ giờ cao điểm
      const peakHoursData = this.getPeakHoursData();

      // Thu thập dữ liệu từ biểu đồ tỷ lệ lấp đầy ghế
      const seatOccupancyData = this.getSeatOccupancyData();

      // Tạo sheets khác nhau cho từng loại dữ liệu
      const workbookData: Record<string, any[]> = {
        'Giới tính khách hàng': genderData,
        'Giờ cao điểm': peakHoursData,
        'Tỷ lệ lấp đầy ghế': seatOccupancyData
      };
      // Tạo metadata thông tin báo cáo
      const reportInfo = [
        { 'Thông tin báo cáo': 'Giá trị' },
        { 'Thông tin báo cáo': 'Báo cáo thống kê khách hàng' },
        { 'Thông tin báo cáo': '' },
        { 'Thông tin báo cáo': 'Thời gian báo cáo' },
        { 'Thông tin báo cáo': `Từ: ${this.formatDate(this.dateRange.startDate)}` },
        { 'Thông tin báo cáo': `Đến: ${this.formatDate(this.dateRange.endDate)}` },
        { 'Thông tin báo cáo': '' },
        { 'Thông tin báo cáo': 'Ngày xuất báo cáo' },
        { 'Thông tin báo cáo': this.formatDate(new Date()) }
      ];

      // Thêm sheet thông tin báo cáo
      workbookData['Thông tin báo cáo'] = reportInfo;

      // Xuất dữ liệu ra file Excel
      this.exportService.exportMultiSheetExcel(
        workbookData,
        'bao_cao_thong_ke_khach_hang',
        this.dateRange
      );
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu khách hàng:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu. Vui lòng thử lại sau.');
    }
  }

  /**
   * Lấy dữ liệu thống kê giới tính khách hàng
   */
  private getCustomerGenderData(): any[] {
    if (!this.customerGenderChartComponent || !this.customerGenderChartComponent.chartOptions || !this.customerGenderChartComponent.hasData) {
      return [{ 'Thông báo': 'Không có dữ liệu giới tính khách hàng để xuất' }];
    }
    return this.customerGenderChartComponent.chartOptions.labels.map((label, index) => {
      return {
        'Giới tính': label,
        'Số lượng': this.customerGenderChartComponent.chartOptions.series[index]
      };
    });
  }
  /**
   * Lấy dữ liệu thống kê giờ cao điểm
   */
  private getPeakHoursData(): any[] {
    if (!this.peakHoursChartComponent || !this.peakHoursChartComponent.chartOptions || !this.peakHoursChartComponent.hasData) {
      return [{ 'Thông báo': 'Không có dữ liệu giờ cao điểm để xuất' }];
    }
    return this.peakHoursChartComponent.chartOptions.xaxis.categories.map((hour: string, index: number) => {
      return {
        'Giờ': hour,
        'Lượt khách': this.peakHoursChartComponent.chartOptions.series[0].data[index]
      };
    });
  }

  /**
   * Lấy dữ liệu tỷ lệ lấp đầy ghế
   */
  private getSeatOccupancyData(): any[] {
    if (!this.seatOccupancyChartComponent || !this.seatOccupancyChartComponent.chartOptions || !this.seatOccupancyChartComponent.hasData) {
      return [{ 'Thông báo': 'Không có dữ liệu tỷ lệ lấp đầy ghế để xuất' }];
    }
    return this.seatOccupancyChartComponent.chartOptions.xaxis.categories.map((movie: string, index: number) => {
      return {
        'Suất chiếu': movie,
        'Tỷ lệ lấp đầy (%)': this.seatOccupancyChartComponent.chartOptions.series[0].data[index]
      };
    });
  }

  /**
   * Xuất tất cả dữ liệu dịch vụ và nội dung
   */
  private exportAllContentData(): void {
    try {
      // Thu thập dữ liệu từ biểu đồ thống kê vé
      const ticketStatisticsData = this.getTicketStatisticsData();

      // Tạo sheets khác nhau cho từng loại dữ liệu
      const workbookData: Record<string, any[]> = {
        'Thống kê vé theo thời gian': ticketStatisticsData
      };

      // Tạo metadata thông tin báo cáo
      const reportInfo = [
        { 'Thông tin báo cáo': 'Giá trị' },
        { 'Thông tin báo cáo': 'Báo cáo thống kê dịch vụ và nội dung' },
        { 'Thông tin báo cáo': '' },
        { 'Thông tin báo cáo': 'Thời gian báo cáo' },
        { 'Thông tin báo cáo': `Từ: ${this.formatDate(this.dateRange.startDate)}` },
        { 'Thông tin báo cáo': `Đến: ${this.formatDate(this.dateRange.endDate)}` },
        { 'Thông tin báo cáo': '' },
        { 'Thông tin báo cáo': 'Ngày xuất báo cáo' },
        { 'Thông tin báo cáo': this.formatDate(new Date()) }
      ];

      // Thêm sheet thông tin báo cáo
      workbookData['Thông tin báo cáo'] = reportInfo;

      // Xuất dữ liệu ra file Excel
      this.exportService.exportMultiSheetExcel(
        workbookData,
        'bao_cao_thong_ke_dich_vu_va_noi_dung',
        this.dateRange
      );
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu dịch vụ và nội dung:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu. Vui lòng thử lại sau.');
    }
  }

  /**
   * Lấy dữ liệu thống kê vé
   */
  private getTicketStatisticsData(): any[] {
    if (!this.ticketStatisticsChartComponent || !this.ticketStatisticsChartComponent.chartOptions || !this.ticketStatisticsChartComponent.hasData) {
      return [{ 'Thông báo': 'Không có dữ liệu thống kê vé để xuất' }];
    }

    return this.ticketStatisticsChartComponent.chartOptions.xaxis.categories.map((date: string, index: number) => {
      return {
        'Thời gian': date,
        'Vé đã nhận': this.ticketStatisticsChartComponent.chartOptions.series[0].data[index],
        'Vé đã giải quyết': this.ticketStatisticsChartComponent.chartOptions.series[1].data[index],
        'Vé chưa giải quyết': this.ticketStatisticsChartComponent.chartOptions.series[2].data[index]
      };
    });
  }

  /**
   * Format ngày tháng
   */
  private formatDate(date: Date | null): string {
    if (!date) return 'N/A';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}
