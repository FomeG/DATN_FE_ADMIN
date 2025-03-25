import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticService, StatisticPopularGenresRes } from '../../../services/statistic.service';
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
  selector: 'app-popular-genres',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './popular-genres.component.html',
  styleUrl: './popular-genres.component.css'
})
export class PopularGenresComponent implements OnInit {
  // Khai báo các biến
  isLoading: boolean = true;
  apiError: boolean = false;
  timeRangeFilter: string = 'thisMonth';
  genresData: StatisticPopularGenresRes[] = [];
  totalRevenue: number = 0;
  totalShowtimes: number = 0;
  topGenre: string = '';

  // Chart Options
  pieChartOptions: PieChartOptions = {};
  barChartOptions: BarChartOptions = {};

  // Các màu mặc định
  genreColors: string[] = [
    '#4facfe', '#43e97b', '#fa709a', '#f7b733', '#667eea', 
    '#764ba2', '#26c6da', '#ec407a', '#66bb6a', '#5c6bc0'
  ];

  constructor(private statisticService: StatisticService) {}

  ngOnInit(): void {
    // Khởi tạo chart options
    this.initializeChartOptions();
    // Tải dữ liệu
    this.loadGenresData();
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
      colors: ['#fa709a'],
      xaxis: {
        categories: []
      }
    };
  }

  applyTimeRange(range: string): void {
    this.timeRangeFilter = range;
    this.loadGenresData();
  }

  loadGenresData(): void {
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
      this.statisticService.getPopularGenres(startDate, endDate).subscribe({
        next: (response) => {
          if (response && response.data && response.data.length > 0) {
            console.log('API Data:', response.data);
            this.genresData = response.data;
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
          console.error('Error loading genres data:', err);
          this.apiError = true;
          this.loadMockData(); // Tải dữ liệu mẫu nếu API lỗi
          this.isLoading = false;
        }
      });
    }, 500);
  }

  loadMockData(): void {
    console.log('Loading mock data for genres');
    
    // Tạo dữ liệu mẫu cho thể loại phim
    this.genresData = [
      { genreName: 'Hành động', totalShowtimes: 85, totalRevenue: 380000000 },
      { genreName: 'Tình cảm', totalShowtimes: 72, totalRevenue: 290000000 },
      { genreName: 'Kinh dị', totalShowtimes: 64, totalRevenue: 320000000 },
      { genreName: 'Hoạt hình', totalShowtimes: 58, totalRevenue: 270000000 },
      { genreName: 'Khoa học viễn tưởng', totalShowtimes: 54, totalRevenue: 310000000 },
      { genreName: 'Hài', totalShowtimes: 45, totalRevenue: 230000000 },
      { genreName: 'Phiêu lưu', totalShowtimes: 42, totalRevenue: 210000000 },
      { genreName: 'Tâm lý', totalShowtimes: 38, totalRevenue: 180000000 },
      { genreName: 'Tài liệu', totalShowtimes: 18, totalRevenue: 85000000 },
      { genreName: 'Khác', totalShowtimes: 15, totalRevenue: 70000000 }
    ];
    
    console.log('Mock data generated:', this.genresData);
    this.calculateMetrics();
    this.updateCharts();
  }

  calculateMetrics(): void {
    // Tính tổng số lượt chiếu
    this.totalShowtimes = this.genresData.reduce((sum, item) => sum + item.totalShowtimes, 0);
    
    // Tính tổng doanh thu
    this.totalRevenue = this.genresData.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    // Tìm thể loại phổ biến nhất
    if (this.genresData.length > 0) {
      const topGenreItem = this.genresData.reduce((prev, current) => 
        (prev.totalShowtimes > current.totalShowtimes) ? prev : current, 
        this.genresData[0]
      );
      
      this.topGenre = topGenreItem.genreName;
    } else {
      this.topGenre = 'N/A';
    }
    
    console.log('Metrics calculated:', {
      totalShowtimes: this.totalShowtimes,
      totalRevenue: this.totalRevenue,
      topGenre: this.topGenre
    });
  }

  updateCharts(): void {
    console.log('Updating charts with data');
    this.updatePieChart();
    this.updateBarChart();
  }

  updatePieChart(): void {
    // Sắp xếp dữ liệu theo số lượt chiếu (giảm dần)
    const sortedData = [...this.genresData].sort((a, b) => b.totalShowtimes - a.totalShowtimes);
    
    // Lấy top 5 thể loại, gộp các thể loại còn lại vào "Khác"
    let chartData: StatisticPopularGenresRes[] = [...sortedData];
    if (chartData.length > 5) {
      const top5 = chartData.slice(0, 5);
      const others = chartData.slice(5);
      const otherSum = others.reduce(
        (sum, item) => ({ 
          genreName: 'Khác', 
          totalShowtimes: sum.totalShowtimes + item.totalShowtimes, 
          totalRevenue: sum.totalRevenue + item.totalRevenue
        }), 
        { genreName: 'Khác', totalShowtimes: 0, totalRevenue: 0 }
      );
      chartData = [...top5, otherSum];
    }

    this.pieChartOptions = {
      series: chartData.map(item => item.totalShowtimes),
      labels: chartData.map(item => item.genreName),
      chart: {
        type: 'pie',
        height: 350,
        fontFamily: 'inherit'
      },
      colors: chartData.map((_, i) => this.getGenreColor(i)),
      dataLabels: {
        enabled: true,
        formatter: function(val: number, opts: any) {
          return opts.w.globals.labels[opts.seriesIndex];
        }
      },
      legend: {
        position: 'bottom',
        formatter: function(val: string, opts: any) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex] + ' lượt';
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            return val + ' lượt chiếu';
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
    const sortedData = [...this.genresData].sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Lấy top 10 thể loại
    const topData = sortedData.slice(0, 10);
    
    // Tạo mảng categories (tên thể loại) và data (doanh thu)
    const categories = topData.map(item => item.genreName);
    const data = topData.map(item => item.totalRevenue / 1000000); // Đổi ra đơn vị triệu đồng
    
    // Tạo mảng màu sắc theo thể loại
    const colors = topData.map((_, i) => this.getGenreColor(i));

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

  // Format tiền tệ
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND', 
      maximumFractionDigits: 0
    }).format(value);
  }

  // Lấy màu sắc cho thể loại theo index
  getGenreColor(index: number): string {
    return this.genreColors[index % this.genreColors.length];
  }

  // Tính phần trăm
  calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  // Xuất dữ liệu ra Excel
  exportToExcel(type: string): void {
    if (!this.genresData || this.genresData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const currentDate = new Date();
    const dateStr = currentDate.toISOString().split('T')[0];
    const fileName = `Thong_ke_the_loai_phim_${dateStr}.xlsx`;
    
    // Sắp xếp dữ liệu theo thể loại phổ biến nhất
    const sortedData = [...this.genresData].sort((a, b) => b.totalShowtimes - a.totalShowtimes);
    
    // Tạo dữ liệu cho Excel
    const data = sortedData.map((item, index) => ({
      'STT': index + 1,
      'Thể loại': item.genreName,
      'Số lượt chiếu': item.totalShowtimes,
      'Tỷ lệ chiếu (%)': parseFloat(((item.totalShowtimes / this.totalShowtimes) * 100).toFixed(1)),
      'Doanh thu': item.totalRevenue,
      'Tỷ lệ doanh thu (%)': parseFloat(((item.totalRevenue / this.totalRevenue) * 100).toFixed(1))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thể loại phim');

    // Thiết lập tiêu đề
    const titleRow = { 
      'STT': 'BÁO CÁO THỐNG KÊ THỂ LOẠI PHIM PHỔ BIẾN',
      'Thể loại': '',
      'Số lượt chiếu': '',
      'Tỷ lệ chiếu (%)': '',
      'Doanh thu': '',
      'Tỷ lệ doanh thu (%)': ''
    };
    const filterRow = {
      'STT': `Khoảng thời gian: ${this.getTimeRangeText()}`,
      'Thể loại': '',
      'Số lượt chiếu': '',
      'Tỷ lệ chiếu (%)': '',
      'Doanh thu': '',
      'Tỷ lệ doanh thu (%)': ''
    };
    const summaryRow = {
      'STT': `Thể loại phổ biến nhất: ${this.topGenre}`,
      'Thể loại': '',
      'Số lượt chiếu': this.totalShowtimes,
      'Tỷ lệ chiếu (%)': 100,
      'Doanh thu': this.totalRevenue,
      'Tỷ lệ doanh thu (%)': 100
    };

    XLSX.utils.sheet_add_json(worksheet, [titleRow, filterRow, summaryRow], { origin: 'A1', skipHeader: true });

    // Định dạng cột tiền tệ
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 4; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: 4 }); // Cột Doanh thu
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
