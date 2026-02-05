
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseInit";
import { createSessionThunk, signInWithGoogleThunk } from "../Redux/Reducers/authReducer";
import styles from "../styles/signIn.module.css";

export function SignIn() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const emailRef = useRef();
    const passwordRef = useRef();

    function handleSubmit(e) {
        e.preventDefault();
        const data = {
            email: emailRef.current.value,
            password: passwordRef.current.value
        };
        dispatch(createSessionThunk(data)).then((status) => {
            if (status.payload) navigate("/");
            else navigate("/signin");
        });
    }

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // The signed-in user info.
            const user = result.user;
            await dispatch(signInWithGoogleThunk(user));
            navigate("/");
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.inputForm}>
                <h1>SignIn</h1>
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Enter Email" required ref={emailRef} />
                    <input type="password" placeholder="Enter Password" required ref={passwordRef} />
                    <button type="submit">Submit</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        style={{
                            backgroundColor: 'white',
                            color: '#4a4a4a',
                            border: '1px solid #ddd',
                            backgroundImage: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
                            alt="Google"
                            style={{ width: '20px', height: '20px' }}
                        />
                        Sign in with Google
                    </button>
                </div>

                <div style={{ marginTop: '15px' }}>
                    <span>or &nbsp;</span>
                    <NavLink to="/signup">Create New Account</NavLink>
                </div>
            </div>
        </div>
    );
}
