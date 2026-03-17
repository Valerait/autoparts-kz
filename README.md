# АвтоЗапчасти — Интернет-магазин автозапчастей

Production-ready интернет-магазин автозапчастей с поиском по каталожным номерам, подбором по авто, корзиной, оформлением заказов, личным кабинетом и админ-панелью.

## Стек технологий

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase-compatible)
- **ORM:** Prisma
- **Search:** PostgreSQL trigram indexes + полнотекстовый поиск
- **Auth:** JWT + Refresh Token + OTP через WhatsApp
- **Cache:** Redis
- **Docker:** docker-compose

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# Клонировать и запустить
cp .env.example .env
docker-compose up -d

# Миграции и seed
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

### Вариант 2: Локальная разработка

**Предварительные требования:**
- Node.js 20+
- PostgreSQL 16+
- Redis

```bash
# 1. Установить зависимости
npm install

# 2. Настроить .env
cp .env.example .env
# Отредактировать .env — указать DATABASE_URL и другие переменные

# 3. Сгенерировать Prisma Client
npx prisma generate

# 4. Создать таблицы в БД
npx prisma db push

# 5. Применить trigram индексы (для fuzzy search)
psql $DATABASE_URL -f scripts/post-migrate.sql

# 6. Загрузить demo-данные
npx tsx prisma/seed.ts

# 7. Запустить dev-сервер
npm run dev
```

Приложение будет доступно на http://localhost:3000

## Тестовые аккаунты

| Роль     | Телефон        | Пароль      |
|----------|----------------|-------------|
| Admin    | +79001234567   | admin123    |
| Manager  | +79001234568   | manager123  |
| Customer | +79001234569   | customer123 |

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (shop)/            # Публичные страницы магазина
│   │   ├── page.tsx       # Главная
│   │   ├── search/        # Поиск
│   │   ├── products/[slug]/ # Карточка товара
│   │   ├── categories/[slug]/ # Категория
│   │   ├── brands/[slug]/ # Бренд
│   │   ├── cart/          # Корзина
│   │   └── checkout/      # Оформление заказа
│   ├── (auth)/            # Авторизация
│   │   ├── login/         # Вход
│   │   └── register/      # Регистрация
│   ├── account/           # Личный кабинет
│   ├── admin/             # Админ-панель
│   └── api/               # API Routes
│       ├── auth/          # Авторизация
│       ├── products/      # Товары и поиск
│       ├── categories/    # Категории
│       ├── brands/        # Бренды
│       ├── cart/          # Корзина
│       ├── orders/        # Заказы
│       ├── vehicles/      # Автомобили
│       ├── favorites/     # Избранное
│       └── admin/         # Админ API
├── components/            # React компоненты
│   ├── ui/               # Базовые UI (Button, Input, Badge)
│   ├── layout/           # Header, Footer
│   ├── shop/             # ProductCard, SearchBox, VehicleSelector
│   └── admin/            # Компоненты админки
├── hooks/                 # React hooks (useAuth, useCart)
├── lib/                   # Серверные утилиты
│   ├── prisma.ts         # Prisma Client
│   ├── auth.ts           # JWT утилиты
│   ├── api-response.ts   # API response helpers
│   ├── validation.ts     # Zod schemas
│   ├── rate-limit.ts     # Rate limiter
│   └── audit.ts          # Audit logging
├── services/              # Бизнес-логика
│   ├── catalog-search.ts # Поиск по каталожным номерам
│   └── whatsapp/         # WhatsApp провайдеры
├── utils/                 # Клиентские утилиты
└── middleware.ts          # Next.js middleware
```

## Ключевые возможности

### Поиск по каталожным номерам
- Нормализация номеров (удаление пробелов, дефисов, приведение к uppercase)
- Точный поиск по OEM/cross/alias номерам
- Fuzzy search через PostgreSQL trigram
- Автоматический подбор аналогов
- Поиск по тексту (название, описание)

### Авторизация через WhatsApp
- Абстракция провайдеров: mock / Twilio / Meta Cloud API / 360dialog
- OTP-код отправляется через WhatsApp
- Автоматическое создание аккаунта при первом входе
- Mock-провайдер для локальной разработки (коды в консоли)

### Админ-панель (/admin)
- Dashboard со статистикой
- CRUD для товаров, категорий, брендов
- Управление заказами со сменой статусов
- Импорт каталога из CSV/Excel
- Управление пользователями

### Импорт товаров
- Поддержка CSV и Excel (.xlsx)
- Dry-run режим
- Валидация строк
- Upsert логика (обновление существующих по SKU)
- Лог ошибок импорта

## API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `POST /api/auth/refresh` — Обновление токена
- `POST /api/auth/whatsapp/send-otp` — Отправка OTP в WhatsApp
- `POST /api/auth/whatsapp/verify-otp` — Проверка OTP
- `GET /api/auth/me` — Текущий пользователь
- `POST /api/auth/logout` — Выход

### Products
- `GET /api/products/search?q=...` — Поиск товаров
- `GET /api/products/[id]` — Карточка товара
- `GET /api/products/by-vehicle?makeId=...&modelId=...` — По автомобилю

### Cart & Orders
- `GET/POST/PUT/DELETE /api/cart` — Корзина
- `GET/POST /api/orders` — Заказы

### Admin
- `GET /api/admin/dashboard` — Статистика
- `GET/POST /api/admin/products` — Товары
- `GET/POST /api/admin/categories` — Категории
- `GET/POST /api/admin/brands` — Бренды
- `GET /api/admin/orders` — Заказы
- `PUT /api/admin/orders/[id]` — Смена статуса
- `GET /api/admin/users` — Пользователи
- `POST /api/admin/import` — Импорт каталога

## Переменные окружения

См. `.env.example` для полного списка.

## WhatsApp интеграция

### Production-ready вариант
- Подключить Twilio или Meta WhatsApp Cloud API
- Настроить переменные `TWILIO_*` или `META_WHATSAPP_*`
- Установить `WHATSAPP_PROVIDER=twilio` или `WHATSAPP_PROVIDER=meta_cloud`

### MVP вариант
- Использовать `WHATSAPP_PROVIDER=mock`
- OTP-коды будут выводиться в консоль сервера
- Подходит для разработки и тестирования

### Что потребует внешней интеграции
- Approved WhatsApp Business Account (для Meta Cloud API)
- Twilio аккаунт с WhatsApp Sandbox или Production (для Twilio)
- Утверждённые шаблоны сообщений (требование Meta)

## Безопасность

- JWT + Refresh Token с HttpOnly cookies
- bcrypt для хеширования паролей
- Rate limiting на API и OTP
- Zod валидация на всех endpoints
- Audit logging для критичных действий
- CORS и security headers
- Middleware защита для /admin и /account
- Защита от brute force через OTP attempts limit
