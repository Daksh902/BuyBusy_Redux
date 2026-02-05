// for creating Slice and Async Thunk
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// firebase database
import { db } from "../../firebaseInit";
import { collection, addDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";

// toast notification
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// initial State to store data 
// for list of all the users, if a user is logged in, data of loggedIn user
const initialState = {
    userList: [],
    isLoggedIn: false,
    userLoggedIn: null
};

// Async thunk for getting list of all the users within the firebase database
export const getInitialUserList = createAsyncThunk(
    "auth/userList",
    (args, thunkAPI) => {
        const unsub = onSnapshot(collection(db, "buybusy-redux"), (snapShot) => {
            const users = snapShot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            thunkAPI.dispatch(setUserList(users));
        });
        // Clean up the listener
        return () => unsub();
    }
);

// AsyncThunk for creating new user in database
export const createUserThunk = createAsyncThunk(
    "auth/createUser",
    async (data, thunkAPI) => {
        // getting userList from initialState
        const { authReducer } = thunkAPI.getState();
        const { userList } = authReducer;

        // checking whether user's email already exist or not
        const index = userList.findIndex((user) => user.email === data.email);

        // if email address already exists inside database
        if (index !== -1) {
            toast.error('Email address already in use !!');
            return;
        }

        // if email not found create new user 
        await addDoc(collection(db, "buybusy-redux"), {
            name: data.name,
            email: data.email,
            password: data.password,
            cart: [],
            orders: []
        });
        // notification 
        toast.success("New user Created, Please LogIn to Continue !!");
    }
);

// AsyncThunk for signIn user
export const createSessionThunk = createAsyncThunk(
    "auth/createSession",
    async (data, thunkAPI) => {
        // getting userList from initialState
        const { authReducer } = thunkAPI.getState();
        const { userList } = authReducer;

        // finding user inside the userList
        const index = userList.findIndex((user) => user.email === data.email);

        // if user not found show notification
        if (index === -1) {
            toast.error("Email does not exist, Try again or SignUp Instead!!!");
            return false;
        }

        // if email found in database then match password
        if (userList[index].password === data.password) {
            toast.success("Sign In Successfully!!!");

            // logging in user and storing its data in local variable
            thunkAPI.dispatch(setLoggedIn(true));
            thunkAPI.dispatch(setUserLoggedIn(userList[index]));

            // generating user's login token and store user's data 
            window.localStorage.setItem("token", true);
            window.localStorage.setItem("index", JSON.stringify(userList[index]));
            return true;
        } else {
            // if password doesn't match in database
            toast.error("Wrong UserName/Password, Try Again");
            return false;
        }
    }
);

// AsyncThunk for Google SignIn
export const signInWithGoogleThunk = createAsyncThunk(
    "auth/signInWithGoogle",
    async (googleUser, thunkAPI) => {
        try {
            // Check if user already exists in our database query Firestore directly
            const q = query(collection(db, "buybusy-redux"), where("email", "==", googleUser.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // User exists, log them in
                const userDoc = querySnapshot.docs[0];
                const existingUser = { id: userDoc.id, ...userDoc.data() };

                thunkAPI.dispatch(setLoggedIn(true));
                thunkAPI.dispatch(setUserLoggedIn(existingUser));

                window.localStorage.setItem("token", true);
                window.localStorage.setItem("index", JSON.stringify(existingUser));
                toast.success("Sign In Successfully!!");
            } else {
                // New user, create database entry
                const newUser = {
                    name: googleUser.displayName || "Google User",
                    email: googleUser.email,
                    password: "google-auth-user", // dummy password
                    cart: [],
                    orders: []
                };

                const docRef = await addDoc(collection(db, "buybusy-redux"), newUser);

                // Add the generated ID to our local object
                const userWithId = { id: docRef.id, ...newUser };

                // Log them in immediately
                thunkAPI.dispatch(setLoggedIn(true));
                thunkAPI.dispatch(setUserLoggedIn(userWithId));

                window.localStorage.setItem("token", true);
                window.localStorage.setItem("index", JSON.stringify(userWithId));
                toast.success("Welcome! Account created successfully.");
            }
        } catch (error) {
            console.error("Error signing in with Google:", error);
            toast.error("Google Sign In failed. Please try again.");
        }
    }
);

// AsyncThunk for SignOut
export const removeSessionThunk = createAsyncThunk(
    "auth/removeSession",
    () => {
        // removing user's data and token from local storage
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("index");
    }
);

const authSlice = createSlice({
    name: 'authentication',
    initialState,
    reducers: {
        // to set userList 
        setUserList: (state, action) => {
            state.userList = action.payload;
        },
        // whether user isLoggedIn or not
        setLoggedIn: (state, action) => {
            state.isLoggedIn = action.payload;
        },
        // data of loggedIn user
        setUserLoggedIn: (state, action) => {
            state.userLoggedIn = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(removeSessionThunk.fulfilled, (state, action) => {
            // removing user's token and data from initialState
            state.isLoggedIn = false;
            state.userLoggedIn = null;
            toast.success("Sign Out successfully!!!!");
        });
    }
});

// exporting the reducer 
export const authReducer = authSlice.reducer;
// exporting the reducer actions
export const { setLoggedIn, setUserLoggedIn, setUserList } = authSlice.actions;

// exporting the user's state to get data
export const authSelector = (state) => state.authReducer;
