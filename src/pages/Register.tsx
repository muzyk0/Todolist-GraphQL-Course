import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/App.module.css";

import { gql, useMutation } from "@apollo/client";

const registerMutation = gql`
    mutation Register($email: String!, $password: String!, $name: String!) {
        register(email: $email, password: $password, name: $name) {
            id
            name
            email
        }
    }
`;

interface UserData {
    id: number;
    email: string;
    name: string;
}

interface RegisterMutationType {
    register?: UserData;
}

type FormData = {
    name: string;
    password: string;
    email: string;
};

export const Register = () => {
    const navigate = useNavigate();

    const [userRegister] = useMutation<RegisterMutationType, FormData>(
        registerMutation
    );

    const { register, handleSubmit } = useForm<FormData>();
    const onSubmit = handleSubmit(async (data) => {
        const result = await userRegister({
            variables: data,
        });

        if (result.errors) {
            alert(result.errors[0].message);
            return;
        }

        navigate("/login", { replace: true });
    });

    return (
        <div className={styles.FormWrapper}>
            <form onSubmit={onSubmit}>
                <label>Name</label>
                <input {...register("name")} />
                <label>E-mail</label>
                <input {...register("email")} />
                <label>Password</label>
                <input {...register("password")} type="password" />
                <div>
                    <button type="submit">Register</button> or{" "}
                    <Link to={"/login"}>Login</Link>
                </div>
            </form>
        </div>
    );
};
