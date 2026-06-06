# TaskFlow

Веб-приложение для управления проектами и задачами. Данные проектов и задач хранятся в Supabase, авторизация и команда — в `localStorage`.

## Запуск

```bash
npm install
npm run dev
```

Сайт откроется на http://localhost:5173

Сборка: `npm run build` (папка `dist/`)

## Стек

HTML5, CSS3, JavaScript (ES6+), Vite, Tailwind CSS, Supabase (REST и Realtime).

## Структура

```
index.html
src/css/          — стили, тема, БЭМ
src/js/
  main.js         — вход
  app.js          — запуск приложения
  pages/          — страницы
  core/           — классы приложения
  api/            — запросы к Supabase
```

## БЭМ

Имена классов: блок__элемент--модификатор. Хелпер `bem()` в `src/js/bem.js`, базовые стили блоков — в `src/css/bem.css`.

## Основные классы

- `Application` — маршруты и рендер страниц
- `StateManager` — состояние приложения
- `ThemeManager` — светлая/тёмная тема
- `RealtimeSync` — обновление проектов и задач через Supabase Realtime
- `ProjectService`, `TaskService` — работа с API
