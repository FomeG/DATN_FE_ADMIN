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

import { StatisticService, StatisticPeakHoursRes } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { ExportService } from '../../shared/services/export.service';

// Define the chart options interface
export type PeakHoursChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
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
  selector: 'app-peak-hours-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title">Giờ cao điểm</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportPeakHoursToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadPeakHoursData()">
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
          <div id="peak-hours-chart">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [xaxis]="chartOptions.xaxis"
              [stroke]="chartOptions.stroke"
              [dataLabels]="chartOptions.dataLabels"
              [yaxis]="chartOptions.yaxis"
              [plotOptions]="chartOptions.plotOptions"
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
export class PeakHoursChartComponent implements OnInit, OnDestroy {
  chartOptions!: PeakHoursChartOptions;
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
      this.loadPeakHoursData();
    });
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  loadPeakHoursData(): void {
    this.isLoading = true;
    this.hasData = false;
    this.isSampleData = false;

    // Chuyển đổi null thành undefined
    const startDate = this.currentDateRange.startDate ?? undefined;
    const endDate = this.currentDateRange.endDate ?? undefined;
    
    // Gọi API với tham số thời gian từ bộ lọc
    this.statisticService.getPeakHours(startDate, endDate).subscribe({
      next: (response: CommonResponse<StatisticPeakHoursRes[]>) => {
        this.isLoading = false;
        if (response && response.data && response.data.length > 0) {
          this.hasData = true;
          this.isSampleData = false;
          this.updateChart(response.data);
        } else {
          // Nếu không có dữ liệu thực, sử dụng dữ liệu mẫu
          this.hasData = true;
          this.isSampleData = true;
          this.updateChartWithSampleData();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Lỗi khi tải dữ liệu giờ cao điểm:', error);
        // Hiển thị dữ liệu mẫu khi có lỗi
        this.hasData = true;
        this.isSampleData = true;
        this.updateChartWithSampleData();
      }
    });
  }

  private updateChart(data: StatisticPeakHoursRes[]): void {
    // Sắp xếp dữ liệu theo giờ
    data.sort((a, b) => a.hourOfDay - b.hourOfDay);
    
    const categories: string[] = [];
    const seriesData: number[] = [];

    data.forEach(item => {
      // Format giờ hiển thị với định dạng 24h chuẩn
      const hour = item.hourOfDay;
      const hourFormatted = hour.toString().padStart(2, '0'); // Đảm bảo 2 chữ số (01, 02, etc.)
      const hourDisplay = `${hourFormatted}:00`;
      
      categories.push(hourDisplay);
      seriesData.push(item.totalTicketsSold);
    });

    this.chartOptions.series = [{
      name: 'Lượt khách',
      data: seriesData
    }];
    this.chartOptions.xaxis.categories = categories;
  }

  /**
   * Cập nhật biểu đồ với dữ liệu mẫu khi không có dữ liệu thực
   */
  private updateChartWithSampleData(): void {
    const sampleData: StatisticPeakHoursRes[] = [
      { hourOfDay: 9, totalTicketsSold: 45 },
      { hourOfDay: 10, totalTicketsSold: 62 },
      { hourOfDay: 11, totalTicketsSold: 78 },
      { hourOfDay: 12, totalTicketsSold: 95 },
      { hourOfDay: 13, totalTicketsSold: 85 },
      { hourOfDay: 14, totalTicketsSold: 65 },
      { hourOfDay: 15, totalTicketsSold: 45 },
      { hourOfDay: 16, totalTicketsSold: 58 },
      { hourOfDay: 17, totalTicketsSold: 72 },
      { hourOfDay: 18, totalTicketsSold: 110 },
      { hourOfDay: 19, totalTicketsSold: 135 },
      { hourOfDay: 20, totalTicketsSold: 152 },
      { hourOfDay: 21, totalTicketsSold: 128 },
      { hourOfDay: 22, totalTicketsSold: 85 },
      { hourOfDay: 23, totalTicketsSold: 42 }
    ];
    
    this.updateChart(sampleData);
  }

  private initChartOptions(): void {
    this.chartOptions = {
      series: [{
        name: 'Lượt khách',
        data: []
      }],
      chart: {
        height: 300,
        type: 'bar',
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
              filename: 'Thống kê giờ cao điểm',
              columnDelimiter: ',',
              headerCategory: 'Giờ',
              headerValue: 'Giá trị',
            },
            svg: {
              filename: 'Thống kê giờ cao điểm',
            },
            png: {
              filename: 'Thống kê giờ cao điểm',
            }
          },
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 6,
          dataLabels: {
            position: 'top',
          },
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val.toFixed(0);
        },
        style: {
          fontSize: '12px',
          colors: ['#fff'],
          fontWeight: 'bold'
        },
        offsetY: -20
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Giờ trong ngày',
          style: {
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            colors: '#e2e8f0',
            fontSize: '12px'
          },
          rotate: 0
        }
      },
      yaxis: {
        title: {
          text: 'Lượt khách',
          style: {
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          formatter: (val: number) => {
            return val.toFixed(0);
          },
          style: {
            colors: '#e2e8f0',
            fontSize: '12px'
          }
        }
      },
      fill: {
        opacity: 1,
        colors: ['#36b9cc']
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => {
            return val.toString() + ' lượt';
          }
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          const timeOfDay = w.globals.labels[dataPointIndex] || w.globals.categoryLabels[dataPointIndex];
          
          return `
            <div class="custom-tooltip">
              <span class="tooltip-title">Thời gian: ${timeOfDay}</span>
              <span class="tooltip-value">${value.toLocaleString('vi-VN')} lượt khách</span>
            </div>
          `;
        }
      },
      title: {
        text: 'Phân bố khách hàng theo giờ',
        align: 'center',
        style: {
          color: '#e2e8f0',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetY: 0,
        labels: {
          colors: '#e2e8f0'
        }
      },
      labels: []
    };
  }

  exportPeakHoursToExcel(): void {
    if (!this.hasData) return;

    // Chuẩn bị dữ liệu xuất Excel
    const exportData = this.chartOptions.xaxis.categories.map((hour: string, index: number) => {
      return {
        'Giờ': hour,
        'Lượt khách': this.chartOptions.series[0].data[index]
      };
    });

    this.exportService.exportToExcel(exportData, 'gio_cao_diem', 'Giờ cao điểm', this.currentDateRange);
  }
} 