

## Plano Completo: Publicar Garden Gestão na Google Play Store

### O que você precisa fazer (fora do Lovable)

1. **Conta de Desenvolvedor Google Play** — Taxa única de **US$ 25** (~R$ 125)
   - Criar em: https://play.google.com/console
   - Precisa de um cartão de crédito e documento de identidade

2. **Computador com Android Studio instalado** (gratuito)
   - Download: https://developer.android.com/studio
   - Necessário para compilar o APK/AAB do app

3. **Exportar o projeto para GitHub** — Botão "Export to GitHub" no Lovable

4. **Comandos no terminal** (após git pull):
   ```text
   npm install
   npx cap add android
   npx cap sync
   npm run build
   npx cap sync
   npx cap run android  (testar no emulador/celular)
   ```

5. **Gerar o AAB assinado** — Via Android Studio > Build > Generate Signed Bundle
   - Você cria uma "keystore" (chave de assinatura) na primeira vez
   - Guarde essa keystore em lugar seguro — sem ela você não consegue atualizar o app

6. **Subir na Google Play Console** — Upload do arquivo `.aab`, preencher ficha (screenshots, descrição, ícone), e enviar para revisão

### O que o Lovable faz por você

- Configura o **Capacitor** no projeto (capacitor.config.ts, plugins nativos)
- Cria os **wrappers nativos** (haptics, push, status bar)
- Migra a vibração do botão para usar Haptics nativo
- Configura ícones e splash screen
- Todo o código fica pronto para compilar

### O que o Lovable NÃO consegue fazer

- Compilar o APK/AAB (precisa do Android Studio no seu computador)
- Criar sua conta na Google Play Console
- Fazer upload na loja
- Assinar o app com sua keystore

### Resumo de custos

```text
Item                          Custo
─────────────────────────────────────
Conta Google Play Developer   US$ 25 (única vez)
Android Studio                Gratuito
Hospedagem Lovable            Já incluída no seu plano
─────────────────────────────────────
Total                         ~US$ 25
```

### Implementação técnica (o que vou fazer agora)

1. Instalar `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`
2. Criar `capacitor.config.ts` com appId e server URL do sandbox
3. Instalar plugins: `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`
4. Criar `src/lib/native.ts` — detecção de plataforma + wrappers
5. Migrar `Button.tsx` para usar Haptics nativo quando disponível
6. Documentar o passo-a-passo de build no README

### Pós-implementação (seus passos)

```text
1. Export to GitHub (botão no Lovable)
2. git clone → npm install
3. npx cap add android
4. npm run build → npx cap sync
5. npx cap run android (testar)
6. Android Studio → Build → Generate Signed Bundle
7. Upload do .aab na Google Play Console
```

