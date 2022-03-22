import React from "react";
import { useRefreshToken } from "./hooks/useRefreshToken";

import { RoutesContainer } from "./RoutesContainer";
import { Layout } from "./components/layout/Layout";

function App() {
    const loading = useRefreshToken();

    if (loading) {
        return <>Загрузка...</>;
    }

    return (
        <Layout>
            <RoutesContainer />
        </Layout>
    );
}

export default App;
