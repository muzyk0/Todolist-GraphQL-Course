# Мини курс по GraphQL

> Вам не удалось запустить сервер, веб или что то пошло не так? А может у вас есть вопросы?
>
> [Telegram](https://t.me/ru9art) - `@ru9art`

## В этом уроке настроем регистрацию и авторизацию пользователя.

#### Так как мы работает с graphQL, то у нас есть уже готовая документация API и находится она по адресу [http://localhost:5000/graphql](http://localhost:5000/graphql)

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

```typescript
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
                <input {...register("password")} />
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

```typescript
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

```typescript
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

```typescript
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

```graphql
mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
        id
        name
        email
    }
}
```

> $email, $password и $name это наши переменные.

Внизу найдите `QUERY VARIABLES` здесь мы пишем параметры в формате JSON. Среда playground graphql подсказывает что мы должны туда написать (ctrl + space)

```graphql
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

> Знак register`?` в типе RegisterMutationType означает, что данные могут не прийти из за ошибки в аргументах или на сервере.

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

> q: А что будет если придет ошибка? мы же не увидим ее?
>
> a: Если придет ошибка мы сможем увидеть ее только во вкладке network. Так давайте это исправим.

Функция userRegister возвращаем промис, а значит мы можем дождаться выполнения запроса и проконтролировать, что все прошло успешно.

1. Добавьте перед функцией callback async
2. Дождемся результата выполнения функции userRegister и запишем в переменную result
3. Проверим пришли ли нам какие либо ошибки. if (result.errors) {}
4. Если пришли, то выведем alert()

```typescript
const onSubmit = handleSubmit(async (data) => {
    const result = await userRegister({
        variables: data,
    });

    if (result.errors) {
        alert(result.errors[0].message);
    }
});
```

> q: Все хорошо и ошибок нет, Я зарегистрировался?
>
> a: Да. Но войти в аккаунт нужно самому, так настроен сервер. (Возможно временно)
>
> q: Я слышал, что в graphql есть автотипизация, так зачем мы ее пишем сами?
>
> a: Почти верно. Есть специальные библиотеки для автоматической типизации, создания хуков для упрощения работы. Например: GraphQL Code Generator. Сделаем с его помощью страницу входа. Хорошо?

### 4. Настройка GraphQL Code Generator
