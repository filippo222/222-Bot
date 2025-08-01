process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import './api.js';
import {createRequire} from 'module';
import path, {join} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {platform} from 'process';
import * as ws from 'ws';
import {readdirSync, statSync, unlinkSync, existsSync, readFileSync, rmSync, watch} from 'fs';
import yargs from 'yargs';
import {spawn} from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import {tmpdir} from 'os';
import {format} from 'util';
import P from 'pino';
import pino from 'pino';
import Pino from 'pino';
import {Boom} from '@hapi/boom';
import {makeWASocket, protoType, serialize} from './lib/simple.js';
import {Low, JSONFile} from 'lowdb';
import {mongoDB, mongoDBV2} from './lib/mongoDB.js';
import store from './lib/store.js';

const {proto} = (await import('@whiskeysockets/baileys')).default;
const {DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, PHONENUMBER_MCC} = await import('@whiskeysockets/baileys');
import readline from 'readline';
import NodeCache from 'node-cache';

const {CONNECTING} = ws;
const {chain} = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

protoType();
serialize();

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; 

global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
}; 

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '');

global.timestamp = {start: new Date};
global.videoList = [];
global.videoListXXX = [];

const __dirname = global.__dirname(import.meta.url);

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[' + (opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`));

global.DATABASE = global.db; 
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) => setInterval(async function() {
      if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1 * 1000));
  }
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  };
  global.db.chain = chain(global.db.data);
};
loadDatabase();

global.chatgpt = new Low(new JSONFile(path.join(__dirname, '/db/chatgpt.json')));
global.loadChatgptDB = async function loadChatgptDB() {
  if (global.chatgpt.READ) {
    return new Promise((resolve) =>
      setInterval(async function() {
        if (!global.chatgpt.READ) {
          clearInterval(this);
          resolve( global.chatgpt.data === null ? global.loadChatgptDB() : global.chatgpt.data );
        }
      }, 1 * 1000));
  }
  if (global.chatgpt.data !== null) return;
  global.chatgpt.READ = true;
  await global.chatgpt.read().catch(console.error);
  global.chatgpt.READ = null;
  global.chatgpt.data = {
    users: {},
    ...(global.chatgpt.data || {}),
  };
  global.chatgpt.chain = lodash.chain(global.chatgpt.data);
};
loadChatgptDB();

global.authFile = `222Session`;
const {state, saveState, saveCreds} = await useMultiFileAuthState(global.authFile);
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = new NodeCache();
const {version} = await fetchLatestBaileysVersion();
let phoneNumber = global.botnumber;

const methodCodeQR = process.argv.includes("qr");
const methodCode = !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));


let opcion;
if (methodCodeQR) {
  opcion = '1';
}

if (!methodCodeQR && !methodCode && !existsSync(`./${global.authFile}/creds.json`)) {
  const topBorder = '═'.repeat(52);
  const midBorder = '─'.repeat(50);
  const spacer = ' '.repeat(2);
  
  do {
    console.clear();
    opcion = await question(`
${chalk.hex('#00ffff')('╔' + topBorder + '╗')}
${chalk.hex('#00ffff')('║')}${spacer}${chalk.bold.hex('#8aff80')('🔐  SCEGLI UN METODO DI COLLEGAMENTO')}${'    '.repeat(10)}${chalk.hex('#00ffff')('║')}
${chalk.hex('#00ffff')('╠' + midBorder + '╣')}
${chalk.hex('#00ffff')('║')}${spacer}${chalk.italic.hex('#d9a0ff')('Digita il numero dell’opzione desiderata:')}${spacer}${chalk.hex('#00ffff')('║')}
${chalk.hex('#00ffff')('║')}${spacer}${chalk.bold.hex('#ff5555')('1.')} ${chalk.hex('#00ffcc')(' Scansione Codice QR')}${' '.repeat(26)}${chalk.hex('#00ffff')('║')}
${chalk.hex('#00ffff')('║')}${spacer}${chalk.bold.hex('#ff5555')('2.')} ${chalk.hex('#00ffcc')(' Codice a 8 caratteri')}${' '.repeat(27)}${chalk.hex('#00ffff')('║')}
${chalk.hex('#00ffff')('╚' + topBorder + '╝')}
${chalk.bold.hex('#ff80bf')('---> ')}
`);

    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.bold.hex('#ff3333')('\n[⚠️] Scelta non valida. Inserisci solo "1" o "2".\n'));
    }
  } while ((opcion !== '1' && opcion !== '2') || existsSync(`./${global.authFile}/creds.json`));
}

const filterStrings = [
  "Q2xvc2luZyBzdGFsZSBvcGVu",
  "Q2xvc2luZyBvcGVuIHNlc3Npb24=",
  "RmFpbGVkIHRvIGRlY3J5cHQ=",
  "U2Vzc2lvbiBlcnJvcg==",
  "RXJyb3I6IEJhZCBNQUM=",
  "RGVjcnlwdGVkIG1lc3NhZ2U="
];

console.info = () => {};
console.debug = () => {}; 

function redefineConsoleMethod(methodName, filterStrings) {
  const originalConsoleMethod = console[methodName];
  console[methodName] = function() {
    const message = arguments[0];
    if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
      arguments[0] = "";
    }
    originalConsoleMethod.apply(console, arguments);
  };
}

['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings));

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
  mobile: MethodMobile, 
  browser: opcion == '1' ? ['222-Bot-Md', 'Safari', '3.0'] : methodCodeQR ? ['222-Bot-Md', 'Safari', '3.0'] : ['Ubuntu', 'Chrome', '110.0.5585.95'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
  },
  markOnlineOnConnect: true, 
  generateHighQualityLinkPreview: true, 
  syncFullHistory: true,  
  getMessage: async (clave) => {
    let jid = jidNormalizedUser(clave.remoteJid);
    let msg = await store.loadMessage(jid, clave.id);
    return msg?.message || "";
  },
  msgRetryCounterCache,
  msgRetryCounterMap,
  defaultQueryTimeoutMs: undefined, 
  version,  
};

global.conn = makeWASocket(connectionOptions);


if (!existsSync(`./${global.authFile}/creds.json`)) {
  if (opcion === '2' || methodCode) {
    opcion = '2';
    if (!conn.authState.creds.registered) {  
      if (MethodMobile) throw new Error(`Impossibile utilizzare un codice di accoppiamento con l'API mobile`);

      let numeroTelefono;
      if (!!phoneNumber) {
        numeroTelefono = phoneNumber.replace(/[^0-9]/g, '');
        if (!Object.keys(PHONENUMBER_MCC).some(v => numeroTelefono.startsWith(v))) {
          console.log(chalk.bold.redBright(`\n⚠️ Inserisci un numero WhatsApp valido\nEsempio: +39 xxx xxx xxxx\n`));
          process.exit(0);
        }
      } else {
        while (true) {
          numeroTelefono = await question(chalk.hex('#FFD700')(`\n📱 Inserisci il tuo numero WhatsApp (es. +39XXXYYYYYYY): `));
          numeroTelefono = numeroTelefono.replace(/[^0-9]/g, '');

          if (numeroTelefono.match(/^\d+$/) && Object.keys(PHONENUMBER_MCC).some(v => numeroTelefono.startsWith(v))) {
            break;
          } else {
            console.log(chalk.bold.redBright(`\n⚠️ Numero non valido! Inserisci un numero WhatsApp valido\nEsempio: +39 300 600 9000\n`));
          }
        }
        rl.close();  
      } 

      setTimeout(async () => {
        let codigo = await conn.requestPairingCode(numeroTelefono);
        codigo = codigo?.match(/.{1,4}/g)?.join("-") || codigo;
        console.log(chalk.yellowBright('\n🔑 CODICE DI ABBINAMENTO 🔑'));
        console.log(chalk.bgWhite.black(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
        console.log(chalk.bgGreen.black(`  ${codigo}  `));
        console.log(chalk.bgWhite.black(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
        console.log(chalk.blueBright('Inserisci questo codice nella sezione "Link a un dispositivo" su WhatsApp'));
      }, 3000);
    }
  }
}

conn.isInit = false;
conn.well = false;
console.log(chalk.hex('#00BFFF')(`
┌───────────────────────────────────────┐
│   🚀 222-Bot-Md - Avvio in corso...   │
└───────────────────────────────────────┘
`));


if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write();
      if (opts['autocleartmp'] && (global.support || {}).find) {
        const tmp = [tmpdir(), 'tmp', 'jadibts'];
        tmp.forEach((filename) => spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete']));
      }
    }, 10 * 1000);
  }
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT);


function clearTmp() {
  const tmp = [join(__dirname, './tmp')];
  const filename = [];
  tmp.forEach((dirname) => readdirSync(dirname).forEach((file) => filename.push(join(dirname, file))));
  return filename.map((file) => {
    const stats = statSync(file);
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 3)) {
      unlinkSync(file);
      return true;
    }
    return false;
  });
}

function purgeSession() {
  let prekey = [];
  let directorio = readdirSync(`./${global.authFile}`);
  let filesFolderPreKeys = directorio.filter(file => file.startsWith('pre-key-'));
  prekey = [...prekey, ...filesFolderPreKeys];
  filesFolderPreKeys.forEach(files => {
    unlinkSync(`./${global.authFile}/${files}`);
  });
} 

function purgeSessionSB() {
  try {
    let listaDirectorios = readdirSync('./jadibts/');
    let SBprekey = [];
    listaDirectorios.forEach(directorio => {
      if (statSync(`./jadibts/${directorio}`).isDirectory()) {
        let DSBPreKeys = readdirSync(`./jadibts/${directorio}`).filter(fileInDir => {
          return fileInDir.startsWith('pre-key-');
        });
        SBprekey = [...SBprekey, ...DSBPreKeys];
        DSBPreKeys.forEach(fileInDir => {
          unlinkSync(`./jadibts/${directorio}/${fileInDir}`);
        });
      }
    });
    if (SBprekey.length === 0) return;
  } catch (err) {
    console.log(chalk.redBright(`\n⚠️ Errore durante la pulizia: ${err.message}\n`));
  }
}

function purgeOldFiles() {
  const directories = [`./${global.authFile}/`, './jadibts/'];
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  directories.forEach(dir => {
    readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stats = statSync(filePath);
      if (stats.isFile() && stats.mtimeMs < oneHourAgo && file !== 'creds.json') { 
        unlinkSync(filePath);
        console.log(chalk.green(`✔ File ${file} eliminato`));
      }
    });
  });
}


async function connectionUpdate(update) {
  const {connection, lastDisconnect, isNewLogin} = update;
  global.stopped = connection;
  if (isNewLogin) conn.isInit = true;
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
    global.timestamp.connect = new Date;
  }
  
  if (global.db.data == null) loadDatabase();
  
  if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
    if (opcion == '1' || methodCodeQR) {
      console.log(chalk.yellow('𝐒𝐜𝐚𝐧𝐬𝐢𝐨𝐧𝐚 𝐪𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐝𝐢𝐜𝐞 𝐐𝐑, 𝐢𝐥 𝐜𝐨𝐝𝐢𝐜𝐞 𝐐𝐑 𝐬𝐜𝐚𝐝𝐞 𝐭𝐫𝐚 𝟔𝟎 𝐬𝐞𝐜𝐨𝐧𝐝𝐢.'));
    }
  }
  
  if (connection == 'open') {
    try {
        await conn.groupAcceptInvite('FjPBDj4sUgFLJfZiLwtTvk');
    } catch (error) {
        console.error('Error accepting group invite:', error.message);
        if (error.data === 401) {
            console.error('Authorization error: Please check your credentials or session.');
        } else {
            console.error('Unexpected error:', error);
        }
    }
    console.log(chalk.green('\n222-Bot-Md connesso ✅️ \n'));
  }
  
  let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  if (reason == 405) {
    await unlinkSync(`./${global.authFile}/creds.json`);
    console.log(chalk.bold.redBright(`[ ⚠️ ] 𝐂𝐨𝐧𝐧𝐞𝐬𝐬𝐢𝐨𝐧𝐞 𝐬𝐨𝐬𝐭𝐢𝐭𝐮𝐢𝐭𝐚, 𝐫𝐢𝐚𝐯𝐯𝐢𝐨 𝐢𝐧 𝐜𝐨𝐫𝐬𝐨...\n𝐒𝐞 𝐚𝐩𝐩𝐚𝐫𝐞 𝐮𝐧 𝐞𝐫𝐫𝐨𝐫𝐞, 𝐫𝐢𝐜𝐨𝐦𝐢𝐧𝐜𝐢𝐚 𝐜𝐨𝐧: 𝐧𝐩𝐦 𝐬𝐭𝐚𝐫𝐭`)); 
    process.send('reset');
  }
  
  if (connection === 'close') {
    const statusMessages = {
      [DisconnectReason.badSession]: `⚠️ Sessione errata - Elimina ${global.authFile} e riscansiona`,
      [DisconnectReason.connectionClosed]: "⚠️ Connessione chiusa - Riconnessione in corso...",
      [DisconnectReason.connectionLost]: "⚠️ Connessione persa - Riconnessione in corso...",
      [DisconnectReason.connectionReplaced]: "⚠️ Connessione sostituita - Chiudi l'altra sessione",
      [DisconnectReason.loggedOut]: `⚠️ Disconnesso - Elimina ${global.authFile} e riscansiona`,
      [DisconnectReason.restartRequired]: "⚠️ Riavvio richiesto - Riavvia il server",
      [DisconnectReason.timedOut]: "⚠️ Timeout - Riconnessione in corso..."
    };
    
    const message = statusMessages[reason] || `⚠️ Errore sconosciuto (${reason}) - Verifica se il numero è bannato`;
    console.log(chalk.yellowBright(`\n${message}\n`));
    
    await global.reloadHandler(true).catch(console.error);
  }
}


process.on('uncaughtException', console.error);


let isInit = true;
let handler = await import('./handler.js');
global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) {
    console.error(e);
  }
  
  if (restatConn) {
    const oldChats = global.conn.chats;
    try {
      global.conn.ws.close();
    } catch { }
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, {chats: oldChats});
    isInit = true;
  }
  
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler);
    conn.ev.off('group-participants.update', conn.participantsUpdate);
    conn.ev.off('groups.update', conn.groupsUpdate);
    conn.ev.off('message.delete', conn.onDelete);
    conn.ev.off('call', conn.onCall);
    conn.ev.off('connection.update', conn.connectionUpdate);
    conn.ev.off('creds.update', conn.credsUpdate);
  }


  conn.welcome = '@user benvenuto/a in @subject';
  conn.bye = '@user ha abbandonato il gruppo';
  conn.spromote = '@user ha i poteri';
  conn.sdemote = '@user non ha più i poteri';
  conn.sIcon = 'immagine gruppo modificata';
  conn.sRevoke = 'link reimpostato, nuovo link: @revoke';


  conn.handler = handler.handler.bind(global.conn);
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
  conn.onDelete = handler.deleteUpdate.bind(global.conn);
  conn.onCall = handler.callUpdate.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);

  const currentDateTime = new Date();
  const messageDateTime = new Date(conn.ev);
  if (currentDateTime >= messageDateTime) {
    const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0]);
  } else {
    const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0]);
  }

  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('group-participants.update', conn.participantsUpdate);
  conn.ev.on('groups.update', conn.groupsUpdate);
  conn.ev.on('message.delete', conn.onDelete);
  conn.ev.on('call', conn.onCall);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  isInit = false;
  return true;
};


const pluginFolder = global.__dirname(join(__dirname, './plugins/index'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename));
      const module = await import(file);
      global.plugins[filename] = module.default || module;
    } catch (e) {
      conn.logger.error(e);
      delete global.plugins[filename];
    }
  }
}

filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);


global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`🔄 Plugin aggiornato: '${filename}'`);
      else {
        conn.logger.warn(`🗑️ Plugin eliminato: '${filename}'`);
        return delete global.plugins[filename];
      }
    } else conn.logger.info(`✨ Nuovo plugin: '${filename}'`);
    
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    
    if (err) conn.logger.error(`❌ Errore nel plugin '${filename}'\n${format(err)}`);
    else {
      try {
        const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
        global.plugins[filename] = module.default || module;
      } catch (e) {
        conn.logger.error(`❌ Errore nel plugin '${filename}\n${format(e)}'`);
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => 
        a.localeCompare(b)));
      }
    }
  }
};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();


async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version']),
  ].map((p) => {
    return Promise.race([
      new Promise((resolve) => {
        p.on('close', (code) => {
          resolve(code !== 127);
        });
      }),
      new Promise((resolve) => {
        p.on('error', (_) => resolve(false));
      })]);
  }));
  
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
  const s = global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
  Object.freeze(global.support);
}


setInterval(async () => {
  if (stopped === 'close' || !conn || !conn.user) return;
  const a = await clearTmp();
  console.log(chalk.blueBright(`
  ┌───────────────────────────────────────┐
  │   🧹 Temp files cleaned successfully  │
  └───────────────────────────────────────┘
  `));
}, 180000);

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn.user) return;
  await purgeSession();
  console.log(chalk.blueBright(`
  ┌───────────────────────────────────────┐
  │   🗑️ Session files cleaned successfully │
  └───────────────────────────────────────┘
  `));
}, 1000 * 60 * 60);

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn.user) return;
  await purgeSessionSB();
  console.log(chalk.blueBright(`
  ┌───────────────────────────────────────┐
  │   🧽 Sub-bots sessions cleaned        │
  └───────────────────────────────────────┘
  `));
}, 1000 * 60 * 60);

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn.user) return;
  await purgeOldFiles();
  console.log(chalk.blueBright(`
  ┌───────────────────────────────────────┐
  │   🗂️  Old files cleaned successfully  │
  └───────────────────────────────────────┘
  `));
}, 1000 * 60 * 60);


setInterval(async () => {
  if (stopped === 'close' || !conn || !conn.user) return;
  const _uptime = process.uptime() * 1000;
  const uptime = clockString(_uptime);
  const bio = `222 own all`;
  await conn.updateProfileStatus(bio).catch((_) => _);
}, 60000);

function clockString(ms) {
  const d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [d, 'Giorni', h, 'Ore', m, 'Minuti', s, 'Secondi'].map((v) => v.toString().padStart(2, 0)).join(' ');
}


_quickTest().catch(console.error);