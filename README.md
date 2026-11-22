# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


## Atualização da aula de 09/11/2026

Referência: [branch `09112026` do professor](https://github.com/marcelolinck/Projeto_falaa_cidade/tree/ccdf34dc5f8e4a2a3c48d8914f5f124072ddccb4).

A tela **Novo reporte**, aberta pelo botão `+` do mapa, permite informar título, tipo, descrição, fotos, localização e severidade. Uma foto do problema é obrigatória e o tipo **Outro** exige descrição. O envio grava a ocorrência no Firestore e tenta enviar as fotos ao Firebase Storage. Se as fotos falharem depois da criação, o aplicativo informa o protocolo e permite tentar novamente enquanto a tela estiver aberta, sem criar outra ocorrência. Ao sair ou fechar o aplicativo, essa tentativa não é preservada.

O mapa ainda usa ocorrências simuladas, portanto os novos reportes não aparecem nele automaticamente. Na web, selecione a foto no computador e informe cidade e UF; a localização do navegador continua necessária. O endereço obtido automaticamente está disponível no aplicativo móvel quando a geocodificação funciona.

As regras de segurança locais ficam em `firebase/firestore.rules` e `firebase/storage.rules`. As regras publicadas são configuradas no console Firebase e devem ser conferidas separadamente. Para executar os testes locais do Firestore, use `npm run test:rules` (Java necessário; na primeira execução o emulador é baixado). Os testes usam um projeto fictício e não alteram o banco remoto. Para testar a retomada do envio de fotos com serviços simulados, execute `npm run test:reportes`.

Depois de atualizar, execute `npm ci`. Como há um novo plugin de câmera e alteração no splash, gere e instale novamente o development build (`npx expo run:android` ou `npx expo run:ios`). Teste a câmera em um aparelho físico com as permissões de câmera e localização liberadas.

Materiais da aula:

- [Manual e checklist de teste do novo reporte](docs/manual-nova-solicitacao.md)
- [Roteiro de explicação do novo reporte](docs/roteiro-explicacao-nova-solicitacao.md)
- [Roteiro de explicação do mapa](docs/roteiro-explicacao-mapa.md)

Foram mantidos os identificadores Android/iOS, o development client, as correções de perfil e a estrutura `service/` deste projeto.
