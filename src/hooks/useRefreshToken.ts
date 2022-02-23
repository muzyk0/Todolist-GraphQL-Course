import React from "react";
import { setAccessToken } from "../lib/accessToken";

export const useRefreshToken = () => {
    const [loading, setLoading] = React.useState(true);

    React.useLayoutEffect(() => {
        fetch("http://localhost:5000/refresh_token", {
            method: "POST",
            credentials: "include",
        }).then(async (req) => {
            const { accessToken } = await req.json();

            setAccessToken(accessToken);
            setLoading(false);
        });
    }, []);
    return loading;
};
