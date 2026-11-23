# Validação da atividade: novo reporte

## Antes de testar

- Inicie o projeto com `npx expo start --clear` e abra o aplicativo.
- Use uma conta de teste e confira as regras publicadas no Firebase.
- No navegador, libere a localização, selecione uma imagem e informe cidade e UF. No celular, libere câmera e localização.
- Para repetir os testes locais: `npm run test:reportes`, `npm run test:rules`, `npx tsc --noEmit` e `npm run lint`. Os testes de regras precisam de Java e usam apenas um projeto fictício no emulador.

## Formulário

1. Deixe o título vazio e toque em **Enviar reporte**. Confira o aviso e confirme que nada foi criado.
2. Informe título, mas não adicione foto. Confira o aviso de foto obrigatória.
3. Selecione **Outro** e deixe a descrição vazia. Confira o aviso de descrição obrigatória.
4. Teste sem login e sem localização, sempre conferindo que o reporte não é criado.
5. Na web, teste cidade ou UF inválida e depois informe os valores corretos.

## Envio e conferência no Firebase

1. Preencha título, tipo, localização, cidade quando solicitada e ao menos uma foto do problema. Envie e anote o protocolo mostrado.
2. Em Firestore → Dados → `ocorrencias`, localize o documento pelo protocolo. Confira `titulo`, `descricao`, `tipo`, `idNotificante`, `status: aberto`, `situacao: aberta`, `latitude`, `longitude`, `localizacao` e `criadoEm`.
3. Confira se `fotos.problema` contém o registro da foto e se o arquivo correspondente existe no Storage. A presença de um documento no Firestore, sozinha, não comprova o envio da foto.
4. No celular, confira também o endereço quando a geocodificação conseguir encontrá-lo. Na web, o preenchimento automático de endereço não está implementado.

## Falhas e retentativa

- Se o aplicativo informar que o reporte foi criado, mas as fotos falharam, anote o protocolo e use **Tentar fotos novamente** na mesma tela. Não crie outro reporte.
- Confira que a tentativa não cria outro documento e que as fotos aparecem no documento original depois de concluída.
- A retomada depende da tela permanecer aberta; ao sair ou fechar o aplicativo, as fotos pendentes não podem ser retomadas pela interface atual.
- Volte ao mapa no celular e confira o marcador. Em Perfil → Ver reportes, confira o título em Todos e em Meus reportes usando a conta que enviou a ocorrência.

Registre qualquer mensagem de erro e, na web, o erro do console do navegador. Não inclua senhas ou tokens nos registros.
