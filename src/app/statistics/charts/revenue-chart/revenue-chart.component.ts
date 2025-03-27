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
    NgApexchartsModule
} from 'ng-apexcharts';

import { StatisticService } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { ExportService } from '../../shared/services/export.service';

// Define interfaces for the API response data
interface StatisticRevenueByTimeRes {
    orderDate: Date;
    hourOfDay: number;
    totalRevenue: number;
    totalOrders: number;
}

interface StatisticRevenueByCinemaRes {
    cinemaName: string;
    totalRevenue: number;
    totalOrders: number;
}

interface CommonResponse<T> {
    responseCode: number;
    message: string;
    data: T;
    totalRecord?: number;
}

export type RevenueChartOptions = {
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
};

@Component({
    selector: 'app-revenue-chart',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule],
    providers: [StatisticService],
    template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title">Biểu đồ doanh thu theo thời gian</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportTimeRevenueToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadRevenueByTimeData()">
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
        
        <div *ngIf="!isLoading && hasData">
          <div id="revenue-chart">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [xaxis]="chartOptions.xaxis"
              [stroke]="chartOptions.stroke"
              [dataLabels]="chartOptions.dataLabels"
              [yaxis]="chartOptions.yaxis"
              [labels]="chartOptions.labels"
              [legend]="chartOptions.legend"
              [fill]="chartOptions.fill"
              [tooltip]="chartOptions.tooltip"
            ></apx-chart>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title">Doanh thu theo rạp</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportCinemaRevenueToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadRevenueByCinemaData()">
            <i class="mdi mdi-refresh"></i> Tải lại
          </button>
        </div>
      </div>
      <div class="card-body">
        <div *ngIf="isLoadingCinema" class="text-center p-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        
        <div *ngIf="!isLoadingCinema && !hasCinemaData" class="text-center p-5">
          <p class="text-muted">Không có dữ liệu trong khoảng thời gian đã chọn</p>
        </div>
        
        <div *ngIf="!isLoadingCinema && hasCinemaData">
          <div id="cinema-revenue-chart">
            <apx-chart
              [series]="cinemaChartOptions.series"
              [chart]="cinemaChartOptions.chart"
              [xaxis]="cinemaChartOptions.xaxis"
              [stroke]="cinemaChartOptions.stroke"
              [dataLabels]="cinemaChartOptions.dataLabels"
              [yaxis]="cinemaChartOptions.yaxis"
              [labels]="cinemaChartOptions.labels"
              [legend]="cinemaChartOptions.legend"
              [fill]="cinemaChartOptions.fill"
              [tooltip]="cinemaChartOptions.tooltip"
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
    
    /* CSS cho các menu items thêm văn bản */
    :global(.apexcharts-menu-icon) {
      color: white !important;
      background-color: rgba(0,0,0,0.5) !important;
      border-radius: 50% !important;
      padding: 3px !important;
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
      
      :global(.apexcharts-grid-borders line),
      :global(.apexcharts-grid line) {
        stroke: #4a5568 !important;
      }
      
      :global(.apexcharts-xaxis line),
      :global(.apexcharts-yaxis line) {
        stroke: #4a5568 !important;
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
  `]
})
export class RevenueChartComponent implements OnInit, OnDestroy {
    chartOptions!: RevenueChartOptions;
    cinemaChartOptions!: RevenueChartOptions;

    isLoading = true;
    isLoadingCinema = true;
    hasData = false;
    hasCinemaData = false;

    private dateRangeSubscription!: Subscription;
    private currentDateRange: DateRange = {} as DateRange;

    constructor(
        private statisticService: StatisticService,
        private dashboardService: DashboardService,
        private exportService: ExportService
    ) {
        this.initChartOptions();
        this.initCinemaChartOptions();
    }

    ngOnInit(): void {
        this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(dateRange => {
            this.currentDateRange = dateRange;
            this.loadRevenueByTimeData();
            this.loadRevenueByCinemaData();
        });
    }

    ngOnDestroy(): void {
        if (this.dateRangeSubscription) {
            this.dateRangeSubscription.unsubscribe();
        }
    }

    loadRevenueByTimeData(): void {
        this.isLoading = true;
        this.hasData = false;

        if (!this.currentDateRange) {
            this.isLoading = false;
            return;
        }

        this.statisticService.getRevenueByTime(
            this.currentDateRange.startDate || undefined,
            this.currentDateRange.endDate || undefined
        ).subscribe({
            next: (response: CommonResponse<StatisticRevenueByTimeRes[]>) => {
                this.isLoading = false;

                if (response && response.data && response.data.length > 0) {
                    this.hasData = true;
                    this.updateTimeChart(response.data);
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                console.error('Error loading revenue by time data', error);
            }
        });
    }

    loadRevenueByCinemaData(): void {
        this.isLoadingCinema = true;
        this.hasCinemaData = false;

        if (!this.currentDateRange) {
            this.isLoadingCinema = false;
            return;
        }

        this.statisticService.getRevenueByCinema(
            this.currentDateRange.startDate || undefined,
            this.currentDateRange.endDate || undefined
        ).subscribe({
            next: (response: CommonResponse<StatisticRevenueByCinemaRes[]>) => {
                this.isLoadingCinema = false;

                if (response && response.data && response.data.length > 0) {
                    this.hasCinemaData = true;
                    this.updateCinemaChart(response.data);
                }
            },
            error: (error: any) => {
                this.isLoadingCinema = false;
                console.error('Error loading revenue by cinema data', error);
            }
        });
    }

    private updateTimeChart(data: StatisticRevenueByTimeRes[]): void {
        // Xử lý dữ liệu cho biểu đồ thời gian
        const categories: string[] = [];
        const seriesData: number[] = [];

        // Sắp xếp dữ liệu theo ngày
        data.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());

        data.forEach(item => {
            const date = new Date(item.orderDate);
            const formattedDate = date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            categories.push(formattedDate);
            seriesData.push(item.totalRevenue);
        });

        this.chartOptions.series = [{
            name: 'Doanh thu',
            data: seriesData
        }];

        this.chartOptions.xaxis.categories = categories;
    }

    private updateCinemaChart(data: StatisticRevenueByCinemaRes[]): void {
        // Xử lý dữ liệu cho biểu đồ rạp
        const categories: string[] = [];
        const seriesData: number[] = [];

        data.forEach(item => {
            categories.push(item.cinemaName);
            seriesData.push(item.totalRevenue);
        });

        this.cinemaChartOptions.series = [{
            name: 'Doanh thu',
            data: seriesData
        }];

        this.cinemaChartOptions.xaxis.categories = categories;
    }

    private initChartOptions(): void {
        this.chartOptions = {
            series: [{
                name: 'Doanh thu',
                data: []
            }],
            chart: {
                height: 350,
                type: 'line',
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
                            filename: 'Doanh thu theo thời gian',
                            columnDelimiter: ',',
                            headerCategory: 'Thời gian',
                            headerValue: 'Giá trị',
                        },
                        svg: {
                            filename: 'Doanh thu theo thời gian',
                        },
                        png: {
                            filename: 'Doanh thu theo thời gian',
                        }
                    },
                }
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 3,
                curve: 'smooth',
                colors: ['#4e73df']
            },
            xaxis: {
                categories: [],
                title: {
                    text: 'Thời gian'
                }
            },
            yaxis: {
                title: {
                    text: 'Doanh thu (VNĐ)'
                },
                labels: {
                    formatter: (val) => {
                        return val.toLocaleString('vi-VN') + ' đ';
                    }
                }
            },
            fill: {
                opacity: 1,
                colors: ['#4e73df']
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: (val) => {
                        return val.toLocaleString('vi-VN') + ' đ';
                    }
                },
                custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                    const value = series[seriesIndex][dataPointIndex];
                    const formattedValue = value.toLocaleString('vi-VN') + ' đ';
                    const category = w.globals.categoryLabels[dataPointIndex];

                    return `
            <div class="custom-tooltip">
              <span class="tooltip-title">${category}</span>
              <span class="tooltip-value">${formattedValue}</span>
            </div>
          `;
                }
            },
            title: {
                text: 'Doanh thu theo thời gian',
                align: 'left'
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                floating: true,
                offsetY: -25,
                offsetX: -5
            },
            labels: []
        };
    }

    private initCinemaChartOptions(): void {
        this.cinemaChartOptions = {
            series: [{
                name: 'Doanh thu',
                data: []
            }],
            chart: {
                height: 350,
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
                            filename: 'Doanh thu theo rạp',
                            columnDelimiter: ',',
                            headerCategory: 'Rạp',
                            headerValue: 'Giá trị',
                        },
                        svg: {
                            filename: 'Doanh thu theo rạp',
                        },
                        png: {
                            filename: 'Doanh thu theo rạp',
                        }
                    },
                }
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: [],
                title: {
                    text: 'Rạp chiếu phim'
                }
            },
            yaxis: {
                title: {
                    text: 'Doanh thu (VNĐ)'
                },
                labels: {
                    formatter: (val) => {
                        return val.toLocaleString('vi-VN') + ' đ';
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
                    formatter: (val) => {
                        return val.toLocaleString('vi-VN') + ' đ';
                    }
                },
                custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                    const value = series[seriesIndex][dataPointIndex];
                    const formattedValue = value.toLocaleString('vi-VN') + ' đ';
                    const category = w.globals.categoryLabels[dataPointIndex];

                    return `
            <div class="custom-tooltip">
              <span class="tooltip-title">${category}</span>
              <span class="tooltip-value">${formattedValue}</span>
            </div>
          `;
                }
            },
            title: {
                text: 'Doanh thu theo rạp',
                align: 'left'
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                floating: true,
                offsetY: -25,
                offsetX: -5
            },
            labels: []
        };
    }

    exportTimeRevenueToExcel(): void {
        if (!this.hasData) return;

        // Chuẩn bị dữ liệu xuất Excel có định dạng tốt hơn
        const exportData = this.chartOptions.series[0].data.map((value, index) => {
            return {
                'Thời gian': this.chartOptions.xaxis.categories[index],
                'Doanh thu (VNĐ)': value
            };
        });

        this.exportService.exportToExcel(exportData, 'doanh_thu_theo_thoi_gian', 'Doanh thu', this.currentDateRange);
    }

    exportCinemaRevenueToExcel(): void {
        if (!this.hasCinemaData) return;

        // Chuẩn bị dữ liệu xuất Excel có định dạng tốt hơn
        const exportData = this.cinemaChartOptions.series[0].data.map((value, index) => {
            return {
                'Rạp chiếu phim': this.cinemaChartOptions.xaxis.categories[index],
                'Doanh thu (VNĐ)': value
            };
        });

        this.exportService.exportToExcel(exportData, 'doanh_thu_theo_rap', 'Doanh thu', this.currentDateRange);
    }
} 