# Desafio 1: gravar reportes no Firestore

O formulário já existente foi mantido. O envio grava título, descrição, usuário autenticado, coordenadas, status inicial e data do servidor na coleção `ocorrencias`. Como melhorias propostas pelo desafio, também grava tipo, endereço quando disponível e severidade; o botão mostra o progresso do envio.

As fotos continuam apenas no estado da tela: não são salvas no Firestore nem enviadas ao Firebase Storage. O mapa continua mostrando ocorrências simuladas; listar dados reais é o próximo desafio.

## Configurar e testar

1. No projeto Firebase do aplicativo, crie o Firestore em modo de produção e escolha `southamerica-east1` se ainda não existir. Confira a região antes de criar, pois a escolha não pode ser alterada depois.
2. Em Firestore Database → Regras, revise e publique o conteúdo de `firestore.rules`. Essas regras seguem o enunciado: a coleção `ocorrencias` fica publicamente legível e só usuários autenticados podem criar documentos com seu próprio UID. Publicar substitui as regras atuais: confira outros acessos antes de aplicá-las.
3. Configure as variáveis Firebase conforme `.envExample`, execute o aplicativo e entre na conta. Permita a localização no aparelho.
4. No mapa, abra **Novo reporte**, informe um título, selecione o tipo e envie. Confira o documento na coleção `ocorrencias` do console.
5. Verifique que não é possível enviar sem título, sem login ou sem localização; teste também uma tentativa sem permissão nas regras. Confirme que os campos gravados correspondem ao formulário e que `criadoEm` foi preenchido pelo servidor.

Para a avaliação, revise os comentários e explique com suas próprias palavras o que você entendeu. A execução e a gravação real no Firebase dependem da configuração do projeto e devem ser verificadas no aparelho.
