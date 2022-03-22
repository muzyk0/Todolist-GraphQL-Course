import jwtDecode from "jwt-decode";

export let accessToken = "";

export const setAccessToken = (token: string) => {
    accessToken = token;
};

export const getAccessToken = () => {
    return accessToken;
};

interface AccessTokenPayload {
    userId: number;
}

export const isAuthSelector = () => {
    try {
        return jwtDecode<AccessTokenPayload>(accessToken).userId !== undefined;
    } catch {
        return false;
    }
};
