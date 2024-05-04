// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMeoeIvPfNsALoEJHsE8zpAg51OQfqRvE",
  authDomain: "buybusy-redux-a9708.firebaseapp.com",
  databaseURL: "https://buybusy-redux-a9708-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "buybusy-redux-a9708",
  storageBucket: "buybusy-redux-a9708.appspot.com",
  messagingSenderId: "1095955611817",
  appId: "1:1095955611817:web:f5261c468f9115038429b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);