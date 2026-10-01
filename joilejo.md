# EduNova — Simple & Easy Error Breakdown

This file explains all the issues found in EduNova's backend and frontend in simple, easy-to-understand language, along with how each issue was fixed.

---

## 1. Red Error Alert when Clicking Subjects Quickly

* **The Problem (In Easy Terms)**:  
  When you clicked on subject cards quickly in the app, two web requests were sent to the database at the exact same millisecond. Because PostgreSQL doesn't allow two identical entries for the same student and subject, it threw a database collision error (`Unique constraint failed on userId, subjectId`), causing a red error banner to pop up.

* **How We Fixed It**:  
  We added a smart safety handler in `backend/services/subjectService.js`. Now, if two requests hit the database at the exact same time, the system catches the collision safely, fetches the existing record, and returns it smoothly without showing any error message.

---

## 2. All Subject Cards Saving Under a Single Subject

* **The Problem (In Easy Terms)**:  
  The database originally had only **1 subject** saved inside it (*Mathematics & Mechanics*). So when you clicked on *Physics*, *Chemistry*, *Biology*, or *DevOps*, the backend couldn't find those subjects in the database and mapped everything to that single *Mathematics* subject.

* **How We Fixed It**:  
  We ran a seed script (`seed_subjects.js`) that populated all **21 universal subjects** (School Class 10, College B.Tech, Competitive Exams, and Skills tracks) directly into PostgreSQL with proper names, colors, images, and IDs.

---

## 3. Added Subjects Not Updating on "My Subjects" or Dashboard

* **The Problem (In Easy Terms)**:  
  The "My Subjects" page and Dashboard were showing a fixed static list instead of reading your real enrolled subjects. So even when you selected new subjects, the screen kept showing the old default subjects.

* **How We Fixed It**:  
  We updated `useSubjects.js`, `MySubjectsPage.jsx`, and `EduNovaPixelPerfectDashboard.jsx`. Now the app always checks your live enrolled subjects in the database first. When you add or remove a subject, it updates in real time everywhere across the app.

---

## 4. Calendar Missing Date Task Creation & Full Info Popup

* **The Problem (In Easy Terms)**:  
  On the "My Tasks" calendar view:
  1. You couldn't click on a specific date (e.g., September 27) to create a task for that particular day.
  2. Clicking on a task on the calendar didn't show its full details, subtasks, or description.

* **How We Fixed It**:  
  1. We added a `+` button inside every calendar day box. Clicking it opens the task creator with that date automatically pre-filled (`YYYY-MM-DD`).
  2. Clicking any task on the calendar now opens a **Task Quick Overview Modal** showing full info, priority badges, due date, duration, subtask checkboxes, and action buttons (`Mark Complete`, `Start Focus`, `Edit`, `Delete`).

---

## 5. Live Server Status

* **Backend Server**: Running live on `http://localhost:5000` (PostgreSQL Database Connected).
* **Frontend Application**: Running live on `http://localhost:3000` (React App Ready).

---

*This document was created as requested in `joilejo.md`.*
