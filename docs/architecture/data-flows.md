# Data flows

How the main interactions move through the app. For the structure these flows run on, see
the [architecture overview](README.md).

## 1. Request lifecycle (any API call)

```mermaid
sequenceDiagram
    participant Pg as Page (presentation)
    participant UC as Use case (domain)
    participant Repo as XRepositoryImpl (infrastructure)
    participant Int as Interceptors<br/>(guestAuth, auth)
    participant API as Backend
    participant M as Mapper

    Pg->>Pg: loading.set(true)
    Pg->>UC: execute(params)
    UC->>Repo: call through the abstract XRepository (DI)
    Repo->>Int: HttpClient request to environment.apiUrl + endpoint
    Int->>Int: attach Bearer token, refresh first if it expires in < 60 s
    Int->>API: HTTP request
    API-->>Int: DTO (or 401 → refresh and retry once)
    Int-->>Repo: DTO
    Repo->>M: map DTO → domain model
    M-->>UC: Observable<Model>
    UC-->>Pg: Observable<Model>
    Pg->>Pg: data.set(model), loading.set(false)
```

Pages subscribe with `takeUntilDestroyed(this.destroyRef)`, so leaving the page cancels the
request. On error, the page sets an error signal with a Spanish message. Some features
translate backend errors through `presentation/shared/utils/http-error-translator.ts`.

## 2. Staff login and token refresh

1. `/login` → `LoginComponent` calls `LoginUseCase`.
2. `AuthRepository.login()` sends `POST /auth/login`. The use case stores the tokens and
   the user through `AuthSessionRepository` (backed by `TokenService` and
   `UserSessionService`).
3. `TokenService.isAuthenticated` flips to `true`. `adminGuard` now lets `/admin/*`
   through, and `adminPublicGuard` keeps the user away from `/login`.
4. `TokenRefreshSchedulerService` reacts to that signal and schedules a refresh 120 s
   before the access token expires.

From then on, `authInterceptor` handles every staff request:

```mermaid
flowchart TD
    req["Outgoing request"] --> skip{"/guest/* or R2?"}
    skip -- yes --> pass["Send as is"]
    skip -- no --> tok{"Access token?"}
    tok -- no --> pass
    tok -- yes --> soon{"Expires in < 60 s?"}
    soon -- no --> send["Send with Bearer token"]
    send --> r401{"401?"}
    r401 -- no --> done["Response"]
    r401 -- yes --> refresh
    soon -- yes --> refresh["POST /auth/refresh<br/>(one shared request)"]
    refresh -- ok --> retry["Store tokens, resend with new token"]
    refresh -- fails or refresh token expired --> out["Clear tokens →<br/>/login?sessionExpired=true"]
```

The guest flow is the same with `POST /guest/auth/login`, `GuestTokenService`,
`guestAuthInterceptor` and `/guest/login`. It has no scheduler: guest tokens are refreshed
only on demand.

## 3. Guest booking: unit → cart → Wompi → result

```mermaid
sequenceDiagram
    participant G as Guest
    participant SPA as Frontend
    participant API as Backend
    participant W as Wompi widget

    G->>SPA: /room-details/:unitId, picks dates
    SPA->>API: POST /guest/cart/reservation (SaveReservationDraftUseCase)
    G->>SPA: adds experiences
    SPA->>API: POST /guest/cart/items (AddCartExperienceItemUseCase)
    G->>SPA: /guest/cart → pay
    SPA->>API: POST /guest/cart/checkout (GetCheckoutPayloadUseCase)
    API-->>SPA: publicKey, amountInCents, reference, signature, redirectUrl
    SPA->>W: new WidgetCheckout(payload).open()
    W-->>SPA: transaction result
    loop up to 15 times, 1 s → 5 s backoff
        SPA->>API: GET /guest/cart/checkout/status/:reference
    end
    alt Wompi redirects instead
        W->>SPA: /guest/payment/success?reference=…
        SPA->>API: GET /guest/cart/checkout/status/:reference
    end
    SPA-->>G: approved → "Ver Mis Reservas", otherwise → back to cart
```

- Visiting `/room-details` or `/experiences` needs no account. The cart and everything
  after it sit behind `guestGuard`.
- The Wompi script is loaded globally in `src/index.html`.
- The frontend never decides whether a payment succeeded. It only shows the status the
  backend reports, and the backend learns it from Wompi's webhook.

## 4. File upload (staff)

1. The page calls `UploadFileUseCase.execute(file, category)`.
2. `StorageRepository.getPresignedUrl()` sends `POST /storage/presigned-url` with the file
   name, type, size and category. The backend checks them and returns `presignedUrl`,
   `fileUrl` and `key`.
3. `uploadToPresignedUrl()` sends a `PUT` with the file straight to R2. `authInterceptor`
   skips `r2.cloudflarestorage.com`, so no JWT leaks to R2.
4. The page saves the **`key`** on the resource (for example
   `UpdateUnitMediaKeysUseCase`), never the URL. The backend builds URLs when it returns the
   resource.
