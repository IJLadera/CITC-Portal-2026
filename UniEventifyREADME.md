# **Website Documentation**

## **1. Introduction**
### **1.1 About the Website**
This system is designed to manage and organize events efficiently, catering to different roles such as Admins, Deans, Chairpersons, Faculty, and Students. The platform allows users to create, manage, and participate in events while ensuring role-based access to specific functionalities.

### **1.2 Objectives**
- Provide a structured event management system.
- Facilitate role-based permissions for users.
- Ensure smooth user experience with features like filtering, notifications, and document management.

---

## **2. Website Features**

### **2.1 Landing Page**
- Displays **featured (latest) events**.
- Shows **archived events** (past or completed events).

### **2.2 Events Page**
- Allows filtering of **public events** (College, University, or Exam category).
- Users can filter events by **category** and **date**.
- All roles can filter events by category, college, department, month, or faculty, or search manually.
- Chairperson/Dean: Can see all events, including those created by faculty.
- Mother Org/Unit Org/Student: Cannot see faculty-created events if the category is personal and the type is non-academic.

### **2.3 Authentication**
- **Login Page**: Users log in using their **email address**.
- **Register Page**: New users can create an account by inputting required details.

### **2.4 Dashboard**
Different contents are displayed based on the user role:
#### **Admin(Developer Access)**
- View and manage **users** (add, update, delete, activate, or deactivate users).
- Upload multiple users via **CSV**.
- Manage **entities** such as:
  - Setups, Venues, Status, Sections, Event Categories, Colleges, Departments, User Roles, Event Types, and School Years.

#### **Dean/Chairperson**
- **Dean**: Views **draft events** created by Mother Org (student organizations).
- **Chairperson**: Views **events** created by Unit Org or Faculty.
- Both roles can **approve** or **disapprove** events (disapproval requires a remark).

### **2.5 Events Management**
- Events with **draft status** and created by students are **not shown** on the calendar.
- Users can filter events by:
  - **Category, College, Department, Month, Faculty**.
  - Manual search is available.

#### **Role-based Event Viewing:**
- **Admin**:
  - Cannot see events **created by faculty** if the category is **Personal** and the event type is **Non-Academic**.
- **Dean/Chairperson**:
  - Can view **all** events, including faculty-created events.
- **Mother Org, Unit Org, Student**:
  - Cannot see faculty-created events if the category is **Personal** and the event type is **Non-Academic**.

### **2.6 Your Events Page**
- Displays events **created by the user** and events **they are a participant in**.

### **2.7 Timeline**
- Displays **past and future events**.
- **Faculty users cannot access** this page.

### **2.8 Add Event**
- **Roles Allowed:** Admin, Dean, Chairperson, Mother Org, Unit Org.
- Users must fill **required fields** before proceeding.
- If the event type is **Academic** and the date conflicts with an existing event, a **conflict modal** appears showing:
  - Available date/time.
  - Expected number of participants.
  - Option to "Proceed Anyway".
- For events categorized as **University, College, Department, or Student Organization**, users must upload:
  - **Approved document**.
  - **Event poster/image**.

### **2.9 Upload CSV**
- **Admin-only feature**.
- Allows bulk uploading of events.
- Admin can **download the CSV format** from this page.

### **2.10 Documents Page**
- Displays **role-specific documents**.
- **Students see student documents; Faculty see faculty documents**.

### **2.11 Notifications Page**
- Users receive notifications for:
  - Events they are **participants in**.
  - **Deans and Chairpersons receive approval notifications** for events requiring action.

### **2.12 Announcements Page**
- Displays announcements created by:
  - **Admin, Dean, Chairperson, Mother Org, Unit Org**.

### **2.13 Profile Page**
- Displays **user details**.

### **2.14 Reports Page**
- Accessible only to:
  - **Admin, Dean, Chairperson, Mother Org, Unit Org**.
- Displays reports related to **events**.

## **3. Entities**
#### Setups
- in-person
- virtual
- hybrid

#### Venues
- name: AVR, location: {location} 
- name: PAT, location: {location} 
- name: CDO B.I.T.E.S’ Board Room, location: {location} 
- name: Career Center, location: {location} 
- name: SCITC Office, location: {location} 
- name: Food Innovation Building, location: {location} 
- name: New Students’ Lounge, location: {location} 
- name: DRER Memorial Hall, location: {location} 
- name: Campus Grounds, location: {location} 
- name: Cafeteria Function Hall, location: {location} 

#### Status
- draft
- postponed
- cancelled
- upcoming
- done
- ongoing
- disapproved

#### Event Categories
- Student Organization
- Department
- Exam
- Personal
- College
- University

#### Colleges
- CITC

#### Departments
- All CITC Department
- CS
- DS
- TCM
- IT

#### User Roles
- Unit Org, rank: 3
- Mother Org, rank: 2
- Student, rank: 5
- Faculty, rank: 4
- Chairperson, rank: 3
- Dean, rank: 2
- Admin, rank: 1

#### Event Types
- Non-School Activities
- Extracurricular Activities
- Non-Academic
- Academic

#### School Years
- name: 2023 - 2024, StartYear: 2023, EndYear: 2024
- name: 2024 - 2025, StartYear: 2024, EndYear: 2025

#### Semesters
- name: First Semester - 2024 - 2025, StartDate: 2023-08-07, EndDate: 2023-12-12, SchoolYear: {foriegn key}

## **4. Role-Based Access Control (RBAC)**
| Feature                     | Admin | Dean  | Chairperson | Mother Org | Unit Org | Student |
|-----------------------------|-------|-------|-------------|------------|----------|---------|
| View All Events             | ✅    | ✅   | ✅         | ✅         | ✅      | ✅      |
| Approve/Disapprove Events   | ❌    | ✅   | ✅         | ❌         | ❌      | ❌      |
| Add Event                   | ✅    | ✅   | ✅         | ✅         | ✅      | ✅      |
| Upload CSV                  | ✅    | ❌   | ❌         | ❌         | ❌      | ❌      |
| Manage Users                | ✅    | ❌   | ❌         | ❌         | ❌      | ❌      |
| View Reports                | ✅    | ✅   | ✅         | ✅         | ✅      | ❌      |

## **5. Special Permission and Access Control**
- The is_staff access control functions the same as admin access, so it will be assigned to the Dean.
_______________________________________________________________________________________________
| Feature                     | Admin | Dean  | Chairperson | Mother Org | Unit Org | Student |
|-----------------------------|-------|-------|-------------|------------|----------|---------|
| View All Events             | ✅    | ✅   | ✅         | ✅         | ✅      | ✅      |
| Approve/Disapprove Events   | ❌    | ✅   | ✅         | ❌         | ❌      | ❌      |
| Add Event                   | ✅    | ✅   | ✅         | ✅         | ✅      | ✅      |
| Upload CSV                  | ✅    | ✅   | ❌         | ❌         | ❌      | ❌      |
| Manage Users                | ✅    | ✅   | ❌         | ❌         | ❌      | ❌      |
| View Reports                | ✅    | ✅   | ✅         | ✅         | ✅      | ❌      |