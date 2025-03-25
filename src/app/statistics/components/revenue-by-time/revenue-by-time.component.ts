import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticService, StatisticRevenueByTimeRes } from '../../../services/statistic.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ChartOptions {
  series?: any[];
  chart?: any;
  xaxis?: any;
  yaxis?: any;
  dataLabels?: any;
  grid?: any;
  stroke?: any;
  title?: any;
  colors?: string[];
  fill?: any;
  tooltip?: any;
  markers?: any;
  legend?: any;
}

@Component({
  selector: 'app-revenue-by-time',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './revenue-by-time.component.html',
  styleUrl: './revenue-by-time.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RevenueByTimeComponent implements OnInit {
  // Khai báo các biến
  isLoading: boolean = true;
  apiError: boolean = false;
  timeTypeFilter: string = 'day';
  timeRangeFilter: string = 'thisMonth';
  timeData: StatisticRevenueByTimeRes[] = [];
  totalRevenue: number = 0;
  totalTickets: number = 0;
  peakDate: string = '';

  // Chart Options
  mainChartOptions: ChartOptions = {};
  mixedChartOptions: ChartOptions = {};

  // Các màu mặc định
  chartColors: string[] = [
    '#4d84fe', '#43e97b', '#fa709a', '#f7b733', '#667eea'
  ];

  constructor(private statisticService: StatisticService) {}

  ngOnInit(): void {
    // Khởi tạo chart options
    this.initializeChartOptions();
    // Tải dữ liệu
    this.loadTimeData();
  }

  initializeChartOptions(): void {
    // Khởi tạo các mặc định cho main chart (area chart)
    this.mainChartOptions = {
      series: [{
        name: 'Doanh thu',
        data: []
      }],
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: [this.chartColors[0]],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: [],
        type: 'category'
      },
      yaxis: {
        title: {
          text: 'Doanh thu (VNĐ)',
          style: {
            fontSize: '12px'
          }
        },
        labels: {
          formatter: (val: number) => {
            return val.toLocaleString('vi-VN') + ' ₫';
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            return this.formatCurrency(val);
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1'
      }
    };

    // Khởi tạo các mặc định cho mixed chart (line + column)
    this.mixedChartOptions = {
      series: [
        {
          name: 'Doanh thu',
          type: 'column',
          data: []
        },
        {
          name: 'Số vé',
          type: 'line',
          data: []
        }
      ],
      chart: {
        height: 350,
        type: 'line',
        stacked: false,
        toolbar: {
          show: true
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: [0, 3],
        curve: 'smooth'
      },
      colors: [this.chartColors[0], this.chartColors[1]],
      xaxis: {
        categories: [],
        type: 'category'
      },
      yaxis: [
        {
          title: {
            text: 'Doanh thu (VNĐ)',
            style: {
              fontSize: '12px'
            }
          },
          labels: {
            formatter: (val: number) => {
              if (val >= 1000000) {
                return (val / 1000000).toFixed(1) + ' tr';
              }
              return val.toLocaleString('vi-VN');
            }
          }
        },
        {
          opposite: true,
          title: {
            text: 'Số vé',
            style: {
              fontSize: '12px'
            }
          },
          labels: {
            formatter: (val: number) => {
              return val.toFixed(0);
            }
          }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number, { seriesIndex }: { seriesIndex: number }) => {
            if (seriesIndex === 0) {
              return this.formatCurrency(val);
            }
            return val.toLocaleString('vi-VN') + ' vé';
          }
        }
      },
      markers: {
        size: 5
      },
      legend: {
        position: 'top'
      }
    };
  }

  applyTimeType(type: string): void {
    this.timeTypeFilter = type;
    this.loadTimeData();
  }

  applyTimeRange(range: string): void {
    this.timeRangeFilter = range;
    this.loadTimeData();
  }

  loadTimeData(): void {
    this.isLoading = true;
    this.apiError = false;

    // Xác định khoảng thời gian dựa trên bộ lọc
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    const today = new Date();
    
    switch(this.timeRangeFilter) {
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Đầu tuần (Chủ nhật)
        endDate = new Date(today);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
    }

    // Thêm timeout để hiệu ứng loading được rõ ràng hơn 
    setTimeout(() => {
      this.statisticService.getRevenueByTime(this.timeTypeFilter, startDate, endDate).subscribe({
        next: (response) => {
          if (response && response.data && response.data.length > 0) {
            console.log('API Data:', response.data);
            this.timeData = response.data;
            this.calculateMetrics();
            this.updateCharts();
            this.isLoading = false;
          } else {
            console.log('No data received from API, using mock data');
            this.apiError = true;
            this.loadMockData(); // Tải dữ liệu mẫu nếu API không trả về dữ liệu
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error loading time data:', err);
          this.apiError = true;
          this.loadMockData(); // Tải dữ liệu mẫu nếu API lỗi
          this.isLoading = false;
        }
      });
    }, 500);
  }

  loadMockData(): void {
    console.log('Loading mock data for time revenue');
    
    const mockData: StatisticRevenueByTimeRes[] = [];
    const today = new Date();
    
    switch(this.timeTypeFilter) {
      case 'day':
        // Tạo dữ liệu mẫu cho 30 ngày gần nhất
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Tạo giá trị ngẫu nhiên với xu hướng tăng vào cuối tuần
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const baseSales = isWeekend ? 180 : 120;
          const randomFactor = Math.random() * 50 + 50;
          const tickets = Math.floor(baseSales + randomFactor);
          const revenue = tickets * 85000;
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            totalTickets: tickets,
            totalRevenue: revenue,
            totalShowtimes: Math.floor(tickets / 15) + 1
          });
        }
        break;
        
      case 'week':
        // Tạo dữ liệu mẫu cho 12 tuần gần nhất
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - (i * 7));
          
          // Tạo giá trị ngẫu nhiên với xu hướng tăng theo thời gian
          const baseSales = 800 + (i * 10);
          const randomFactor = Math.random() * 300 + 100;
          const tickets = Math.floor(baseSales + randomFactor);
          const revenue = tickets * 85000;
          
          mockData.push({
            date: `${date.getFullYear()}-W${this.getWeekNumber(date)}`,
            totalTickets: tickets,
            totalRevenue: revenue,
            totalShowtimes: Math.floor(tickets / 15) + 1
          });
        }
        break;
        
      case 'month':
        // Tạo dữ liệu mẫu cho 12 tháng gần nhất
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
          
          // Tạo giá trị ngẫu nhiên với xu hướng tăng vào tháng hè và cuối năm
          const isSummer = date.getMonth() >= 4 && date.getMonth() <= 7;
          const isYearEnd = date.getMonth() >= 10;
          const baseSales = isSummer ? 4500 : (isYearEnd ? 5000 : 3500);
          const randomFactor = Math.random() * 1000 + 500;
          const tickets = Math.floor(baseSales + randomFactor);
          const revenue = tickets * 85000;
          
          mockData.push({
            date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
            totalTickets: tickets,
            totalRevenue: revenue,
            totalShowtimes: Math.floor(tickets / 15) + 1
          });
        }
        break;
        
      case 'year':
        // Tạo dữ liệu mẫu cho 5 năm gần nhất
        for (let i = 4; i >= 0; i--) {
          const year = today.getFullYear() - i;
          
          // Tạo giá trị ngẫu nhiên với xu hướng tăng theo năm
          const baseSales = 40000 + (i * 5000);
          const randomFactor = Math.random() * 10000 + 5000;
          const tickets = Math.floor(baseSales + randomFactor);
          const revenue = tickets * 85000;
          
          mockData.push({
            date: year.toString(),
            totalTickets: tickets,
            totalRevenue: revenue,
            totalShowtimes: Math.floor(tickets / 15) + 1
          });
        }
        break;
    }
    
    this.timeData = mockData;
    console.log('Mock data generated:', this.timeData);
    this.calculateMetrics();
    this.updateCharts();
  }

  calculateMetrics(): void {
    // Tính tổng số lượng vé
    this.totalTickets = this.timeData.reduce((sum, item) => sum + item.totalTickets, 0);
    
    // Tính tổng doanh thu
    this.totalRevenue = this.timeData.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    // Tìm ngày có doanh thu cao nhất
    if (this.timeData.length > 0) {
      const peakTimeItem = this.timeData.reduce((prev, current) => 
        (prev.totalRevenue > current.totalRevenue) ? prev : current, 
        this.timeData[0]
      );
      
      this.peakDate = this.getFormattedDate(peakTimeItem.date);
    } else {
      this.peakDate = 'N/A';
    }
    
    console.log('Metrics calculated:', {
      totalTickets: this.totalTickets,
      totalRevenue: this.totalRevenue,
      peakDate: this.peakDate
    });
  }

  updateCharts(): void {
    console.log('Updating charts with data');
    this.updateMainChart();
    this.updateMixedChart();
  }

  updateMainChart(): void {
    // Sắp xếp dữ liệu theo thời gian (tăng dần)
    const sortedData = [...this.timeData].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Chuẩn bị dữ liệu cho biểu đồ
    const categories = sortedData.map(item => this.getFormattedDate(item.date));
    const revenueData = sortedData.map(item => item.totalRevenue);
    
    // Cập nhật biểu đồ chính
    this.mainChartOptions = {
      ...this.mainChartOptions,
      series: [{
        name: 'Doanh thu',
        data: revenueData
      }],
      xaxis: {
        ...this.mainChartOptions.xaxis,
        categories: categories
      },
      title: {
        text: `Doanh thu theo ${this.getTimeTypeName()}`,
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 'bold'
        }
      }
    };
  }

  updateMixedChart(): void {
    // Sắp xếp dữ liệu theo thời gian (tăng dần)
    const sortedData = [...this.timeData].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Chuẩn bị dữ liệu cho biểu đồ
    const categories = sortedData.map(item => this.getFormattedDate(item.date));
    const revenueData = sortedData.map(item => item.totalRevenue);
    const ticketData = sortedData.map(item => item.totalTickets);
    
    // Cập nhật biểu đồ kết hợp
    this.mixedChartOptions = {
      ...this.mixedChartOptions,
      series: [
        {
          name: 'Doanh thu',
          type: 'column',
          data: revenueData
        },
        {
          name: 'Số vé',
          type: 'line',
          data: ticketData
        }
      ],
      xaxis: {
        ...this.mixedChartOptions.xaxis,
        categories: categories
      }
    };
  }

  // Format tiền tệ
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND', 
      maximumFractionDigits: 0
    }).format(value);
  }

  // Tính phần trăm
  calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  // Định dạng hiển thị ngày tùy theo loại thời gian
  getFormattedDate(dateStr: string): string {
    // Thực hiện định dạng dựa trên kiểu thời gian
    switch(this.timeTypeFilter) {
      case 'day':
        // Hiển thị ngày tháng năm (DD/MM/YYYY)
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
        
      case 'week':
        // Hiển thị tuần theo định dạng "Tuần X/YYYY"
        if (dateStr.includes('-W')) {
          const [year, week] = dateStr.split('-W');
          return `Tuần ${week}/${year}`;
        }
        return dateStr;
        
      case 'month':
        // Hiển thị tháng năm (MM/YYYY)
        if (dateStr.includes('-')) {
          const [year, month] = dateStr.split('-');
          return `Tháng ${month}/${year}`;
        }
        return dateStr;
        
      case 'year':
        // Hiển thị năm
        return `Năm ${dateStr}`;
        
      default:
        return dateStr;
    }
  }

  // Định dạng tên loại thời gian
  getTimeTypeName(): string {
    switch(this.timeTypeFilter) {
      case 'day': return 'ngày';
      case 'week': return 'tuần';
      case 'month': return 'tháng';
      case 'year': return 'năm';
      default: return 'thời gian';
    }
  }

  // Lấy số tuần trong năm
  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  // Lấy text hiển thị khoảng thời gian
  getTimeRangeText(): string {
    const today = new Date();
    let fromDate: Date;
    let toDate: Date;

    switch(this.timeRangeFilter) {
      case 'thisWeek':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - today.getDay());
        toDate = new Date(today);
        return `Tuần này (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
        
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today);
        return `Tháng này (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
        
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        return `Tháng trước (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
        
      case 'thisYear':
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = new Date(today);
        return `Năm nay (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
        
      default:
        return 'Tất cả thời gian';
    }
  }

  // Xuất dữ liệu ra Excel
  exportToExcel(type: string): void {
    if (!this.timeData || this.timeData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const currentDate = new Date();
    const dateStr = currentDate.toISOString().split('T')[0];
    const fileName = `Thong_ke_doanh_thu_theo_thoi_gian_${dateStr}.xlsx`;
    
    // Sắp xếp dữ liệu theo thời gian
    const sortedData = [...this.timeData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Tạo dữ liệu cho Excel
    const data = sortedData.map((item, index) => ({
      'STT': index + 1,
      'Thời gian': this.getFormattedDate(item.date),
      'Số suất chiếu': item.totalShowtimes,
      'Số vé bán': item.totalTickets,
      'Tỷ lệ vé (%)': parseFloat(((item.totalTickets / this.totalTickets) * 100).toFixed(1)),
      'Doanh thu': item.totalRevenue,
      'Tỷ lệ doanh thu (%)': parseFloat(((item.totalRevenue / this.totalRevenue) * 100).toFixed(1))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doanh thu theo thời gian');

    // Thiết lập tiêu đề
    const titleRow = { 
      'STT': 'BÁO CÁO THỐNG KÊ DOANH THU THEO THỜI GIAN',
      'Thời gian': '',
      'Số suất chiếu': '',
      'Số vé bán': '',
      'Tỷ lệ vé (%)': '',
      'Doanh thu': '',
      'Tỷ lệ doanh thu (%)': ''
    };
    const filterRow = {
      'STT': `Loại thời gian: Theo ${this.getTimeTypeName()} | Khoảng thời gian: ${this.getTimeRangeText()}`,
      'Thời gian': '',
      'Số suất chiếu': '',
      'Số vé bán': '',
      'Tỷ lệ vé (%)': '',
      'Doanh thu': '',
      'Tỷ lệ doanh thu (%)': ''
    };
    const summaryRow = {
      'STT': `Thời gian có doanh thu cao nhất: ${this.peakDate}`,
      'Thời gian': '',
      'Số suất chiếu': '',
      'Số vé bán': this.totalTickets,
      'Tỷ lệ vé (%)': 100,
      'Doanh thu': this.totalRevenue,
      'Tỷ lệ doanh thu (%)': 100
    };

    XLSX.utils.sheet_add_json(worksheet, [titleRow, filterRow, summaryRow], { origin: 'A1', skipHeader: true });

    // Định dạng cột tiền tệ
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 4; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: 5 }); // Cột Doanh thu
      if (worksheet[cell]) {
        worksheet[cell].z = '#,##0 "₫"';
      }
    }

    // Xuất file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }
}
