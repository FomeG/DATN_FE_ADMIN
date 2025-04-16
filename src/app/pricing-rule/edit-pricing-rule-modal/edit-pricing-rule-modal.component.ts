import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PricingRuleService, PricingRule } from '../../services/pricing-rule.service';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-edit-pricing-rule-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-pricing-rule-modal.component.html',
  styleUrl: './edit-pricing-rule-modal.component.css'
})
export class EditPricingRuleModalComponent {
  @Input() rule: PricingRule | null = null;
  @Output() ruleUpdated = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();
  private modalInstance?: Modal;
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
            this.closeModal();
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
  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
      this.modalClosed.emit(); // Phát sự kiện khi đóng modal
    }
  }
} 