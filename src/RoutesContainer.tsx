import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { isAuthSelector } from "./lib/accessToken";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { TodoList } from "./pages/TodoList";

export const RoutesContainer: React.FC = () => {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <RequireAuth>
                        <TodoList />
                    </RequireAuth>
                }
            />

            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
        </Routes>
    );
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
    let isAuth = isAuthSelector();
    let location = useLocation();

    if (!isAuth) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
