# Module A: Facilities & Assets Catalogue - Workflow Documentation

## System Architecture Overview

![System Architecture Overview](other/system-architecture-overview.svg)

**Technology Stack:**
- **Frontend:** React 18 + DaisyUI + Tailwind CSS
- **Backend:** Spring Boot 3.x (REST API)
- **Database:** MongoDB Atlas (Cloud)
- **Authentication:** Google OAuth 2.0
- **Ports:** Frontend (5173), Backend (8080)

---

## User Roles & Permissions

![User Roles](other/user-roles-used.svg)

## Main Workflows

### 1. Resource Management Workflow (Admin/Technician/Lecturer)

![Resource Management Workflow](admin/resources-management-workflow.svg)

**Key Operations:**

**Create Resource:**
1. User clicks "Add New Resource" button
2. ResourceForm component opens
3. User fills form:
   - Name *
   - Type (LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT, OFFICE, AUDITORIUM)
   - Capacity
   - Location *
   - Status (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE)
   - Description
   - Amenities (list)
   - Availability Windows (day, start time, end time)
4. Frontend validates form
5. POST /api/resources
   → Backend: ResourceController.createResource()
   → Service: ResourceService.createResource()
   → Repository: ResourceRepository.save()
   → MongoDB: Insert document
6. Success response → Update UI → Refresh resource list

**Edit Resource:**
1. User clicks "Edit" button on resource row
2. ResourceForm opens with pre-filled data
3. User modifies fields
4. Frontend validates form
5. PUT /api/resources/{id}
   → Backend: ResourceController.updateResource()
   → Service: ResourceService.updateResource()
   → Repository: ResourceRepository.save()
   → MongoDB: Update document
6. Success response → Update UI → Refresh resource list

**Delete Resource:**
1. User selects resources (checkboxes)
2. User clicks "Delete Selected" button
3. Confirmation dialog
4. DELETE /api/resources/{id} (for each selected)
   → Backend: ResourceController.deleteResource()
   → Service: ResourceService.deleteResource()
   → Repository: ResourceRepository.deleteById()
   → MongoDB: Delete document
5. Success response → Update UI → Refresh resource list

### 2. Resource Listing & Filtering Workflow

![Resource Listing and Filtering Workflow](client/resource-listing-filtering-workflow.svg)

**Key Operations:**

**Initial Load:**
1. User navigates to Resource Management Page
2. Frontend: useEffect triggers
3. GET /api/resources
   → Backend: ResourceController.getAllResources()
   → Service: ResourceService.getAllResources()
   → Repository: ResourceRepository.findAll()
   → MongoDB: Find all documents
4. Response: Array of Resource objects
5. Frontend: setResources(data)
6. Render table with resources

**Filtering:**
User applies filters:
├─ Search term (name, location, description)
├─ Type (LECTURE_HALL, LAB, etc.)
├─ Status (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE)
├─ Location (text search)
├─ Minimum Capacity (number)
└─ Creator (for "My Resources" view)

Filtering Flow:
1. User changes filter value
2. Debounce: 500ms delay (location) / 300ms delay (search term)
3. Frontend: fetchResources()
4. GET /api/resources?status=X&type=Y&location=Z&minCapacity=N&search=S&creator=C
   → Backend: ResourceController.getAllResources()
   → Service: ResourceService.getAllResources()
   → MongoDB: Dynamic query with filters using MongoTemplate
5. Response: Filtered array
6. Update UI with filtered results

**Pagination:**
1. User changes page (Next/Previous buttons)
2. Frontend: setPagination({ page: newPage })
3. Client-side: Slice filtered array
   - startIndex = page * size
   - endIndex = startIndex + size
   - paginatedData = filteredData.slice(startIndex, endIndex)
4. Update UI with paginated results

### 3. Resource Statistics Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RESOURCE STATISTICS FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. User navigates to Resource Management Page
2. Frontend: useEffect triggers fetchAllResources()
3. GET /api/resources
   → Fetches all resources
4. Frontend: calculate statistics
   - Total resources count
   - Count by status (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE)
   - Count by type (LECTURE_HALL, LAB, MEETING_ROOM, etc.)
5. Display statistics in cards at top of page

Statistics Display:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Total       │  │   Active     │  │ Out of       │  │    By Type   │
│  Resources   │  │   Resources  │  │  Service     │  │    Filter    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

Type Filter Dropdown:
- LECTURE_HALL: X count
- LAB: Y count
- MEETING_ROOM: Z count
- EQUIPMENT: N count
- OFFICE: M count
- AUDITORIUM: K count

When user selects a type:
- Filter resources by type
- Show type-specific statistics
- Display active/out of service/maintenance counts for that type
```

### 4. Public Resource Listing Workflow (Student/All Users)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PUBLIC RESOURCE LISTING FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. User navigates to Resources page (/resources)
2. Frontend: ResourceListPage component loads
3. Fetch resources with filters:
   - Search term
   - Type filter
   - Status filter (default: ACTIVE)
   - Location filter
   - Minimum capacity
   - Amenities filter
4. Display resources in card format grouped by type
5. Each card shows:
   - Resource icon
   - Resource name
   - Description
   - Location
   - Capacity
   - Status badge
   - Book button (if logged in)

Card Layout by Type:
┌─────────────────────────────────────────────────────────────────────────────┐
│ LECTURE HALLS                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                        │
│ │   Hall 1     │ │   Hall 2     │ │   Hall 3     │                        │
│ │   📦 150     │ │   📦 200     │ │   📦 100     │                        │
│ │   Active     │ │   Active     │ │  Maintenance │                        │
│ │  [Book]      │ │  [Book]      │ │  [Book]      │                        │
│ └──────────────┘ └──────────────┘ └──────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

![API Endpoints](other/api-endpoints.svg)

**REST API Endpoints for Module A:**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/resources | Get all resources with filtering | All Users |
| GET | /api/resources/{id} | Get resource by ID | All Users |
| GET | /api/resources/paginated | Get paginated resources with sorting | All Users |
| GET | /api/resources/{id}/availability | Get resource availability for date | All Users |
| GET | /api/resources/{id}/availability/check | Check resource availability for time slot | All Users |
| GET | /api/resources/{id}/audit | Get resource audit log | All Users |
| POST | /api/resources | Create new resource | RESOURCE_MANAGER, ADMIN |
| POST | /api/resources/bulk | Create multiple resources | ADMIN |
| PUT | /api/resources/{id} | Update resource | RESOURCE_MANAGER, ADMIN |
| PATCH | /api/resources/{id}/status | Update resource status | RESOURCE_MANAGER, ADMIN |
| PATCH | /api/resources/{id}/share | Track resource share count | All Users |
| DELETE | /api/resources/{id} | Delete resource | ADMIN, STAFF (owner only) |

**Query Parameters (for GET /api/resources):**
- `status`: Filter by status (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE, RESERVED)
- `type`: Filter by type (LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT, OFFICE, AUDITORIUM, CLASSROOM)
- `location`: Filter by location (partial match, case-insensitive)
- `minCapacity`: Filter by minimum capacity
- `search`: Search term (name, location, description - case-insensitive)
- `creator`: Filter by creator user ID

**Query Parameters (for GET /api/resources/paginated):**
- `page`: Page number (0-indexed, default: 0)
- `size`: Page size (default: 10)
- `search`: Search term (name, location, description)
- `status`: Filter by status
- `type`: Filter by type
- `sortBy`: Sort field (default: name)
- `sortDir`: Sort direction (asc/desc, default: asc)

## Database Schema

![Database Schema](other/db-schema-doc.svg)

**Resource Document Structure:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Unique identifier |
| name | String | Yes | Resource name (indexed) |
| type | Enum | Yes | LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT, OFFICE, AUDITORIUM, CLASSROOM (indexed) |
| capacity | Integer | No | Maximum capacity (indexed) |
| location | String | Yes | Physical location (indexed) |
| status | Enum | Yes | ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE, RESERVED (indexed) |
| description | String | No | Detailed description |
| amenities | Array<String> | No | List of amenities |
| availabilityWindows | Array<Object> | No | Day/time availability windows |
| shareCount | Integer | No | Number of times resource was shared |
| createdBy | String | No | User ID of creator |
| createdAt | LocalDateTime | Auto | Creation timestamp |
| updatedAt | LocalDateTime | Auto | Last update timestamp |

**Availability Window Structure:**
- `dayOfWeek`: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
- `startTime`: HH:MM format
- `endTime`: HH:MM format
- `available`: Boolean

**MongoDB Indexes (for performance optimization):**
- Single field indexes: status, type, location, name, capacity
- Compound indexes: status + type, type + location

## Frontend Components

**Component Hierarchy:**

```
App.jsx
└─ Resources Routes
   ├─ ResourceManagementPage (Admin/Technician/Lecturer)
   │  ├─ ResourceForm (Modal)
   │  ├─ Filter Section
   │  ├─ Statistics Cards
   │  └─ Resource Table
   │     ├─ Checkbox (select)
   │     ├─ Resource Info (name, icon, description)
   │     ├─ Type Badge
   │     ├─ Location
   │     ├─ Capacity
   │     ├─ Status Badge
   │     └─ Actions (Edit, Delete)
   │
   └─ ResourceListPage (Public/All Users)
      ├─ Search Bar
      ├─ Filters (Type, Status, Location, Capacity)
      ├─ Clear Filters Button
      └─ Resource Cards (grouped by type)
         ├─ Resource Icon
         ├─ Resource Name
         ├─ Description
         ├─ Location
         ├─ Capacity
         ├─ Status Badge
         └─ Book Button
```

**Shared Components:**
- **ResourceForm**: Modal form for adding/editing resources
- **TableRowSkeleton**: Loading state for table rows
- **PageLoader**: Loading state for initial page load
- **Status Badge Component**: Displays resource status with color coding

## Performance Optimizations

**1. MongoDB Indexes**
- Single field indexes on frequently queried fields (status, type, location, name, capacity)
- Compound indexes on common filter combinations (status + type, type + location)
- Improves query performance for large datasets
- Reduces full collection scans

**2. Client-Side Debouncing**
- 500ms delay on search input
- Reduces API calls during typing
- Improves user experience by preventing excessive requests

**3. Client-Side Filtering**
- Filters applied after data fetch
- Reduces server load for complex filters
- Enables fast response times for subsequent filter changes

**4. Pagination**
- Client-side pagination (current implementation)
- Server-side pagination (planned optimization for large datasets)

**5. Loading States**
- Skeleton loaders for table rows
- Page loader for initial load
- Improves perceived performance

## User Journey Summary

**STUDENT/GENERAL USER:**
1. Login → Dashboard
2. Navigate to Resources
3. View all resources in card format
4. Search/filter resources
5. View resource details
6. Book resource (if logged in)

**LECTURER/TECHNICIAN:**
1. Login → Dashboard
2. Navigate to Resource Management
3. View resource statistics
4. View all resources in table
5. Filter/search resources
6. Add new resource
7. Edit existing resources
8. Book resources

**ADMIN:**
1. Login → Dashboard
2. Navigate to Resource Management
3. View resource statistics
4. View all resources in table
5. Filter/search resources
6. Add new resource
7. Edit existing resources
8. Delete resources (single or bulk)
9. Manage resource availability
10. View analytics

## Integration Points

**1. Booking System (Module B)**
- Resources used in booking forms
- Resource availability checked before booking
- Resource status affects booking eligibility
- Prevents scheduling conflicts for the same resource

**2. Incident/Ticket System (Module C)**
- Resources linked to support tickets
- Resource status affects ticket creation
- Resource issues reported via tickets
- Up to 3 image attachments per ticket

**3. User Management (Module E)**
- Role-based access control (ADMIN, TECHNICIAN, LECTURER, STUDENT)
- Google OAuth 2.0 authentication
- Permission checks for CRUD operations
- Secure endpoints using role-based access control

**4. Notifications (Module D)**
- Resource status changes trigger notifications
- Booking confirmations include resource details
- Maintenance alerts for resources
- Notification panel in web UI

## Future Enhancements

**1. Advanced Search**
- Full-text search with MongoDB Atlas Search
- Faceted search
- Search suggestions/autocomplete

**2. Resource Analytics**
- Usage statistics per resource
- Booking frequency analysis
- Maintenance scheduling

**3. Resource Images**
- Upload/display resource images
- Image gallery
- Floor plans

**4. Bulk Operations**
- Bulk edit
- Bulk import (CSV/Excel)
- Bulk export

**5. Resource Categories**
- Hierarchical categories
- Tags system
- Advanced filtering

**6. Real-time Updates**
- WebSocket integration
- Live availability status
- Real-time booking conflicts

---

## Implementation Details

### Backend Implementation (Spring Boot)

**Layered Architecture:**
```
Controller Layer (ResourceController.java)
    ↓
Service Layer (ResourceService.java)
    ↓
Repository Layer (ResourceRepository.java)
    ↓
MongoDB Database
```

**Key Files:**
- `ResourceController.java` - REST API endpoints with proper HTTP methods and status codes
- `ResourceService.java` - Business logic and data processing
- `ResourceRepository.java` - MongoDB repository with custom query methods
- `Resource.java` - Entity model with MongoDB annotations

**Security Implementation:**
- Role-based access control using `@PreAuthorize` annotations
- Google OAuth 2.0 integration for authentication
- Protected routes in frontend using `ProtectedRoute` component
- Permission checks before CRUD operations

**Validation:**
- Input validation using `@Valid` annotations
- Custom error responses with meaningful messages
- Frontend form validation before API calls

### Frontend Implementation (React)

**Component Structure:**
- Functional components with React Hooks
- State management using `useState` and `useEffect`
- Context API for authentication state
- Axios for HTTP requests with interceptors

**Key Files:**
- `ResourceManagementPage.jsx` - Admin resource management interface
- `ResourceListPage.jsx` - Public resource listing with filtering
- `ResourceForm.jsx` - Form component for add/edit operations
- `resourceService.js` - API service layer

**UI/UX Features:**
- DaisyUI components for consistent styling
- Tailwind CSS for responsive design
- Loading states with skeleton loaders
- Toast notifications for user feedback
- Modal dialogs for confirmations

---

## Testing Evidence

### Backend Testing

**API Testing (Postman):**
- Created Postman collection for all endpoints
- Tested all HTTP methods (GET, POST, PUT, DELETE)
- Verified role-based access control
- Tested error handling and validation

**Unit Tests:**
- Repository layer tests
- Service layer tests
- Controller layer tests

### Frontend Testing

**Manual Testing:**
- Tested all user flows (create, edit, delete, filter, search)
- Verified role-based access
- Tested responsive design on different screen sizes
- Verified form validation

**Integration Testing:**
- Tested frontend-backend integration
- Verified data persistence in MongoDB
- Tested error handling from backend

---

## Team Contribution

**Module A - Facilities & Assets Catalogue**

| Component | Implemented By | Description |
|-----------|---------------|-------------|
| Backend API | Member 1 | REST API endpoints for resources (13 endpoints implemented) |
| Database Design | Member 1 | MongoDB schema and indexes |
| Frontend Components | Member 1 | Resource management UI (ResourceManagementPage, ResourceDetailPage) |
| Authentication Integration | Team | Role-based access control integration |
| Testing & Documentation | Member 1 | API testing and documentation |

**Individual Contributions (Member 1 - Module A Lead):**
- Implemented 13 REST API endpoints using different HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Proper RESTful naming conventions followed
- Correct HTTP status codes used (200, 201, 204, 400, 401, 403, 404, 409)
- Meaningful error responses with GlobalExceptionHandler
- Integration tests with ResourceControllerIntegrationTest
- Swagger/OpenAPI documentation for all endpoints
- Commit history reflects individual work

---

## Non-Functional Requirements

### Security
- OAuth 2.0 authentication (Google Sign-in)
- Role-based access control (RBAC)
- Input validation and sanitization
- Safe file handling for attachments
- Protected API endpoints

### Performance
- MongoDB indexes for query optimization
- Client-side debouncing for search
- Pagination for large datasets
- Loading states for better UX
- Efficient data fetching

### Scalability
- Cloud-based MongoDB Atlas database
- Stateless REST API architecture
- Component-based frontend architecture
- Modular design for easy extension

### Usability
- Clean and intuitive UI
- Responsive design for all devices
- Clear error messages
- Loading indicators
- Consistent design patterns

---

## Conclusion

**Module A: Facilities & Assets Catalogue** is fully implemented with all required features plus additional enhancements:

✅ Maintain a catalogue of bookable resources (LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT, CLASSROOM, AUDITORIUM, OFFICE)
✅ Resource metadata (type, capacity, location, availability windows, status: ACTIVE/OUT_OF_SERVICE/UNDER_MAINTENANCE/RESERVED)
✅ Search and filtering by type, capacity, location, status, creator, and full-text search
✅ Role-based access control (ADMIN, RESOURCE_MANAGER, STAFF, LECTURER, STUDENT)
✅ RESTful API with proper HTTP methods (GET, POST, PUT, PATCH, DELETE) and status codes
✅ MongoDB database with indexes for performance optimization
✅ React frontend with modern UI (DaisyUI + Tailwind CSS)
✅ Integration with other modules (Booking, Tickets, Notifications, Authentication)

**Additional Features Implemented:**
- Server-side pagination with sorting
- Resource availability checking by date and time slot
- Resource audit log tracking
- Resource share tracking
- Resource analytics dashboard
- Bulk delete operations (parallel individual deletes)
- Client-side resource save/favorite functionality
- Saved resources with notes capability

**Technology Stack:** React 18, Spring Boot 3.x, MongoDB Atlas, DaisyUI, Tailwind CSS
**Status:** ✅ Complete
**Assignment Compliance:** ✅ All minimum requirements satisfied with additional value-added features
