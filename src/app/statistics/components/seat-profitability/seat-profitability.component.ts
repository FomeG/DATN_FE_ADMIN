import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
// import { StatisticService } from '../../../core/services/statistic.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Interface cho dữ liệu lợi nhuận ghế
interface SeatProfitData {
  seatCode: string;
  row: string;
  column: number;
  totalSales: number;
  occupancyRate: number;
  totalRevenue: number;
}

// Interface cho dữ liệu bản đồ nhiệt
interface HeatmapData {
  name: string;
  data: { x: string; y: number }[];
}

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
  selector: 'app-seat-profitability',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './seat-profitability.component.html',
  styleUrls: ['./seat-profitability.component.css']
})
export class SeatProfitabilityComponent implements OnInit {
  // Loading và error states
  isLoading: boolean = true;
  apiError: boolean = false;

  // Filter
  timeRangeFilter: string = 'thisMonth';

  // Data
  seatData: SeatProfitData[] = [];
  totalRevenue: number = 0;
  topSeat: string = '';
  worstSeat: string = '';
  averageOccupancy: number = 0;

  // Chart options
  barChartOptions: ChartOptions = {};
  heatmapOptions: ChartOptions = {};

  constructor(/*private statisticService: StatisticService*/) {}

  ngOnInit(): void {
    this.initChartOptions();
    this.loadSeatData();
  }

  initChartOptions(): void {
    // Bar chart options
    this.barChartOptions = {
      series: [{
        name: 'Doanh thu',
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
      colors: ['#4e73df'],
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
          return val.toLocaleString('vi-VN') + ' ₫';
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
        position: 'bottom',
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        title: {
          text: 'Doanh thu (VNĐ)'
        },
        labels: {
          formatter: function (val: number) {
            return val.toLocaleString('vi-VN');
          }
        }
      },
      title: {
        text: 'Top 10 ghế có doanh thu cao nhất',
        align: 'left'
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toLocaleString('vi-VN') + ' ₫';
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

    // Heatmap options
    this.heatmapOptions = {
      series: [],
      chart: {
        height: 450,
        type: 'heatmap',
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
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val.toLocaleString('vi-VN') + ' ₫';
        },
        style: {
          colors: ['#fff']
        }
      },
      colors: ["#008FFB"],
      title: {
        text: 'Bản đồ nhiệt doanh thu theo vị trí ghế',
        align: 'left'
      },
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 100000,
                color: '#ebf3fb',
                name: 'thấp',
              },
              {
                from: 100001,
                to: 300000,
                color: '#bdd7ee',
                name: 'trung bình thấp',
              },
              {
                from: 300001,
                to: 500000,
                color: '#8ebae5',
                name: 'trung bình',
              },
              {
                from: 500001,
                to: 800000,
                color: '#5a9bd5',
                name: 'trung bình cao',
              },
              {
                from: 800001,
                to: 5000000,
                color: '#3373c4',
                name: 'cao',
              }
            ]
          }
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Cột'
        }
      },
      yaxis: {
        categories: [],
        title: {
          text: 'Hàng'
        },
        reversed: true
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return val.toLocaleString('vi-VN') + ' ₫';
          }
        }
      }
    };
  }

  loadSeatData(): void {
    this.isLoading = true;
    this.apiError = false;

    // Trong môi trường thực tế, bạn sẽ gọi API từ service
    // this.statisticService.getSeatProfitability(this.timeRangeFilter).subscribe({
    //   next: (data) => {
    //     this.seatData = data;
    //     this.isLoading = false;
    //     this.calculateMetrics();
    //     this.updateCharts();
    //   },
    //   error: (error) => {
    //     console.error('Error fetching seat data:', error);
    //     this.isLoading = false;
    //     this.apiError = true;
    //     // Load dữ liệu mẫu khi API bị lỗi
    //     this.generateMockData();
    //   }
    // });

    // Trong môi trường demo, tạo dữ liệu mẫu
    setTimeout(() => {
      this.generateMockData();
      this.isLoading = false;
    }, 1000);
  }

  generateMockData(): void {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.seatData = [];

    // Tạo dữ liệu mẫu với logic thực tế
    // - Hàng đầu (A) và hàng cuối (J) thường có doanh thu thấp hơn
    // - Hàng giữa (D-G) thường có doanh thu cao hơn
    // - Ghế ở giữa (cột 4-7) thường được ưa chuộng hơn
    rows.forEach(row => {
      columns.forEach(column => {
        const seatCode = `${row}${column}`;
        
        // Tính toán hệ số dựa trên vị trí hàng
        let rowFactor = 1.0;
        if (row === 'A' || row === 'J') rowFactor = 0.7; // Hàng đầu và cuối ít được ưa chuộng
        else if (row === 'B' || row === 'I') rowFactor = 0.8;
        else if (row === 'C' || row === 'H') rowFactor = 0.9;
        else if (row === 'D' || row === 'G') rowFactor = 1.1; // Hàng giữa được ưa chuộng hơn
        else if (row === 'E' || row === 'F') rowFactor = 1.2; // Hàng giữa được ưa chuộng nhất
        
        // Tính toán hệ số dựa trên vị trí cột
        let columnFactor = 1.0;
        if (column === 1 || column === 10) columnFactor = 0.75; // Cột ngoài cùng ít được ưa chuộng
        else if (column === 2 || column === 9) columnFactor = 0.85;
        else if (column === 3 || column === 8) columnFactor = 0.95;
        else if (column === 4 || column === 7) columnFactor = 1.1; // Cột giữa được ưa chuộng hơn
        else if (column === 5 || column === 6) columnFactor = 1.2; // Cột giữa được ưa chuộng nhất
        
        // Tính số lần bán và tỷ lệ lấp đầy
        const baseTotalSales = Math.floor(Math.random() * 30) + 50; // 50-80 lần bán
        const totalSales = Math.floor(baseTotalSales * rowFactor * columnFactor);
        const occupancyRate = Math.min(100, Math.floor((totalSales / 100) * 100));
        
        // Tính toán doanh thu, dao động từ 150,000 đến 900,000 VNĐ
        const baseRevenue = 300000; // Doanh thu cơ sở
        const randomFactor = 0.8 + Math.random() * 0.4; // Hệ số ngẫu nhiên từ 0.8 đến 1.2
        const totalRevenue = Math.floor(baseRevenue * rowFactor * columnFactor * randomFactor);
        
        this.seatData.push({
          seatCode,
          row,
          column,
          totalSales,
          occupancyRate,
          totalRevenue
        });
      });
    });
    
    // Sắp xếp dữ liệu theo doanh thu giảm dần
    this.seatData.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Tính các chỉ số thống kê
    this.calculateMetrics();
    
    // Cập nhật biểu đồ
    this.updateCharts();
  }

  calculateMetrics(): void {
    if (this.seatData.length === 0) return;

    // Tính tổng doanh thu
    this.totalRevenue = this.seatData.reduce((sum, seat) => sum + seat.totalRevenue, 0);

    // Xác định ghế có doanh thu cao nhất và thấp nhất
    this.topSeat = this.seatData[0].seatCode;
    this.worstSeat = this.seatData[this.seatData.length - 1].seatCode;

    // Tính tỷ lệ lấp đầy trung bình
    const totalOccupancy = this.seatData.reduce((sum, seat) => sum + seat.occupancyRate, 0);
    this.averageOccupancy = totalOccupancy / this.seatData.length;
  }

  updateCharts(): void {
    // Cập nhật biểu đồ cột
    const top10Seats = this.seatData.slice(0, 10);
    this.barChartOptions.series = [{
      name: 'Doanh thu',
      data: top10Seats.map(seat => seat.totalRevenue)
    }];
    this.barChartOptions.xaxis = {
      ...this.barChartOptions.xaxis,
      categories: top10Seats.map(seat => seat.seatCode)
    };

    // Cập nhật bản đồ nhiệt
    const rows = [...new Set(this.seatData.map(seat => seat.row))].sort();
    const columns = [...new Set(this.seatData.map(seat => seat.column))].sort((a, b) => a - b);

    this.heatmapOptions.yaxis = {
      ...this.heatmapOptions.yaxis,
      categories: rows
    };

    this.heatmapOptions.xaxis = {
      ...this.heatmapOptions.xaxis,
      categories: columns.map(String)
    };

    // Tạo dữ liệu cho bản đồ nhiệt
    const heatmapData: HeatmapData[] = [];
    rows.forEach(row => {
      const rowData = {
        name: row,
        data: columns.map(column => {
          const seat = this.seatData.find(s => s.row === row && s.column === column);
          return {
            x: String(column),
            y: seat ? seat.totalRevenue : 0
          };
        })
      };
      heatmapData.push(rowData);
    });

    this.heatmapOptions.series = heatmapData;
  }

  applyTimeRange(timeRange: string): void {
    if (this.timeRangeFilter !== timeRange) {
      this.timeRangeFilter = timeRange;
      this.loadSeatData();
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('vi-VN') + ' ₫';
  }

  calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';
    const percentage = (value / total) * 100;
    return percentage.toFixed(1) + '%';
  }

  exportToExcel(): void {
    // Tạo mảng dữ liệu cho file Excel
    const data = [
      ['Báo cáo Thống kê lợi nhuận ghế'], // Tiêu đề
      ['Thời gian', this.getTimeRangeText()], // Thông tin thời gian
      ['Tổng doanh thu', this.formatCurrency(this.totalRevenue)], // Tổng doanh thu
      ['Ghế doanh thu cao nhất', this.topSeat], // Ghế tốt nhất
      ['Ghế doanh thu thấp nhất', this.worstSeat], // Ghế tệ nhất
      ['Tỷ lệ lấp đầy trung bình', this.averageOccupancy.toFixed(1) + '%'], // Tỷ lệ lấp đầy
      [], // Dòng trống
      ['STT', 'Mã ghế', 'Hàng', 'Cột', 'Số lần bán', 'Tỷ lệ lấp đầy', 'Doanh thu', 'Tỷ lệ doanh thu'] // Header
    ];

    // Thêm dữ liệu ghế
    this.seatData.forEach((seat, index) => {
      data.push([
        String(index + 1),
        seat.seatCode,
        seat.row,
        String(seat.column),
        String(seat.totalSales),
        seat.occupancyRate + '%',
        this.formatCurrency(seat.totalRevenue),
        this.calculatePercentage(seat.totalRevenue, this.totalRevenue)
      ]);
    });

    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Thiết lập độ rộng cột
    const wscols = [
      { wch: 5 },  // STT
      { wch: 10 }, // Mã ghế
      { wch: 8 },  // Hàng
      { wch: 8 },  // Cột
      { wch: 12 }, // Số lần bán
      { wch: 15 }, // Tỷ lệ lấp đầy
      { wch: 15 }, // Doanh thu
      { wch: 15 }  // Tỷ lệ doanh thu
    ];
    ws['!cols'] = wscols;

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Thống kê lợi nhuận ghế');

    // Chuyển đổi workbook thành mảng nhị phân Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Tạo Blob và tải xuống
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Thong_ke_loi_nhuan_ghe_${new Date().toISOString().split('T')[0]}.xlsx`;
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
