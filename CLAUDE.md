# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Web приложение B2B платформы для поиска партнеров, для продажи и закупки. Поиск лучший партнеров под заказ

## 🛠️ Tech Stack
- **TypeScript / React**
- **Redux Toolkit / RTK Query** — state и data слой
- **Emotion** — стилизация компонентов, кастомизация тем
- **@chakra-ui/react** — UI-фреймворк
- **Lottie** — анимация интерфейса
- **brojs/cli** — управление сборкой, dev-server, генерацией, тестами и scaffold-командами
- **REST API** — интеграция с backend, Express/NodeJS моки
- **i18next** — интернационализация (ru/en)
- **ESLint, Prettier, Stylelint** — автоматизация чистоты кода
- **Jenkins** — автоматизация тестирования и деплоя
- **Webpack** — сборка фронтенда

## запуск проекта 
npm start

после запуска проект будет расположен по адресу 
http://localhost:8099/procurement-pl

все API работает и проксируется по адресу http://localhost:8099/api

тестовый пользователь 
email: 'admin@test-company.ru',
password: 'SecurePass123!',

если его нет завести его можно скриптом recreate-test-user.js

не исправляй файлы из папки @stubs/  в powershell или в терминале, не надо перезагружать сервер, там есть hot reload

нельзя трогать в bro.config.js .api ключ

не используй в js и typescript стиль кода от языка Python
используй mcp context7 для получения code convention и code style проекта согласно тех стеку

не останавливайся если есть ошибки на ui, проверяй что все ключи локализации имеют текстовки

проверяй что все api выдают статус 200

не заканчивай работу если есть любые ошибки, строй план выполнения задач 

все api должны данные хранить в базе данных, никаких моков и глобальных переменных, текущая база данных mongoDB которая поднята в doker

тестируй после внесения изменений используя браузер
и пиши автотесты на playwright по функционалу который работает

на изменение автотестов на работающий функционал запрашивай подтверждение от пользователя

не создавай инструкции, summary, report

используй в качестве документации по написанию тестов @https://testing-library.com/ 

при проверке и доработке API используй mcp MongoDB

Node.js не кэширует старые модули, на нем стоит хот релоад папки api

не редактируй файлы проекта в терминале

## 📂 Project Structure
@types/ # Глобальные типы
locales/ # Локализация (i18next: ru/en)
remote-assets/ # Внешние ресурсы (images, icons)
src/
├── data/ # Data слой: API, store, константы, RTK Query
│ ├── api/ # API-клиенты, endpoints
│ └── slices/ # Redux Toolkit slices
├── assets/ # Картинки, иконки, SVG для проекта
├── components/ # Кастомные UI-компоненты, аватары, модальные окна, формы
│ └── animations/ # Композиции с Lottie/Emotion
├── hooks/ # Custom React hooks
├── pages/ # Маршруты приложения, состояние страниц
├── utils/ # Вспомогательные функции
└── types/ # Локальные типы и интерфейсы
stubs/
├── api/ # Моки для backend/Express
└── mocks/ # Test data и json-файлы
app.tsx # Корневой компонент
index.tsx # Точка входа микрофронтенда
bro.config.js # Фронтовая конфигурация (роутинг, интеграция)
tsconfig.json # TS-конфиг
.eslintrc.js # Linting-правила
.prettierrc.json # Formatting-правила
Jenkinsfile / .github/ # CI/CD pipeline
README.md # Описание, инструкции
LICENSE # Лицензия


## 📝 Code Standards

### TypeScript
- Строгая типизация во всех слоях (tsconfig strict: true).
- Явная типизация возвращаемых значений.
- Классификация типов: @types/ для глобальных, src/types/ для модульных.
- Не использовать `any` без спец. причины и комментария.

### Redux + RTK Query
- Одна папка __data__/ для данных и Redux-слоев.
- API клиенты в `src/__data__/api/`, slices в `src/__data__/slices/`.
- Использовать tagTypes для кэширования, invalidate для мутаций.
- Все endpoints должны быть типизированы.

### UI/Styling
- Chakra UI как основной компонентный фреймворк.
- Emotion — только для сложных кейсов/анимаций.
- Предпочитать theme-токены и responsive-массивы Chakra.

### Интернационализация
- Локализация хранится в `locales/`
- Подключение через @brojs/i18nextconfig и хуки i18next
- Все тексты и кнопки должны быть ключами перевода

### Соглашения
- components: максимум 200 строк, тесты рядом (Component.tsx, Component.test.tsx)
- pages: соответствуют маршрутам bro.config.js
- assets: только то, что реально нужно в UI/production

# Chakra UI v3 Rules

This project uses Chakra UI v3. Follow these rules:

1. Import from @chakra-ui/react: Alert, Avatar, Button, Card, Field, Table, etc.
2. Import from components/ui: Checkbox, Drawer, Radio, Menu, Dialog, Tooltip,
   etc.
3. Use toaster.create() instead of useToast()
4. Modal is now Dialog with different props
5. Boolean props changed: isOpen → open, isDisabled → disabled
6. colorScheme → colorPalette
7. Button icons are children, not props
8. Always use VStack/HStack, not Stack
9. Use compound components for complex components
10. Check migration guide for component-specific changes

## Core Migration Rules

### Package Changes

# Removed Packages

- Remove @emotion/styled and framer-motion dependencies
- Icons: Use lucide-react or react-icons instead of @chakra-ui/icons
- Hooks: Use react-use or usehooks-ts instead of @chakra-ui/hooks
- Next.js: Use asChild prop instead of @chakra-ui/next-js package

### Import Sources

Always use correct import sources:

# From @chakra-ui/react:

Alert, Avatar, Button, Card, Field, Table, Input, NativeSelect, Tabs, Textarea,
Separator, useDisclosure, Box, Flex, Stack, HStack, VStack, Text, Heading, Icon

# From components/ui (relative imports):

Provider, Toaster, ColorModeProvider, Tooltip, PasswordInput

### Toast System

```tsx
// ✅ New v3 way
import { toaster } from "./components/ui/toaster"

// ❌ Old v2 way
const toast = useToast()
toast({
  title: "Title",
  status: "error",
  isClosable: true,
  position: "top-right",
})

toaster.create({
  title: "Title",
  type: "error", // status → type
  meta: {
    closable: true, // isClosable → meta.closable
  },
  placement: "top-end", // top-right → top-end
})
```

### Dialog (formerly Modal)

```tsx
// ❌ Old v2
<Modal isOpen={isOpen} onClose={onClose} isCentered>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Title</ModalHeader>
    <ModalBody>Content</ModalBody>
  </ModalContent>
</Modal>

// ✅ New v3
<Dialog.Root open={isOpen} onOpenChange={onOpenChange} placement="center">
  <Dialog.Backdrop />
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Title</Dialog.Title>
    </Dialog.Header>
    <Dialog.Body>Content</Dialog.Body>
  </Dialog.Content>
</Dialog.Root>
```

### Button Icons

```tsx
// ❌ Old v2
<Button leftIcon={<Mail />} rightIcon={<ChevronRight />}>
  Email
</Button>

// ✅ New v3
<Button>
  <Mail /> Email <ChevronRight />
</Button>
```

### Alert Structure

```tsx
// ❌ Old v2
<Alert variant="left-accent">
  <AlertIcon />
  <AlertTitle>Title</AlertTitle>
  <AlertDescription>Description</AlertDescription>
</Alert>

// ✅ New v3
<Alert.Root borderStartWidth="4px" borderStartColor="colorPalette.solid">
  <Alert.Indicator />
  <Alert.Content>
    <Alert.Title>Title</Alert.Title>
    <Alert.Description>Description</Alert.Description>
  </Alert.Content>
</Alert.Root>
```

### Tooltip

```tsx
// ❌ Old v2
<Tooltip label="Content" hasArrow placement="top">
  <Button>Hover me</Button>
</Tooltip>

// ✅ New v3
import { Tooltip } from "./components/ui/tooltip"

<Tooltip content="Content" showArrow positioning={{ placement: "top" }}>
  <Button>Hover me</Button>
</Tooltip>
```

### Input with Validation

```tsx
// ❌ Old v2
<Input isInvalid />

// ✅ New v3
<Field.Root invalid>
  <Field.Label>Email</Field.Label>
  <Input />
  <Field.ErrorText>This field is required</Field.ErrorText>
</Field.Root>
```

### Table Structure

```tsx
// ❌ Old v2
<Table variant="simple">
  <Thead>
    <Tr>
      <Th>Header</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Cell</Td>
    </Tr>
  </Tbody>
</Table>

// ✅ New v3
<Table.Root variant="line">
  <Table.Header>
    <Table.Row>
      <Table.ColumnHeader>Header</Table.ColumnHeader>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Cell</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
```

### Tabs

```tsx
// ❌ Old v2
<Tabs>
  <TabList>
    <Tab>One</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Content</TabPanel>
  </TabPanels>
</Tabs>

// ✅ New v3
<Tabs.Root defaultValue="one" colorPalette="orange">
  <Tabs.List>
    <Tabs.Trigger value="one">One</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="one">Content</Tabs.Content>
</Tabs.Root>
```

### Menu

```tsx
// ❌ Old v2
<Menu>
  <MenuButton as={Button}>Actions</MenuButton>
  <MenuList>
    <MenuItem>Download</MenuItem>
  </MenuList>
</Menu>

// ✅ New v3
<Menu.Root>
  <Menu.Trigger asChild>
    <Button>Actions</Button>
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Item value="download">Download</Menu.Item>
  </Menu.Content>
</Menu.Root>
```

### Popover

```tsx
// ❌ Old v2
<Popover>
  <PopoverTrigger>
    <Button>Click</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverArrow />
    <PopoverBody>Content</PopoverBody>
  </PopoverContent>
</Popover>

// ✅ New v3
<Popover.Root positioning={{ placement: "bottom-end" }}>
  <Popover.Trigger asChild>
    <Button>Click</Button>
  </Popover.Trigger>
  <Popover.Content>
    <PopoverArrow />
    <Popover.Body>Content</Popover.Body>
  </Popover.Content>
</Popover.Root>
```

### Select/NativeSelect

```tsx
// ❌ Old v2
<Select placeholder="Select option">
  <option value="1">Option 1</option>
</Select>

// ✅ New v3
<NativeSelect.Root size="sm">
  <NativeSelect.Field placeholder="Select option">
    <option value="1">Option 1</option>
  </NativeSelect.Field>
  <NativeSelect.Indicator />
</NativeSelect.Root>
```


## Prop Name Rules

### Boolean Props

- `isOpen` → `open`
- `isDisabled` → `disabled`
- `isInvalid` → `invalid`
- `isRequired` → `required`
- `isActive` → `data-active`
- `isLoading` → `loading`
- `isChecked` → `checked`
- `isIndeterminate` → `indeterminate`

### Style Props

- `colorScheme` → `colorPalette`
- `spacing` → `gap`
- `noOfLines` → `lineClamp`
- `truncated` → `truncate`
- `thickness` → `borderWidth`
- `speed` → `animationDuration`

### Component-Specific

- Divider → Separator
- Modal → Dialog
- Collapse → Collapsible
- Tags → Badge
- useToast → toaster.create()


## Style System Rules

### Nested Styles

```tsx
// ❌ Old v2
<Box sx={{ svg: { color: "red.500" } }} />

// ✅ New v3 (the & is required)
<Box css={{ "& svg": { color: "red.500" } }} />
```

### Gradients

```tsx
// ❌ Old v2
<Box bgGradient="linear(to-r, red.200, pink.500)" />

// ✅ New v3
<Box bgGradient="to-r" gradientFrom="red.200" gradientTo="pink.500" />
```

### Theme Access

```tsx
// ❌ Old v2
const theme = useTheme()
const gray400 = theme.colors.gray["400"]

// ✅ New v3
const system = useChakra()
const gray400 = system.token("colors.gray.400")
```