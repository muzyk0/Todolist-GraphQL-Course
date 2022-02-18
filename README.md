# Мини курс по GraphQL

> Вам не удалось запустить сервер, веб или что то пошло не так. А может у вас есть вопросы?
>
> [Telegram](https://t.me/ru9art) - `@ru9art`

## Для работы с API сервера нам понадобится сам сервер, Docker, Docker-Compose, Bash

> Пока не получилось задеплоить сервер на хостинг
>
> Скачать сервер можно по [ссылке](https://github.com/muzyk0/Todolist-GraphQL-server). Как его запустить написано в `README.md`
>
> Но так же продублирую здесь.
>
> 1. В папке `deploy/dev` продублируйте файл `.env.example` и переименуйте в `.env`
>
> 2. Впишите любые символы в `ACCESS_TOKEN_SECRET=` и `REFRESH_TOKEN_SECRET=`
>
> например `ACCESS_TOKEN_SECRET=234sdsdf23fmn1v51fon`
>
> 3. Запустите `bash create_docker_db.sh` и дождитесь когда выполнение команды закончится
>
> 4. Запустите `start_dev_docker.sh`

Для начала создадим Next.JS проект:

```bash
npx create-next-app todolist-grpahql-course --use-npm --example "https://github.com/muzyk0/TodoList-GraphQL-Web-NextJs"
```

А теперь проверим что все работает запустив проект

```bash
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в своем браузере что бы увидеть результат.

## В первую очередь настроем наш Apollo Client

1. Добавим нужные зависимости

```
npm install @apollo/client graphql jwt-decode apollo-link-token-refresh
# or
yarn add @apollo/client graphql jwt-decode apollo-link-token-refresh
```

2. Мы будет сохранять Access Token в стейт менеджере и по этому давайте сразу подготовим для этого функцию в файле, а хранить пока что мы будет в обычной переменной.

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

4. А теперь подключим Apollo Provider в `_app.tsx`

```typescript
import { createApolloClient } from "../lib/apolloClient";

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ApolloProvider client={createApolloClient()}>
            <Component {...pageProps} />)
        </ApolloProvider>
    );
}
```

5. Так как для работы с тудулистом нам потрубется авторизация, то настроем сначала ее.

### Так как мы работает с graphQL, то у нас есть уже готовая документация API и находится она по адресу [http://localhost:5000](http://localhost:5000)

В файле `components/layout/layout.tsx` отправим запрос `Me` и проверим авторизованны мы или нет.

Импортируем

```typescript
import { gql, useQuery } from "@apollo/client";
```

Это наш запрос за данными об авторизации. В ответ мы получим null если не авторизованы или данные которые мы запросим.

```typescript
const meQuery = gql`
    query Me {
        me {
            id
            email
            name
        }
    }
`;
```

Так же ниже пропишем типизацию

```typescript
interface Me {
    id: number;
    email: string;
    name: string;
}

interface meQueryType {
    me: Me | null;
}
```

В компоненте `Layout` используем хук useQuery.
Он нам вернет

1. data - данные которые мы запросили
2. loading - boolean флаг загрузки
3. error - ошибка если что то пошло не так.

```typescript
const { data, loading, error } = useQuery<meQueryType>(meQuery);
```

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
