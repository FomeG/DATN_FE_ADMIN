import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActorService, Actor } from '../services/actor.service';

@Component({
  selector: 'app-actor-management',
  templateUrl: './actor-management.component.html',
  styleUrls: ['./actor-management.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
  providers: [DatePipe]
})
export class ActorManagementComponent implements OnInit {
  actors: Actor[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  actorForm: FormGroup;
  selectedActor: Actor | null = null;
  selectedFile: File | null = null;
  isEditing = false;

  constructor(
    private actorService: ActorService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.actorForm = this.fb.group({
      name: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      biography: ['', Validators.required],
      status: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadActors();
  }

  loadActors() {
    this.actorService.getActors(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (res) => {
          this.actors = res.data;
          this.totalRecords = res.totalRecord;
        },
        error: (error) => {
          console.error('Error loading actors:', error);
        }
      });
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmit() {
    if (this.actorForm.valid) {
      const formData = new FormData();
      Object.keys(this.actorForm.value).forEach(key => {
        if (key !== 'photo') {
          formData.append(key, this.actorForm.value[key]);
        }
      });

      if (this.selectedFile) {
        formData.append('photo', this.selectedFile);
      }

      if (this.isEditing && this.selectedActor) {
        this.actorService.updateActor(this.selectedActor.id, formData)
          .subscribe({
            next: () => {
              this.loadActors();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error updating actor:', error);
            }
          });
      } else {
        this.actorService.createActor(formData)
          .subscribe({
            next: () => {
              this.loadActors();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error creating actor:', error);
            }
          });
      }
    }
  }

  editActor(actor: Actor) {
    this.isEditing = true;
    this.selectedActor = actor;
    this.actorForm.patchValue({
      name: actor.name,
      dateOfBirth: new Date(actor.dateOfBirth).toISOString().split('T')[0],
      biography: actor.biography,
      status: actor.status
    });
  }

  deleteActor(id: string) {
    if (confirm('Are you sure you want to delete this actor?')) {
      this.actorService.deleteActor(id)
        .subscribe({
          next: () => {
            this.loadActors();
          },
          error: (error) => {
            console.error('Error deleting actor:', error);
          }
        });
    }
  }

  resetForm() {
    this.actorForm.reset();
    this.selectedActor = null;
    this.isEditing = false;
    this.selectedFile = null;
    this.actorForm.patchValue({ status: 1 });
  }

  onPageChange(page: number) {
    if (page >= 1 && (page - 1) * this.recordPerPage < this.totalRecords) {
      this.currentPage = page;
      this.loadActors();
    }
  }
}