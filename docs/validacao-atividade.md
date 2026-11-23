# Validar o cadastro de reportes

1. Abra o aplicativo, entre com uma conta de teste e permita o acesso à localização. Para seguir o roteiro com Google, use a versão web. No Expo Go use e-mail e senha.
2. No mapa, toque em **+**. Tente enviar com título vazio e confira o alerta. Repita sem login e confirme que nenhum documento foi criado.
3. Com a conta conectada, preencha o título e escolha um tipo. Deixe a descrição vazia. Na web, informe cidade e UF quando solicitado.
4. Envie e anote o protocolo. Em Firestore Database → Dados → `ocorrencias`, abra o documento desse protocolo e confira `titulo`, `status: "aberto"`, `latitude`, `longitude`, `idNotificante` e `criadoEm`. Confira o tipo e, quando disponível, o endereço.
5. Volte ao mapa no celular e confira o marcador. Em **Perfil → Ver reportes**, confira o título em **Todos** e em **Meus reportes** com a conta que enviou a ocorrência.
