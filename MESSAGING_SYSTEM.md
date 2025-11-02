# Conversation & Messaging System Documentation

## Overview
The CampusOne messaging system provides real-time communication between students and teachers with automatic course-based group conversations.

## Key Features

### 1. **Auto-Generated Course Conversations**
- When a course is created, a conversation group is automatically generated
- All enrolled students and the course instructor are automatically added as participants
- When students enroll in a course, they're automatically added to the course conversation
- When students unenroll, they're automatically removed from the course conversation

### 2. **Manual Conversation Creation** (Teacher Only)
Teachers can create custom conversations:
- **Private Chat**: One-on-one conversations
- **Group Chat**: Custom group with selected participants
- **Course Group**: Link to an existing course to auto-add all enrolled students

### 3. **Real-Time Messaging**
- Socket.IO integration for instant message delivery
- Message history persisted in MongoDB
- Support for text, files, and images
- Typing indicators and presence detection

## Database Schema

### Conversation Model
```javascript
{
  participants: [String],  // Array of firebaseUid
  type: String,            // 'private', 'group', 'announcement', 'course'
  name: String,            // Conversation title
  description: String,     // Description text
  courseTag: String,       // Course code (e.g., CS101)
  courseId: ObjectId,      // Reference to Course
  groupInfo: String,       // Member count info
  avatarColor: String,     // Primary color for avatar
  avatarColor2: String,    // Secondary color for gradient
  lastMessageAt: Date,     // Timestamp of last message
  createdAt: Date,         // Creation timestamp
  isActive: Boolean        // Active status
}
```

### Message Model
```javascript
{
  conversationId: ObjectId,  // Reference to Conversation
  senderUid: String,         // Firebase UID of sender
  content: String,           // Message text
  timestamp: Date,           // Message timestamp
  type: String,              // 'text', 'file', 'image'
  fileUrl: String,           // URL for attachments
  fileName: String           // Original filename
}
```

## API Endpoints

### GET /conversations
Get all conversations for the authenticated user
- **Auth**: Required
- **Returns**: Array of conversations with participant details and last message

### GET /conversations/:id/messages
Get all messages for a specific conversation
- **Auth**: Required
- **Params**: `id` - Conversation ID
- **Returns**: Array of messages with sender details

### POST /conversations
Create a new conversation (Teacher only)
- **Auth**: Required (Teacher role)
- **Body**:
  ```json
  {
    "type": "group",  // 'private', 'group', 'course'
    "name": "Study Group",
    "description": "Course study group",
    "participantsEmails": ["student1@edu", "student2@edu"],
    "courseId": "optional-course-id"
  }
  ```
- **Returns**: Created conversation object

### POST /conversations/sync-courses
Sync all course conversations (Teacher only)
- **Auth**: Required (Teacher role)
- **Returns**: Sync results for all courses

### POST /conversations/:id/messages
Send a message to a conversation
- **Auth**: Required
- **Params**: `id` - Conversation ID
- **Body**:
  ```json
  {
    "content": "Hello everyone!",
    "type": "text",
    "fileUrl": "optional-file-url",
    "fileName": "optional-filename"
  }
  ```
- **Returns**: Created message object
- **Side Effect**: Emits socket event to all conversation participants

## Course Integration

### Enrollment Flow
1. Student enrolls in a course via `/courses/:courseId/enroll`
2. Student's UID is added to `course.enrolledStudentUids`
3. `addStudentToCourseConversation()` is automatically called
4. Student is added to the course conversation group
5. Student can now see and participate in the course conversation

### Unenrollment Flow
1. Student unenrolls via `/courses/:courseId/unenroll`
2. Student's UID is removed from `course.enrolledStudentUids`
3. `removeStudentFromCourseConversation()` is automatically called
4. Student is removed from the course conversation
5. Student can no longer see or access the conversation

### Course Creation Flow
1. Teacher creates a new course via `/courses`
2. `syncCourseConversation()` is automatically called
3. A new conversation is created with type='course'
4. Course instructor (if found in Users collection) is added as participant
5. Conversation is linked to course via `courseId` field

## Utility Functions

### `syncCourseConversation(courseId)`
**Location**: `server/utils/courseConversation.js`

Creates or updates a course conversation to match current enrollment:
- Finds all enrolled students by UID
- Adds course instructor
- Creates conversation if doesn't exist
- Updates participants if conversation exists
- Updates member count in `groupInfo`

### `addStudentToCourseConversation(courseId, studentUid)`
**Location**: `server/utils/courseConversation.js`

Adds a single student to a course conversation:
- Finds conversation by `courseId`
- Adds student UID to participants array
- Updates member count
- Creates conversation if doesn't exist

### `removeStudentFromCourseConversation(courseId, studentUid)`
**Location**: `server/utils/courseConversation.js`

Removes a student from a course conversation:
- Finds conversation by `courseId`
- Removes student UID from participants array
- Updates member count

## Frontend Components

### CreateConversationModal
**Location**: `src/components/CreateConversationModal.jsx`

Multi-step modal for creating conversations:
- **Step 1**: Choose conversation type (Private/Group/Course)
- **Step 2a**: Select participants (for Private/Group)
- **Step 2b**: Select course (for Course type)
- Validates teacher role before allowing creation
- Refreshes conversation list after creation

**Props**:
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback when modal closes
- `onCreated`: Callback after successful creation

### Messages Component
**Location**: `src/pages/Messages.jsx`

Main messaging interface:
- Displays conversation list with search
- Shows message history for selected conversation
- Real-time message sending and receiving
- Integrates CreateConversationModal
- Auto-scrolls to latest message

## Admin Scripts

### `syncAllCourseConversations.js`
Batch sync all course conversations:
```bash
node server/syncAllCourseConversations.js
```

### `enrollStudentsInCourses.js`
Enroll students in courses and create conversations:
```bash
node server/enrollStudentsInCourses.js
```

### `createStudentUsers.js`
Create User documents for all students:
```bash
node server/createStudentUsers.js
```

## Socket.IO Events

### `joinConversation`
Client joins a conversation room
- **Emit**: `{ conversationId: 'xxx' }`
- **Server**: Adds socket to room

### `receiveMessage`
Server broadcasts new message to conversation room
- **Receive**: Full message object with sender details
- **Auto-triggered**: When message is sent via POST endpoint

## Security

### Authentication
- All endpoints require Firebase ID token
- Token verified via `authenticateToken` middleware
- User UID extracted from token for authorization

### Authorization
- Only teachers can create conversations
- Only conversation participants can view messages
- Only conversation participants can send messages

### Data Privacy
- Users only see conversations they participate in
- Course conversations only visible to enrolled students and instructor
- Removed participants lose access to conversation history

## Best Practices

1. **Always use transactions** when enrolling/unenrolling to ensure conversation sync
2. **Handle errors gracefully** - conversation sync failures shouldn't break enrollment
3. **Validate participants** - ensure UIDs exist in User collection
4. **Clean up orphaned conversations** - remove conversations with no participants
5. **Rate limit message sending** - prevent spam and abuse

## Future Enhancements

- [ ] Message reactions and threading
- [ ] File upload integration with cloud storage
- [ ] Message search and filtering
- [ ] Conversation archiving
- [ ] Push notifications for new messages
- [ ] Read receipts and delivery status
- [ ] Admin tools for conversation moderation
- [ ] Message encryption for privacy
- [ ] Voice and video call integration
- [ ] Announcement channels (broadcast-only)

## Troubleshooting

### Issue: Conversations not appearing
**Solution**: Ensure user UID is in conversation.participants array

### Issue: Students not auto-added to course conversation
**Solution**: Check that:
1. Student has valid firebaseUid in User collection
2. Student UID is in course.enrolledStudentUids
3. Run `syncCourseConversation(courseId)` to force sync

### Issue: Messages not real-time
**Solution**: 
1. Check Socket.IO connection in browser console
2. Verify socket server is running
3. Ensure client joined conversation room via `socket.emit('joinConversation')`

### Issue: "Only teachers can create conversations" error
**Solution**: Check user role in JWT token and User document

## Demo Data Summary

After running the setup scripts, you should have:
- **20 students** with User accounts (dummy Firebase UIDs)
- **5 teachers** with User accounts
- **12 active courses** with varied enrollment (2-9 students per course)
- **12 course conversations** automatically created with all participants
- **Sample enrollments** across multiple courses per student

## Testing Checklist

- [ ] Teacher can create private conversation
- [ ] Teacher can create group conversation
- [ ] Teacher can create course conversation
- [ ] Students appear in course conversations after enrollment
- [ ] Students removed from course conversations after unenrollment
- [ ] Messages appear in real-time for all participants
- [ ] Conversation list updates with latest message
- [ ] Search functionality works in Messages page
- [ ] Create Conversation modal validates inputs
- [ ] Only teachers see "Create Conversation" button
