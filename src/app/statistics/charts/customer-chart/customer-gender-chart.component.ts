import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
  NgApexchartsModule
} from 'ng-apexcharts';

import { StatisticService, StatisticCustomerGenderRes } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { ExportService } from '../../shared/services/export.service';

// Define the chart options interface
export type GenderChartOptions = {
  series: number[];
  chart: ApexChart;
  xaxis?: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  labels: string[];
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
};

interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
  totalRecord?: number;
}

@Component({
  selector: 'app-customer-gender-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title">Giới tính khách hàng</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportGenderDataToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadGenderData()">
            <i class="mdi mdi-refresh"></i> Tải lại
          </button>
        </div>
      </div>
      <div class="card-body">
        <div *ngIf="isLoading" class="text-center p-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        
        <div *ngIf="!isLoading && !hasData" class="text-center p-5">
          <p class="text-muted">Không có dữ liệu trong khoảng thời gian đã chọn</p>
        </div>
        
        <div *ngIf="isSampleData" class="sample-data-warning">
          <div class="alert alert-warning mb-3">
            <i class="mdi mdi-information-outline me-2"></i>
            Đang hiển thị dữ liệu mẫu do không có dữ liệu thực từ API
          </div>
        </div>
        
        <div *ngIf="!isLoading && hasData">
          <div id="gender-chart">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [labels]="chartOptions.labels"
              [dataLabels]="chartOptions.dataLabels"
              [plotOptions]="chartOptions.plotOptions"
              [yaxis]="chartOptions.yaxis"
              [legend]="chartOptions.legend"
              [fill]="chartOptions.fill"
              [tooltip]="chartOptions.tooltip"
            ></apx-chart>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 1.5rem;
    }
    
    .card {
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    .card-header {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background-color: transparent;
    }
    
    .card-title {
      margin-bottom: 0;
      color: #333;
      font-weight: 600;
    }
    
    .btn-group .btn {
      border-radius: 4px;
      margin-left: 5px;
      transition: all 0.2s;
    }
    
    .btn-group .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .btn-group .btn-outline-primary {
      color: #4e73df;
      border-color: #4e73df;
    }
    
    .btn-group .btn-outline-primary:hover {
      background-color: #4e73df;
      color: white;
    }
    
    .btn-group .btn-outline-secondary {
      color: #6c757d;
      border-color: #6c757d;
    }
    
    .btn-group .btn-outline-secondary:hover {
      background-color: #6c757d;
      color: white;
    }

    /* CSS cho tooltip tùy chỉnh */
    :global(.custom-tooltip) {
      background: #1a202c !important;
      border: 1px solid #4a5568 !important;
      border-radius: 8px !important;
      padding: 12px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
    }
    
    :global(.tooltip-title) {
      color: #90cdf4 !important;
      font-weight: bold !important;
      font-size: 14px !important;
      display: block !important;
      margin-bottom: 8px !important;
      text-align: left !important;
    }
    
    :global(.tooltip-value) {
      color: #f7fafc !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      text-align: left !important;
    }
    
    /* CSS cho menu xuất dữ liệu của ApexCharts */
    :global(.apexcharts-menu) {
      background-color: #1a202c !important;
      border: 2px solid #4299e1 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
      border-radius: 8px !important;
      padding: 8px 4px !important;
      z-index: 999999 !important;
    }
    
    :global(.apexcharts-menu-item) {
      color: white !important;
      font-weight: 500 !important;
      padding: 12px 16px !important;
      border-radius: 4px !important;
      margin: 4px 0 !important;
      transition: all 0.2s ease !important;
      font-size: 14px !important;
    }
    
    :global(.apexcharts-menu-item:hover) {
      background-color: #4299e1 !important;
      color: white !important;
      transform: translateX(4px) !important;
    }
    
    /* CSS dark mode */
    @media (prefers-color-scheme: dark) {
      .card {
        background-color: #2d3748;
        color: #e2e8f0;
      }
      
      .card-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .card-title {
        color: #e2e8f0;
      }
      
      .text-muted {
        color: #a0aec0 !important;
      }
      
      .btn-group .btn-outline-primary {
        color: #90cdf4;
        border-color: #90cdf4;
      }
      
      .btn-group .btn-outline-primary:hover {
        background-color: #90cdf4;
        color: #1a202c;
      }
      
      .btn-group .btn-outline-secondary {
        color: #cbd5e0;
        border-color: #cbd5e0;
      }
      
      .btn-group .btn-outline-secondary:hover {
        background-color: #cbd5e0;
        color: #1a202c;
      }
      
      /* Dark mode tooltip styles */
      :global(.custom-tooltip) {
        background: #2d3748 !important;
        border: 1px solid #4a5568 !important;
      }
      
      :global(.tooltip-title) {
        color: #90cdf4 !important;
      }
      
      :global(.tooltip-value) {
        color: #f7fafc !important;
      }

      /* Dark mode menu styles */
      :global(.apexcharts-menu) {
        background-color: #2d3748 !important;
        border: 1px solid #4a5568 !important;
      }
      
      :global(.apexcharts-menu-item) {
        color: #f7fafc !important;
      }
      
      :global(.apexcharts-menu-item:hover) {
        background-color: #4a5568 !important;
        color: #90cdf4 !important;
      }
      
      /* ApexCharts dark mode styling */
      :global(.apexcharts-canvas) {
        background-color: #2d3748 !important;
      }
      
      :global(.apexcharts-text) {
        fill: #e2e8f0 !important;
      }
      
      :global(.apexcharts-legend-text) {
        color: #e2e8f0 !important;
      }
      
      :global(.apexcharts-tooltip) {
        background: #2d3748 !important;
        border: 1px solid #4a5568 !important;
      }
      
      :global(.apexcharts-tooltip-title) {
        background: #1a202c !important;
        border-bottom: 1px solid #4a5568 !important;
      }
    }

    .sample-data-warning {
      margin-bottom: 1rem;
    }
  `]
})
export class CustomerGenderChartComponent implements OnInit, OnDestroy {
  chartOptions!: GenderChartOptions;
  isLoading = true;
  hasData = false;
  isSampleData = false;

  private dateRangeSubscription!: Subscription;
  private currentDateRange: DateRange = {} as DateRange;

  constructor(
    private statisticService: StatisticService,
    private dashboardService: DashboardService,
    private exportService: ExportService
  ) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(dateRange => {
      this.currentDateRange = dateRange;
      this.loadGenderData();
    });
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  loadGenderData(): void {
    this.isLoading = true;
    this.hasData = false;
    this.isSampleData = false;

    console.log('Đang gọi API với tham số:', {
      startDate: this.currentDateRange?.startDate,
      endDate: this.currentDateRange?.endDate
    });

    // Thử gọi API không có tham số ngày tháng
    this.statisticService.getCustomerGender().subscribe({
      next: (response: CommonResponse<StatisticCustomerGenderRes[]>) => {
        this.isLoading = false;
        console.log('Kết quả API giới tính khách hàng (không filter thời gian):', response);

        if (response && response.data && response.data.length > 0) {
          this.hasData = true;
          this.isSampleData = false;
          this.updateChart(response.data);
        } else {
          console.log('Không có dữ liệu giới tính khách hàng, hiển thị dữ liệu mẫu');
          this.hasData = true;
          this.isSampleData = true;
          this.updateChartWithSampleData();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Lỗi khi tải dữ liệu giới tính khách hàng:', error);
        alert('Lỗi khi tải dữ liệu giới tính khách hàng: ' + JSON.stringify(error));
        // Hiển thị dữ liệu mẫu trong trường hợp lỗi
        this.hasData = true;
        this.isSampleData = true;
        this.updateChartWithSampleData();
      }
    });
  }

  private updateChart(data: StatisticCustomerGenderRes[]): void {
    // Xử lý dữ liệu giới tính
    const labels: string[] = [];
    const seriesData: number[] = [];

    data.forEach(item => {
      // Chuyển đổi giới tính từ mã thành tên hiển thị
      let genderDisplay = 'Khác';
      if (item.gender === 'Male') {
        genderDisplay = 'Nam';
      } else if (item.gender === 'Female') {
        genderDisplay = 'Nữ';
      }
      
      labels.push(genderDisplay);
      seriesData.push(item.totalCustomers);
    });

    this.chartOptions.series = seriesData;
    this.chartOptions.labels = labels;
  }

  /**
   * Cập nhật biểu đồ với dữ liệu mẫu khi không có dữ liệu thực
   */
  private updateChartWithSampleData(): void {
    const sampleData: StatisticCustomerGenderRes[] = [
      { gender: 'Female', totalCustomers: 1, totalSpent: 3887996 },
      { gender: 'Male', totalCustomers: 1, totalSpent: 3820271 }
    ];
    
    this.updateChart(sampleData);
  }

  private initChartOptions(): void {
    this.chartOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'pie',
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
          },
          export: {
            csv: {
              filename: 'Thống kê giới tính khách hàng',
              columnDelimiter: ',',
              headerValue: 'Giá trị',
            },
            svg: {
              filename: 'Thống kê giới tính khách hàng',
            },
            png: {
              filename: 'Thống kê giới tính khách hàng',
            }
          },
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts) {
          return opts.w.globals.labels[opts.seriesIndex] + ': ' + val.toFixed(1) + '%';
        }
      },
      stroke: {
        width: 0
      },
      plotOptions: {
        pie: {
          donut: {
            size: '0%'
          },
          expandOnClick: true
        }
      },
      fill: {
        opacity: 1,
        // Màu sắc cho mỗi loại giới tính
        colors: ['#4e73df', '#e74a3b', '#1cc88a']
      },
      yaxis: {
        labels: {
          formatter: (val) => {
            return val.toString();
          }
        }
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => {
            return val.toString() + ' khách hàng';
          }
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex];
          const percent = (value / series.reduce((a: number, b: number) => a + b, 0) * 100).toFixed(1);
          const gender = w.globals.labels[seriesIndex];
          
          return `
            <div class="custom-tooltip">
              <span class="tooltip-title">Giới tính: ${gender}</span>
              <span class="tooltip-value">${value} khách hàng (${percent}%)</span>
            </div>
          `;
        }
      },
      title: {
        text: 'Thống kê theo giới tính',
        align: 'center'
      },
      labels: []
    };
  }

  exportGenderDataToExcel(): void {
    if (!this.hasData) return;

    // Chuẩn bị dữ liệu xuất Excel
    const exportData = this.chartOptions.labels.map((label, index) => {
      return {
        'Giới tính': label,
        'Số lượng': this.chartOptions.series[index]
      };
    });

    this.exportService.exportToExcel(exportData, 'thong_ke_gioi_tinh', 'Giới tính khách hàng', this.currentDateRange);
  }
} 