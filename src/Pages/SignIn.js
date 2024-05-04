
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";

import { createSessionThunk } from "../Redux/Reducers/authReducer";
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
            if (status) navigate("/");
            else navigate("/signin");
        });
    }

    return (
        <div className={styles.container}>
            <div className={styles.inputForm}>
                <h1>SignIn</h1>
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Enter Email" required ref={emailRef} />
                    <br />
                    <input type="password" placeholder="Enter Password" required ref={passwordRef} />
                    <br />
                    <button>Submit</button>
                </form>
                <br />
                <span>or &nbsp;</span>
                <NavLink to="/signup">Create New Account</NavLink>
            </div>
        </div>
    );
}
