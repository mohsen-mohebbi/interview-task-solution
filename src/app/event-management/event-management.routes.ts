import { Routes } from '@angular/router';
import { MyEventsComponent } from './pages/my-events/my-events.component';
import { EventFormComponent } from './pages/event-form/event-form.component';
import { EventDetailsComponent } from './pages/event-details/event-details.component';

export const EVENT_MANAGEMENT_ROUTES: Routes = [
  { path: '', component: MyEventsComponent },
  { path: 'create', component: EventFormComponent },
  { path: 'edit/:id', component: EventFormComponent },
  { path: ':id', component: EventDetailsComponent }
];
