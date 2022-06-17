/*
| Settings for olgitbridge for you to change.
*/
const config = module.exports = { forward: { }, ssl: { } };

// overleaf server
config.olServer = 'http://localhost';

// used if all the working directories in one place
// must be ending with '/'
config.baseDir = '/var/olgitbridge/';

// blueprint of the overleaf version (only differences to git to be uploaded again)
config.bluesDir = config.baseDir + 'blues/';

// stores hashes of the downloaded zips to optimize cases
// when no changes happened in overleaf
config.hashDir = config.baseDir + 'hash/';

// place of the git clones
config.padsDir = config.baseDir + 'pads/';

// place of the git repositories
config.reposDir = config.baseDir + 'repos/';

// milliseconds to not downsync a project again
config.downSyncTimeout = 30000;

// ssl settings
config.ssl.enable = false;
config.ssl.key = 'XXX';
config.ssl.cert = 'XXX';

// change to 443 for https
config.port = 5000;

// enable to forward requests to the main port.
config.forward.enable = false;
// set this to the URL of the server
config.forward.target = 'https://HOST';
config.forward.port = 80;
