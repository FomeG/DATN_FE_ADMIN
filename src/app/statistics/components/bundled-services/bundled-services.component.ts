import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexNonAxisChartSeries, 
  ApexPlotOptions, ApexResponsive, ApexTitleSubtitle, ApexXAxis, ApexYAxis, ApexLegend,
  ApexFill, ApexTooltip, ApexTheme, ApexGrid, ApexStroke, ApexMarkers 
} from "ng-apexcharts";
import { NgApexchartsModule } from "ng-apexcharts";
import { StatisticService, StatisticTopServicesRes } from '../../../services/statistic.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

// Cấu hình biểu đồ tròn
export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  legend: ApexLegend;
  colors: string[];
  tooltip: ApexTooltip;
};

// Cấu hình biểu đồ cột
export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  colors: string[];
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

// Cấu hình biểu đồ đường
export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  markers: ApexMarkers;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
};

@Component({
  selector: 'app-bundled-services',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './bundled-services.component.html',
  styleUrls: ['./bundled-services.component.css']
})
export class BundledServicesComponent implements OnInit {
  // Dữ liệu thống kê
  topServices: StatisticTopServicesRes[] = [];
  totalServicesCount: number = 0;
  totalRevenue: number = 0;
  
  // Cho phép truy cập đối tượng Math trong template
  Math = Math;
  
  // Thời gian lọc
  startDate: Date | null = null;
  endDate: Date | null = null;
  timeRangeFilter: string = 'thisMonth';

  // Đang tải dữ liệu
  isLoading: boolean = false;
  
  // Lưu thông tin lỗi API để hiển thị (debug)
  apiError: any = null;
  
  // Biểu đồ tròn
  public pieChartOptions: Partial<PieChartOptions>;
  
  // Biểu đồ cột
  public barChartOptions: Partial<BarChartOptions>;

  // Biểu đồ đường
  public lineChartOptions: Partial<LineChartOptions>;

  // Màu sắc cho biểu đồ
  chartColors: string[] = ['#4facfe', '#00f2fe', '#fa709a', '#fee140', '#667eea'];

  constructor(private statisticService: StatisticService) { 
    // Khởi tạo cấu hình biểu đồ tròn
    this.pieChartOptions = {
      series: [],
      chart: {
        type: "pie",
        height: 300,
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        toolbar: {
          show: false
        }
      },
      labels: [],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ],
      legend: {
        position: "right",
        fontSize: "14px",
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      colors: this.chartColors,
      dataLabels: {
        enabled: false
      },
      tooltip: {
        enabled: true,
        theme: "light",
        style: {
          fontSize: '12px',
          fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        y: {
          formatter: function (val) {
            return new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(val);
          }
        },
        marker: {
          show: true,
        }
      }
    };

    // Khởi tạo cấu hình biểu đồ cột
    this.barChartOptions = {
      series: [
        {
          name: "Số lượng bán",
          data: []
        },
        {
          name: "Doanh thu (triệu)",
          data: []
        }
      ],
      chart: {
        type: "bar",
        height: 300,
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 5
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: [this.chartColors[0], this.chartColors[2]],
      legend: {
        position: "top",
        fontSize: "14px",
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        itemMargin: {
          horizontal: 10,
          vertical: 0
        }
      },
      grid: {
        borderColor: "#f1f1f1",
        row: {
          colors: ["transparent", "transparent"],
          opacity: 0.1
        }
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            fontSize: "12px",
            fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          }
        }
      },
      yaxis: {
        title: {
          text: undefined
        },
        labels: {
          formatter: function (val) {
            return val.toFixed(0);
          }
        }
      },
      tooltip: {
        enabled: true,
        theme: "light",
        style: {
          fontSize: '12px',
          fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        y: {
          formatter: function (val, { seriesIndex, dataPointIndex, w }) {
            if (seriesIndex === 0) {
              return val.toFixed(0);
            }
            return (val).toFixed(1) + " triệu";
          }
        },
        marker: {
          show: true,
        },
        fixed: {
          enabled: false,
          position: 'topRight',
          offsetX: 0,
          offsetY: 0,
        },
      }
    };

    // Khởi tạo cấu hình biểu đồ đường
    this.lineChartOptions = {
      series: [
        {
          name: "Doanh thu theo ngày",
          data: []
        }
      ],
      chart: {
        height: 300,
        type: "line",
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      colors: [this.chartColors[4]], // Sử dụng màu khác với biểu đồ cột
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 3
      },
      markers: {
        size: 4,
        colors: ["#fff"],
        strokeColors: this.chartColors[4],
        strokeWidth: 2
      },
      grid: {
        borderColor: "#f1f1f1",
        row: {
          colors: ["transparent", "transparent"],
          opacity: 0.1
        }
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            fontSize: "12px",
            fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          }
        }
      },
      yaxis: {
        title: {
          text: "Doanh thu (triệu VND)"
        },
        labels: {
          formatter: function (val) {
            return val.toFixed(0);
          }
        }
      },
      tooltip: {
        enabled: true,
        theme: "light",
        style: {
          fontSize: '12px',
          fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        y: {
          formatter: function (val) {
            return new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(val);
          }
        },
        marker: {
          show: true,
        },
        fixed: {
          enabled: false,
          position: 'topRight',
          offsetX: 0,
          offsetY: 0,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        floating: true,
        offsetY: -25,
        offsetX: -5
      }
    };
  }

  ngOnInit(): void {
    this.applyTimeRange('thisMonth');
  }

  /**
   * Áp dụng lọc theo thời gian
   */
  applyTimeRange(range: string): void {
    this.timeRangeFilter = range;
    const now = new Date();
    
    switch (range) {
      case 'today':
        this.startDate = new Date(now.setHours(0, 0, 0, 0));
        this.endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'thisWeek':
        const firstDay = now.getDate() - now.getDay();
        this.startDate = new Date(now.setDate(firstDay));
        this.startDate.setHours(0, 0, 0, 0);
        this.endDate = new Date(now);
        this.endDate.setDate(this.startDate.getDate() + 6);
        this.endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        this.startDate = new Date(now.getFullYear(), 0, 1);
        this.endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        this.startDate = null;
        this.endDate = null;
        break;
    }
    
    // Gọi API để lấy dữ liệu
    this.loadTopServices();
  }

  /**
   * Lấy dữ liệu thống kê top dịch vụ
   */
  loadTopServices(): void {
    this.isLoading = true;
    this.apiError = null;
    
    console.log('Fetching data with date range:', {
      startDate: this.startDate,
      endDate: this.endDate
    });
    
    this.statisticService.getTopServices(this.startDate || undefined, this.endDate || undefined)
      .subscribe({
        next: (response) => {
          console.log('API response:', response);
          
          // Kiểm tra nhiều cấu trúc response khác nhau
          let data: StatisticTopServicesRes[] = [];
          
          if (response) {
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              // Cấu trúc chuẩn theo interface
              data = response.data;
            } else if (Array.isArray(response) && response.length > 0) {
              // Trường hợp API trả về mảng trực tiếp
              data = response as unknown as StatisticTopServicesRes[];
            } else {
              // Sử dụng type assertion để tránh lỗi TypeScript
              const responseAny = response as any;
              
              // Kiểm tra các thuộc tính khác có thể chứa dữ liệu
              const possibleDataProps = ['result', 'items', 'services', 'list'];
              for (const prop of possibleDataProps) {
                if (responseAny[prop] && Array.isArray(responseAny[prop]) && responseAny[prop].length > 0) {
                  data = responseAny[prop];
                  break;
                }
              }
            }
          }
          
          if (data.length > 0) {
            this.topServices = data;
            
            // Tính tổng số dịch vụ đã bán và tổng doanh thu
            this.totalServicesCount = this.topServices.reduce((sum, service) => sum + service.totalSold, 0);
            this.totalRevenue = this.topServices.reduce((sum, service) => sum + service.totalRevenue, 0);
            
            // Cập nhật dữ liệu biểu đồ
            this.updateChartData();
          } else {
            console.warn('Response data is empty or invalid, using mock data');
            this.useMockData();
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải dữ liệu top dịch vụ:', error);
          this.isLoading = false;
          this.apiError = error;
          
          // Sử dụng dữ liệu mẫu để hiển thị
          this.useMockData();
        }
      });
  }
  
  /**
   * Cập nhật dữ liệu biểu đồ từ topServices
   */
  updateChartData(): void {
    // Lấy tối đa 5 dịch vụ hàng đầu để hiển thị trên biểu đồ
    const topFiveServices = this.topServices.slice(0, 5);
    
    // Cập nhật dữ liệu biểu đồ tròn
    const pieLabels = topFiveServices.map(service => service.serviceName);
    const pieData = topFiveServices.map(service => service.totalRevenue);
    
    this.pieChartOptions.labels = pieLabels;
    this.pieChartOptions.series = pieData;
    
    // Cập nhật dữ liệu biểu đồ cột
    if (this.barChartOptions.xaxis) {
      this.barChartOptions.xaxis.categories = pieLabels;
    }
    
    if (this.barChartOptions.series && this.barChartOptions.series.length >= 2) {
      this.barChartOptions.series[0].data = topFiveServices.map(service => service.totalSold);
      this.barChartOptions.series[1].data = topFiveServices.map(service => service.totalRevenue / 1000000); // Chuyển đổi sang triệu
    }
    
    // Tạo dữ liệu mẫu cho biểu đồ đường (doanh thu theo thời gian)
    this.updateLineChartData();
  }
  
  /**
   * Tạo dữ liệu cho biểu đồ đường
   */
  updateLineChartData(): void {
    // Xác định phạm vi thời gian dựa trên bộ lọc hiện tại
    const dates: string[] = [];
    const revenueData: number[] = [];
    
    if (this.startDate && this.endDate) {
      // Tính số ngày trong khoảng thời gian
      const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Tạo mảng ngày và doanh thu mẫu
      if (diffDays <= 31) { // Hiển thị theo ngày nếu <= 31 ngày
        for (let i = 0; i <= diffDays; i++) {
          const currentDate = new Date(this.startDate);
          currentDate.setDate(currentDate.getDate() + i);
          
          // Format ngày thành dd/MM
          const day = String(currentDate.getDate()).padStart(2, '0');
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          dates.push(`${day}/${month}`);
          
          // Doanh thu ngẫu nhiên từ 1-10 triệu
          const randomRevenue = Math.floor(Math.random() * 9000000) + 1000000;
          revenueData.push(randomRevenue);
        }
      } else { // Hiển thị theo tháng nếu > 31 ngày
        const startMonth = this.startDate.getMonth();
        const startYear = this.startDate.getFullYear();
        const endMonth = this.endDate.getMonth();
        const endYear = this.endDate.getFullYear();
        
        const monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);
        
        for (let i = 0; i <= monthDiff; i++) {
          const currentMonth = new Date(startYear, startMonth + i, 1);
          const monthName = currentMonth.toLocaleDateString('vi-VN', { month: 'short' });
          const year = currentMonth.getFullYear();
          dates.push(`${monthName} ${year}`);
          
          // Doanh thu ngẫu nhiên từ 10-50 triệu
          const randomRevenue = Math.floor(Math.random() * 40000000) + 10000000;
          revenueData.push(randomRevenue);
        }
      }
    }
    
    // Cập nhật dữ liệu biểu đồ đường
    if (this.lineChartOptions.xaxis) {
      this.lineChartOptions.xaxis.categories = dates;
    }
    
    if (this.lineChartOptions.series && this.lineChartOptions.series.length > 0) {
      this.lineChartOptions.series[0].data = revenueData;
    }
  }
  
  /**
   * Sử dụng dữ liệu mẫu để hiển thị 
   */
  useMockData(): void {
    this.topServices = [
      { serviceName: 'Gói bắp nước', totalSold: 1250, totalRevenue: 12500000 },
      { serviceName: 'Gói VIP', totalSold: 850, totalRevenue: 17000000 },
      { serviceName: 'Gói đôi', totalSold: 720, totalRevenue: 10800000 },
      { serviceName: 'Gói sinh nhật', totalSold: 320, totalRevenue: 8000000 },
      { serviceName: 'Gói gia đình', totalSold: 180, totalRevenue: 5400000 },
    ];
    
    this.totalServicesCount = this.topServices.reduce((sum, service) => sum + service.totalSold, 0);
    this.totalRevenue = this.topServices.reduce((sum, service) => sum + service.totalRevenue, 0);
    
    // Cập nhật dữ liệu biểu đồ với dữ liệu mẫu
    this.updateChartData();
  }

  /**
   * Định dạng tiền tệ VND
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }
  
  /**
   * Định dạng số lượng triệu
   */
  formatMillions(value: number): string {
    return (value / 1000000).toFixed(1) + ' tr';
  }

  /**
   * Export dữ liệu ra Excel
   */
  exportToExcel(type: string): void {
    this.isLoading = true;
    
    try {
      let data: any[] = [];
      let fileName = '';
      let sheetName = '';
      
      // Dữ liệu và tên file khác nhau tùy loại export
      switch (type) {
        case 'topServices':
          data = this.topServices.map(service => ({
            'Tên dịch vụ': service.serviceName,
            'Số lượng bán': service.totalSold,
            'Doanh thu': service.totalRevenue,
            'Doanh thu (VND)': this.formatCurrency(service.totalRevenue)
          }));
          fileName = 'Top_Dich_Vu_' + this.getFormattedDateForFileName();
          sheetName = 'Top dịch vụ';
          break;
          
        case 'revenueByTime':
          if (this.lineChartOptions.xaxis?.categories && this.lineChartOptions.series?.[0]?.data) {
            const categories = this.lineChartOptions.xaxis.categories as string[];
            const revenueData = this.lineChartOptions.series[0].data as number[];
            
            data = categories.map((date, index) => ({
              'Thời gian': date,
              'Doanh thu': revenueData[index],
              'Doanh thu (VND)': this.formatCurrency(revenueData[index])
            }));
          }
          fileName = 'Doanh_Thu_Theo_Thoi_Gian_' + this.getFormattedDateForFileName();
          sheetName = 'Doanh thu theo thời gian';
          break;
          
        case 'all':
          // Sheet 1: Top dịch vụ
          const topServicesData = this.topServices.map(service => ({
            'Tên dịch vụ': service.serviceName,
            'Số lượng bán': service.totalSold,
            'Doanh thu': service.totalRevenue,
            'Doanh thu (VND)': this.formatCurrency(service.totalRevenue)
          }));
          
          // Sheet 2: Doanh thu theo thời gian
          let revenueByTimeData: any[] = [];
          if (this.lineChartOptions.xaxis?.categories && this.lineChartOptions.series?.[0]?.data) {
            const categories = this.lineChartOptions.xaxis.categories as string[];
            const revenueData = this.lineChartOptions.series[0].data as number[];
            
            revenueByTimeData = categories.map((date, index) => ({
              'Thời gian': date,
              'Doanh thu': revenueData[index],
              'Doanh thu (VND)': this.formatCurrency(revenueData[index])
            }));
          }
          
          // Sheet 3: Tổng quan
          const overviewData = [{
            'Tổng số dịch vụ đã bán': this.totalServicesCount,
            'Tổng doanh thu': this.totalRevenue,
            'Tổng doanh thu (VND)': this.formatCurrency(this.totalRevenue),
            'Khoảng thời gian': this.getDateRangeString(),
          }];
          
          // Tạo Workbook với nhiều sheet
          const workbook = XLSX.utils.book_new();
          
          // Thêm từng sheet vào workbook
          const topServicesSheet = XLSX.utils.json_to_sheet(topServicesData);
          XLSX.utils.book_append_sheet(workbook, topServicesSheet, 'Top dịch vụ');
          
          const revenueByTimeSheet = XLSX.utils.json_to_sheet(revenueByTimeData);
          XLSX.utils.book_append_sheet(workbook, revenueByTimeSheet, 'Doanh thu theo thời gian');
          
          const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
          XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');
          
          // Xuất file Excel
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          fileName = 'Bao_Cao_Thong_Ke_Dich_Vu_' + this.getFormattedDateForFileName();
          FileSaver.saveAs(blob, fileName + '.xlsx');
          
          this.isLoading = false;
          return;
      }
      
      // Trường hợp xuất 1 sheet
      if (data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Xuất file Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        FileSaver.saveAs(blob, fileName + '.xlsx');
      }
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
    }
    
    this.isLoading = false;
  }
  
  /**
   * Lấy định dạng ngày cho tên file
   */
  private getFormattedDateForFileName(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return day + '_' + month + '_' + year;
  }
  
  /**
   * Lấy chuỗi khoảng thời gian hiển thị
   */
  private getDateRangeString(): string {
    if (!this.startDate || !this.endDate) {
      return 'Tất cả thời gian';
    }
    
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return `${formatDate(this.startDate)} - ${formatDate(this.endDate)}`;
  }
}
