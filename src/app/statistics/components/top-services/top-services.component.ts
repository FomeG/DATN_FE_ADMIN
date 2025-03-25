import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticService } from '../../../services/statistic.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ServiceStatItem {
  serviceName: string;
  quantity: number;
  revenue: number;
}

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
}

interface CompareChartOptions {
  series?: any[];
  chart?: any;
  xaxis?: any;
  yaxis?: any;
  dataLabels?: any;
  colors?: string[];
  tooltip?: any;
  legend?: any;
  stroke?: any;
  fill?: any;
}

@Component({
  selector: 'app-top-services',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './top-services.component.html',
  styleUrl: './top-services.component.css'
})
export class TopServicesComponent implements OnInit {
  // Khai báo các biến
  isLoading: boolean = true;
  apiError: boolean = false;
  timeRangeFilter: string = 'thisMonth';
  servicesData: ServiceStatItem[] = [];
  totalServicesSold: number = 0;
  totalRevenue: number = 0;

  // Chart Options
  pieChartOptions: PieChartOptions = {};
  barChartOptions: BarChartOptions = {};
  compareChartOptions: CompareChartOptions = {};

  // Service colors
  serviceColors: string[] = [
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', 
    '#fee140', '#667eea', '#764ba2', '#a4d1f5', '#ffcb8c',
    '#00b09b', '#96c93d', '#ff9a9e', '#fad0c4', '#6a11cb'
  ];

  constructor(private statisticService: StatisticService) {}

  ngOnInit(): void {
    this.loadServicesData();
  }

  applyTimeRange(range: string): void {
    this.timeRangeFilter = range;
    this.loadServicesData();
  }

  loadServicesData(): void {
    this.isLoading = true;
    this.apiError = false;

    // TODO: Thay thế bằng API thực tế khi có
    // this.statisticService.getTopServices(this.timeRangeFilter).subscribe({
    //   next: (data) => {
    //     this.servicesData = data;
    //     this.calculateTotals();
    //     this.updateCharts();
    //     this.isLoading = false;
    //   },
    //   error: (err) => {
    //     console.error('Error loading service data:', err);
    //     this.apiError = true;
    //     this.loadMockData(); // Tải dữ liệu mẫu nếu API lỗi
    //     this.isLoading = false;
    //   }
    // });

    // Tạm thời dùng dữ liệu mẫu
    setTimeout(() => {
      this.loadMockData();
      this.isLoading = false;
    }, 1000);
  }

  loadMockData(): void {
    this.servicesData = [
      { serviceName: 'Massage thư giãn toàn thân', quantity: 230, revenue: 57500000 },
      { serviceName: 'Chăm sóc da mặt cơ bản', quantity: 180, revenue: 25200000 },
      { serviceName: 'Trị liệu đá nóng', quantity: 120, revenue: 36000000 },
      { serviceName: 'Tẩy tế bào chết toàn thân', quantity: 95, revenue: 19000000 },
      { serviceName: 'Liệu pháp hương thơm', quantity: 85, revenue: 17000000 },
      { serviceName: 'Gói chăm sóc VIP', quantity: 45, revenue: 31500000 },
      { serviceName: 'Massage chân', quantity: 70, revenue: 10500000 },
      { serviceName: 'Tắm thảo mộc', quantity: 40, revenue: 12000000 },
      { serviceName: 'Dịch vụ trẻ hóa da', quantity: 30, revenue: 15000000 },
      { serviceName: 'Khác', quantity: 25, revenue: 6250000 }
    ];
    
    this.calculateTotals();
    this.updateCharts();
  }

  calculateTotals(): void {
    this.totalServicesSold = this.servicesData.reduce((sum, item) => sum + item.quantity, 0);
    this.totalRevenue = this.servicesData.reduce((sum, item) => sum + item.revenue, 0);
  }

  updateCharts(): void {
    this.updatePieChart();
    this.updateBarChart();
    this.updateCompareChart();
  }

  updatePieChart(): void {
    // Lấy top 5 dịch vụ, gộp các dịch vụ còn lại vào "Khác"
    let chartData: ServiceStatItem[] = [...this.servicesData];
    if (chartData.length > 5) {
      const top5 = chartData.slice(0, 5);
      const others = chartData.slice(5);
      const otherSum = others.reduce(
        (sum, item) => ({ 
          serviceName: 'Khác', 
          quantity: sum.quantity + item.quantity, 
          revenue: sum.revenue + item.revenue
        }), 
        { serviceName: 'Khác', quantity: 0, revenue: 0 }
      );
      chartData = [...top5, otherSum];
    }

    this.pieChartOptions = {
      series: chartData.map(item => item.quantity),
      labels: chartData.map(item => item.serviceName),
      chart: {
        type: 'donut',
        height: 300
      },
      colors: chartData.map((_, i) => this.getServiceColor(i)),
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'bottom',
        formatter: function(val: string, opts: any) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex] + ' lượt';
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return val + ' lượt';
          }
        }
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Tổng dịch vụ',
                formatter: (w: any) => {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) + ' lượt';
                }
              }
            }
          }
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
            height: 250
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  updateBarChart(): void {
    // Lấy top 5 dịch vụ theo doanh thu
    const top5Revenue = [...this.servicesData]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const formatCurrencyTooltip = this.formatCurrencyTooltip.bind(this);

    this.barChartOptions = {
      series: [{
        name: 'Doanh thu',
        data: top5Revenue.map(item => item.revenue / 1000000) // Đổi sang đơn vị triệu
      }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 6,
          dataLabels: {
            position: 'top'
          }
        }
      },
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
      colors: ['#fa709a'],
      xaxis: {
        categories: top5Revenue.map(item => item.serviceName),
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: function(val: string) {
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
            return formatCurrencyTooltip(val * 1000000);
          }
        }
      }
    };
  }

  updateCompareChart(): void {
    // Lấy top 5 dịch vụ theo số lượng
    const top5 = [...this.servicesData]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const formatCurrencyTooltip = this.formatCurrencyTooltip.bind(this);

    this.compareChartOptions = {
      series: [
        {
          name: 'Số lượng',
          type: 'column',
          data: top5.map(item => item.quantity)
        },
        {
          name: 'Doanh thu (triệu)',
          type: 'line',
          data: top5.map(item => item.revenue / 1000000)
        }
      ],
      chart: {
        height: 300,
        type: 'line',
        toolbar: {
          show: false
        }
      },
      stroke: {
        width: [0, 4],
        curve: 'smooth'
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [1],
        formatter: function(val: number, { seriesIndex }: any) {
          if (seriesIndex === 1) {
            return val.toFixed(1) + ' tr';
          }
          return val;
        }
      },
      xaxis: {
        categories: top5.map(item => item.serviceName),
        labels: {
          formatter: function(val: string) {
            return val.length > 10 ? val.substring(0, 8) + '...' : val;
          }
        }
      },
      yaxis: [
        {
          title: {
            text: 'Số lượng',
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
        {
          opposite: true,
          title: {
            text: 'Doanh thu (triệu)',
            style: {
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val: number) {
              return val.toFixed(0);
            }
          }
        }
      ],
      colors: ['#43e97b', '#fa709a'],
      tooltip: {
        y: {
          formatter: function(val: number, { seriesIndex }: any) {
            if (seriesIndex === 0) {
              return val + ' lượt';
            } else {
              return formatCurrencyTooltip(val * 1000000);
            }
          }
        }
      },
      fill: {
        type: ['solid', 'gradient'],
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.6,
          gradientToColors: ['#fee140'],
          opacityFrom: 1,
          opacityTo: 1,
        }
      },
      legend: {
        position: 'top'
      }
    };
  }

  calculatePercentage(value: number, total: number): string {
    if (!total) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  getServiceColor(index: number): string {
    return this.serviceColors[index % this.serviceColors.length];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  formatCurrencyTooltip(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND', 
      maximumFractionDigits: 0
    }).format(value);
  }

  // Xuất dữ liệu ra Excel
  exportToExcel(type: string): void {
    if (!this.servicesData || this.servicesData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const currentDate = new Date();
    const dateStr = currentDate.toISOString().split('T')[0];
    let fileName = '';
    
    switch (type) {
      case 'popularServices':
        fileName = `Thong_ke_dich_vu_pho_bien_${dateStr}.xlsx`;
        this.exportPopularServicesData(fileName);
        break;
      case 'serviceRevenue':
        fileName = `Thong_ke_doanh_thu_dich_vu_${dateStr}.xlsx`;
        this.exportServiceRevenueData(fileName);
        break;
      case 'all':
        fileName = `Bao_cao_dich_vu_day_du_${dateStr}.xlsx`;
        this.exportAllData(fileName);
        break;
    }
  }

  exportPopularServicesData(fileName: string): void {
    const data = this.servicesData.map((item, index) => ({
      'STT': index + 1,
      'Tên dịch vụ': item.serviceName,
      'Số lượng đã bán': item.quantity,
      'Tỷ lệ (%)': parseFloat(((item.quantity / this.totalServicesSold) * 100).toFixed(1))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top dịch vụ');

    // Thiết lập tiêu đề
    const titleRow = { 
      'STT': 'BÁO CÁO THỐNG KÊ DỊCH VỤ PHỔ BIẾN',
      'Tên dịch vụ': '',
      'Số lượng đã bán': '',
      'Tỷ lệ (%)': ''
    };
    const filterRow = {
      'STT': `Khoảng thời gian: ${this.getTimeRangeText()}`,
      'Tên dịch vụ': '',
      'Số lượng đã bán': '',
      'Tỷ lệ (%)': ''
    };
    const summaryRow = {
      'STT': `Tổng cộng: ${this.servicesData.length} dịch vụ`,
      'Tên dịch vụ': '',
      'Số lượng đã bán': this.totalServicesSold,
      'Tỷ lệ (%)': 100
    };

    XLSX.utils.sheet_add_json(worksheet, [titleRow, filterRow, summaryRow], { origin: 'A1', skipHeader: true });

    // Xuất file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  exportServiceRevenueData(fileName: string): void {
    const data = this.servicesData.map((item, index) => ({
      'STT': index + 1,
      'Tên dịch vụ': item.serviceName,
      'Doanh thu': item.revenue,
      'Tỷ lệ (%)': parseFloat(((item.revenue / this.totalRevenue) * 100).toFixed(1))
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doanh thu theo dịch vụ');

    // Thiết lập tiêu đề
    const titleRow = { 
      'STT': 'BÁO CÁO DOANH THU THEO DỊCH VỤ',
      'Tên dịch vụ': '',
      'Doanh thu': '',
      'Tỷ lệ (%)': ''
    };
    const filterRow = {
      'STT': `Khoảng thời gian: ${this.getTimeRangeText()}`,
      'Tên dịch vụ': '',
      'Doanh thu': '',
      'Tỷ lệ (%)': ''
    };
    const summaryRow = {
      'STT': `Tổng cộng: ${this.servicesData.length} dịch vụ`,
      'Tên dịch vụ': '',
      'Doanh thu': this.totalRevenue,
      'Tỷ lệ (%)': 100
    };

    XLSX.utils.sheet_add_json(worksheet, [titleRow, filterRow, summaryRow], { origin: 'A1', skipHeader: true });

    // Định dạng cột tiền tệ
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 4; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: 2 }); // Cột Doanh thu
      if (worksheet[cell]) {
        worksheet[cell].z = '#,##0 "₫"';
      }
    }

    // Xuất file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  exportAllData(fileName: string): void {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Tổng quan
    const overviewData = [
      ['BÁO CÁO TỔNG QUAN DỊCH VỤ', '', ''],
      [`Khoảng thời gian: ${this.getTimeRangeText()}`, '', ''],
      ['', '', ''],
      ['Tổng số dịch vụ khác nhau:', this.servicesData.length, ''],
      ['Tổng số lượt sử dụng dịch vụ:', this.totalServicesSold, ''],
      ['Tổng doanh thu:', this.totalRevenue, ''],
      ['', '', ''],
      ['Top 3 dịch vụ phổ biến nhất:', '', ''],
    ];

    // Thêm top 3 dịch vụ phổ biến
    const top3Services = [...this.servicesData]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
      
    top3Services.forEach((service, index) => {
      overviewData.push([
        `${index + 1}. ${service.serviceName}`,
        `${service.quantity} lượt`,
        `${this.formatCurrency(service.revenue)}`
      ]);
    });

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');
    
    // Sheet 2: Chi tiết dịch vụ
    const servicesData = this.servicesData.map((item, index) => ({
      'STT': index + 1,
      'Tên dịch vụ': item.serviceName,
      'Số lượng': item.quantity,
      'Tỷ lệ số lượng (%)': parseFloat(((item.quantity / this.totalServicesSold) * 100).toFixed(1)),
      'Doanh thu': item.revenue,
      'Tỷ lệ doanh thu (%)': parseFloat(((item.revenue / this.totalRevenue) * 100).toFixed(1))
    }));

    const servicesSheet = XLSX.utils.json_to_sheet(servicesData);
    XLSX.utils.book_append_sheet(workbook, servicesSheet, 'Chi tiết dịch vụ');
    
    // Định dạng cột tiền tệ
    const range = XLSX.utils.decode_range(servicesSheet['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: 4 }); // Cột Doanh thu
      if (servicesSheet[cell]) {
        servicesSheet[cell].z = '#,##0 "₫"';
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
