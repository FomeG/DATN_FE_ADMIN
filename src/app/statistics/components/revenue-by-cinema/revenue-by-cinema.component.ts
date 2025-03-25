import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticService, StatisticRevenueByCinemaRes } from '../../../services/statistic.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface PieChartOptions {
  series?: number[];
  chart?: any;
  labels?: string[];
  responsive?: any[];
  colors?: string[];
  dataLabels?: any;
  legend?: any;
  tooltip?: any;
  plotOptions?: any;
  states?: any;
  fill?: any;
}

interface BarChartOptions {
  series?: any[];
  chart?: any;
  xaxis?: any;
  yaxis?: any;
  dataLabels?: any;
  colors?: string[];
  tooltip?: any;
  plotOptions?: any;
  fill?: any;
  grid?: any;
}

@Component({
  selector: 'app-revenue-by-cinema',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './revenue-by-cinema.component.html',
  styleUrl: './revenue-by-cinema.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RevenueByCinemaComponent implements OnInit {
  // Khai báo các biến
  isLoading: boolean = true;
  apiError: boolean = false;
  timeRangeFilter: string = 'thisMonth';
  cinemaData: StatisticRevenueByCinemaRes[] = [];
  totalRevenue: number = 0;
  totalTickets: number = 0;
  topCinema: string = '';

  // Chart Options
  pieChartOptions: PieChartOptions = {};
  barChartOptions: BarChartOptions = {};

  // Các màu mặc định
  cinemaColors: string[] = [
    '#4facfe', '#43e97b', '#fa709a', '#f7b733', '#667eea', 
    '#764ba2', '#26c6da', '#ec407a', '#66bb6a', '#5c6bc0'
  ];

  constructor(private statisticService: StatisticService) {}

  ngOnInit(): void {
    // Khởi tạo chart options
    this.initializeChartOptions();
    // Tải dữ liệu
    this.loadCinemaData();
  }

  initializeChartOptions(): void {
    // Khởi tạo các mặc định cho pie chart
    this.pieChartOptions = {
      series: [],
      chart: {
        type: 'pie',
        height: 350,
        toolbar: {
          show: false
        }
      },
      labels: [],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };

    // Khởi tạo các mặc định cho bar chart
    this.barChartOptions = {
      series: [{
        name: 'Doanh thu',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#4d84fe'],
      xaxis: {
        categories: []
      }
    };
  }

  applyTimeRange(range: string): void {
    this.timeRangeFilter = range;
    this.loadCinemaData();
  }

  loadCinemaData(): void {
    this.isLoading = true;
    this.apiError = false;

    // Xác định khoảng thời gian dựa trên bộ lọc
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    const today = new Date();
    
    switch(this.timeRangeFilter) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Đầu tuần (Chủ nhật)
        endDate = new Date(today);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
    }

    // Thêm timeout để hiệu ứng loading được rõ ràng hơn 
    setTimeout(() => {
      this.statisticService.getRevenueByCinema(startDate, endDate).subscribe({
        next: (response) => {
          if (response && response.data && response.data.length > 0) {
            console.log('API Data:', response.data);
            this.cinemaData = response.data;
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
          console.error('Error loading cinema data:', err);
          this.apiError = true;
          this.loadMockData(); // Tải dữ liệu mẫu nếu API lỗi
          this.isLoading = false;
        }
      });
    }, 500);
  }

  loadMockData(): void {
    console.log('Loading mock data for cinemas');
    
    // Tạo dữ liệu mẫu cho các rạp
    this.cinemaData = [
      { cinemaName: 'CGV Aeon Mall Hà Đông', totalTickets: 5200, totalRevenue: 780000000, totalShowtimes: 120 },
      { cinemaName: 'CGV Vincom Times City', totalTickets: 4800, totalRevenue: 720000000, totalShowtimes: 110 },
      { cinemaName: 'CGV Mipec Tower', totalTickets: 4350, totalRevenue: 652500000, totalShowtimes: 95 },
      { cinemaName: 'CGV Tràng Tiền Plaza', totalTickets: 4150, totalRevenue: 622500000, totalShowtimes: 100 },
      { cinemaName: 'BHD Star Vincom Center', totalTickets: 3900, totalRevenue: 585000000, totalShowtimes: 90 },
      { cinemaName: 'BHD Star The Garden', totalTickets: 3500, totalRevenue: 525000000, totalShowtimes: 85 },
      { cinemaName: 'Galaxy Hà Nội', totalTickets: 3200, totalRevenue: 480000000, totalShowtimes: 80 },
      { cinemaName: 'Lotte Cinema Keangnam', totalTickets: 2900, totalRevenue: 435000000, totalShowtimes: 75 },
      { cinemaName: 'Platinum Royal City', totalTickets: 2500, totalRevenue: 375000000, totalShowtimes: 65 },
      { cinemaName: 'Lotte Cinema Landmark 72', totalTickets: 2200, totalRevenue: 330000000, totalShowtimes: 60 }
    ];
    
    console.log('Mock data generated:', this.cinemaData);
    this.calculateMetrics();
    this.updateCharts();
  }

  calculateMetrics(): void {
    // Tính tổng số lượng vé
    this.totalTickets = this.cinemaData.reduce((sum, item) => sum + item.totalTickets, 0);
    
    // Tính tổng doanh thu
    this.totalRevenue = this.cinemaData.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    // Tìm rạp có doanh thu cao nhất
    if (this.cinemaData.length > 0) {
      const topCinemaItem = this.cinemaData.reduce((prev, current) => 
        (prev.totalRevenue > current.totalRevenue) ? prev : current, 
        this.cinemaData[0]
      );
      
      this.topCinema = topCinemaItem.cinemaName;
    } else {
      this.topCinema = 'N/A';
    }
    
    console.log('Metrics calculated:', {
      totalTickets: this.totalTickets,
      totalRevenue: this.totalRevenue,
      topCinema: this.topCinema
    });
  }

  updateCharts(): void {
    console.log('Updating charts with data');
    this.updatePieChart();
    this.updateBarChart();
  }

  updatePieChart(): void {
    // Sắp xếp dữ liệu theo số lượng vé (giảm dần)
    const sortedData = [...this.cinemaData].sort((a, b) => b.totalTickets - a.totalTickets);
    
    // Lấy top 5 rạp, gộp các rạp còn lại vào "Khác"
    let chartData: StatisticRevenueByCinemaRes[] = [...sortedData];
    if (chartData.length > 5) {
      const top5 = chartData.slice(0, 5);
      const others = chartData.slice(5);
      const otherSum = others.reduce(
        (sum, item) => ({ 
          cinemaName: 'Khác', 
          totalTickets: sum.totalTickets + item.totalTickets, 
          totalRevenue: sum.totalRevenue + item.totalRevenue,
          totalShowtimes: sum.totalShowtimes + item.totalShowtimes
        }), 
        { cinemaName: 'Khác', totalTickets: 0, totalRevenue: 0, totalShowtimes: 0 }
      );
      chartData = [...top5, otherSum];
    }

    this.pieChartOptions = {
      series: chartData.map(item => item.totalTickets),
      labels: chartData.map(item => this.shortenCinemaName(item.cinemaName)),
      chart: {
        type: 'pie',
        height: 350,
        fontFamily: 'inherit'
      },
      colors: chartData.map((_, i) => this.getCinemaColor(i)),
      dataLabels: {
        enabled: true,
        formatter: function(val: number, opts: any) {
          return opts.w.globals.labels[opts.seriesIndex];
        }
      },
      legend: {
        position: 'bottom',
        formatter: function(val: string, opts: any) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex] + ' vé';
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            return val + ' vé';
          }
        }
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: false
            }
          },
          expandOnClick: true
        }
      },
      states: {
        hover: {
          filter: {
            type: 'darken',
            value: 0.9
          }
        }
      },
      fill: {
        type: 'gradient',
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  updateBarChart(): void {
    // Sắp xếp dữ liệu theo doanh thu (giảm dần)
    const sortedData = [...this.cinemaData].sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Lấy top 10 rạp
    const topData = sortedData.slice(0, 10);
    
    // Tạo mảng categories (tên rạp) và data (doanh thu)
    const categories = topData.map(item => this.shortenCinemaName(item.cinemaName));
    const data = topData.map(item => item.totalRevenue / 1000000); // Đổi ra đơn vị triệu đồng
    
    // Tạo mảng màu sắc theo rạp
    const colors = topData.map((_, i) => this.getCinemaColor(i));

    // Định dạng tiền tệ trong tooltip
    const formatRevenue = this.formatCurrency.bind(this);
    
    this.barChartOptions = {
      series: [{
        name: 'Doanh thu',
        data: data
      }],
      chart: {
        type: 'bar',
        height: 350,
        fontFamily: 'inherit',
        toolbar: {
          show: false
        },
        animations: {
          enabled: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          distributed: true
        }
      },
      colors: colors,
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val.toFixed(1) + ' tr';
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
        }
      },
      xaxis: {
        categories: categories,
        position: 'bottom',
        labels: {
          style: {
            fontSize: '11px'
          },
          formatter: function(val: string) {
            // Rút gọn tên quá dài
            return val.length > 15 ? val.substring(0, 12) + '...' : val;
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: 'Triệu đồng',
          style: {
            fontSize: '12px'
          }
        },
        labels: {
          formatter: function(val: number) {
            return val.toFixed(0);
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return formatRevenue(val * 1000000);
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1'
      },
      fill: {
        opacity: 1
      }
    };
  }

  // Rút gọn tên rạp
  shortenCinemaName(name: string): string {
    // Ví dụ: "CGV Aeon Mall Hà Đông" -> "CGV Hà Đông"
    if (name.includes('CGV')) {
      const parts = name.split(' ');
      return `CGV ${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
    }
    if (name.includes('BHD Star')) {
      const parts = name.split(' ');
      return `BHD ${parts[parts.length - 1]}`;
    }
    if (name.includes('Lotte Cinema')) {
      const parts = name.split(' ');
      return `Lotte ${parts[parts.length - 1]}`;
    }
    // Nếu tên quá dài, rút gọn
    if (name.length > 15) {
      return name.substring(0, 15) + '...';
    }
    return name;
  }

  // Format tiền tệ
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND', 
      maximumFractionDigits: 0
    }).format(value);
  }

  // Lấy màu sắc cho rạp theo index
  getCinemaColor(index: number): string {
    return this.cinemaColors[index % this.cinemaColors.length];
  }

  // Tính phần trăm
  calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  // Xuất dữ liệu ra Excel
  exportToExcel(type: string): void {
    if (!this.cinemaData || this.cinemaData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const currentDate = new Date();
    const dateStr = currentDate.toISOString().split('T')[0];
    const fileName = `Thong_ke_doanh_thu_theo_rap_${dateStr}.xlsx`;
    
    // Sắp xếp dữ liệu theo doanh thu cao nhất
    const sortedData = [...this.cinemaData].sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Tạo dữ liệu cho Excel
    const data = sortedData.map((item, index) => ({
      'STT': index + 1,
      'Tên rạp': item.cinemaName,
      'Số suất chiếu': item.totalShowtimes,
      'Số vé bán': item.totalTickets,
      'Tỷ lệ vé (%)': parseFloat(((item.totalTickets / this.totalTickets) * 100).toFixed(1)),
      'Doanh thu': item.totalRevenue,
      'Tỷ lệ doanh thu (%)': parseFloat(((item.totalRevenue / this.totalRevenue) * 100).toFixed(1))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doanh thu theo rạp');

    // Thiết lập tiêu đề
    const titleRow = { 
      'STT': 'BÁO CÁO THỐNG KÊ DOANH THU THEO RẠP',
      'Tên rạp': '',
      'Số suất chiếu': '',
      'Số vé bán': '',
      'Tỷ lệ vé (%)': '',
      'Doanh thu': '',
      'Tỷ lệ doanh thu (%)': ''
    };
    const filterRow = {
      'STT': `Khoảng thời gian: ${this.getTimeRangeText()}`,
      'Tên rạp': '',
      'Số suất chiếu': '',
      'Số vé bán': '',
      'Tỷ lệ vé (%)': '',
      'Doanh thu': '',
      'Tỷ lệ doanh thu (%)': ''
    };
    const summaryRow = {
      'STT': `Rạp có doanh thu cao nhất: ${this.topCinema}`,
      'Tên rạp': '',
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

  getTimeRangeText(): string {
    const today = new Date();
    let fromDate: Date;
    let toDate = new Date();

    switch(this.timeRangeFilter) {
      case 'today':
        return `Hôm nay (${today.toLocaleDateString('vi-VN')})`;
      case 'thisWeek':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - today.getDay());
        return `Tuần này (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        return `Tháng này (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
      case 'thisYear':
        fromDate = new Date(today.getFullYear(), 0, 1);
        return `Năm nay (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`;
      default:
        return 'Tất cả thời gian';
    }
  }
}
