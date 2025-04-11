import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subscription } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexStroke,
  ApexChart
} from "ng-apexcharts";

import { StatisticService, StatisticSummaryDateRangeDetail, CommonResponse } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  title: ApexTitleSubtitle;
  fill: ApexFill;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  grid: any;
  colors: any;
  toolbar: any;
};

@Component({
  selector: 'app-sync-charts',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './sync-charts.component.html',
  styleUrls: ['./sync-charts.component.css']
})
export class SyncChartsComponent implements OnInit, OnDestroy {
  public revenueChartOptions: Partial<ChartOptions> = {};
  public ordersChartOptions: Partial<ChartOptions> = {};
  public ticketsChartOptions: Partial<ChartOptions> = {};
  public servicesChartOptions: Partial<ChartOptions> = {};

  public commonOptions: Partial<ChartOptions> = {
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    markers: {
      size: 3,
      hover: {
        size: 5
      }
    },
    tooltip: {
      followCursor: false,
      theme: "dark",
      x: {
        show: true,
        format: 'dd MMM yyyy'
      },
      marker: {
        show: true
      },
      y: {
        title: {
          formatter: function() {
            return "";
          }
        }
      }
    },
    grid: {
      borderColor: '#2c2e33',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: 'dd/MM/yyyy',
        style: {
          colors: '#ffffff'
        }
      },
      axisBorder: {
        color: '#2c2e33'
      },
      axisTicks: {
        color: '#2c2e33'
      }
    }
  };

  private dateRangeSubscription!: Subscription;
  private currentDateRange: DateRange = {} as DateRange;

  isLoading = true;
  hasData = false;
  isSampleData = false;
  chartData: StatisticSummaryDateRangeDetail[] = [];

  constructor(
    private statisticService: StatisticService,
    private dashboardService: DashboardService
  ) {
    this.initCharts();
  }

  ngOnInit(): void {
    this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(dateRange => {
      this.currentDateRange = dateRange;
      this.loadChartData();
    });
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  private initCharts(): void {
    // Khởi tạo biểu đồ doanh thu
    this.revenueChartOptions = {
      series: [
        {
          name: "Doanh thu",
          data: []
        }
      ],
      chart: {
        id: "revenue",
        group: "statistics",
        type: "line",
        height: 140,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        background: '#191c24'
      },
      colors: ["#008FFB"],
      title: {
        text: "Doanh thu",
        align: "left",
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff'
        }
      },
      yaxis: {
        tickAmount: 3,
        labels: {
          minWidth: 40,
          formatter: (value) => {
            return this.formatCurrency(value);
          },
          style: {
            colors: ['#ffffff']
          }
        }
      }
    };

    // Khởi tạo biểu đồ số đơn hàng
    this.ordersChartOptions = {
      series: [
        {
          name: "Đơn hàng",
          data: []
        }
      ],
      chart: {
        id: "orders",
        group: "statistics",
        type: "line",
        height: 140,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        background: '#191c24'
      },
      colors: ["#546E7A"],
      title: {
        text: "Số đơn hàng",
        align: "left",
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff'
        }
      },
      yaxis: {
        tickAmount: 3,
        labels: {
          minWidth: 40,
          style: {
            colors: ['#ffffff']
          }
        }
      }
    };

    // Khởi tạo biểu đồ số vé
    this.ticketsChartOptions = {
      series: [
        {
          name: "Vé",
          data: []
        }
      ],
      chart: {
        id: "tickets",
        group: "statistics",
        type: "line",
        height: 140,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        background: '#191c24'
      },
      colors: ["#00E396"],
      title: {
        text: "Số vé",
        align: "left",
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff'
        }
      },
      yaxis: {
        tickAmount: 3,
        labels: {
          minWidth: 40,
          style: {
            colors: ['#ffffff']
          }
        }
      }
    };

    // Khởi tạo biểu đồ số dịch vụ
    this.servicesChartOptions = {
      series: [
        {
          name: "Dịch vụ",
          data: []
        }
      ],
      chart: {
        id: "services",
        group: "statistics",
        type: "line",
        height: 140,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        background: '#191c24'
      },
      colors: ["#FEB019"],
      title: {
        text: "Số dịch vụ",
        align: "left",
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff'
        }
      },
      yaxis: {
        tickAmount: 3,
        labels: {
          minWidth: 40,
          style: {
            colors: ['#ffffff']
          }
        }
      }
    };
  }

  private loadChartData(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.currentDateRange;

    // Chuyển đổi kiểu dữ liệu từ Date | null sang Date | undefined
    const start = startDate || undefined;
    const end = endDate || undefined;

    this.statisticService.getSummaryDateRangeDetail(start, end).subscribe({
      next: (response: CommonResponse<StatisticSummaryDateRangeDetail[]>) => {
        this.isLoading = false;
        console.log('Kết quả API chi tiết thống kê:', response);

        if (response && response.data && response.data.length > 0) {
          this.hasData = true;
          this.isSampleData = false;
          this.chartData = response.data;
          this.updateCharts(response.data);
        } else {
          console.log('Không có dữ liệu chi tiết thống kê, hiển thị dữ liệu mẫu');
          this.hasData = true;
          this.isSampleData = true;
          this.updateChartsWithSampleData();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Lỗi khi tải dữ liệu chi tiết thống kê:', error);
        this.hasData = true;
        this.isSampleData = true;
        this.updateChartsWithSampleData();
      }
    });
  }

  private updateCharts(data: StatisticSummaryDateRangeDetail[]): void {
    // Chuẩn bị dữ liệu cho các biểu đồ
    const revenueData: [number, number][] = [];
    const ordersData: [number, number][] = [];
    const ticketsData: [number, number][] = [];
    const servicesData: [number, number][] = [];

    data.forEach(item => {
      const timestamp = new Date(item.date).getTime();
      revenueData.push([timestamp, item.totalRevenue]);
      ordersData.push([timestamp, item.totalOrders]);
      ticketsData.push([timestamp, item.totalTickets]);
      servicesData.push([timestamp, item.totalServices]);
    });

    // Cập nhật dữ liệu cho các biểu đồ
    this.revenueChartOptions.series = [{
      name: 'Doanh thu',
      data: revenueData
    }];

    this.ordersChartOptions.series = [{
      name: 'Đơn hàng',
      data: ordersData
    }];

    this.ticketsChartOptions.series = [{
      name: 'Vé',
      data: ticketsData
    }];

    this.servicesChartOptions.series = [{
      name: 'Dịch vụ',
      data: servicesData
    }];
  }

  private updateChartsWithSampleData(): void {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 30); // Bắt đầu từ 30 ngày trước

    const revenueData = this.generateSampleData(baseDate.getTime(), 30, { min: 1000000, max: 10000000 });
    const ordersData = this.generateSampleData(baseDate.getTime(), 30, { min: 10, max: 100 });
    const ticketsData = this.generateSampleData(baseDate.getTime(), 30, { min: 50, max: 500 });
    const servicesData = this.generateSampleData(baseDate.getTime(), 30, { min: 20, max: 200 });

    this.revenueChartOptions.series = [{
      name: 'Doanh thu',
      data: revenueData
    }];

    this.ordersChartOptions.series = [{
      name: 'Đơn hàng',
      data: ordersData
    }];

    this.ticketsChartOptions.series = [{
      name: 'Vé',
      data: ticketsData
    }];

    this.servicesChartOptions.series = [{
      name: 'Dịch vụ',
      data: servicesData
    }];
  }

  private generateSampleData(baseval: number, count: number, yrange: { min: number, max: number }): [number, number][] {
    let i = 0;
    let series: [number, number][] = [];
    while (i < count) {
      const x = baseval;
      const y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push([x, y]);
      baseval += 86400000; // Thêm 1 ngày (tính bằng milliseconds)
      i++;
    }
    return series;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  }
}
