# Placement Guidance Website

A modern and responsive web application designed to help students and job seekers with their placement preparation and career guidance. The platform offers comprehensive tools for resume building, job tracking, and mock interview preparation.

## Key Features

### 1. Resume Builder
- Professional PDF resume generation with modern templates
- Real-time preview of changes
- Multiple sections support:
  - Personal Information
  - Education History
  - Work Experience
  - Projects
  - Skills
- Automatic PDF generation with custom styling
- Save and edit multiple versions

### 2. Job Application Tracker
- Track job applications with detailed information:
  - Company Name (required)
  - Position (required)
  - Applied Date (required)
  - Application Status
  - Next Steps
  - Notes
- Validation to prevent future dates
- Real-time status updates
- Sort and filter applications

### 3. Mock Interviews
- Schedule and manage mock interview sessions
- Required fields:
  - Interview Date (must be at least tomorrow)
  - Interview Time
  - Interview Type
- Automatic cleanup:
  - Interviews are automatically removed 1 hour after scheduled time
  - Real-time updates without page refresh
- Time remaining indicator
- Interview preparation resources

## Technologies Used

- **Frontend:**
  - React.js (Functional components with hooks)
  - Tailwind CSS (Responsive design)
  - Framer Motion (Smooth animations)
  - React Router (Navigation)
  - @react-pdf/renderer (PDF generation)

- **Backend:**
  - Firebase Authentication
  - Cloud Firestore (Real-time database)

## Prerequisites

1. Node.js (v14 or higher)
2. npm or yarn
3. Firebase account
4. Modern web browser

## Detailed Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/navneeth31/placement_guidance.git
   cd placement-guidance
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Email/Password
   - Create a Cloud Firestore database
   - Get your Firebase configuration:
     - Go to Project Settings
     - Find the Firebase SDK snippet
     - Copy the configuration object

4. **Environment Configuration**
   - Modify the `.env` file in the root directory
   - Add your Firebase configuration:
     ```env
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     ```

5. **Start Development Server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/           # React components
│   ├── dashboard/       # Dashboard components
│   │   ├── ResumeBuilder.js
│   │   ├── JobTracker.js
│   │   └── MockInterviews.js
│   ├── auth/           # Authentication components
│   └── common/         # Shared components
├── contexts/           # React contexts
│   └── AuthContext.js
├── services/          # Firebase services
│   └── firebase/
├── styles/           # CSS and Tailwind styles
└── App.js           # Main application component
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm run deploy` - Deploy to Firebase Hosting

## Usage Guide

1. **Resume Builder:**
   - Navigate to the Resume Builder section
   - Fill in all required sections
   - Click "Generate PDF" to create a professional resume
   - Save changes automatically

2. **Job Tracker:**
   - Add new job applications with required details
   - Update application status as you progress
   - View all applications in a sorted list
   - Add notes and next steps

3. **Mock Interviews:**
   - Schedule new interviews
   - Select interview type and time
   - View upcoming interviews
   - Prepare using provided resources
   - Interviews auto-delete after completion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.
