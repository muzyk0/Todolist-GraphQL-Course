# Tutorial по GraphQL

> Вам не удалось запустить сервер, веб или что то пошло не так? А может у вас есть вопросы?
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

## Приступим к реализации регистрации и авторизации пользователя.

#### Так как мы работаем с graphQL, то у нас есть уже готовая документация API и находится она по адресу [http://localhost:5000/graphql](http://localhost:5000/graphql)

### 1. Создание страниц входа, регистрации.

`1.1` Нам понадобятся библиотеки `React Router` и `React Hook Form` (опционально)

```bash
npm install react-router-dom@6 react-hook-form
# or
yarn add react-router-dom@6 react-hook-form
```

`1.2` Страницу регистрации возьмем [отсюда](https://react-hook-form.com/get-started#TypeScript) и немного перепишем.
Поля которые мы будем отправлять на сервер найдете в [документации](http://localhost:5000/graphql) и попробуйте сделать сами.

Перейдите по адресу [http://localhost:5000/graphql](http://localhost:5000/graphql) справа у нас 2 кнопки `DOCS` и `SCHEMA`. Нам нужна только вкладка `DOCS`, найдите в MUTATIONS register(...): User! и посмотрите какие поля мы должны передать и какие можем запросить.

> Знак `!` в конце `User!` означает, что мутация обязана возвращать данные типа User. Это могут быть как все поля так и несколько

А если лень, то вот готовый код страницы регистрации.

Добавьте в `srs/styles/App.module.css`

```css
.FormWrapper {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.FormWrapper > form {
    display: flex;
    flex-direction: column;
    row-gap: 10px;
}
```

А страницу регистрации в `srs/pages/Register.tsx`

```typescript jsx
import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import styles from "../styles/App.module.css";

type FormData = {
    name: string;
    password: string;
    email: string;
};

export const Register = () => {
    const { register, handleSubmit } = useForm<FormData>();
    const onSubmit = handleSubmit((data) => console.log(data));

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
```

Аналогично сделайте страницу Login только без поля "name"

`1.3` Добавим в `src/lib/accessToken.ts` проверку на авторизацию. Здесь мы декодируем jwt токен и проверяем пришел ли нам userId, если нет значит мы не авторизованы.

```typescript
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
```

`1.4` Создадим файл `src/RoutesContainer.tsx` и добавим

```typescript jsx
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
```

Из компонента `src/App.tsx` вынесите jsx тудулиста в отдельный компонент в `src/pages/TodoList.tsx`

```typescript jsx
import React from "react";
import styles from "../styles/App.module.css";

export const TodoList: React.FC = () => {
    return (
        <div className={styles.App}>
            <div>
                <h3>What to learn</h3>
                <div>
                    <input />
                    <button>+</button>
                </div>
                <ul>
                    <li>
                        <input type="checkbox" checked={true} />{" "}
                        <span>HTML&CSS</span>
                    </li>
                    <li>
                        <input type="checkbox" checked={true} /> <span>JS</span>
                    </li>
                    <li>
                        <input type="checkbox" checked={false} />{" "}
                        <span>React</span>
                    </li>
                </ul>
                <div>
                    <button>All</button>
                    <button>Active</button>
                    <button>Completed</button>
                </div>
            </div>
        </div>
    );
};
```

а в `App.tsx` возвращайте RoutesContainer

```typescript jsx
function App() {
    const loading = useRefreshToken();

    if (loading) {
        return <>Загрузка...</>;
    }

    return <RoutesContainer />;
}
```

### 3. Приступим к регистрации.

`3.1` Найдите в документации [http://localhost:5000/graphql](http://localhost:5000/graphql) мутацию register(...): User!

Для регистрации нам нужно передать 3 аргумента

> name: String!
>
> password: String!
>
> email: String!

В поле ввода напишем

```graphql endpoint
# Write your query or mutation here

mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
        id
        name
        email
    }
}
```

> PS: $email, $password и $name это наши переменные.

Внизу найдите `QUERY VARIABLES` здесь мы пишем параметры в формате JSON. Среда Apollo GraphQL playground подсказывает что мы должны туда написать (ctrl + space)

```json
{
    "email": "test@example.com",
    "name": "Your name",
    "password": "12345678"
}
```

Нажимаем Execute Query (Ctrl + Enter) (Кнопка Play) и мы успешно зарегистрировались и получили обратно данные которые мы запросили в мутации.

`3.2` А теперь сделаем тоже самое только в компоненте `src/pages/TodoList.tsx`.

Импортируем

```typescript
import { gql, useMutation } from "@apollo/client";
```

Добавим мутацию с использованием gql.

```typescript
const registerMutation = gql`
    mutation Register($email: String!, $password: String!, $name: String!) {
        register(email: $email, password: $password, name: $name) {
            id
            name
            email
        }
    }
`;
```

Так же ниже пропишем типизацию возвращаемых данных с сервера.

> Знак register`?` в типе RegisterMutationType означает, что данные могут не прийти из-за ошибки в аргументах или на сервере.

```typescript
interface UserData {
    id: number;
    email: string;
    name: string;
}

interface RegisterMutationType {
    register?: UserData;
}
```

В компоненте `TodoList` вверху используем хук useMutation()

> useMutation<Тип возвращаемых данных, Тип принимающих аргументов>()
>
> Хук возвращает массив где первым элементом будет функция, вторым дополнительные параметры (Нам пока не пригодится)

```typescript
const [userRegister] = useMutation<RegisterMutationType, FormData>(
    registerMutation
);
```

А теперь отредактируем функцию onSubmit

```typescript
const onSubmit = handleSubmit(({ email, name, password }) => {
    userRegister({
        variables: { email, name, password },
    });
});
//# or
const onSubmit = handleSubmit((data) => {
    userRegister({
        variables: data,
    });
});
```

Проверьте вкладку network отправили ли мы запрос и с каким данными, а так же что получили обратно.

> Q: А что будет если придет ошибка? Мы же не увидим ее?
>
> A: Если придет ошибка мы сможем увидеть ее только во вкладке network. Так давайте это исправим.

Функция userRegister возвращаем промис, а значит мы можем дождаться выполнения запроса и проконтролировать, что все прошло успешно.

1. Добавьте перед функцией callback `async` (Внутри handleSubmit)
2. Дождемся результата выполнения функции userRegister и запишем в переменную `result`
3. Проверим ошибки. `if (result.errors) {}`
4. Если есть ошибки, то выведем alert()

```typescript
const onSubmit = handleSubmit(async (data) => {
    const result = await userRegister({
        variables: data,
    });

    if (result.errors) {
        alert(result.errors[0].message);
        return;
    }
});
```

И добавим редирект на страницу входа.

```typescript
// В начало компонента
const navigate = useNavigate();

// В конец функции onSubmit
navigate("/login", { replace: true });
```

> Q: Все хорошо и ошибок нет, Я зарегистрировался?
>
> A: Да. Но войти в аккаунт нужно самому, так настроен сервер. (Возможно временно)
>
> Q: Я слышал, что в graphql есть автотипизация, так зачем мы ее пишем сами?
>
> A: Почти верно. Есть специальные библиотеки для автоматической типизации и создания хуков. Например: GraphQL Code Generator. Сделаем с его помощью страницу входа. Хорошо?

### 4. Настройка GraphQL Code Generator

`4.1` Документация [Installing Codegen](https://www.graphql-code-generator.com/docs/getting-started/installation)

Добавляем зависимость

```bash
yarn add @graphql-codegen/cli -D
```

И запускаем инициализацию graphql-codegen init

```bash
yarn graphql-codegen init
```

```
Если отмечено **, то это значение не является значением по умолчанию
и его нужно изменить. (Значения по умолчанию актуальны на Март 2022 года)

1. What type of application are you building? Application built with React
2. ** Where is your schema?: (path or url) http://localhost:5000/graphql
3. ** Where are your operations and fragments?: src/graphql/**/*.graphql
4. Pick plugins: TypeScript (required by other typescript plugins), TypeScript Operations (operations and fragments), TypeScript React Apollo (typed components and HOCs)
5. Where to write the output: src/generated/graphql.tsx
6. ** Do you want to generate an introspection file? No
7. How to name the config file? codegen.yml
8. ** What script in package.json should run the codegen? gen

Не забудьте запустить # yarn install
```

Теперь в package.json у нас появился новый скрипт для генерации хуков, типизации и прочего.

```bash
yarn gen
```

#### И так же заранее настроем codegen.yml

```yaml
config:
    withHOC: false
    withComponent: false
    withHooks: true
    namingConvention:
        enumValues: keep
```

Добавьте на один уровень с plugins.

> Здесь отключаем генерацию HOC'ов и Components
>
> enumValues: keep - Не преобразуем enum с сервера. (Оставляем регистр символов таким же)

Получаем примерно так:

```yaml
overwrite: true
schema: "http://localhost:5000/graphql"
documents: "src/graphql/**/*.graphql"
generates:
    src/generated/graphql.tsx:
        plugins:
            - "typescript"
            - "typescript-operations"
            - "typescript-react-apollo"
        config:
            withHOC: false
            withComponent: false
            withHooks: true
            namingConvention:
                enumValues: keep
```

### 5. Приступим к авторизации.

`5.1` В документации нам понадобится мутация `login(...): LoginResponse!`

Сначала попробуем авторизоваться в нашей песочнице (Так же этот код нужно будет вставить в файл чуть позже)

```graphql endpoint
mutation Login($password: String!, $email: String!) {
    login(password: $password, email: $email) {
        accessToken
    }
}
```

В `QUERY VARIABLES`

```json
{
    "password": "your password",
    "email": "your email"
}
```

В ответ получаем `accessToken` и запишем его в `HTTP HEADERS`

```json
{
    "authorization": "Bearer your_access_token"
}
```

> Q: Что такое Token?
>
> A: [Habr](https://habr.com/ru/company/vk/blog/115163/), а расшифровать его можно здесь [https://jwt.io/](https://jwt.io/)

`5.2` Теперь сделаем все то же самое только в нашем React приложении.

В `src/graphql/user.graphql` (обычный текстовый файл) добавим только что написанную в песочнице мутацию и запустим генерацию.

```bash
yarn gen
```

Импортируем `useLoginMutation из '../generated/graphql';`

Хук useLoginMutation сгенерировался автоматически и нам осталось его только вызвать вверху компонента.

```typescript
const [login] = useLoginMutation();
```

Так же перепишем функцию onSubmit

1. Добавьте перед функцией callback `async` (Внутри handleSubmit)
2. Вызовем функцию `login` и передадим значения нашей формы
3. Дождемся результата выполнения и запишем в переменную `result`
4. Проверим ошибки. `if (result.errors) {}`
5. Если есть ошибки, то выведем alert()
6. Установим новый AccessToken. Оператор ?? называется [Оператор нулевого слияния](https://learn.javascript.ru/nullish-coalescing-operator)

```typescript
const onSubmit = handleSubmit(async ({ password, email }) => {
    const result = await login({
        variables: {
            password,
            email,
        },
    });

    if (result.errors) {
        alert(result.errors[0].message);
        return;
    }

    setAccessToken(result.data?.login.accessToken ?? "");
});
```

И добавим редирект на главную страницу.

```typescript
// В начало компонента
const navigate = useNavigate();

// В конец функции onSubmit
navigate("/", { replace: true });
```

Весь код страницы `Login`

```typescript jsx
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/App.module.css";
import { useLoginMutation } from "../generated/graphql";
import { setAccessToken } from "../lib/accessToken";

type FormData = {
    password: string;
    email: string;
};

export const Login = () => {
    const navigate = useNavigate();

    const [login] = useLoginMutation();
    const { register, handleSubmit } = useForm<FormData>();
    const onSubmit = handleSubmit(async ({ password, email }) => {
        const result = await login({
            variables: {
                password,
                email,
            },
        });

        if (result.errors) {
            alert(result.errors[0].message);
            return;
        }

        setAccessToken(result.data?.login.accessToken ?? "");

        navigate("/", { replace: true });
    });

    return (
        <div className={styles.FormWrapper}>
            <form onSubmit={onSubmit}>
                <label>E-mail</label>
                <input {...register("email")} />
                <label>Password</label>
                <input {...register("password")} type="password" />
                <div>
                    <button type="submit">Login</button> or{" "}
                    <Link to={"/register"}>Register</Link>
                </div>
            </form>
        </div>
    );
};
```

### 5. Напоследок давайте отобразив наш логин и реализуем выход из аккаунта.

В первую очередь нам нужно добавить мутацию и запрос для получения имени.

В `src/graphql/user.graphql` добавьте и снова сгенерируйте graphql.tsx

```graphql endpoint
query Me {
    me {
        name
    }
}

mutation Logout {
    logout
}
```

```bash
yarn gen
```

Создайте компонент Header в `src/components/layout/Heder.tsx`

```typescript jsx
import React from "react";

export const Header: React.FC = () => {
    return <header style={{ display: "flex", gap: "10px" }}>Header</header>;
};
```

Компонент Layout в `src/components/layout/Layout.tsx`

```typescript jsx
import React from "react";
import { Header } from "./Header";

export const Layout: React.FC = ({ children }) => {
    return (
        <>
            <Header />
            {children}
        </>
    );
};
```

В `src/App.tsx` оберните RoutesContainer в Layout

```typescript jsx
import { Layout } from "./components/layout/Layout";

// ...
// ...

return (
    <Layout>
        <RoutesContainer />
    </Layout>
);
```

1. В компонент Header.tsx импортируем недавно сгенерированные хуки и вызовите их в компоненте.

```typescript
// Для редиректа на страницу авторизации после выхода
const navigate = useNavigate();

// Сразу забираем с помощью деструктуризации data и loading
const { data, loading } = useMeQuery();
const [logout] = useLogoutMutation();
```

2. Добавим обработчик будущей кнопки выхода из аккаунта

```typescript
const onLogoutClick = async () => {
    const result = await logout();

    if (result.errors) {
        alert(result.errors[0].message);
        return;
    }

    // Обнуляем токен
    setAccessToken("");

    // Редирект на страницу Login
    navigate("/login", { replace: true });
};
```

3. И саму разметку

```typescript jsx
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
```

Теперь в шапке сайта будет отображаться имя пользователя и кнопка выхода или кнопки регистрации и авторизации если не авторизованы.

> Q: Почему авторизация и выход с аккаунта работает только с перезагрузкой страницы?
>
> A: Так как у Apollo есть кэш, будем его обнулять. Так же нужно сделать и в Login.tsx
>
> ```typescript
> // Деструктуризацией из дополнительных параметром заберм "client"
> const [logout, { client }] = useLogoutMutation();
>
> // А в onLogoutClick после setAccessToken("") добавьте
> client.resetStore();
> ```

Полный код header.tsx

```typescript jsx
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
```

### Попробуйте реализовать сами еще несколько запросов и мутаций.

#### Например:

1. Добавление нового тудулиста.
2. Вывод всех ваших тудулистов.
3. Редактирование (Изменение названия или описания).
4. Удаление
