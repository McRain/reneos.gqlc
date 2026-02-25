# @reneos/gqlc — GraphQL Client Library

Легковесный GraphQL-клиент для браузера и Node.js.  
Поддерживает шаблоны запросов, query, mutation и subscription.

GitHub: https://github.com/McRain/reneos.gqlc

## Установка

```bash
npm i @reneos/gqlc
```

---

## Статический API (GraphQLClient)

```js
import gqlc from "@reneos/gqlc"
```

### Инициализация

```js
gqlc.Init({
  method: "post",
  credentials: "include",
  headers: { Authorization: "Bearer TOKEN" },
  url: "https://example.com/graphql"
})
```

### Query (динамический запрос)

```js
const { user, error } = await gqlc.Get({
  user: [
    { $args: { id: "userId" } },
    "name",
    "email",
    { elements: ["id", "title"] }
  ]
})
```

Сгенерированный запрос:

```graphql
query { user (id: "userId") { name email elements { id title } } }
```

### Query (шаблон)

```js
// Сохраняем шаблон
gqlc.Add({
  user_query: {
    user: [
      { $args: { id: "$userid" } },
      "name",
      "email"
    ]
  }
})

// Используем с подстановкой данных
const { user, error } = await gqlc.Get("user_query", { $userid: "abc-123" })
```

### Mutation

```js
const { createUser, error } = await gqlc.Set({
  createUser: [
    { $args: { name: "Alice", email: "alice@example.com" } },
    "id",
    "name"
  ]
})
```

### Subscription

```js
const { onMessage, error } = await gqlc.Sub({
  onMessage: [
    { $args: { channel: "general" } },
    "text",
    "author"
  ]
})
```

### Управление шаблонами

```js
// Добавить шаблоны
gqlc.Add({
  tmpl_one: { ... },
  tmpl_two: { ... }
})

// Прочитать шаблон
const tmpl = gqlc.Read("tmpl_one")

// Удалить шаблоны
gqlc.Remove(["tmpl_one", "tmpl_two"])
```

---

## Экземплярный API (Client)

Для случаев, когда нужно несколько клиентов с разными конфигурациями.

```js
import { Client } from "@reneos/gqlc"

const client = new Client({
  method: "post",
  credentials: "include",
  headers: {},
  url: "https://example.com/graphql"
})
```

### Query

```js
const { user, error } = await client.read({
  user: [
    { $args: { id: "userId" } },
    "name",
    "email"
  ]
})
```

### Query (шаблон)

```js
client.add({
  user_query: {
    user: [
      { $args: { id: "$userid" } },
      "name",
      "email"
    ]
  }
})

const { user, error } = await client.read("user_query", { $userid: "abc-123" })
```

### Mutation

```js
const { createUser, error } = await client.write({
  createUser: [
    { $args: { name: "Alice" } },
    "id",
    "name"
  ]
})
```

### Subscription

```js
const { onMessage, error } = await client.subs({
  onMessage: [
    { $args: { channel: "general" } },
    "text",
    "author"
  ]
})
```

### Управление шаблонами

```js
client.add({ tmpl: { ... } })
client.remove(["tmpl"])
```

---

## Аргументы

Специальный объект `$args` передаёт аргументы в GraphQL-поля:

```js
{ $args: { id: "123", limit: 10, active: true } }
```

Для передачи переменных (raw enum/переменных без кавычек) используйте префикс `$`:

```js
{ $args: { type: "$MyEnum" } }
// Результат: type: MyEnum (без кавычек)
```

---

## Обработка ошибок

При сетевой/неизвестной ошибке возвращается объект:

```js
{ error: { code: 400, message: "..." } }  // static API
{ error: { code: 500, message: "..." } }  // instance API
```

При ошибке с сервера бросается `GraphError`:

```js
import gqlc from "@reneos/gqlc"

const { GraphError } = gqlc
// GraphError имеет поля: code, message, data
```

---

## API Reference

### Static (GraphQLClient)

| Метод | Описание |
|-------|----------|
| `Init(config)` | Инициализация клиента с конфигурацией fetch |
| `Get(query, data?)` | Выполнить query |
| `Set(query, data?)` | Выполнить mutation |
| `Sub(query, data?)` | Выполнить subscription |
| `Add(templates)` | Сохранить шаблоны запросов |
| `Read(key)` | Прочитать сохранённый шаблон |
| `Remove(keys)` | Удалить шаблоны по ключам |
| `Build(op, ...args)` | Построить строку GraphQL-запроса |
| `ParseTemplate(tmpl, data)` | Подставить данные в шаблон |

### Instance (Client)

| Метод | Описание |
|-------|----------|
| `new Client(config)` | Создать экземпляр клиента |
| `read(query, data?)` | Выполнить query |
| `write(query, data?)` | Выполнить mutation |
| `subs(query, data?)` | Выполнить subscription |
| `add(templates)` | Сохранить шаблоны |
| `remove(keys)` | Удалить шаблоны |
| `build(op, ...args)` | Построить строку запроса |
| `parseTemplate(tmpl, data)` | Подставить данные в шаблон |

---

## Лицензия

MIT