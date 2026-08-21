# Руководство по интеграции super-html для Cocos Creator



ссылки для сторов текущего проекта:
https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded

-

## Обзор

**super-html** — это плагин для Cocos Creator, который позволяет упаковывать веб-сборки в один HTML-файл для использования в playable-рекламе. **super_html_playable** — адаптер, который предоставляет методы для взаимодействия с различными платформами рекламы (Unity Ads, IronSource, Google и др.).

## Основные ресурсы

- **Плагин на Cocos Store:** https://store.cocos.com/app/detail/3657
- **GitHub репозиторий:** https://github.com/magician-f/cocos-playable-demo
- **Автор:** https://github.com/magician-f

## Архитектура интеграции

### Структура файлов

```
assets/scripts/
├── super_html_playable.ts    # Адаптер для взаимодействия с super-html
└── LootboxController.ts       # Основной контроллер, использующий интеграцию - это из другого проекта нетрогаем просто для примера
```

### Принцип работы

1. **super-html плагин** создает глобальный объект `window.super_html` в браузере
2. **super_html_playable.ts** предоставляет TypeScript-обертку для безопасного доступа к этому объекту
3. **LootboxController.ts** использует адаптер для управления переходами в сторы и аналитикой

## API super_html_playable

### Основные методы

#### 1. `download()`

Сообщает платформе рекламы о клике пользователя на кнопку скачивания.

```typescript
superHtmlPlayable.download();
```

**Когда вызывать:**
- При клике пользователя на кнопку CTA (Call To Action)
- При переходе в стор приложения
- После завершения геймплея, когда пользователь хочет установить приложение

**Пример использования:**
```typescript
openStoreLink() {
    // Отправляем событие аналитики
    this.trackPlayableEvent('CTA_CLICKED');
    
    // Сообщаем платформе о клике на скачивание
    superHtmlPlayable.download();
    
    // Открываем ссылку на стор
    sys.openURL(this.googlePlayUrl);
}
```

#### 2. `game_end()`

Сообщает платформе рекламы о завершении геймплея.

```typescript
superHtmlPlayable.game_end();
```

**Когда вызывать:**
- При открытии финального экрана (например, экрана с карточками)
- Когда игрок достиг конечной точки геймплея
- Один раз за сессию (используйте флаг для предотвращения повторных вызовов)

**Пример использования:**
```typescript
showCardsScreen() {
    // Отправляем событие аналитики
    this.trackPlayableEventOnce('COMPLETED', 'hasTrackedCardsComplete');
    
    // Сообщаем платформе о завершении геймплея (один раз)
    if (!this.hasSentSuperHtmlGameEnd) {
        superHtmlPlayable.game_end();
        this.hasSentSuperHtmlGameEnd = true;
    }
    
    // Показываем экран карточек
    this.cardsScreenNode.active = true;
}
```

#### 3. `set_google_play_url(url: string)`

Устанавливает ссылку на Google Play Store.

```typescript
superHtmlPlayable.set_google_play_url('https://play.google.com/store/apps/details?id=com.example.app');
```

**Параметры:**
- `url: string` - полная ссылка на страницу приложения в Google Play Store

**Когда вызывать:**
- В `onLoad()` при инициализации скрипта
- Если `googlePlayUrl` задан в параметрах

**Пример использования:**
```typescript
onLoad() {
    if (this.googlePlayUrl) {
        superHtmlPlayable.set_google_play_url(this.googlePlayUrl);
        console.log('Google Play URL установлен:', this.googlePlayUrl);
    }
}
```

**Важно:** Этот метод используется платформой Unity Ads для автоматического перехода по ссылке при вызове `download()`.

#### 4. `set_app_store_url(url: string)`

Устанавливает ссылку на App Store (iOS).

```typescript
superHtmlPlayable.set_app_store_url('');
```

**Параметры:**
- `url: string` - полная ссылка на страницу приложения в App Store

**Когда вызывать:**
- В `onLoad()` при инициализации скрипта
- Если `appStoreUrl` задан в параметрах

**Пример использования:**
```typescript
onLoad() {
    if (this.appStoreUrl) {
        superHtmlPlayable.set_app_store_url(this.appStoreUrl);
        console.log('App Store URL установлен:', this.appStoreUrl);
    }
}
```

**Важно:** Этот метод используется платформой Unity Ads для автоматического перехода по ссылке при вызове `download()`.

#### 5. `is_hide_download()`

Проверяет, нужно ли скрывать кнопку скачивания (используется платформой Google).

```typescript
const shouldHide = superHtmlPlayable.is_hide_download();
```

**Возвращает:**
- `boolean` - `true` если нужно скрыть кнопку, `false` если показывать

**Когда использовать:**
- Для условного отображения кнопки CTA
- Если платформа предоставляет свою кнопку скачивания

#### 6. `is_audio()`

Проверяет, разрешено ли воспроизведение звука (используется платформой IronSource).

```typescript
const canPlayAudio = superHtmlPlayable.is_audio();
```

**Возвращает:**
- `boolean` - `true` если звук разрешен, `false` если запрещен

**Когда использовать:**
- Для управления звуком в игре
- Для соблюдения требований платформы рекламы

## Работа со ссылками на сторы

### Принцип работы

1. **Установка ссылок:** В `onLoad()` устанавливаются ссылки через `set_google_play_url()` и `set_app_store_url()`
2. **Хранение ссылок:** Ссылки сохраняются в глобальном объекте `window.super_html`
3. **Использование:** При вызове `download()` платформа может автоматически использовать эти ссылки

### Параметры в LootboxController

```typescript
@property({
    tooltip: 'Google Play ссылка для super_html_playable (по умолчанию Stack Ball)'
})
googlePlayUrl: string = 'https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded';

@property({
    tooltip: 'App Store ссылка для super_html_playable (опционально)'
})
appStoreUrl: string = '';
```

### Инициализация ссылок

```typescript
onLoad() {
    // Прокидываем ссылки в super_html_playable (unity/ironsource)
    if (this.googlePlayUrl) {
        superHtmlPlayable.set_google_play_url(this.googlePlayUrl);
        console.log('[LootboxController] super_html_playable: google_play_url установлен:', this.googlePlayUrl);
    }
    
    if (this.appStoreUrl) {
        superHtmlPlayable.set_app_store_url(this.appStoreUrl);
        console.log('[LootboxController] super_html_playable: app_store_url установлен:', this.appStoreUrl);
    }
}
```

### Использование ссылок при переходе

```typescript
openStoreLink() {
    // Выбираем ссылку: приоритет Google Play, потом App Store
    const targetUrl = this.googlePlayUrl || this.appStoreUrl;
    
    if (!targetUrl) {
        console.warn('Ссылка не указана');
        return;
    }
    
    // Отправляем событие аналитики
    this.trackPlayableEvent('CTA_CLICKED');
    
    // Сообщаем платформе о клике на скачивание
    // Платформа может использовать установленные через set_google_play_url/set_app_store_url ссылки
    superHtmlPlayable.download();
    
    // Также открываем ссылку напрямую (fallback)
    if (sys.openURL) {
        sys.openURL(targetUrl);
    } else if (typeof window !== 'undefined') {
        window.open(targetUrl, '_blank');
    }
}
```

## Режимы работы

### 1. Стандартный режим

**Описание:** Переход в стор происходит при клике в любое место экрана после открытия всех карточек.

**Параметры:**
- `enableStoreLinkOnClick: boolean = true` - включить переход по ссылке при клике
- `enableUnity: boolean = false` - Unity режим выключен

**Логика:**
```typescript
handleInputClick() {
    // Если карточки открыты и готовы, и включен переход по ссылке
    if (this.cardsScreenReady && this.enableStoreLinkOnClick && (this.googlePlayUrl || this.appStoreUrl)) {
        // Если включен Unity режим, переход по ссылке только через кнопку
        if (this.enableUnity) {
            return; // Не переходим по ссылке при клике
        }
        
        // Стандартный режим - переходим по ссылке
        this.openStoreLink();
        return;
    }
    
    // Обычная логика открытия лутбокса
    if (!this.isOpened) {
        this.openLootbox();
    }
}
```

### 2. Unity режим

**Описание:** Переход в стор происходит только через специальную кнопку. Клики в любое место экрана не приводят к переходу.

**Параметры:**
- `enableUnity: boolean = true` - включить Unity режим
- `unityScreen: Node` - нода экрана Unity
- `unityButton: Button` - кнопка для перехода в Unity режиме

**Логика:**
```typescript
// В handleInputClick() проверяется enableUnity
if (this.enableUnity) {
    console.log('Unity режим включен, переход по ссылке только через кнопку');
    return; // Не переходим по ссылке при клике
}

// Обработчик кнопки Unity
private onUnityButtonClick(event: Event) {
    const targetUrl = this.googlePlayUrl || this.appStoreUrl;
    if (this.enableUnity && targetUrl) {
        console.log('Unity кнопка нажата, переходим по ссылке:', targetUrl);
        this.openStoreLink(); // Вызывает superHtmlPlayable.download() и открывает ссылку
    }
}
```

**Особенности:**
- Платформа Unity Ads может использовать ссылки, установленные через `set_google_play_url()` и `set_app_store_url()`
- При вызове `download()` платформа автоматически переходит по соответствующей ссылке (Android → Google Play, iOS → App Store)

### 3. One-Click режим

**Описание:** Автоматический переход в стор сразу при открытии экрана карточек, без необходимости клика пользователя.

**Параметры:**
- `enableOneClick: boolean = false` - включить One-Click режим

**Логика:**
```typescript
showCardsScreen() {
    // Отправляем событие завершения геймплея
    this.trackPlayableEventOnce('COMPLETED', 'hasTrackedCardsComplete');
    superHtmlPlayable.game_end();
    
    // One-click режим: автопереход в стор при открытии экрана карточек
    if (this.enableOneClick && !this.hasOneClickFired && (this.googlePlayUrl || this.appStoreUrl)) {
        this.hasOneClickFired = true;
        console.log('One-click включен, открываем стор при показе карточек');
        this.scheduleOnce(() => {
            this.openStoreLink(); // Вызывает superHtmlPlayable.download() и открывает ссылку
        }, 0);
    }
    
    // Показываем экран карточек
    this.cardsScreenNode.active = true;
}
```

**Особенности:**
- Переход происходит автоматически, без участия пользователя
- Используется флаг `hasOneClickFired` для предотвращения повторных переходов
- Подходит для коротких playable-реклам, где нужно быстро перевести пользователя в стор

## Интеграция с аналитикой

### События AppLovin Playable Analytics

Интеграция super-html работает совместно с аналитикой AppLovin:

```typescript
// LOADING - при старте игры
onLoad() {
    this.trackPlayableEventOnce('LOADING', 'hasTrackedLoading');
    // ...
}

// LOADED - после инициализации
setInitialState() {
    // ...
    this.trackPlayableEventOnce('LOADED', 'hasTrackedLoaded');
}

// DISPLAYED - после анимации появления фона
startMainBackgroundFadeIn() {
    // ...
    .call(() => {
        this.trackPlayableEventOnce('DISPLAYED', 'hasTrackedDisplayed');
    })
}

// COMPLETED - при открытии экрана карточек
showCardsScreen() {
    this.trackPlayableEventOnce('COMPLETED', 'hasTrackedCardsComplete');
    superHtmlPlayable.game_end(); // Сообщаем super-html о завершении
}

// CTA_CLICKED - при клике на переход в стор
openStoreLink() {
    this.trackPlayableEvent('CTA_CLICKED');
    superHtmlPlayable.download(); // Сообщаем super-html о клике
}
```

## Полный пример интеграции

```typescript
import superHtmlPlayable from './super_html_playable';

@ccclass('GameController')
export class GameController extends Component {
    @property({
        tooltip: 'Google Play ссылка'
    })
    googlePlayUrl: string = 'https://play.google.com/store/apps/details?id=com.example.app';
    
    @property({
        tooltip: 'App Store ссылка'
    })
    appStoreUrl: string = '';
    
    @property({
        tooltip: 'Включить Unity режим'
    })
    enableUnity: boolean = false;
    
    @property({
        tooltip: 'Включить One-Click режим'
    })
    enableOneClick: boolean = false;
    
    @property(Button)
    unityButton: Button = null!;
    
    @property(Node)
    victoryScreen: Node = null!;
    
    private hasSentGameEnd: boolean = false;
    private hasOneClickFired: boolean = false;
    
    onLoad() {
        // Устанавливаем ссылки на сторы
        if (this.googlePlayUrl) {
            superHtmlPlayable.set_google_play_url(this.googlePlayUrl);
        }
        if (this.appStoreUrl) {
            superHtmlPlayable.set_app_store_url(this.appStoreUrl);
        }
        
        // Настраиваем кнопку Unity, если режим включен
        if (this.enableUnity && this.unityButton) {
            this.unityButton.node.on(Button.EventType.CLICK, this.onUnityButtonClick, this);
        }
    }
    
    // Показываем экран победы
    showVictoryScreen() {
        this.victoryScreen.active = true;
        
        // Сообщаем платформе о завершении геймплея (один раз)
        if (!this.hasSentGameEnd) {
            superHtmlPlayable.game_end();
            this.hasSentGameEnd = true;
        }
        
        // One-Click режим: автопереход в стор
        if (this.enableOneClick && !this.hasOneClickFired && (this.googlePlayUrl || this.appStoreUrl)) {
            this.hasOneClickFired = true;
            this.scheduleOnce(() => {
                this.openStoreLink();
            }, 0);
        }
    }
    
    // Обработчик клика в любое место (стандартный режим)
    onScreenClick() {
        if (this.victoryScreen.active && !this.enableUnity) {
            this.openStoreLink();
        }
    }
    
    // Обработчик кнопки Unity
    private onUnityButtonClick(event: Event) {
        this.openStoreLink();
    }
    
    // Открытие ссылки на стор
    openStoreLink() {
        const targetUrl = this.googlePlayUrl || this.appStoreUrl;
        if (!targetUrl) {
            console.warn('Ссылка не указана');
            return;
        }
        
        // Отправляем событие аналитики
        // this.trackPlayableEvent('CTA_CLICKED');
        
        // Сообщаем платформе о клике на скачивание
        superHtmlPlayable.download();
        
        // Открываем ссылку напрямую (fallback)
        if (sys.openURL) {
            sys.openURL(targetUrl);
        } else if (typeof window !== 'undefined') {
            window.open(targetUrl, '_blank');
        }
    }
}
```

## Важные замечания

### 1. Безопасность вызовов

Все методы `super_html_playable` безопасно проверяют наличие `window.super_html`:

```typescript
download() {
    //@ts-ignore
    window.super_html && super_html.download();
}
```

Если плагин super-html не загружен, вызовы просто игнорируются без ошибок.

### 2. Порядок вызовов

**Рекомендуемый порядок:**
1. `set_google_play_url()` / `set_app_store_url()` - в `onLoad()`
2. `game_end()` - при открытии финального экрана (один раз)
3. `download()` - при клике на CTA или переходе в стор

### 3. Один раз за сессию

Некоторые методы должны вызываться только один раз:
- `game_end()` - используйте флаг `hasSentGameEnd`
- One-Click переход - используйте флаг `hasOneClickFired`

### 4. Приоритет ссылок

При выборе ссылки для перехода:
1. **Google Play** (`googlePlayUrl`) - приоритет для Android
2. **App Store** (`appStoreUrl`) - fallback для iOS

```typescript
const targetUrl = this.googlePlayUrl || this.appStoreUrl;
```

### 5. Платформы и каналы

Разные платформы используют разные методы:

- **Unity Ads:** Использует `set_google_play_url()` / `set_app_store_url()` для автоматического перехода при `download()`
- **Google:** Использует `is_hide_download()` для управления кнопкой
- **IronSource:** Использует `is_audio()` для управления звуком

## Отладка

### Проверка наличия super-html

```typescript
if (typeof window !== 'undefined' && (window as any).super_html) {
    console.log('super-html загружен');
} else {
    console.warn('super-html не найден');
}
```

### Логирование вызовов

Все методы `super_html_playable` логируют свои вызовы:

```typescript
download() {
    console.log("download");
    //@ts-ignore
    window.super_html && super_html.download();
}
```

### Проверка установленных ссылок

```typescript
if (typeof window !== 'undefined' && (window as any).super_html) {
    console.log('Google Play URL:', (window as any).super_html.google_play_url);
    console.log('App Store URL:', (window as any).super_html.appstore_url);
}
```

## Заключение

Интеграция super-html обеспечивает:

1. **Универсальность:** Работает с различными платформами рекламы
2. **Автоматизацию:** Платформы могут автоматически использовать установленные ссылки
3. **Гибкость:** Поддержка разных режимов работы (стандартный, Unity, One-Click)
4. **Безопасность:** Все вызовы безопасны и не вызывают ошибок при отсутствии плагина

Используйте эту документацию как руководство для интеграции super-html в ваши проекты Cocos Creator.

