// /* eslint-disable no-unused-vars */
// import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// const db = getFirestore();

// export const userService = {
//   // Get user profile
//   async getUserProfile(userId) {
//     const docRef = doc(db, 'users', userId);
//     const docSnap = await getDoc(docRef);
//     return docSnap.exists() ? docSnap.data() : null;
//   },

//   // Create or update user profile
//   async updateUserProfile(userId, data) {
//     const docRef = doc(db, 'users', userId);
//     await setDoc(docRef, data, { merge: true });
//   },

//   // Resume related functions
//   async saveResume(userId, resumeData) {
//     const docRef = doc(db, 'users', userId, 'resumes', 'current');
//     await setDoc(docRef, resumeData, { merge: true });
//   },

//   async getResume(userId) {
//     const docRef = doc(db, 'users', userId, 'resumes', 'current');
//     const docSnap = await getDoc(docRef);
//     return docSnap.exists() ? docSnap.data() : null;
//   },

//   // Job applications
//   async addJobApplication(userId, jobData) {
//     const jobsRef = collection(db, 'users', userId, 'jobs');
//     const docRef = doc(jobsRef);
//     await setDoc(docRef, {
//       ...jobData,
//       createdAt: new Date(),
//       status: jobData.status || 'applied'
//     });
//   },

//   async updateJobApplication(userId, jobId, updates) {
//     const docRef = doc(db, 'users', userId, 'jobs', jobId);
//     await updateDoc(docRef, {
//       ...updates,
//       updatedAt: new Date()
//     });
//   },

//   async getJobApplications(userId) {
//     const jobsRef = collection(db, 'users', userId, 'jobs');
//     const q = query(jobsRef);
//     const querySnapshot = await getDocs(q);
//     return querySnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));
//   },

//   // Mock interviews
//   async scheduleMockInterview(userId, interviewData) {
//     const interviewsRef = collection(db, 'users', userId, 'interviews');
//     const docRef = doc(interviewsRef);
//     await setDoc(docRef, {
//       ...interviewData,
//       createdAt: new Date(),
//       status: 'scheduled'
//     });
//   },

//   async getMockInterviews(userId) {
//     const interviewsRef = collection(db, 'users', userId, 'interviews');
//     const q = query(interviewsRef);
//     const querySnapshot = await getDocs(q);
//     return querySnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));
//   },

//   async updateMockInterview(userId, interviewId, updates) {
//     const docRef = doc(db, 'users', userId, 'interviews', interviewId);
//     await updateDoc(docRef, {
//       ...updates,
//       updatedAt: new Date()
//     });
//   }
// };
