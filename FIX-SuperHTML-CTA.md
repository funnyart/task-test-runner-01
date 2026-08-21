# Fix: SuperHTML CTA — удаление лишней логики установки

## Ошибка

```
[Technical error] Rejected for technical error: Please remove other installation logic,
only call window.install. Please modify according to Article 2 of the specification.
```

## Причина

Метод `_onCtaClick()` в `ArtilleryController.ts` содержал два вызова при нажатии CTA-кнопки:

```typescript
private _onCtaClick() {
    SuperHtmlPlayable.download();       // ✅ правильно

    const targetUrl = this.googlePlayUrl || this.appStoreUrl;
    if (targetUrl) {
        sys.openURL(targetUrl);          // ❌ лишняя логика установки
    }
}
```

Согласно спецификации SuperHTML (Article 2), при нажатии CTA-кнопки должен вызываться **только** `window.super_html.download()` (который внутри платформы вызывает `window.install`). Прямое открытие URL через `sys.openURL()` — это дублирующий механизм установки, который запрещён.

Этот обработчик привязан к двум кнопкам:

- `ctaButton` (энд-карта успеха) — строка 610
- `tryAgainButton` (энд-карта проигрыша) — строка 705

## Исправление

1. Убрать `sys.openURL()` из `_onCtaClick()`:

```typescript
private _onCtaClick() {
    SuperHtmlPlayable.download();
}
```

2. Убрать `sys` из импортов `cc`, так как он больше нигде не используется:

```diff
- import { ..., sys, Button, AudioClip, AudioSource } from 'cc';
+ import { ..., Button, AudioClip, AudioSource } from 'cc';
```

## Что НЕ трогать

Свойства `googlePlayUrl` и `appStoreUrl` и вызовы `SuperHtmlPlayable.set_google_play_url()` / `set_app_store_url()` в `onLoad()` — это конфигурация SuperHTML SDK, а не логика установки. Они сообщают платформе, куда редиректить при `download()`. Их нужно оставить.