import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogoutMutation, useMeQuery } from "../../generated/graphql";
import { setAccessToken } from "../../lib/accessToken";

export const Header: React.FC = () => {
    const navigate = useNavigate();

    const { data, loading } = useMeQuery();
    const [logout, { client }] = useLogoutMutation();

    const onLogoutClick = async () => {
        const result = await logout();

        if (result.errors) {
            alert(result.errors[0].message);
            return;
        }

        setAccessToken("");
        client.resetStore();

        navigate("/login", { replace: true });
    };

    if (loading) {
        return <>Загрузка...</>;
    }

    return (
        <header style={{ display: "flex", gap: "10px" }}>
            {data?.me ? (
                <>
                    {data?.me?.name}
                    <button onClick={onLogoutClick}>logout</button>
                </>
            ) : (
                <>
                    <Link to={"/login"}>Login</Link>
                    <Link to={"/register"}>Register</Link>
                </>
            )}
        </header>
    );
};
