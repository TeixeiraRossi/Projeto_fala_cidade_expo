const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This local backup can contain a second, complete dependency tree.
config.resolver.blockList.push(/[\\/]\.expo[\\/]sdk58-repair-backup([\\/]|$)/);

// Pastas geradas e ferramentas exclusivas dos testes não fazem parte do app.
// Evita que o monitor do Metro percorra esses diretórios em cada inicialização.
config.resolver.blockList.push(
  /[\\/]\.git([\\/]|$)/,
  /[\\/]\.validation-[^\\/]+([\\/]|$)/,
  /[\\/]\.expo[\\/](cache|static-tmp)([\\/]|$)/,
  /[\\/]node_modules[\\/]firebase-tools([\\/]|$)/,
  /[\\/]node_modules[\\/]@firebase[\\/]rules-unit-testing([\\/]|$)/
);

module.exports = config;
