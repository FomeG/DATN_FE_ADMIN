import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PricingRuleService, PricingRule } from '../../services/pricing-rule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-pricing-rule-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="editPricingRuleModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Edit Pricing Rule</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="ruleForm" class="p-2">
              <!-- Rule Name Display -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-primary">Rule Name</label>
                <div class="form-control-plaintext border-bottom">{{ rule?.ruleName }}</div>
              </div>

              <!-- Multiplier Input -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-primary">Multiplier Value</label>
                <div class="input-group">
                  <input type="number" 
                         class="form-control" 
                         formControlName="multiplier"
                         [class.is-invalid]="ruleForm.get('multiplier')?.invalid && ruleForm.get('multiplier')?.touched"
                         step="0.1">
                  <span class="input-group-text">×</span>
                </div>
                <div class="form-text text-muted">Enter the multiplier value for price calculation</div>
                <div class="invalid-feedback" *ngIf="ruleForm.get('multiplier')?.errors?.['required']">
                  Multiplier is required
                </div>
                <div class="invalid-feedback" *ngIf="ruleForm.get('multiplier')?.errors?.['min']">
                  Multiplier must be greater than or equal to 0
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="button" 
                    class="btn btn-primary" 
                    (click)="onSubmit()" 
                    [disabled]="!ruleForm.valid">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-header {
      background-color: #f8f9fa;
      border-bottom: 2px solid #e9ecef;
    }
    .modal-footer {
      background-color: #f8f9fa;
      border-top: 2px solid #e9ecef;
    }
    .form-label {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .form-control {
      border: 1px solid #ced4da;
      padding: 0.5rem 0.75rem;
    }
    .form-control:focus {
      border-color: #86b7fe;
      box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
    }
    .form-control-plaintext {
      font-size: 1rem;
      padding: 0.5rem 0;
      color: #212529;
    }
    .form-text {
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .input-group-text {
      background-color: #e9ecef;
      border: 1px solid #ced4da;
    }
  `]
})
export class EditPricingRuleModalComponent {
  @Input() rule: PricingRule | null = null;
  @Output() ruleUpdated = new EventEmitter<void>();

  ruleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private pricingRuleService: PricingRuleService
  ) {
    this.ruleForm = this.fb.group({
      multiplier: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnChanges(): void {
    if (this.rule) {
      this.ruleForm.patchValue({
        multiplier: this.rule.multiplier
      });
    }
  }

  onSubmit(): void {
    if (this.ruleForm.valid && this.rule) {
      this.pricingRuleService.updateRuleMultiplier(
        this.rule.pricingRuleId,
        this.ruleForm.value.multiplier
      ).subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            Swal.fire('Success', 'Rule updated successfully', 'success');
            this.ruleUpdated.emit();
            // Close modal
            const modal = document.getElementById('editPricingRuleModal');
            if (modal) {
              const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
              if (modalInstance) {
                modalInstance.hide();
              }
            }
          } else {
            Swal.fire('Error', response.message, 'error');
          }
        },
        error: (error) => {
          console.error('Error updating rule:', error);
          Swal.fire('Error', 'Failed to update rule', 'error');
        }
      });
    }
  }
} 