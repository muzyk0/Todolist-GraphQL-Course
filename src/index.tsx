import React from "react";
import ReactDOM from "react-dom";
import "./styles/globals.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { ApolloProvider } from "@apollo/client";
import { createApolloClient } from "./lib/apolloClient";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
