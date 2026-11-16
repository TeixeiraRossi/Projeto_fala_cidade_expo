const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This local backup can contain a second, complete dependency tree.
config.resolver.blockList.push(/[\\/]\.expo[\\/]sdk58-repair-backup([\\/]|$)/);

module.exports = config;
