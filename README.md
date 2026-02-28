# 🌿 Garden Gestão — SaaS de Gestão para Restaurantes

## Sobre o projeto

> Sistema completo de gestão para restaurantes — estoque, financeiro, equipe, IA e muito mais.

## Tecnologias

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Capacitor (app nativo iOS/Android)
- Lovable Cloud (backend)

## Desenvolvimento local

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

---

## 📱 Compilar App Nativo (Android)

### Pré-requisitos

1. **Node.js** instalado (v18+)
2. **Android Studio** instalado — [download](https://developer.android.com/studio)
3. **Conta Google Play Developer** — US$ 25 (única vez) — [criar conta](https://play.google.com/console)

### Passo a passo

```sh
# 1. Clone o repositório (Export to GitHub no Lovable primeiro)
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instale as dependências
npm install

# 3. Adicione a plataforma Android
npx cap add android

# 4. Build do projeto web
npm run build

# 5. Sincronize com o projeto nativo
npx cap sync

# 6. Teste no emulador ou dispositivo físico
npx cap run android
```

### Gerar AAB para Google Play

1. Abra o Android Studio: `npx cap open android`
2. Vá em **Build → Generate Signed Bundle / APK**
3. Selecione **Android App Bundle (.aab)**
4. Crie uma **keystore** (primeira vez) — **guarde em local seguro!**
5. Gere o bundle assinado
6. Faça upload do `.aab` na [Google Play Console](https://play.google.com/console)

### Após cada atualização no Lovable

```sh
git pull
npm install
npm run build
npx cap sync
# Gere novo AAB no Android Studio
```

---

## 📱 Compilar App Nativo (iOS)

### Pré-requisitos

1. **Mac** com **Xcode** instalado (App Store, gratuito)
2. **Conta Apple Developer** — US$ 99/ano — [criar conta](https://developer.apple.com)

```sh
npx cap add ios
npm run build
npx cap sync
npx cap run ios
# ou: npx cap open ios (abre no Xcode)
```

---

## Deploy Web (PWA)

Abra o [Lovable](https://lovable.dev) e clique em **Share → Publish**.

## Domínio customizado

Vá em **Project → Settings → Domains** e clique em **Connect Domain**.
