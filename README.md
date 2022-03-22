# Tutorial по GraphQL

> Вам не удалось запустить сервер, веб или что-то пошло не так. А может у вас есть вопросы?
>
> [Telegram](https://t.me/ru9art) - `@ru9art`

## Для работы с API сервера нам понадобится сам сервер, Docker, Docker-Compose, Bash

> Пока не получилось задеплоить сервер на хостинг прийдется включать сервер локально.
>
> Скачать сервер можно по [ссылке](https://github.com/muzyk0/Todolist-GraphQL-server). Как его запустить написано в `README.md`
>
> Но так же продублирую здесь.
>
> 1. В папке `deploy/dev` продублируйте файл `.env.example` и переименуйте в `.env`
>
> 2. Впишите любые символы в `ACCESS_TOKEN_SECRET=` и `REFRESH_TOKEN_SECRET=`
>
> например `ACCESS_TOKEN_SECRET=234sdsdf23fmn1v51fon` и `REFRESH_TOKEN_SECRET=2938jksdklfbyr378dhkjavf`
>
> 3. Запустите `bash create_docker_db.sh` и дождитесь когда выполнение команды закончится
>
> 4. Запустите `start_dev_docker.sh`

Для скачаем стартовый проект https://github.com/muzyk0/todolist-graphql-course/tree/L0_get-started

Скачаем все зависимости

```bash
yarn install

#or

yarn
```

А теперь проверим что все работает запустив проект

```bash
yarn start
```

Откройте [http://localhost:3000](http://localhost:3000) в своем браузере, чтобы увидеть результат.

## В первую очередь настроем наш Apollo Client

1. Добавим нужные зависимости

```
npm install @apollo/client graphql jwt-decode apollo-link-token-refresh
# or
yarn add @apollo/client graphql jwt-decode apollo-link-token-refresh
```

2. Мы будем сохранять Access Token в стейт менеджере и по этому давайте сразу подготовим для этого функцию в файле, а хранить пока что будем в обычной переменной.

```typescript
export let accessToken = "";

export const setAccessToken = (token: string) => {
    accessToken = token;
};

export const getAccessToken = () => {
    return accessToken;
};
```

3. Создадим файл `lib/apolloClient.ts` в папке `src` и добавьте данный код.
   Тут производится магия подключения Apollo, проверки и перезапроса токета авторизации.

```typescript
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
```

4. Теперь подключим Apollo Provider в `index.tsx`

```typescript
import { createApolloClient } from "./lib/apolloClient";

ReactDOM.render(
    <ApolloProvider client={createApolloClient()}>
        <App />
    </ApolloProvider>,
    document.getElementById("root")
);
```

5. Так же в компоненте `App` при первой отрисовки мы будем запрашивать у сервера актуальный accessToken и сохранять в глобальном состоянии приложения, по этому создадим кастомный хук `hooks/useRefreshToken.ts`

```typescript
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
```

А в `App.tsx` добавим вызов хука

```typescript
import { useRefreshToken } from "./hooks/useRefreshToken";

function App() {
    // this code
    const loading = useRefreshToken();

    if (loading) {
        return <>Загрузка...</>;
    }
    // end this code

    // some code
    // return jsx
}
```

На этом базовая настройка клиента завершена.