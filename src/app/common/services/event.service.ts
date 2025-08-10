import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EventModel } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}/events`;
  private readonly LOCAL_KEY = 'em:events';
  private eventsSub = new BehaviorSubject<EventModel[]>([]);
  public events$ = this.eventsSub.asObservable();

  constructor(private http: HttpClient) {}

  /** Load events from API and local cache */
  init(query?: { [key: string]: any }) {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          params = params.set(key, query[key]);
        }
      });
    }

    this.http.get<EventModel[]>(this.apiUrl, { params }).pipe(
      catchError(err => {
        console.error('EventService: failed to load remote events', err);
        return of([]);
      })
    ).subscribe(remote => {
      const local = this.loadLocal();
      const merged = this.merge(remote, local);
      this.eventsSub.next(merged);
    });
  }

  /** Save to localStorage */
  private saveLocal(items: EventModel[]) {
    try {
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify(items));
    } catch {}
  }

  /** Load from localStorage */
  private loadLocal(): EventModel[] {
    try {
      const raw = localStorage.getItem(this.LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Merge remote + local events */
private merge(remote: EventModel[], local: EventModel[]): EventModel[] {
  const map = new Map<string, EventModel>();

  remote.forEach(r => {
    if (r.id) map.set(r.id, r);
  });

  local.forEach(l => {
    if (l.id) map.set(l.id, l); // local overrides
  });

  return Array.from(map.values());
}


  /** ---- API Methods ---- */

  create(data: Partial<EventModel>): Observable<EventModel> {
    return this.http.post<EventModel>(this.apiUrl, data).pipe(
      tap(ev => {
        const next = [...this.eventsSub.value, ev];
        this.eventsSub.next(next);
        this.saveLocal(next);
      })
    );
  }

  findAll(query?: { [key: string]: any }): Observable<EventModel[]> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          params = params.set(key, query[key]);
        }
      });
    }
    return this.http.get<EventModel[]>(this.apiUrl, { params }).pipe(
      tap(events => {
        this.eventsSub.next(events);
        this.saveLocal(events);
      })
    );
  }

  /** Same as findOne but also cached */
  getById(id: string): Observable<EventModel | undefined> {
    return this.events$.pipe(map(list => list.find(e => e.id === id)));
  }

  findOne(id: string): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.apiUrl}/${id}`);
  }

  getForOrg(orgId: string): Observable<EventModel[]> {
    return this.events$.pipe(map(list => list.filter(e => e.organizerId === orgId)));
  }

  update(id: string, data: Partial<EventModel>): Observable<EventModel> {
    return this.http.patch<EventModel>(`${this.apiUrl}/${id}`, data).pipe(
      tap(ev => {
        const list = this.eventsSub.value.map(e => e.id === id ? ev : e);
        this.eventsSub.next(list);
        this.saveLocal(list);
      })
    );
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const list = this.eventsSub.value.filter(e => e.id !== id);
        this.eventsSub.next(list);
        this.saveLocal(list);
      })
    );
  }
}
