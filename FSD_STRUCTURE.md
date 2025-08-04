# Feature Sliced Design (FSD) Structure

Этот проект теперь использует архитектуру Feature Sliced Design (FSD) для лучшей организации кода и масштабируемости.

## Структура проекта

```
src/
├── app/                    # Инициализация приложения
│   ├── providers/         # Провайдеры (контекст, роутинг и т.д.)
│   └── index.ts
├── pages/                 # Страницы приложения
│   └── chat/             # Страница чата
│       └── index.ts
├── widgets/               # Композитные блоки
│   └── chat/             # Виджет чата
│       ├── Chat.tsx
│       ├── ChatMessages.tsx
│       ├── ChatInput.tsx
│       └── index.ts
├── features/              # Функциональность
│   └── chat/             # Фичи чата
│       └── index.ts
├── entities/              # Бизнес-сущности
│   └── chat/             # Сущности чата
│       ├── ToolEvent.tsx
│       └── index.ts
└── shared/                # Переиспользуемый код
    ├── ui/               # UI компоненты
    │   ├── AgentInfo.tsx
    │   ├── AgentSelector.tsx
    │   ├── ChatHeader.tsx
    │   ├── CodeBlock.tsx
    │   ├── GlitchLogo.tsx
    │   ├── LogViewer.tsx
    │   ├── markdownConfig.tsx
    │   ├── Chat.css
    │   └── index.ts
    ├── lib/              # Утилиты и библиотеки
    │   ├── flowiseApi.ts
    │   ├── flowiseSdk.ts
    │   ├── logger.ts
    │   ├── utils.ts
    │   └── index.ts
    ├── api/              # API клиенты
    │   └── index.ts
    ├── config/           # Конфигурация
    │   ├── theme.ts
    │   └── index.ts
    ├── types/            # Типы
    │   ├── flowise.ts
    │   └── index.ts
    └── index.ts
```

## Слои FSD

### 1. **app/** - Инициализация приложения
- Провайдеры (React Context, роутинг)
- Глобальные стили
- Инициализация библиотек

### 2. **pages/** - Страницы
- Композиция виджетов
- Роутинг
- Метаданные страниц

### 3. **widgets/** - Виджеты
- Композитные блоки
- Композиция фич и сущностей
- Бизнес-логика высокого уровня

### 4. **features/** - Фичи
- Пользовательские сценарии
- Бизнес-логика
- API вызовы

### 5. **entities/** - Сущности
- Бизнес-сущности
- Типы данных
- Базовые компоненты

### 6. **shared/** - Переиспользуемый код
- UI компоненты
- Утилиты
- API клиенты
- Конфигурация
- Типы

## Абсолютные импорты

Проект настроен для использования абсолютных импортов:

```typescript
// ✅ Правильно
import { Chat } from '@/widgets/chat';
import { ToolEvent } from '@/entities/chat';
import { logger } from '@/shared/lib';
import { FlowiseAgent } from '@/shared/types';

// ❌ Неправильно
import { Chat } from '../../widgets/chat';
import { ToolEvent } from '../../../entities/chat';
```

## Правила импортов

1. **Слои могут импортировать только слои ниже себя:**
   - `app` → `pages`, `widgets`, `features`, `entities`, `shared`
   - `pages` → `widgets`, `features`, `entities`, `shared`
   - `widgets` → `features`, `entities`, `shared`
   - `features` → `entities`, `shared`
   - `entities` → `shared`
   - `shared` → только внутренние модули

2. **Слои не могут импортировать слои выше себя**

3. **Внутри слоя можно импортировать любые модули**

## Конфигурация

### TypeScript (tsconfig.app.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/app/*": ["src/app/*"],
      "@/pages/*": ["src/pages/*"],
      "@/widgets/*": ["src/widgets/*"],
      "@/features/*": ["src/features/*"],
      "@/entities/*": ["src/entities/*"],
      "@/shared/*": ["src/shared/*"]
    }
  }
}
```

### Vite (vite.config.ts)
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/app': path.resolve(__dirname, './src/app'),
    '@/pages': path.resolve(__dirname, './src/pages'),
    '@/widgets': path.resolve(__dirname, './src/widgets'),
    '@/features': path.resolve(__dirname, './src/features'),
    '@/entities': path.resolve(__dirname, './src/entities'),
    '@/shared': path.resolve(__dirname, './src/shared'),
  },
}
```

## Преимущества FSD

1. **Масштабируемость** - легко добавлять новые фичи
2. **Изоляция** - слои независимы друг от друга
3. **Переиспользование** - shared слой доступен везде
4. **Читаемость** - понятная структура проекта
5. **Тестируемость** - изолированные модули легче тестировать 