import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../services/employee.service';

@Component({
  selector: 'app-emp-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './emp-management.component.html',
  styleUrl: './emp-management.component.css'
})
export class EmpManagementComponent implements OnInit {
  employees: Employee[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  totalPages = 0;
  pages: number[] = [];

  constructor(
    private employeeService: EmployeeService
  ) { }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployeeList(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.employees = response.data;
          this.totalRecords = response.totalRecord;
          this.calculateTotalPages();
        },
        error: (error) => {
          console.error('Error loading employees:', error);
        }
      });
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadEmployees();
  }

  onDeleteEmployee(id: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
        }
      });
    }
  }

  onLockoutEmployee(id: string) {
    if (confirm('Are you sure you want to lockout this employee?')) {
      this.employeeService.lockoutEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error locking out employee:', error);
        }
      });
    }
  }
}