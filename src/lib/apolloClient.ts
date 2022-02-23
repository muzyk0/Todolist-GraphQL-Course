import {
    ApolloLink,
    HttpLink,
    ApolloClient,
    InMemoryCache,
    Observable,
} from "@apollo/client";
import { getAccessToken, setAccessToken } from "./accessToken";
import { onError } from "@apollo/client/link/error";
import { TokenRefreshLink } from "apollo-link-token-refresh";
import jwtDecode from "jwt-decode";

export const createApolloClient = () => {
    const requestLink = new ApolloLink(
        (operation, forward) =>
            new Observable((observer) => {
                let handle: any;
                Promise.resolve(operation)
                    .then((operation) => {
                        const accessToken = getAccessToken();
                        if (accessToken) {
                            operation.setContext({
                                headers: {
                                    authorization: `bearer ${accessToken}`,
                                },
                            });
                        }
                    })
                    .then(() => {
                        handle = forward(operation).subscribe({
                            next: observer.next.bind(observer),
                            error: observer.error.bind(observer),
                            complete: observer.complete.bind(observer),
                        });
                    })
                    .catch(observer.error.bind(observer));

                return () => {
                    if (handle) handle.unsubscribe();
                };
            })
    );

    const client = new ApolloClient({
        ssrMode: typeof window === undefined,
        link: ApolloLink.from([
            new TokenRefreshLink({
                accessTokenField: "accessToken",
                isTokenValidOrUndefined: () => {
                    const token = getAccessToken();

                    if (!token) {
                        return true;
                    }

                    try {
                        const { exp } = jwtDecode(token) as any;
                        if (Date.now() >= exp * 1000) {
                            return false;
                        } else {
                            return true;
                        }
                    } catch {
                        return false;
                    }
                },
                fetchAccessToken: () => {
                    const uri = new URL(
                        "/refresh_token",
                        "http://localhost:5000/"
                    );
                    return fetch(uri.toString(), {
                        method: "POST",
                        credentials: "include",
                    });
                },
                handleFetch: (accessToken) => {
                    setAccessToken(accessToken);
                },
                handleError: (err) => {
                    console.warn(
                        "Your refresh token is invalid. Try to relogin"
                    );
                    console.error(err);
                },
            }),
            onError(({ graphQLErrors, networkError }) => {
                console.log(graphQLErrors);
                console.log(networkError);
            }),
            requestLink,
            new HttpLink({
                uri: new URL("/graphql", "http://localhost:5000/").toString(),
                credentials: "include",
            }),
        ]),
        defaultOptions: {
            // For Hook useQuery
            watchQuery: {
                fetchPolicy: "cache-first",
                errorPolicy: "all",
            },
            // For client.query()
            query: {
                fetchPolicy: "network-only",
                errorPolicy: "all",
            },
            mutate: {
                // fetchPolicy: "no-cache",
                errorPolicy: "all",
            },
        },
        cache: new InMemoryCache(),
    });

    return client;
};
