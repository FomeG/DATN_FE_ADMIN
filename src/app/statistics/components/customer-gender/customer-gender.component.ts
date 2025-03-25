import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticService, StatisticCustomerGenderRes } from '../../../services/statistic.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries, ApexChart, ApexLegend,
  ApexResponsive, ApexTooltip, ApexDataLabels,
  ApexPlotOptions, ApexStates, ApexTheme, ApexFill,
  ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexGrid,
  ApexMarkers, ApexStroke
} from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

// Cấu hình biểu đồ tròn
export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  states: ApexStates;
  fill: ApexFill;
};

// Cấu hình biểu đồ cột
export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  colors: string[];
  tooltip: ApexTooltip;
};

// Cấu hình biểu đồ radar
export type RadarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  colors: string[];
  fill: ApexFill;
  markers: ApexMarkers;
  stroke: ApexStroke;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-customer-gender',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './customer-gender.component.html',
  styleUrls: ['./customer-gender.component.css']
})
export class CustomerGenderComponent implements OnInit {
  // Dữ liệu thống kê
  genderData: StatisticCustomerGenderRes[] = [];
  totalCustomers: number = 0;
  totalSpent: number = 0;

  // Thời gian lọc
  startDate: Date | null = null;
  endDate: Date | null = null;
  timeRangeFilter: string = 'thisMonth';

  // Đang tải dữ liệu
  isLoading: boolean = false;

  // Lưu thông tin lỗi API để hiển thị
  apiError: any = null;

  // Biểu đồ tròn
  public pieChartOptions: Partial<PieChartOptions>;
  
  // Biểu đồ cột
  public barChartOptions: Partial<BarChartOptions>;
  
  // Biểu đồ radar
  public radarChartOptions: Partial<RadarChartOptions>;

  // Màu sắc cho biểu đồ
  genderColors: Record<string, string> = {
    'Male': '#4facfe',
    'Female': '#fa709a',
    'Other': '#667eea'
  };

  constructor(private statisticService: StatisticService) {
    // Khởi tạo cấu hình biểu đồ tròn
    this.pieChartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: 320,
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
        position: "bottom",
        fontSize: "14px",
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        itemMargin: {
          horizontal: 10,
          vertical: 5
        },
        formatter: function (seriesName, opts) {
          return seriesName + " - " + opts.w.globals.series[opts.seriesIndex];
        }
      },
      colors: Object.values(this.genderColors),
      dataLabels: {
        enabled: true,
        formatter: function (val: any, opts) {
          return opts.w.globals.seriesNames[opts.seriesIndex] + ": " + parseFloat(val).toFixed(1) + "%";
        },
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        },
        dropShadow: {
          enabled: false
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '50%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '22px',
                fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                color: '#333',
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '26px',
                fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                color: '#333',
                offsetY: 16,
                formatter: function (val) {
                  return val.toString();
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Tổng',
                fontSize: '16px',
                fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                color: '#888',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString();
                }
              }
            }
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
            return val.toString() + " khách hàng";
          }
        }
      },
      states: {
        hover: {
          filter: {
            type: 'darken',
            // @ts-ignore
            value: 0.8,
          }
        },
        active: {
          filter: {
            type: 'darken',
            // @ts-ignore
            value: 0.5,
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.2,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.9,
          stops: [0, 90, 100]
        }
      }
    };
    
    // Khởi tạo cấu hình biểu đồ cột
    this.barChartOptions = {
      series: [],
      chart: {
        type: "bar",
        height: 320,
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        toolbar: {
          show: false
        },
        stacked: false
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 5,
          dataLabels: {
            position: 'top',
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
          }).format(Number(val));
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
        }
      },
      xaxis: {
        categories: [],
        position: 'bottom',
        labels: {
          style: {
            fontSize: '12px',
            fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0,
              minimumFractionDigits: 0
            }).format(Number(val));
          },
          style: {
            fontSize: '12px',
            fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          }
        }
      },
      colors: Object.values(this.genderColors),
      tooltip: {
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
            }).format(Number(val));
          }
        }
      }
    };
    
    // Khởi tạo cấu hình biểu đồ radar
    this.radarChartOptions = {
      series: [],
      chart: {
        height: 320,
        type: 'radar',
        fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        toolbar: {
          show: false
        },
        dropShadow: {
          enabled: true,
          blur: 1,
          left: 1,
          top: 1
        }
      },
      dataLabels: {
        enabled: true
      },
      plotOptions: {
        radar: {
          size: 140,
          polygons: {
            strokeColors: '#e9e9e9',
            fill: {
              colors: ['#f8f8f8', '#fff']
            }
          }
        }
      },
      colors: Object.values(this.genderColors),
      markers: {
        size: 4,
        colors: ['#fff'],
        strokeWidth: 2,
      },
      fill: {
        opacity: 0.5
      },
      stroke: {
        width: 2
      },
      tooltip: {
        theme: "light",
        style: {
          fontSize: '12px',
          fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        y: {
          formatter: function (val) {
            return val.toString();
          }
        }
      },
      xaxis: {
        categories: ['Số lượng khách hàng', 'Tổng chi tiêu', 'Chi tiêu trung bình'],
        labels: {
          style: {
            fontSize: '12px',
            fontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          }
        }
      },
      yaxis: {
        show: false
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
    this.loadGenderData();
  }

  /**
   * Lấy dữ liệu thống kê giới tính khách hàng
   */
  loadGenderData(): void {
    this.isLoading = true;
    this.apiError = null;

    console.log('Fetching gender data with date range:', {
      startDate: this.startDate,
      endDate: this.endDate
    });

    this.statisticService.getCustomerGender(this.startDate || undefined, this.endDate || undefined)
      .subscribe({
        next: (response) => {
          console.log('API response:', response);

          if (response && response.data && response.data.length > 0) {
            this.genderData = response.data;

            // Tính tổng số khách hàng và tổng chi tiêu
            this.totalCustomers = this.genderData.reduce((sum, gender) => sum + gender.totalCustomers, 0);
            this.totalSpent = this.genderData.reduce((sum, gender) => sum + gender.totalSpent, 0);

            // Cập nhật dữ liệu biểu đồ
            this.updateChartData();
          } else {
            console.warn('Response data is empty or invalid, using mock data');
            this.useMockData();
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải dữ liệu thống kê giới tính:', error);
          this.isLoading = false;
          this.apiError = error;

          // Sử dụng dữ liệu mẫu để hiển thị
          this.useMockData();
        }
      });
  }

  /**
   * Cập nhật dữ liệu biểu đồ từ genderData
   */
  updateChartData(): void {
    // Biểu đồ tròn: phân bố khách hàng theo giới tính
    const pieLabels = this.genderData.map(gender => this.translateGender(gender.gender));
    const pieData = this.genderData.map(gender => gender.totalCustomers);
    
    this.pieChartOptions.labels = pieLabels;
    this.pieChartOptions.series = pieData;
    
    // Biểu đồ cột: chi tiêu theo giới tính
    const spendingData = this.genderData.map(gender => gender.totalSpent);
    const categories = this.genderData.map(gender => this.translateGender(gender.gender));
    
    this.barChartOptions.xaxis = { categories };
    this.barChartOptions.series = [
      {
        name: 'Chi tiêu',
        data: spendingData
      }
    ];
    
    // Biểu đồ radar: so sánh tương quan
    // Chuẩn hóa dữ liệu về thang 0-100 để so sánh
    const maxCustomers = Math.max(...this.genderData.map(gender => gender.totalCustomers));
    const maxSpent = Math.max(...this.genderData.map(gender => gender.totalSpent));
    const maxAvgSpent = Math.max(...this.genderData.map(gender => 
      gender.totalSpent / gender.totalCustomers
    ));
    
    const radarSeries = this.genderData.map(gender => {
      // Chuẩn hóa các chỉ số để so sánh
      const normalizedCustomers = maxCustomers > 0 ? (gender.totalCustomers / maxCustomers) * 100 : 0;
      const normalizedSpent = maxSpent > 0 ? (gender.totalSpent / maxSpent) * 100 : 0;
      const avgSpent = gender.totalCustomers > 0 ? gender.totalSpent / gender.totalCustomers : 0;
      const normalizedAvgSpent = maxAvgSpent > 0 ? (avgSpent / maxAvgSpent) * 100 : 0;
      
      return {
        name: this.translateGender(gender.gender),
        data: [
          Math.round(normalizedCustomers), 
          Math.round(normalizedSpent), 
          Math.round(normalizedAvgSpent)
        ]
      };
    });
    
    this.radarChartOptions.series = radarSeries;
  }

  /**
   * Dịch giới tính sang tiếng Việt
   */
  translateGender(gender: string): string {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return gender;
    }
  }

  /**
   * Sử dụng dữ liệu mẫu để hiển thị 
   */
  useMockData(): void {
    this.genderData = [
      { gender: 'Male', totalCustomers: 120, totalSpent: 25000000 },
      { gender: 'Female', totalCustomers: 90, totalSpent: 18000000 },
      { gender: 'Other', totalCustomers: 10, totalSpent: 2000000 },
    ];

    this.totalCustomers = this.genderData.reduce((sum, gender) => sum + gender.totalCustomers, 0);
    this.totalSpent = this.genderData.reduce((sum, gender) => sum + gender.totalSpent, 0);

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
   * Tính phần trăm
   */
  calculatePercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return (value / total * 100).toFixed(1) + '%';
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
        case 'gender':
          data = this.genderData.map(gender => ({
            'Giới tính': this.translateGender(gender.gender),
            'Số lượng khách hàng': gender.totalCustomers,
            'Tỷ lệ khách hàng': this.calculatePercentage(gender.totalCustomers, this.totalCustomers)
          }));
          fileName = 'Thong_Ke_Gioi_Tinh_' + this.getFormattedDateForFileName();
          sheetName = 'Thống kê giới tính';
          break;
          
        case 'spending':
          data = this.genderData.map(gender => ({
            'Giới tính': this.translateGender(gender.gender),
            'Tổng chi tiêu': gender.totalSpent,
            'Tổng chi tiêu (VND)': this.formatCurrency(gender.totalSpent),
            'Tỷ lệ chi tiêu': this.calculatePercentage(gender.totalSpent, this.totalSpent),
            'Chi tiêu trung bình/khách': gender.totalCustomers > 0 ? gender.totalSpent / gender.totalCustomers : 0,
            'Chi tiêu trung bình/khách (VND)': this.formatCurrency(gender.totalCustomers > 0 ? gender.totalSpent / gender.totalCustomers : 0)
          }));
          fileName = 'Chi_Tieu_Theo_Gioi_Tinh_' + this.getFormattedDateForFileName();
          sheetName = 'Chi tiêu theo giới tính';
          break;
          
        case 'all':
          // Sheet 1: Thống kê theo giới tính
          const genderData = this.genderData.map(gender => ({
            'Giới tính': this.translateGender(gender.gender),
            'Số lượng khách hàng': gender.totalCustomers,
            'Tỷ lệ khách hàng': this.calculatePercentage(gender.totalCustomers, this.totalCustomers),
            'Tổng chi tiêu': gender.totalSpent,
            'Tổng chi tiêu (VND)': this.formatCurrency(gender.totalSpent),
            'Tỷ lệ chi tiêu': this.calculatePercentage(gender.totalSpent, this.totalSpent),
            'Chi tiêu trung bình/khách': gender.totalCustomers > 0 ? gender.totalSpent / gender.totalCustomers : 0,
            'Chi tiêu trung bình/khách (VND)': this.formatCurrency(gender.totalCustomers > 0 ? gender.totalSpent / gender.totalCustomers : 0)
          }));
          
          // Sheet 2: Tổng quan
          const overviewData = [{
            'Tổng số khách hàng': this.totalCustomers,
            'Tổng chi tiêu': this.totalSpent,
            'Tổng chi tiêu (VND)': this.formatCurrency(this.totalSpent),
            'Chi tiêu trung bình/khách': this.totalCustomers > 0 ? this.totalSpent / this.totalCustomers : 0, 
            'Chi tiêu trung bình/khách (VND)': this.formatCurrency(this.totalCustomers > 0 ? this.totalSpent / this.totalCustomers : 0),
            'Khoảng thời gian': this.getDateRangeString(),
          }];
          
          // Tạo Workbook với nhiều sheet
          const workbook = XLSX.utils.book_new();
          
          // Thêm từng sheet vào workbook
          const genderSheet = XLSX.utils.json_to_sheet(genderData);
          XLSX.utils.book_append_sheet(workbook, genderSheet, 'Thống kê theo giới tính');
          
          const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
          XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');
          
          // Xuất file Excel
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          fileName = 'Bao_Cao_Thong_Ke_Khach_Hang_' + this.getFormattedDateForFileName();
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
