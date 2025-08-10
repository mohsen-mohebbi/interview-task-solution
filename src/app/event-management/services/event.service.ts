import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EventModel } from '../models/event.model';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private readonly API = '/mock-data/mock.json';
    private readonly LOCAL_KEY = 'em:events';
    private eventsSub = new BehaviorSubject<EventModel[]>([]);
    public events$ = this.eventsSub.asObservable();

    constructor(private http: HttpClient) {
        this.init();
    }

    private init() {
        const local = this.loadLocal();
        console.log(local);
        

        if (local.length > 0) {
            // اگر لوکال دیتا داشت، همونو استفاده کن و تمام
            this.eventsSub.next(local);
            return; // دیگه سمت mock.json نرو
        }

        // اگر لوکال خالی بود، از mock.json بخون
        this.http.get<any>(this.API).pipe(
            map(payload => this.extractEvents(payload)),
            map(list => list.map(r => this.normalize(r))),
            catchError(err => {
                console.error('EventService: failed to load remote mock.json', err);
                return of([]);
            })
        ).subscribe(remote => {
            this.eventsSub.next(remote);
            this.saveLocal(remote); // ذخیره برای دفعات بعد
        });
    }


    private extractEvents(payload: any): any[] {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.events)) return payload.events;
        if (Array.isArray(payload.data?.events)) return payload.data.events;

        for (const k of Object.keys(payload)) {
            if (Array.isArray(payload[k]) && payload[k].length && (payload[k][0].id || payload[k][0].title)) {
                return payload[k];
            }
        }
        return [];
    }

    private normalize(r: any): EventModel {
        return {
            id: String(r.id ?? r.eventId ?? this.generateId()),
            title: r.title ?? r.name ?? 'Untitled event',
            description: r.description ?? '',
            startAt: r.startDateTime ?? r.startAt ?? new Date().toISOString(),
            endAt: r.endDateTime ?? r.endAt,
            timezone: r.timezone,
            venue: r.venue ? {
                id: r.venue.id,
                name: r.venue.venueName ?? r.venue.name,
                address1: r.venue.address1,
                city: r.venue.city
            } : undefined,
            primaryImage: r.primaryImageUrl ?? r.primaryImage ?? '',
            coverImage: r.coverImageUrl ?? r.coverImage ?? '',
            organizerId: r.organizer?.id ?? r.organization?.id,
            organizerName: r.organizer?.businessName ?? r.organization?.businessName,
            isPublic: typeof r.isPublic === 'boolean' ? r.isPublic : true,
            createdAt: r.dateAdded ?? r.createdAt,
            updatedAt: r.dateUpdated ?? r.updatedAt,
            raw: r
        };
    }

    private loadLocal(): EventModel[] {
        try {
            const raw = localStorage.getItem(this.LOCAL_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw) as EventModel[];
            return parsed.map(p => ({
                ...p,
                id: p.id ?? this.generateId(),
                startAt: p.startAt ?? new Date().toISOString()
            }));
        } catch {
            return [];
        }
    }

    private saveLocal(items: EventModel[]) {
        try {
            localStorage.setItem(this.LOCAL_KEY, JSON.stringify(items));
        } catch (err) {
            console.warn('EventService: could not persist to localStorage', err);
        }
    }

    // Public API
    getAll(): Observable<EventModel[]> {
        return this.events$;
    }

    getForOrg(orgId: string): Observable<EventModel[]> {
        return this.events$.pipe(map(list => list.filter(e => e.organizerId === orgId)));
    }

    getById(id: string): Observable<EventModel | undefined> {
        return this.events$.pipe(map(list => list.find(x => x.id === id)));
    }

    create(partial: Partial<EventModel>): Observable<EventModel> {
        const id = partial.id ?? this.generateId();
        const ev: EventModel = {
            ...partial,
            id,
            title: partial.title ?? 'Untitled event',
            startAt: partial.startAt ?? new Date().toISOString(),
            isPublic: typeof partial.isPublic === 'boolean' ? partial.isPublic : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            raw: partial.raw
        } as EventModel;

        const next = [...this.eventsSub.value, ev];
        this.eventsSub.next(next);
        this.saveLocal(next);
        return of(ev);
    }

    update(id: string, patch: Partial<EventModel>): Observable<EventModel | undefined> {
        const list = this.eventsSub.value.map(e => e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e);
        this.eventsSub.next(list);
        this.saveLocal(list);
        return of(list.find(e => e.id === id));
    }

    delete(id: string): Observable<boolean> {
        const list = this.eventsSub.value.filter(e => e.id !== id);
        this.eventsSub.next(list);
        this.saveLocal(list);
        return of(true);
    }

    setPublic(id: string, isPublic: boolean): Observable<EventModel | undefined> {
        return this.update(id, { isPublic });
    }

    private generateId(): string {
        return 'ev_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(4);
    }

    remove(id: string): Observable<any> {
        const list = this.eventsSub.value.filter(e => e.id !== id);
        this.eventsSub.next(list);
        this.saveLocal(list);
        return of(true);
    }
}
