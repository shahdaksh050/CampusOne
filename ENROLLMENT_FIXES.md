# Course Enrollment Fixes

## Issues Identified

1. **Missing `firebaseUid` field in Student model**
   - The Student model didn't have a `firebaseUid` field
   - Course enrollments were tracked by Firebase UID in `Course.enrolledStudentUids`
   - But Student records couldn't be matched to logged-in users

2. **Data sync issues**
   - Existing students had course enrollments but no `firebaseUid` set
   - New user (daksh@gmail.com) had User record but no Student record
   - Course-side enrollments weren't synced with Student-side enrollments

3. **Lookup failures**
   - AttendancePage and TimetablePlanner tried to find students by email/firebaseUid
   - Without `firebaseUid` in Student model, matches failed
   - Result: "No Active Courses" message even when enrolled

## Fixes Applied

### 1. Database Model Updates

**server/models/Student.js**
- Added `firebaseUid` field:
  ```javascript
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined values to be non-unique
  }
  ```

### 2. Backend Route Updates

**server/routes/courses.js**
- **Enroll endpoint**: Now sets `firebaseUid` on Student record during enrollment
- **Lookup logic**: Tries to find student by `firebaseUid` first, then falls back to email
- **Unenroll endpoint**: Also updated to use firebaseUid lookup

### 3. Frontend Updates

**src/pages/AttendancePage.jsx**
- Updated `fetchCourses()` to find student by `firebaseUid` first
- Checks both `enrolledCourseIds` and `courses` arrays
- Properly filters active courses by enrollment status

**src/pages/TimetablePlanner.jsx**
- Updated course filtering logic to use `firebaseUid` lookup
- Checks both `enrolledCourseIds` and `courses` arrays
- Filters timetable entries to show only enrolled courses

### 4. Data Migration Scripts

Created helper scripts to sync existing data:

**server/syncFirebaseUids.js**
- Matches Student records to User records by email
- Sets `firebaseUid` from User record to Student record
- Result: All 20 students now have `firebaseUid` set

**server/createStudentForDaksh.js**
- Creates Student record for users who only have User records
- Sets appropriate `firebaseUid` during creation

**server/syncEnrollments.js**
- Syncs Course-side enrollments (`enrolledStudentUids`) to Student-side enrollments
- Updates both `enrolledCourseIds` and `courses` arrays

## How It Works Now

### Enrollment Flow
1. Student clicks "Enroll Now" on a course
2. Backend adds Firebase UID to `Course.enrolledStudentUids`
3. Backend finds Student by `firebaseUid` or creates Student record
4. Backend updates Student's `enrolledCourseIds` and `courses` arrays
5. Frontend reloads enrollment data and updates button state

### Attendance/Timetable Display
1. Student logs in with Firebase auth
2. System gets user's `firebaseUid`
3. Frontend fetches all students and finds match by `firebaseUid`
4. Frontend gets enrolled course IDs from Student record
5. Frontend filters active courses to show only enrolled ones
6. Only enrolled courses appear in attendance dropdown and timetable

## Testing

To verify the fixes:
1. Log in as a student (e.g., daksh@gmail.com)
2. Navigate to Attendance page
3. Should see enrolled courses in dropdown
4. Navigate to Timetable page  
5. Should see timetable entries for enrolled courses only
6. Navigate to Courses page
7. Already enrolled courses should show "Enrolled" button (disabled)
8. Click "Enroll Now" on a new course
9. Button should immediately change to "Enrolled"
10. New course should appear in attendance dropdown

## Future Considerations

1. **Auto-create Student records**: When a new user registers with role='student', automatically create a Student record with matching `firebaseUid`

2. **Admin panel**: Add UI for admins to:
   - Link existing User records to Student records
   - Sync enrollments between Course and Student models
   - View/edit student enrollment data

3. **Validation**: Add validation to ensure:
   - Every student User has a Student record
   - Course and Student enrollment arrays stay in sync
   - No orphaned enrollments exist

4. **Migration on startup**: Consider running sync scripts on server startup to ensure data integrity
