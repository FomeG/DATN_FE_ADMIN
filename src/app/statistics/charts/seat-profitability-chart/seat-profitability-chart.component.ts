import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
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

import { StatisticService } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { ExportService } from '../../shared/services/export.service';

// Define interfaces for the API response data
interface StatisticSeatProfitabilityRes {
  seatTypeName: string;
  averagePrice: number;
  totalTicketsSold: number;
  totalRevenue: number;
}

interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
  totalRecord?: number;
}

export type SeatProfitabilityChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis[];
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-seat-profitability-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  providers: [StatisticService],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">Lợi nhuận ghế</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportDataToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadChartData()">
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
          <p class="text-muted mb-4">API chưa trả về dữ liệu. Hiển thị dữ liệu mẫu:</p>
          <div id="sample-chart">
            <apx-chart
              [series]="sampleChartOptions.series"
              [chart]="sampleChartOptions.chart"
              [xaxis]="sampleChartOptions.xaxis"
              [stroke]="sampleChartOptions.stroke"
              [dataLabels]="sampleChartOptions.dataLabels"
              [yaxis]="sampleChartOptions.yaxis"
              [legend]="sampleChartOptions.legend"
              [fill]="sampleChartOptions.fill"
              [tooltip]="sampleChartOptions.tooltip"
              [plotOptions]="sampleChartOptions.plotOptions"
            ></apx-chart>
          </div>
        </div>
        
        <div *ngIf="!isLoading && hasData">
          <div id="seat-profitability-chart">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [xaxis]="chartOptions.xaxis"
              [stroke]="chartOptions.stroke"
              [dataLabels]="chartOptions.dataLabels"
              [yaxis]="chartOptions.yaxis"
              [legend]="chartOptions.legend"
              [fill]="chartOptions.fill"
              [tooltip]="chartOptions.tooltip"
              [plotOptions]="chartOptions.plotOptions"
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
    
    /* CSS cho các menu items thêm văn bản */
    :global(.apexcharts-menu-icon) {
      color: white !important;
      background-color: rgba(0,0,0,0.5) !important;
      border-radius: 50% !important;
      padding: 3px !important;
    }
    
    /* CSS cho options container */
    :global(.apexcharts-toolbar) div {
      background-color: transparent !important;
    }
    
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
    }
  `]
})
export class SeatProfitabilityChartComponent implements OnInit, OnDestroy {
  chartOptions!: SeatProfitabilityChartOptions;
  sampleChartOptions!: SeatProfitabilityChartOptions;
  
  isLoading: boolean = false;
  hasData: boolean = false;
  
  private dateRangeSubscription: Subscription;
  private currentDateRange: DateRange;

  private statisticService = inject(StatisticService);
  private dashboardService = inject(DashboardService);
  private exportService = inject(ExportService);

  constructor() {
    this.currentDateRange = this.dashboardService.getCurrentDateRange();
    
    // Initialize both chart options
    this.initChartOptions();
    this.initSampleChartOptions();

    this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(range => {
      this.currentDateRange = range;
      this.loadChartData();
    });
  }

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  /**
   * Khởi tạo chart options cho dữ liệu thực
   */
  private initChartOptions(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: "bar",
        height: 350,
        stacked: false,
        toolbar: {
          show: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: []
      },
      yaxis: [
        {
          title: {
            text: "Vé đã bán",
          },
          labels: {
            formatter: function (val) {
              return val.toFixed(0);
            }
          }
        },
        {
          opposite: true,
          title: {
            text: "Doanh thu (VNĐ)"
          },
          labels: {
            formatter: function (val) {
              return val.toLocaleString('vi-VN') + " đ";
            }
          }
        }
      ],
      title: {
        text: "Lợi nhuận theo loại ghế",
        align: "left"
      },
      legend: {
        position: "top",
        horizontalAlign: "right"
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        theme: 'dark',
        x: {
          show: true
        },
        y: {
          formatter: function (val, opts): string {
            if (opts.seriesIndex === 0) {
              return val.toFixed(0) + " vé";
            } else if (opts.seriesIndex === 1) {
              return val.toLocaleString('vi-VN') + " đ";
            }
            return val.toString();
          }
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Roboto, sans-serif'
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          const xLabel = w.globals.labels[dataPointIndex];
          let formattedValue = "";
          
          if (w.globals.seriesNames[seriesIndex] === "Số lượng vé bán") {
            formattedValue = value.toFixed(0) + " vé";
          } else {
            formattedValue = value.toLocaleString('vi-VN') + " đ";
          }
          
          return `<div class="custom-tooltip">
            <span class="tooltip-title">${xLabel} - ${w.globals.seriesNames[seriesIndex]}</span>
            <div class="tooltip-value">${formattedValue}</div>
          </div>`;
        },
        marker: {
          show: true,
        },
        fixed: {
          enabled: false,
          position: 'topRight'
        }
      }
    };
  }

  /**
   * Khởi tạo chart options cho dữ liệu mẫu
   */
  private initSampleChartOptions(): void {
    // Tạo bản sao của chart options
    this.sampleChartOptions = JSON.parse(JSON.stringify(this.chartOptions));
    
    // Thêm dữ liệu mẫu
    this.sampleChartOptions.series = [
      {
        name: "Số lượng vé bán",
        data: [150, 90, 45, 20]
      },
      {
        name: "Doanh thu",
        data: [15000000, 13500000, 9000000, 5000000]
      }
    ];
    
    this.sampleChartOptions.xaxis.categories = ['Thường', 'VIP', 'Đôi', 'Sweetbox'];
    this.sampleChartOptions.title.text = "Dữ liệu mẫu - Lợi nhuận theo loại ghế";

    // Cập nhật tooltip cho dữ liệu mẫu
    this.sampleChartOptions.tooltip = {
      theme: 'dark',
      x: {
        show: true
      },
      y: {
        formatter: function (val, opts): string {
          if (opts.seriesIndex === 0) {
            return val.toFixed(0) + " vé";
          } else if (opts.seriesIndex === 1) {
            return val.toLocaleString('vi-VN') + " đ";
          }
          return val.toString();
        }
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Roboto, sans-serif'
      },
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        const xLabel = w.globals.labels[dataPointIndex];
        let formattedValue = "";
        
        if (w.globals.seriesNames[seriesIndex] === "Số lượng vé bán") {
          formattedValue = value.toFixed(0) + " vé";
        } else {
          formattedValue = value.toLocaleString('vi-VN') + " đ";
        }
        
        return `<div class="custom-tooltip">
          <span class="tooltip-title">${xLabel} - ${w.globals.seriesNames[seriesIndex]}</span>
          <div class="tooltip-value">${formattedValue}</div>
        </div>`;
      },
      marker: {
        show: true,
      },
      fixed: {
        enabled: false,
        position: 'topRight'
      }
    };
  }

  /**
   * Tải dữ liệu biểu đồ
   */
  loadChartData(): void {
    this.isLoading = true;
    this.hasData = false;
    
    this.statisticService.getSeatProfitability(
      this.currentDateRange.startDate || undefined,
      this.currentDateRange.endDate || undefined
    ).subscribe({
      next: (response: CommonResponse<StatisticSeatProfitabilityRes[]>) => {
        this.isLoading = false;
        
        if (response.data && response.data.length > 0) {
          this.hasData = true;
          this.updateChart(response.data);
        }
      },
      error: (error: any) => {
        console.error('Error loading seat profitability data', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Cập nhật biểu đồ với dữ liệu thực
   */
  private updateChart(data: StatisticSeatProfitabilityRes[]): void {
    // Sắp xếp dữ liệu theo doanh thu (giảm dần)
    const sortedData = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Lấy tên loại ghế
    const categories = sortedData.map(item => item.seatTypeName);
    
    // Lấy dữ liệu số lượng vé đã bán
    const ticketsSoldData = sortedData.map(item => item.totalTicketsSold);
    
    // Lấy dữ liệu doanh thu
    const revenueData = sortedData.map(item => item.totalRevenue);
    
    // Cập nhật options
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: "Số lượng vé bán",
          data: ticketsSoldData
        },
        {
          name: "Doanh thu",
          data: revenueData
        }
      ],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };
  }

  exportDataToExcel(): void {
    if (!this.hasData) return;
    
    // Chuẩn bị dữ liệu xuất Excel
    const exportData = this.chartOptions.xaxis.categories.map((category: string, index: number) => {
      return {
        'Loại ghế': category,
        'Số lượng vé (Chiếc)': this.chartOptions.series[0].data[index],
        'Doanh thu (VNĐ)': this.chartOptions.series[1].data[index]
      };
    });
    
    this.exportService.exportToExcel(
      exportData,
      'loi_nhuan_theo_ghe',
      'Lợi nhuận ghế',
      this.currentDateRange
    );
  }
} 