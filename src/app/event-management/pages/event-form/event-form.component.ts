import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, first } from 'rxjs/operators';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { EventService } from '../../services/event.service';
import { EventModel } from '../../models/event.model';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-event-form',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzButtonModule,
    NzCardModule,
    NzUploadModule,
    NzIconModule,
    NzMessageModule,
    NzSpinModule
  ],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss']
})
export class EventFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEdit = false;
  id?: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router, // public so template can use if needed
    private eventService: EventService,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    // build form with nested 'venue' group (use formGroupName in template)
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      startAt: [null, [Validators.required]],
      timezone: ['UTC'],
      venue: this.fb.group({
        name: [''],
        address1: [''],
        city: ['']
      }),
      primaryImage: [''],
      coverImage: [''],
      isPublic: [true]
    });

    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.isEdit = !!this.id;

    if (this.isEdit && this.id) {
      this.loading = true;
      this.eventService.getById(this.id).pipe(first()).subscribe({
        next: (ev) => {
          this.loading = false;
          if (!ev) {
            this.message.error('Event not found');
            this.router.navigate(['/', 'events']);
            return;
          }
          this.patchForm(ev);
        },
        error: () => {
          this.loading = false;
          this.message.error('Failed to load event');
        }
      });
    }
  }

  private patchForm(ev: EventModel) {
    this.form.patchValue({
      title: ev.title ?? '',
      description: ev.description ?? '',
      startAt: ev.startAt ? new Date(ev.startAt) : null,
      timezone: ev.timezone ?? 'UTC',
      venue: {
        name: ev.venue?.name ?? '',
        address1: ev.venue?.address1 ?? '',
        city: ev.venue?.city ?? ''
      },
      primaryImage: ev.primaryImage ?? '',
      coverImage: ev.coverImage ?? '',
      isPublic: typeof ev.isPublic === 'boolean' ? ev.isPublic : true
    });
  }

  removePrimary(): void {
    this.form.patchValue({ primaryImage: '' });
  }

  removeCover(): void {
    this.form.patchValue({ coverImage: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning('Please fix form errors');
      return;
    }

    const raw = this.form.value;
    // ensure startAt is ISO string
    const startAtIso = raw.startAt instanceof Date ? raw.startAt.toISOString() : raw.startAt;

    const payload: any = {
      title: raw.title,
      description: raw.description,
      startAt: startAtIso,
      timezone: raw.timezone,
      venue: {
        name: raw.venue.name,
        address1: raw.venue.address1,
        city: raw.venue.city
      },
      primaryImage: raw.primaryImage,
      coverImage: raw.coverImage,
      isPublic: raw.isPublic
    };

    this.loading = true;

    const req$ = this.isEdit && this.id
      ? this.eventService.update(this.id, payload)
      : this.eventService.create(payload);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.message.success(this.isEdit ? 'Event updated' : 'Event created');
        this.router.navigate(['/', 'events']);
      },
      error: () => {
        this.message.error('Save failed');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/', 'events']);
  }


  uploadPrimary({ file, onSuccess, onError }: any): Subscription {
    const sub = new Subscription();

    this.fileToBase64(file as File)
      .then(dataUrl => {
        this.form.patchValue({ primaryImage: dataUrl });
        // ng-zorro انتظار نداره بعضی آرگومان‌ها، اما امنه که پاس بدیم
        onSuccess?.({}, file);
      })
      .catch(err => {
        onError?.(err, file);
        this.message.error('Failed to read primary image');
      });

    return sub;
  }

  uploadCover({ file, onSuccess, onError }: any): Subscription {
    const sub = new Subscription();

    this.fileToBase64(file as File)
      .then(dataUrl => {
        this.form.patchValue({ coverImage: dataUrl });
        onSuccess?.({}, file);
      })
      .catch(err => {
        onError?.(err, file);
        this.message.error('Failed to read cover image');
      });

    return sub;
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject('File read error');
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

}
