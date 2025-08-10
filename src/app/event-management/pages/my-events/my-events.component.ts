import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { EventService } from '../../services/event.service';
import { EventModel } from '../../models/event.model';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzTableModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzSpinModule,
    NzEmptyModule,
    NzCardModule,
    NzPopconfirmModule
  ],
  templateUrl: './my-events.component.html',
  styleUrls: ['./my-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyEventsComponent implements OnInit {
  search = new FormControl('');
  filter = new FormControl<'all' | 'public' | 'private'>('all');
  loading = true;
  displayed: EventModel[] = [];
  sortDir: 'asc' | 'desc' = 'asc';
  private activeOrgId = 'org-1'; // fallback

  constructor(private eventService: EventService, private router: Router,private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // try to detect activeOrgId from common local storages (adjust to your app)
    const detected = this.detectActiveOrgId();
    if (detected) this.activeOrgId = detected;

    const search$ = this.search.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged());
    const filter$ = this.filter.valueChanges.pipe(startWith(this.filter.value));

    // const events$ = this.eventService.getForOrg(this.activeOrgId).pipe(
    //   startWith([]) // مهم: تا قبل از لود شدن دیتا، یه آرایه خالی بده
    // );

    const events$ = this.eventService.getAll().pipe(startWith([]));

    
    combineLatest([events$, search$, filter$])
      .pipe(
        map(([events, q, f]) => {
          this.loading = false;
          let list = [...events];

          const qLower = (q || '').toString().toLowerCase().trim();
          if (qLower) {
            list = list.filter(e =>
              (e.title || '').toLowerCase().includes(qLower) ||
              (e.description || '').toLowerCase().includes(qLower) ||
              (e.venue?.name || '').toLowerCase().includes(qLower)
            );
          }

          if (f === 'public') list = list.filter(e => e.isPublic !== false);
          if (f === 'private') list = list.filter(e => e.isPublic === false);

          list.sort((a, b) => {
            const ta = new Date(a.startAt).getTime();
            const tb = new Date(b.startAt).getTime();
            return this.sortDir === 'asc' ? ta - tb : tb - ta;
          });

          return list;
        })
      )
      .subscribe(list => {
        this.displayed = list;
        this.cdr.markForCheck();
      });
  }

  toggleSort() {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    // force recompute by re-setting filter control current value
    this.filter.setValue(this.filter.value);
  }

  onCreate() {
    this.router.navigate(['/', 'events', 'create']);
  }

  onEdit(ev: EventModel) {
    this.router.navigate(['/', 'events', 'edit', ev.id]);
  }

  onView(ev: EventModel) {
    this.router.navigate(['/', 'events', ev.id]);
  }

  onDelete(ev: EventModel) {
    this.eventService.remove(ev.id).subscribe(() => {
      // no-op: subscription to events$ will update UI
    });
  }

  private detectActiveOrgId(): string | undefined {
    try {
      // try common keys your app might store user/session
      const possible = [
        localStorage.getItem('user'),
        localStorage.getItem('auth'),
        localStorage.getItem('session'),
      ].filter(Boolean);

      for (const raw of possible) {
        const parsed = JSON.parse(raw as string);
        if (parsed?.activeOrganizationId) return parsed.activeOrganizationId;
        if (parsed?.user?.activeOrganizationId) return parsed.user.activeOrganizationId;
        if (parsed?.organization?.id) return parsed.organization.id;
      }
    } catch (e) {
      // ignore
    }
    return undefined;
  }
}
