# AGENT.md

## Module Purpose
The **Event Management Module** allows logged-in users to create, view, edit, and delete events within their organization. It is built with Angular, structured modularly, and styled using NG-ZORRO (Ant Design) components.

---

## Architecture Overview
- **Module Name:** `event-management`
- **Components:**
  - `event-list` – Displays all events for the organization with search, filter, and sort features.
  - `event-form` – Shared component for creating and editing events.
  - `event-details` – Shows detailed information about an event.
- **Service:**
  - `EventService` – Handles fetching mock data, filtering by organization, and managing local state.
- **Routing:**
  - Configured via `event-management-routing.module.ts` with routes for list, form, and details.
- **Model:**
  - `event.model.ts` – Defines the `Event` interface.
- **State Management:**
  - Local in-memory storage with **RxJS BehaviorSubjects** for reactivity.

---

## Data Flow
1. **EventService** uses Angular `HttpClient` to retrieve all events from the mock API.
2. Events are filtered by the logged-in user's **organizationId** (retrieved from the authentication module).
3. Data is managed locally with **RxJS Subjects/BehaviorSubjects** to allow reactive updates across components.
4. Create/Edit/Delete operations update the in-memory list without persisting to a backend.

---

## Feature Pages

### A. My Events List
- **Component:** `event-list`
- **UI:** NG-ZORRO Table or Cards
- **Features:**
  - Search by title
  - Filter by Public/Private
  - Sort by Date
  - Loading indicator
  - Empty state message
  - Edit/Delete buttons with confirmation modals

### B. Create & Edit Event
- **Component:** `event-form`
- **Shared Form Fields:**
  - Title (required)
  - Description
  - Date & Time with timezone
  - Location (venue)
  - Primary Image Upload
  - Cover Image Upload
  - Public/Private toggle
- **Features:**
  - Form validation
  - Single form component reused for Create & Edit
  - Uses NG-ZORRO inputs, datepicker, switch, and upload

### C. Event Details
- **Component:** `event-details`
- **UI:** NG-ZORRO Descriptions, Image, Tags
- **Features:**
  - Displays all event fields
  - "Copy Public Link" button for public events
  - Optional: Share options

---

## How to Extend

### Add a New Field to the Form
1. Edit `event-form.component.ts` to add a new `FormControl` in the `FormGroup`.
2. Update `event-form.component.html` to include the UI element (use NG-ZORRO components).
3. Update `Event` interface in `event.model.ts`.
4. Adjust `event-list` and `event-details` to display the new field if needed.

### Add a New Filter to the List
1. Add the filter UI in `event-list.component.html`.
2. Implement filtering logic in `event-list.component.ts`.
3. Optionally persist filter state in `EventService`.

### Enhance the Detail View
1. Modify `event-details.component.html` to show new fields or UI enhancements.
2. Use NG-ZORRO components such as `nz-descriptions`, `nz-image`, or `nz-tag`.

---

## AI Agent Notes
- **How AI was used:**  
  This documentation and base structure were generated with AI assistance for clarity and speed.
- **Naming Conventions:**  
  - Classes: `PascalCase`
  - Variables & Methods: `camelCase`
  - Files/Folders: `kebab-case`
- **Avoid Changing:**  
  - Existing API endpoint URLs
  - Property names in `event.model.ts` unless updated across all components and mock data
  - Route paths in `event-management-routing.module.ts` unless navigation is updated
- **Known Limitations / TODOs:**  
  - CRUD operations are in-memory only (no real backend)
  - No image storage; uploads are simulated
  - No pagination for event list
  - Timezone handling is basic (not fully localized)

---

## Example AI Prompt
> "Add a `category` field to the event form with options 'Conference', 'Workshop', and 'Meetup'. Update the Event interface, event list filters, and event details view to support and display the category."

---
