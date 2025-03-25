import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticService, StatisticPeakHoursRes } from '../../../services/statistic.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  title?: any;
  subtitle?: any;
  theme?: any;
  grid?: any;
  annotations?: any;
}

interface LineChartOptions {
  series?: any[];
  chart?: any;
  xaxis?: any;
  yaxis?: any;
  dataLabels?: any;
  colors?: string[];
  tooltip?: any;
  stroke?: any;
  markers?: any;
  fill?: any;
  grid?: any;
}

interface HeatMapOptions {
  series?: any[];
  chart?: any;
  xaxis?: any;
  yaxis?: any;
  dataLabels?: any;
  colors?: string[];
  tooltip?: any;
  plotOptions?: any;
  title?: any;
}

@Component({
  selector: 'app-peak-hours',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './peak-hours.component.html',
  styleUrl: './peak-hours.component.css'
})
export class PeakHoursComponent implements OnInit {
  // Khai báo các biến
  isLoading: boolean = true;
  apiError: boolean = false;
  timeRangeFilter: string = 'thisMonth';
  peakHoursData: StatisticPeakHoursRes[] = [];
  totalTickets: number = 0;
  maxTickets: number = 0;
  peakHour: number = 0;

  // Chart Options
  barChartOptions: BarChartOptions = {};
  lineChartOptions: LineChartOptions = {};
  heatMapOptions: HeatMapOptions = {};

  // Các màu mặc định
  colors: string[] = [
    '#43e97b', '#4facfe', '#fa709a', '#f7b733', '#667eea', '#764ba2', '#26c6da'
  ];

  // Các ngày trong tuần
  daysOfWeek: string[] = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  constructor(private statisticService: StatisticService) {}

  ngOnInit(): void {
    // Luôn khởi tạo các chart options trước khi load dữ liệu
    this.initializeChartOptions();
    this.loadPeakHoursData();
  }

  initializeChartOptions(): void {
    // Khởi tạo các mặc định cho bar chart
    this.barChartOptions = {
      series: [{
        name: 'Số vé bán ra',
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
        enabled: true
      },
      colors: ['#4facfe'],
      xaxis: {
        categories: []
      }
    };

    // Khởi tạo các mặc định cho line chart
    this.lineChartOptions = {
      series: [{
        name: 'Số vé bán ra',
        data: []
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#4facfe'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: []
      }
    };

    // Khởi tạo các mặc định cho heatmap
    this.heatMapOptions = {
      series: [],
      chart: {
        type: 'heatmap',
        height: 350,
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ["#fa709a"],
      xaxis: {
        categories: []
      }
    };
  }

  applyTimeRange(range: string): void {
    this.timeRangeFilter = range;
    this.loadPeakHoursData();
  }

  loadPeakHoursData(): void {
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
      this.statisticService.getPeakHours(startDate, endDate).subscribe({
        next: (response) => {
          if (response && response.data && response.data.length > 0) {
            console.log('API Data:', response.data);
            this.peakHoursData = response.data;
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
          console.error('Error loading peak hours data:', err);
          this.apiError = true;
          this.loadMockData(); // Tải dữ liệu mẫu nếu API lỗi
          this.isLoading = false;
        }
      });
    }, 500);
  }

  loadMockData(): void {
    console.log('Loading mock data');
    // Tạo dữ liệu mẫu cho 24 giờ trong ngày
    this.peakHoursData = Array.from({ length: 24 }, (_, i) => {
      // Tạo một phân phối với đỉnh điểm từ 17h đến 21h (giờ phim tối)
      let ticketCount = 0;
      
      if (i >= 9 && i <= 22) {
        // Buổi sáng: 9-12
        if (i >= 9 && i <= 11) {
          ticketCount = 30 + Math.floor(Math.random() * 50);
        }
        // Buổi trưa: 12-16
        else if (i >= 12 && i <= 16) {
          ticketCount = 50 + Math.floor(Math.random() * 80);
        }
        // Buổi tối: 17-22 (cao điểm)
        else if (i >= 17 && i <= 21) {
          ticketCount = 150 + Math.floor(Math.random() * 200);
        }
        else {
          ticketCount = 70 + Math.floor(Math.random() * 50);
        }
      } else {
        // Ngoài giờ chiếu phim
        ticketCount = Math.floor(Math.random() * 10);
      }
      
      return {
        hourOfDay: i,
        totalTicketsSold: ticketCount
      };
    });
    
    console.log('Mock data generated:', this.peakHoursData);
    this.calculateMetrics();
    this.updateCharts();
  }

  calculateMetrics(): void {
    // Tính tổng số vé bán được
    this.totalTickets = this.peakHoursData.reduce((sum, item) => sum + item.totalTicketsSold, 0);
    
    // Tìm giờ cao điểm (giờ có số vé bán nhiều nhất)
    if (this.peakHoursData.length > 0) {
      const maxTicketsItem = this.peakHoursData.reduce((prev, current) => 
        (prev.totalTicketsSold > current.totalTicketsSold) ? prev : current, 
        this.peakHoursData[0]
      );
      
      this.maxTickets = maxTicketsItem.totalTicketsSold;
      this.peakHour = maxTicketsItem.hourOfDay;
    } else {
      this.maxTickets = 0;
      this.peakHour = 0;
    }
    
    console.log('Metrics calculated:', {
      totalTickets: this.totalTickets,
      maxTickets: this.maxTickets,
      peakHour: this.peakHour
    });
  }

  updateCharts(): void {
    console.log('Updating charts with data');
    this.updateBarChart();
    this.updateLineChart();
    this.updateHeatMapChart();
  }

  updateBarChart(): void {
    // Sắp xếp dữ liệu theo giờ trong ngày
    const sortedData = [...this.peakHoursData].sort((a, b) => a.hourOfDay - b.hourOfDay);
    
    // Tạo mảng categories (giờ) và data (số vé bán)
    const categories = sortedData.map(item => this.formatHour(item.hourOfDay));
    const data = sortedData.map(item => item.totalTicketsSold);
    
    // Tính phân vùng màu dựa trên số lượng vé
    const colors = sortedData.map(item => {
      // Phân loại thành 3 mức: thấp (< 20% max), trung bình (20-70% max), cao (>70% max)
      const percent = item.totalTicketsSold / this.maxTickets;
      if (percent < 0.2) return '#4facfe'; // Xanh dương
      if (percent < 0.7) return '#f7b733'; // Vàng cam
      return '#fa709a'; // Hồng đỏ (cao điểm)
    });

    const formatTicketsTooltip = this.formatTicketsTooltip.bind(this);
    
    this.barChartOptions = {
      series: [{
        name: 'Số vé bán ra',
        data: data
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5,
          distributed: true,
          dataLabels: {
            position: 'top',
            maxItems: 10
          }
        }
      },
      colors: colors,
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val > 0 ? val.toString() : '';
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
        }
      },
      title: {
        text: 'Phân bố lượng vé theo giờ',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 500
        }
      },
      subtitle: {
        text: `Cao điểm: ${this.formatHour(this.peakHour)} (${this.maxTickets} vé)`,
        align: 'center'
      },
      xaxis: {
        categories: categories,
        position: 'bottom',
        labels: {
          style: {
            fontSize: '12px'
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
          text: 'Số vé',
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
            return formatTicketsTooltip(val);
          }
        }
      },
      fill: {
        opacity: 1
      }
    };
  }

  updateLineChart(): void {
    // Sắp xếp dữ liệu theo giờ trong ngày
    const sortedData = [...this.peakHoursData].sort((a, b) => a.hourOfDay - b.hourOfDay);
    
    // Tạo mảng categories (giờ) và data (số vé bán)
    const categories = sortedData.map(item => this.formatHour(item.hourOfDay));
    const data = sortedData.map(item => item.totalTicketsSold);

    const formatTicketsTooltip = this.formatTicketsTooltip.bind(this);
    
    this.lineChartOptions = {
      series: [{
        name: 'Số vé bán ra',
        data: data
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#4facfe'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: '#4facfe',
              opacity: 0.8
            },
            {
              offset: 100,
              color: '#00f2fe',
              opacity: 0.2
            }
          ]
        }
      },
      markers: {
        size: 4,
        colors: ['#4facfe'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 7
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Số vé',
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
            return formatTicketsTooltip(val);
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1'
      }
    };
  }

  updateHeatMapChart(): void {
    // Tạo dữ liệu mẫu cho heatmap: ngày trong tuần x giờ trong ngày
    // Thực tế dữ liệu này cần được gọi từ API nếu có hỗ trợ
    const heatmapData: any[] = this.generateHeatMapData();

    const formatTicketsTooltip = this.formatTicketsTooltip.bind(this);
    
    this.heatMapOptions = {
      series: heatmapData,
      chart: {
        height: 350,
        type: 'heatmap',
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ["#fa709a"],
      title: {
        text: 'Biểu đồ nhiệt theo ngày và giờ',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 500
        }
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 20,
                name: 'Thấp',
                color: '#4facfe'
              },
              {
                from: 21,
                to: 50,
                name: 'Trung bình',
                color: '#f7b733'
              },
              {
                from: 51,
                to: 100,
                name: 'Cao',
                color: '#fa709a'
              },
              {
                from: 101,
                to: 1000,
                name: 'Rất cao',
                color: '#E31A1C'
              }
            ]
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return formatTicketsTooltip(val);
          }
        }
      },
      xaxis: {
        categories: Array.from({ length: 24 }, (_, i) => this.formatHour(i)),
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        categories: this.daysOfWeek,
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      }
    };
  }

  // Tạo dữ liệu giả cho biểu đồ nhiệt
  generateHeatMapData(): any[] {
    return this.daysOfWeek.map((day, dayIndex) => {
      // Các giờ chiếu cao điểm sẽ khác nhau giữa các ngày trong tuần
      // Cuối tuần (T6, T7, CN) sẽ cao hơn
      const isWeekend = dayIndex === 0 || dayIndex === 5 || dayIndex === 6;
      const peakMultiplier = isWeekend ? 1.5 : 1.0;
      
      const data = Array.from({ length: 24 }, (_, hourIndex) => {
        // Phân bố cơ bản lấy từ dữ liệu thời gian thực
        const baseValue = this.peakHoursData.find(item => item.hourOfDay === hourIndex)?.totalTicketsSold || 0;
        
        // Thêm một chút biến động
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        let value = Math.round(baseValue * peakMultiplier * randomFactor);
        
        // Giảm số lượng về 0 cho các giờ sớm sáng (1-7 giờ)
        if (hourIndex >= 1 && hourIndex <= 7) {
          value = Math.min(value, 5);
        }
        
        return {
          x: this.formatHour(hourIndex),
          y: value
        };
      });
      
      return {
        name: day,
        data: data
      };
    });
  }

  // Format giờ sang dạng "HH:00"
  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  // Format số vé cho tooltip
  formatTicketsTooltip(value: number): string {
    if (value === 0) return 'Không có vé bán ra';
    return `${value} vé`;
  }

  // Tính phần trăm
  calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  // Xuất dữ liệu ra Excel
  exportToExcel(type: string): void {
    if (!this.peakHoursData || this.peakHoursData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const currentDate = new Date();
    const dateStr = currentDate.toISOString().split('T')[0];
    const fileName = `Thong_ke_gio_cao_diem_${dateStr}.xlsx`;
    
    // Sắp xếp dữ liệu theo giờ
    const sortedData = [...this.peakHoursData].sort((a, b) => a.hourOfDay - b.hourOfDay);
    
    // Tạo dữ liệu cho Excel
    const data = sortedData.map((item, index) => ({
      'STT': index + 1,
      'Giờ': this.formatHour(item.hourOfDay),
      'Số vé bán ra': item.totalTicketsSold,
      'Tỷ lệ (%)': parseFloat(((item.totalTicketsSold / this.totalTickets) * 100).toFixed(1)),
      'Phân loại': this.getPeakCategory(item.totalTicketsSold, this.maxTickets)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Giờ cao điểm');

    // Thiết lập tiêu đề
    const titleRow = { 
      'STT': 'BÁO CÁO THỐNG KÊ GIỜ CAO ĐIỂM',
      'Giờ': '',
      'Số vé bán ra': '',
      'Tỷ lệ (%)': '',
      'Phân loại': ''
    };
    const filterRow = {
      'STT': `Khoảng thời gian: ${this.getTimeRangeText()}`,
      'Giờ': '',
      'Số vé bán ra': '',
      'Tỷ lệ (%)': '',
      'Phân loại': ''
    };
    const summaryRow = {
      'STT': `Giờ cao điểm: ${this.formatHour(this.peakHour)} (${this.maxTickets} vé)`,
      'Giờ': '',
      'Số vé bán ra': this.totalTickets,
      'Tỷ lệ (%)': 100,
      'Phân loại': ''
    };

    XLSX.utils.sheet_add_json(worksheet, [titleRow, filterRow, summaryRow], { origin: 'A1', skipHeader: true });

    // Xuất file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  // Phân loại giờ cao điểm
  getPeakCategory(ticketCount: number, maxTickets: number): string {
    const percent = ticketCount / maxTickets;
    if (percent < 0.2) return 'Thấp';
    if (percent < 0.5) return 'Trung bình';
    if (percent < 0.8) return 'Cao';
    return 'Cao điểm';
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
