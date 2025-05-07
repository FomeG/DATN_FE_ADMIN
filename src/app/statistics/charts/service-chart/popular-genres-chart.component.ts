import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexDataLabels,
  ApexTooltip,
  ApexStates,
  NgApexchartsModule
} from 'ng-apexcharts';

import { StatisticService, StatisticPopularGenresRes } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { ExportService } from '../../shared/services/export.service';

// Define the chart options interface
export type PopularGenresChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  states: ApexStates;
  colors: string[];
};

interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
  totalRecord?: number;
}

@Component({
  selector: 'app-popular-genres-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title">Thể loại phim phổ biến</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportPopularGenresToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadPopularGenresData()">
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
          <div id="popular-genres-chart">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [labels]="chartOptions.labels"
              [responsive]="chartOptions.responsive"
              [dataLabels]="chartOptions.dataLabels"
              [legend]="chartOptions.legend"
              [colors]="chartOptions.colors"
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
export class PopularGenresChartComponent implements OnInit, OnDestroy {
  chartOptions!: PopularGenresChartOptions;
  isLoading = true;
  hasData = false;
  isSampleData = false;

  private dateRangeSubscription!: Subscription;
  private currentDateRange: DateRange = {} as DateRange;
  private currentPopularGenresData: StatisticPopularGenresRes[] = [];

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
      this.loadPopularGenresData();
    });
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  loadPopularGenresData(): void {
    this.isLoading = true;
    this.hasData = false;
    this.isSampleData = false;
    
    const startDate = this.currentDateRange?.startDate ?? undefined;
    const endDate = this.currentDateRange?.endDate ?? undefined;
    
    this.statisticService.getPopularGenres(startDate, endDate).subscribe({
      next: (response: CommonResponse<StatisticPopularGenresRes[]>) => {
        this.isLoading = false;
        console.log('Kết quả API thể loại phim phổ biến:', response);

        if (response && response.data && response.data.length > 0) {
          this.hasData = true;
          this.isSampleData = false;
          this.currentPopularGenresData = response.data;
          this.updateChart(response.data);
        } else {
          console.log('Không có dữ liệu thể loại phim phổ biến, hiển thị dữ liệu mẫu');
          this.hasData = true;
          this.isSampleData = true;
          this.updateChartWithSampleData();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Lỗi khi tải dữ liệu thể loại phim phổ biến:', error);
        this.hasData = true;
        this.isSampleData = true;
        this.updateChartWithSampleData();
      }
    });
  }

  private updateChart(data: StatisticPopularGenresRes[]): void {
    // Giới hạn số lượng thể loại hiển thị (top 10)
    data.sort((a, b) => b.totalBookedSeats - a.totalBookedSeats);
    const topData = data.slice(0, 10);
    
    const labels: string[] = [];
    const series: number[] = [];
    
    // Xử lý từng thể loại phim
    topData.forEach(item => {
      labels.push(item.genreName);
      // Sử dụng số lượng ghế đã đặt
      series.push(item.totalBookedSeats);
    });

    this.chartOptions.series = series;
    this.chartOptions.labels = labels;
  }

  /**
   * Cập nhật biểu đồ với dữ liệu mẫu khi không có dữ liệu thực
   */
  private updateChartWithSampleData(): void {
    const sampleData: StatisticPopularGenresRes[] = [
      { genreName: 'Tình Cảm', totalShowtimes: 5, totalBookedSeats: 76 },
      { genreName: 'Gia Đình', totalShowtimes: 5, totalBookedSeats: 72 },
      { genreName: 'Kịch', totalShowtimes: 2, totalBookedSeats: 71 },
      { genreName: 'Kinh Dị', totalShowtimes: 3, totalBookedSeats: 65 },
      { genreName: 'Xã Hội', totalShowtimes: 2, totalBookedSeats: 51 },
      { genreName: 'Viễn Tưởng', totalShowtimes: 7, totalBookedSeats: 11 },
      { genreName: 'Tâm Lý', totalShowtimes: 1, totalBookedSeats: 2 },
      { genreName: 'Hành Động', totalShowtimes: 1, totalBookedSeats: 1 }
    ];
    
    this.updateChart(sampleData);
  }

  private initChartOptions(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'pie',
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
          },
          export: {
            csv: {
              filename: 'Thể loại phim phổ biến',
              columnDelimiter: ',',
              headerCategory: 'Thể loại',
              headerValue: 'Doanh thu',
            },
            svg: {
              filename: 'Thể loại phim phổ biến',
            },
            png: {
              filename: 'Thể loại phim phổ biến',
            }
          },
        }
      },
      labels: [],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ],
      dataLabels: {
        enabled: true,
        formatter: function(val: number, opts) {
          return opts.w.globals.labels[opts.seriesIndex] + ': ' + val.toFixed(1) + '%';
        },
        style: {
          fontSize: '14px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: ['#fff']
        },
        dropShadow: {
          enabled: true,
          blur: 3,
          opacity: 0.8
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontSize: '14px',
        labels: {
          colors: '#fff',
        },
        markers: {
          strokeWidth: 0,
          offsetX: 0,
          offsetY: 0
        },
        itemMargin: {
          horizontal: 5,
          vertical: 5
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function(val: number) {
            return val + ' lượt đặt vé';
          }
        },
        custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
          const value = series[seriesIndex];
          const label = w.globals.labels[seriesIndex];
          const percent = w.globals.seriesPercent[seriesIndex][0].toFixed(1);
          
          return `
            <div class="custom-tooltip">
              <span class="tooltip-title">${label}</span>
              <span class="tooltip-value">${value} lượt đặt vé (${percent}%)</span>
            </div>
          `;
        }
      },
      states: {
        hover: {
          filter: {
            type: 'darken'
          }
        },
        active: {
          filter: {
            type: 'darken'
          }
        }
      },
      colors: [
        '#4e73df', // Xanh dương
        '#1cc88a', // Xanh lá
        '#36b9cc', // Xanh lam
        '#f6c23e', // Vàng
        '#e74a3b', // Đỏ
        '#fd7e14', // Cam
        '#6f42c1', // Tím
        '#20c997', // Ngọc
        '#f39c12', // Vàng đậm
        '#6610f2'  // Tím đậm
      ]
    };
  }

  exportPopularGenresToExcel(): void {
    if (!this.hasData) return;

    // Lấy dữ liệu hiện tại đang hiển thị trên biểu đồ
    const genresData = this.chartOptions.labels.map((genre: string, index: number) => {
      // Tìm dữ liệu tổng số suất chiếu từ data gốc nếu có
      const genreData = this.currentPopularGenresData.find(item => item.genreName === genre);
      
      return {
        'Thể loại': genre,
        'Số suất chiếu': genreData?.totalShowtimes || 0,
        'Lượt đặt vé': this.chartOptions.series[index]
      };
    });

    this.exportService.exportToExcel(
      genresData, 
      'the_loai_phim_pho_bien', 
      'Thể loại phim phổ biến', 
      this.currentDateRange
    );
  }
} 