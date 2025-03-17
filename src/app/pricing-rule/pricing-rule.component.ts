import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingRuleService, PricingRule } from '../services/pricing-rule.service';
import { AddPricingRuleModalComponent } from './add-pricing-rule-modal/add-pricing-rule-modal.component';
import { EditPricingRuleModalComponent } from './edit-pricing-rule-modal/edit-pricing-rule-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pricing-rule',
  standalone: true,
  imports: [CommonModule, AddPricingRuleModalComponent, EditPricingRuleModalComponent],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Pricing Rules</h5>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addPricingRuleModal">
          Add New Rule
        </button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Multiplier</th>
                <th>Time Range</th>
                <th>Date Range</th>
                <th>Special Conditions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rule of rules">
                <td>{{ rule.ruleName }}</td>
                <td>{{ rule.multiplier }}</td>
                <td>
                  <ng-container *ngIf="rule.startTime && rule.endTime">
                    {{ rule.startTime }} - {{ rule.endTime }}
                  </ng-container>
                </td>
                <td>
                  <ng-container *ngIf="rule.startDate && rule.endDate">
                    {{ rule.startDate | date }} - {{ rule.endDate | date }}
                  </ng-container>
                </td>
                <td>
                  <div *ngIf="rule.specialDay">Special Day: {{ rule.specialDay }}</div>
                  <div *ngIf="rule.specialMonth">Special Month: {{ rule.specialMonth }}</div>
                  <div *ngIf="rule.dayOfWeek !== null">Day of Week: {{ ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][rule.dayOfWeek] }}</div>
                  <div *ngIf="rule.isDiscount">Discount Rule</div>
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" (click)="openEditModal(rule)">
                      Edit
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="deleteRule(rule.pricingRuleId)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div>
            Total Records: {{ totalRecords }}
          </div>
          <nav>
            <ul class="pagination mb-0">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <a class="page-link" (click)="onPageChange(currentPage - 1)">Previous</a>
              </li>
              <li class="page-item">
                <span class="page-link">Page {{ currentPage }}</span>
              </li>
              <li class="page-item" [class.disabled]="currentPage * recordPerPage >= totalRecords">
                <a class="page-link" (click)="onPageChange(currentPage + 1)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <app-add-pricing-rule-modal (ruleAdded)="loadRules()"></app-add-pricing-rule-modal>
    <app-edit-pricing-rule-modal [rule]="selectedRule" (ruleUpdated)="loadRules()"></app-edit-pricing-rule-modal>
  `,
  styles: [`
    .page-link {
      cursor: pointer;
    }

    .page-link:hover {
      background-color: #e9ecef;
    }

    .table th {
      white-space: nowrap;
    }
  `]
})
export class PricingRuleComponent implements OnInit {
  rules: PricingRule[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  selectedRule: PricingRule | null = null;

  constructor(private pricingRuleService: PricingRuleService) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.pricingRuleService.getAllRules(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.rules = response.data;
            this.totalRecords = response.totalRecord;
          } else {
            Swal.fire('Error', response.message, 'error');
          }
        },
        error: (error) => {
          console.error('Error loading rules:', error);
          Swal.fire('Error', 'Failed to load pricing rules', 'error');
        }
      });
  }

  openEditModal(rule: PricingRule): void {
    this.selectedRule = rule;
    const modal = document.getElementById('editPricingRuleModal');
    if (modal) {
      const modalInstance = new (window as any).bootstrap.Modal(modal);
      modalInstance.show();
    }
  }

  deleteRule(ruleId: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this rule!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pricingRuleService.deleteRule(ruleId)
          .subscribe({
            next: (response) => {
              if (response.responseCode === 200) {
                Swal.fire('Deleted!', 'Rule has been deleted.', 'success');
                this.loadRules();
              } else {
                Swal.fire('Error', response.message, 'error');
              }
            },
            error: (error) => {
              console.error('Error deleting rule:', error);
              Swal.fire('Error', 'Failed to delete rule', 'error');
            }
          });
      }
    });
  }

  onPageChange(page: number): void {
    if (page > 0 && (page - 1) * this.recordPerPage < this.totalRecords) {
      this.currentPage = page;
      this.loadRules();
    }
  }
} 