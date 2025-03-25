import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatisticService, StatisticSeatOccupancyRes } from '../../../services/statistic.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Interface cho ApexCharts
interface ChartOptions {
  series?: any[];
  chart?: any;
  xaxis?: any;
  yaxis?: any;
  title?: any;
  labels?: string[];
  theme?: any;
  plotOptions?: any;
  dataLabels?: any;
  grid?: any;
  stroke?: any;
  tooltip?: any;
  colors?: string[];
  fill?: any;
}

@Component({
  selector: 'app-seat-occupancy',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './seat-occupancy.component.html',
  styleUrls: ['./seat-occupancy.component.css']
})
export class SeatOccupancyComponent implements OnInit {
  // Loading và error states
  isLoading: boolean = true;
  apiError: boolean = false;

  // Filter
  timeRangeFilter: string = 'thisMonth';
  cinemaFilter: string = 'all';
  movieFilter: string = 'all';

  // Data
  occupancyData: StatisticSeatOccupancyRes[] = [];
  totalOccupancyRate: number = 0;
  averageOccupancyRate: number = 0;
  peakOccupancyRate: number = 0;
  peakDate: string = '';

  // Chart options
  lineChartOptions: ChartOptions = {};
  barChartOptions: ChartOptions = {};

  constructor(private statisticService: StatisticService) {}

  ngOnInit(): void {
    this.initChartOptions();
    this.loadOccupancyData();
  }

  initChartOptions(): void {
    // Line chart options
    this.lineChartOptions = {
      series: [{
        name: 'Tỷ lệ lấp đầy',
        data: []
      }],
      chart: {
        type: 'line',
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        }
      },
      colors: ['#4e73df'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Ngày'
        }
      },
      yaxis: {
        title: {
          text: 'Tỷ lệ lấp đầy (%)'
        },
        min: 0,
        max: 100
      },
      title: {
        text: 'Tỷ lệ lấp đầy ghế theo thời gian',
        align: 'left'
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          }
        }
      },
      grid: {
        padding: {
          left: 20,
          right: 20
        }
      }
    };

    // Bar chart options
    this.barChartOptions = {
      series: [{
        name: 'Tỷ lệ lấp đầy',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        }
      },
      colors: ['#1cc88a'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '55%',
          distributed: false,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Rạp'
        }
      },
      yaxis: {
        title: {
          text: 'Tỷ lệ lấp đầy (%)'
        },
        min: 0,
        max: 100
      },
      title: {
        text: 'Tỷ lệ lấp đầy ghế theo rạp',
        align: 'left'
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          }
        }
      },
      grid: {
        padding: {
          left: 20,
          right: 20
        }
      }
    };
  }

  loadOccupancyData(): void {
    this.isLoading = true;
    this.apiError = false;

    // Tính toán ngày bắt đầu và kết thúc dựa trên timeRangeFilter
    const today = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (this.timeRangeFilter) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'thisWeek':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = new Date(today.setDate(today.getDate() + 6));
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
    }

    // Gọi API với các tham số phù hợp
    this.statisticService.getSeatOccupancy(
      startDate,
      endDate,
      this.cinemaFilter !== 'all' ? this.cinemaFilter : undefined
    ).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.occupancyData = response.data;
          this.calculateMetrics();
          this.updateCharts();
        } else {
          this.apiError = true;
          this.generateMockData();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching occupancy data:', error);
        this.isLoading = false;
        this.apiError = true;
        this.generateMockData();
      }
    });
  }

  generateMockData(): void {
    const movies = ['The Godfather', 'The Departed', 'Memento', 'Inception', 'Interstellar'];
    const days = 30; // Số ngày trong tháng
    this.occupancyData = [];

    // Tạo dữ liệu mẫu cho mỗi phim và mỗi ngày
    movies.forEach(movie => {
      for (let i = 1; i <= days; i++) {
        const date = new Date(2024, 2, i); // Tháng 3/2024
        const totalSeats = Math.floor(Math.random() * 20) + 40; // 40-60 ghế
        const bookedSeats = Math.floor(Math.random() * totalSeats); // Số ghế đã đặt
        const occupancyRate = (bookedSeats / totalSeats) * 100;

        this.occupancyData.push({
          startTime: date.toISOString(),
          movieName: movie,
          totalSeats,
          bookedSeats,
          occupancyRate
        });
      }
    });

    // Tính các chỉ số thống kê
    this.calculateMetrics();
    
    // Cập nhật biểu đồ
    this.updateCharts();
  }

  calculateMetrics(): void {
    if (this.occupancyData.length === 0) return;

    // Tính tổng tỷ lệ lấp đầy
    const totalOccupancy = this.occupancyData.reduce((sum, data) => sum + data.occupancyRate, 0);
    this.totalOccupancyRate = totalOccupancy;

    // Tính tỷ lệ lấp đầy trung bình
    this.averageOccupancyRate = totalOccupancy / this.occupancyData.length;

    // Tìm suất chiếu có tỷ lệ lấp đầy cao nhất
    const peakData = this.occupancyData.reduce((max, current) => 
      current.occupancyRate > max.occupancyRate ? current : max
    );
    this.peakOccupancyRate = peakData.occupancyRate;
    this.peakDate = new Date(peakData.startTime).toLocaleDateString('vi-VN');
  }

  updateCharts(): void {
    // Cập nhật biểu đồ đường
    const dates = [...new Set(this.occupancyData.map(data => 
      data.startTime.split('T')[0]
    ))].sort();
    
    const dailyOccupancy = dates.map(date => {
      const dayData = this.occupancyData.filter(data => 
        data.startTime.split('T')[0] === date
      );
      return dayData.reduce((sum, data) => sum + data.occupancyRate, 0) / dayData.length;
    });

    this.lineChartOptions.series = [{
      name: 'Tỷ lệ lấp đầy',
      data: dailyOccupancy
    }];
    this.lineChartOptions.xaxis = {
      ...this.lineChartOptions.xaxis,
      categories: dates.map(date => new Date(date).toLocaleDateString('vi-VN'))
    };

    // Cập nhật biểu đồ cột theo phim
    const movies = [...new Set(this.occupancyData.map(data => data.movieName))].sort();
    const movieOccupancy = movies.map(movie => {
      const movieData = this.occupancyData.filter(data => data.movieName === movie);
      return movieData.reduce((sum, data) => sum + data.occupancyRate, 0) / movieData.length;
    });

    this.barChartOptions.series = [{
      name: 'Tỷ lệ lấp đầy',
      data: movieOccupancy
    }];
    this.barChartOptions.xaxis = {
      ...this.barChartOptions.xaxis,
      categories: movies
    };
  }

  applyTimeRange(timeRange: string): void {
    if (this.timeRangeFilter !== timeRange) {
      this.timeRangeFilter = timeRange;
      this.loadOccupancyData();
    }
  }

  applyCinemaFilter(cinema: string): void {
    if (this.cinemaFilter !== cinema) {
      this.cinemaFilter = cinema;
      this.loadOccupancyData();
    }
  }

  applyMovieFilter(movie: string): void {
    if (this.movieFilter !== movie) {
      this.movieFilter = movie;
      this.loadOccupancyData();
    }
  }

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  exportToExcel(): void {
    // Tạo mảng dữ liệu cho file Excel
    const data = [
      ['Báo cáo Thống kê tỷ lệ lấp đầy ghế'], // Tiêu đề
      ['Thời gian', this.getTimeRangeText()], // Thông tin thời gian
      ['Tổng tỷ lệ lấp đầy', this.formatPercentage(this.totalOccupancyRate)], // Tổng tỷ lệ
      ['Tỷ lệ lấp đầy trung bình', this.formatPercentage(this.averageOccupancyRate)], // Tỷ lệ trung bình
      ['Tỷ lệ lấp đầy cao nhất', this.formatPercentage(this.peakOccupancyRate)], // Tỷ lệ cao nhất
      ['Ngày có tỷ lệ cao nhất', this.peakDate], // Ngày cao nhất
      [], // Dòng trống
      ['STT', 'Phim', 'Thời gian chiếu', 'Tổng số ghế', 'Số ghế đã đặt', 'Tỷ lệ lấp đầy'] // Header
    ];

    // Thêm dữ liệu
    this.occupancyData.forEach((item, index) => {
      data.push([
        String(index + 1),
        item.movieName,
        new Date(item.startTime).toLocaleString('vi-VN'),
        String(item.totalSeats),
        String(item.bookedSeats),
        this.formatPercentage(item.occupancyRate)
      ]);
    });

    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Thiết lập độ rộng cột
    const wscols = [
      { wch: 5 },  // STT
      { wch: 30 }, // Phim
      { wch: 20 }, // Thời gian chiếu
      { wch: 12 }, // Tổng số ghế
      { wch: 15 }, // Số ghế đã đặt
      { wch: 15 }  // Tỷ lệ lấp đầy
    ];
    ws['!cols'] = wscols;

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Thống kê tỷ lệ lấp đầy ghế');

    // Chuyển đổi workbook thành mảng nhị phân Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Tạo Blob và tải xuống
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Thong_ke_ty_le_lap_day_ghe_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  }

  getTimeRangeText(): string {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    
    switch (this.timeRangeFilter) {
      case 'today':
        return `Ngày ${day}/${month}/${year}`;
      case 'thisWeek':
        return `Tuần này (${month}/${year})`;
      case 'thisMonth':
        return `Tháng ${month}/${year}`;
      case 'thisYear':
        return `Năm ${year}`;
      default:
        return '';
    }
  }
}
