import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { first } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

import { EventService } from '../../services/event.service';
import { EventModel } from '../../models/event.model';

@Component({
  standalone: true,
  selector: 'app-event-details',
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzDescriptionsModule,
    NzImageModule,
    NzTagModule,
    NzButtonModule,
    NzSpinModule,
    NzMessageModule
  ],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnInit {
  event?: EventModel;
  loading = true;
  id?: string;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private eventService: EventService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    console.log(this.id);
    
    if (!this.id) {
      this.message.error('Missing event id');
      this.router.navigate(['/', 'events']);
      return;
    }

    this.eventService.getById(this.id).pipe(first()).subscribe({
      next: (ev) => {
        this.loading = false;
        if (!ev) {
          this.message.error('Event not found');
          this.router.navigate(['/', 'events']);
          return;
        }
        this.event = ev;
      },
      error: () => {
        this.loading = false;
        this.message.error('Failed to load event');
      }
    });
  }

  copyPublicLink(): void {
    if (!this.event) return;
    const url = `${location.origin}/events/${this.event.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      this.message.success('Public link copied to clipboard');
    }).catch(() => {
      this.message.error('Could not copy link');
    });
  }

  goEdit(): void {
    if (!this.event) return;
    this.router.navigate(['/', 'events', 'edit', this.event.id]);
  }

  deleteEvent(): void {
    if (!this.event) return;
    const ok = window.confirm('Delete this event?');
    if (!ok) return;
    this.eventService.remove(this.event.id).subscribe({
      next: () => {
        this.message.success('Deleted');
        this.router.navigate(['/', 'events']);
      },
      error: () => {
        this.message.error('Delete failed');
      }
    });
  }
}
