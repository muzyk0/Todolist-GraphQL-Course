import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/App.module.css";
import { useLoginMutation } from "../generated/graphql";
import { setAccessToken } from "../lib/accessToken";

type FormData = {
    password: string;
    email: string;
};

export const Login = () => {
    const navigate = useNavigate();

    const [login, { client }] = useLoginMutation();
    const { register, handleSubmit } = useForm<FormData>();
    const onSubmit = handleSubmit(async ({ password, email }) => {
        const result = await login({
            variables: {
                password,
                email,
            },
        });

        if (result.errors) {
            alert(result.errors[0].message);
            return;
        }

        setAccessToken(result.data?.login.accessToken ?? "");
        client.resetStore();

        navigate("/", { replace: true });
    });

    return (
        <div className={styles.FormWrapper}>
            <form onSubmit={onSubmit}>
                <label>E-mail</label>
                <input {...register("email")} />
                <label>Password</label>
                <input {...register("password")} type="password" />
                <div>
                    <button type="submit">Login</button> or{" "}
                    <Link to={"/register"}>Register</Link>
                </div>
            </form>
        </div>
    );
};
