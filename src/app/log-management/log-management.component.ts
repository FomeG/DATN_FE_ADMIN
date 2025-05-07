import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Log {
  id: number;
  userId?: string;
  action: string;
  tableName: string;
  recordId: string;
  beforeChange: string;
  afterChange: string;
  changeDateTime: string;
  parsedBeforeChange?: any;
  parsedAfterChange?: any;
}

interface ApiResponse {
  responseCode: number;
  message: string;
  data: Log[];
  totalRecord: number;
}

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './log-management.component.html',
  styleUrl: './log-management.component.css'
})
export class LogManagementComponent implements OnInit {
  logs: Log[] = [];
  currentPage: number = 1;
  recordPerPage: number = 10;
  totalRecords: number = 0;
  pages: number[] = [];
  loading: boolean = false;
  error: string | null = null;
  Math = Math; // Make Math available in the template

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = null;

    this.http.get<ApiResponse>(`https://localhost:7263/api/Log/GetLogs?currentPage=${this.currentPage}&recordPerPage=${this.recordPerPage}`)
      .subscribe({
        next: (response) => {
          this.logs = response.data.map(log => {
            // Try to parse JSON strings
            let parsedBefore = null;
            let parsedAfter = null;

            try {
              if (log.beforeChange) {
                parsedBefore = JSON.parse(log.beforeChange);
              }
            } catch (e) {
              console.warn('Could not parse beforeChange JSON:', e);
            }

            try {
              if (log.afterChange) {
                parsedAfter = JSON.parse(log.afterChange);
              }
            } catch (e) {
              console.warn('Could not parse afterChange JSON:', e);
            }

            return {
              ...log,
              parsedBeforeChange: parsedBefore,
              parsedAfterChange: parsedAfter,
              // Format date for better display if needed
              changeDateTime: new Date(log.changeDateTime).toLocaleString()
            };
          });

          this.totalRecords = response.totalRecord;
          this.calculatePages();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching logs:', error);
          this.error = 'Failed to load logs. Please try again later.';
          this.loading = false;
        }
      });
  }

  getKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  calculatePages(): void {
    const totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = [];

    // Calculate the range of pages to show
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  onPageChange(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalRecords / this.recordPerPage) || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadLogs();
  }

  // Helper function to format JSON for display
  formatJson(jsonStr: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch (e) {
      return jsonStr || 'N/A';
    }
  }

  // Check if a value is an array
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  // Check if a value is an object
  isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}