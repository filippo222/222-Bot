import { generateWAMessageFromContent } from "@whiskeysockets/baileys"
import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import fs from 'fs'
import chalk from 'chalk'

/**
 * @type {import('@whiskeysockets/baileys')}
 */
const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

/**
 * Handle messages upsert
 * @param {import('@whiskeysockets/baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate 
 */
export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    if (!chatUpdate)
        return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m)
        return
    if (global.db.data == null)
        await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m)
            return
        m.exp = 0
        m.money = false
        m.limit = false
        
        try {
            // User data initialization
            let user = global.db.data.users[m.sender]
            if (typeof user !== 'object')
                global.db.data.users[m.sender] = {}
            if (user) {
                if (!('registered' in user)) user.registered = false
                if (!user.registered) {
                    if (!('name' in user)) user.name = m.name
                    if (!isNumber(user.age)) user.age = 0
                    if (!('gender' in user)) user.gender = ''
                    if (!isNumber(user.regTime)) user.regTime = -1
                }
                
                // User stats and items
                if (!isNumber(user.messaggi)) user.messaggi = 0
                if (!isNumber(user.command)) user.command = 0
                if (!isNumber(user.blasphemy)) user.blashpemy = 0
                if (!isNumber(user.exp)) user.exp = 0
                if (!isNumber(user.money)) user.money = 0 
                if (!isNumber(user.lvl)) user.lvl = 0
                if (!isNumber(user.carne)) user.carne = 0
                if (!isNumber(user.pollo)) user.pollo = 0
                if (!isNumber(user.ossa)) user.ossa = 0
                if (!isNumber(user.pelliccia)) user.pelliccia = 0
                if (!isNumber(user.warn)) user.warn = 0
                if (!isNumber(user.warnlink)) user.warnlink = 0
                if (!isNumber(user.joincount)) user.joincount = 2   
                if (!isNumber(user.limit)) user.limit = 20
                if (!isNumber(user.grattaevinci)) user.grattaevinci = 0
                if (!isNumber(user.villa)) user.villa = 0
                if (!isNumber(user.casa)) user.casa = 0
                if (!isNumber(user.chiavi)) user.chiavi = 0
                  if (!isNumber(user.auto)) user.auto = 0
                if (!isNumber(user.bank)) user.bank = 0
                if (!isNumber(user.lvl)) user.lvl = 0
                if (!user.datafurto) user.datafurto = 'assente'
                if (!user.ultimofurto) user.ultimofurto = 0
                if (!isNumber(user.furti)) user.furti = 0
                if (!isNumber(user.rubati)) user.rubati = 0
                if (!isNumber(user.premdays)) user.premdays = 0
                if (!isNumber(user.ultimoprelievo)) user.ultimoprelievo = 0
                if (!isNumber(user.ultimodeposito)) user.ultimodeposito = 0
                if (!('sposato' in user)) user.sposato = false
                if (!('richiestally' in user)) user.richiestally = ['',1]
                if (!('divoziato' in user)) user.divorziato = false
                if (!('coniuge' in user)) user.coniuge = ""
                if (!('ex' in user)) user.ex = ""
                if (!('proposals' in user)) user.proposals = {}
                if (!('pendmarry' in user)) user.pendmarry = []
                if (!('pending' in user)) user.pending = []
                if (!('amici' in user)) user.amici = []
                if (!('ultimoreclamo' in user)) user.ultimoreclamo = ['10:10 - 20/20/2020',0]
                if (!('comandi' in user)) user.comandi=[0,0,0]
                if (!('casse' in user)) user.casse = [0,0,0,0,0,0]
                if (!isNumber(user.maxblasph)) user.maxblasph = 2050
                if (!('instagram' in user)) user.instagram = m.instagram
                if (!('muto' in user)) user.muto = false
            } else {
                global.db.data.users[m.sender] = {
                    messaggi: 0,
                    command: 0,
                    blasphemy: 0,
                    money: 0,
                    bank: 0,
                    lvl: 0,
                    ossa: 0,
                    carne: 0,
                    pelliccia: 0,
                    grattaevinci: 0,
                    chiavi: 0,
                    casa: 0,
                    villa: 0,
                    auto: 0,
                    warn: 0,
                    warnlink: 0,
                    muto: false,
                    registered: false,
                    age: 0,
                    regTime: -1,
                    gender: '',
                    name: m.name,
                }
            }
            
            // Chat data initialization
            let chat = global.db.data.chats[m.chat]
            if (typeof chat !== 'object')
                global.db.data.chats[m.chat] = {}
            if (chat) {
                if (!('isBanned' in chat)) chat.isBanned = false
                if (!('welcome' in chat)) chat.welcome = true
                if (!('detect' in chat)) chat.detect = true
                if (!('sWelcome' in chat)) chat.sWelcome = ''
                if (!('sBye' in chat)) chat.sBye = ''
                if (!('sPromote' in chat)) chat.sPromote = ''
                if (!('sDemote' in chat)) chat.sDemote = ''
                if (!('antielimina' in chat)) chat.antielimina = false
                if (!('antibot' in chat)) chat.antibot = true
                if (!('bestemmiometro' in chat)) chat.bestemmiometro = true
                if (!('antilinkgp' in chat)) chat.antilinkgp = true
                if (!('antilinkig' in chat)) chat.antilinkig = false
                if (!('antilinktg' in chat)) chat.antilinktg = false
                if (!('antilinktk' in chat)) chat.antilinktk = false
                if (!('antiSpam' in chat)) chat.antiSpam = true
                if (!('antiviewonce' in chat)) chat.antiviewonce = false
                if (!('antiTraba' in chat)) chat.antiTraba = true
                if (!('antiArab' in chat)) chat.antiArab = false
                if (!('modoadmin' in chat)) chat.modoadmin = true
                if (!isNumber(chat.expired)) chat.expired = 0
                if (!isNumber(chat.messaggi)) chat.messaggi = 0
                if (!isNumber(chat.blasphemy)) chat.blashpemy = 0
                if (!('name' in chat)) chat.name = this.getName(m.chat)
                if (!('rules' in chat)) chat.rules = ''
            } else {
                global.db.data.chats[m.chat] = {
                    name: this.getName(m.chat),
                    isBanned: false,
                    welcome: true,
                    detect: true,
                    sWelcome: '',
                    sBye: '',
                    sPromote: '',
                    sDemote: '',
                    antielimina: false,
                    antibot: true,
                    bestemmiometro: true,
                    antiLinkgp: true,
                    antilinkig: false,
                    antilinktg: false,
                    antilinktk: false,
                    antiviewonce: false,
                    antiToxic: false,
                    antiTraba: true,
                    antiArab: false,
                    modoadmin: true,
                    name: m.name,
                    rules: '',
                }
            }
            
            // Settings initialization
            let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!('self' in settings)) settings.self = false
                if (!('autoread' in settings)) settings.autoread = false
                if (!('restrict' in settings)) settings.restrict = true
                if (!('antiCall' in settings)) settings.antiCall = true
                if (!('antiPrivate' in settings)) settings.antiprivato = true
                if (!('jadibot' in settings)) settings.jadibot = true   
            } else {
                global.db.data.settings[this.user.jid] = {
                    self: false,
                    autoread: false,
                    restrict: true,
                    antiCall: true,
                    antiPrivate: true,
                    jadibot: true,
                }
            }
        } catch (e) {
            console.error(e)
        }
        
        // Message filtering
        if (opts['nyimak']) return
        if (!m.fromMe && opts['self']) return
        if (opts['pconly'] && m.chat.endsWith('g.us')) return
        if (opts['gconly'] && !m.chat.endsWith('g.us')) return
        if (opts['swonly'] && m.chat !== 'status@broadcast') return
        if (typeof m.text !== 'string') m.text = ''

        // User privileges
        const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)

        // Message queque
        if (opts['queque'] && m.text && !(isMods || isPrems)) {
            let queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(m.id || m.key.id)
            setInterval(async function () {
                if (queque.indexOf(previousID) === -1) clearInterval(this)
                await delay(time)
            }, time)
        }

        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)

        let usedPrefix
        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

        // Group metadata
        const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
        const participants = (m.isGroup ? groupMetadata.participants : []) || []
        const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {}
        const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {}
        const isRAdmin = user?.admin == 'superadmin' || false
        const isAdmin = isRAdmin || user?.admin == 'admin' || false
        const isBotAdmin = bot?.admin || false

        // Plugin handling
        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            
            const __filename = join(___dirname, name)
            
            // Plugin 'all' function
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    console.error(e)
                    for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                        let data = (await conn.onWhatsApp(jid))[0] || {}
                        if (data.exists)
                            m.reply(`[ ⚠ ] 𝐄𝐑𝐑𝐎𝐑𝐄`.trim(), data.jid)
                    }
                }
            }
            
            if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) {
                continue
            }
            
            // Command matching
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            let match = (_prefix instanceof RegExp ? 
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ? 
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? 
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                })) continue
            }
            
            if (typeof plugin !== 'function') continue
            
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail
                let isAccept = plugin.command instanceof RegExp ? 
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? 
                        plugin.command.some(cmd => cmd instanceof RegExp ? 
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ? 
                            plugin.command === command :
                            false

                if (!isAccept) continue
                
                m.plugin = name
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if (name != 'OWNER_unbanchat.js' && chat?.isBanned) return
                    if (name != 'OWNER_unbanuser.js' && user?.banned) return
                }
                
                let hl = _prefix 
                let adminMode = global.db.data.chats[m.chat].modoadmin
                let mystica = `${plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || hl || m.text.slice(0, 1) == hl || plugin.command}`
                if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && mystica) return   

                // Permission checks
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) {
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) {
                    fail('owner', m, this)
                    continue
                }
                if (plugin.mods && !isMods) {
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) {
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) {
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) {
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) {
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) {
                    fail('private', m, this)
                    continue
                }
                if (plugin.register == true && _user.registered == false) {
                    fail('unreg', m, this)
                    continue
                }
                
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
                if (xp > 2000) m.reply('Exp limit')
                else if (plugin.money && global.db.data.users[m.sender].money < plugin.money * 1) {
                    fail('senzasoldi', m, this)
                    continue   
                }
                
                m.exp += xp
                if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
                    this.reply(m.chat, `diamanti terminati`, m)
                    continue
                }
                if (plugin.level > _user.level) {
                    this.reply(m.chat, `livello troppo basso`, m)
                    continue
                }
                
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }
                
                try {
                    await plugin.call(this, m, extra)
                    if (!isPrems) {
                        m.limit = m.limit || plugin.limit || false
                        m.money = m.money || plugin.money || false 
                    }
                } catch (e) {
                    m.error = e
                    console.error(e)
                    if (e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                        if (e.name) {
                            for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                                let data = (await conn.onWhatsApp(jid))[0] || {}
                                if (data.exists)
                                    m.reply(`[ ⚠ ] 𝐄𝐑𝐑𝐎𝐑𝐄`.trim(), data.jid)
                            }
                        }
                        m.reply(text)
                    }
                } finally {
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                        if (m.money) {
                            m.reply(+m.money + ' 𝙂𝘼𝙏𝘼𝘾𝙊𝙄𝙉𝙎 🐱 𝙐𝙎𝘼𝘿𝙊(𝙎)')
                            break
                        }
                    }
                    if (m.limit) {
                        m.reply(+m.limit + ' diamante usato')
                    }
                    break
                }
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        // Clean up queque
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        
        // Update user stats
        let chat, user, stats = global.db.data.stats
        if (m) {
            let utente = global.db.data.users[m.sender]
            if (m.isCommand) {
                utente.command += 1
            }
            
            // Mute handling
            if (utente.muto == true) {
                let bang = m.key.id
                let cancellazzione = m.key.participant
                await conn.sendMessage(m.chat, {
                    delete: {
                        remoteJid: m.chat, 
                        fromMe: false, 
                        id: bang, 
                        participant: cancellazzione
                    }
                })
            }
            
            if (m.sender && (user = global.db.data.users[m.sender]) && (chat = global.db.data.chats[m.chat])) {
                user.exp += m.exp
                user.limit -= m.limit * 1
                user.money -= m.money * 1 
                user.messaggi +=1
                chat.messaggi +=1
            }

            // Plugin stats
            let stat
            if (m.plugin) {
                let now = +new Date
                if (m.plugin in stats) {
                    stat = stats[m.plugin]
                    if (!isNumber(stat.total)) stat.total = 1
                    if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                    if (!isNumber(stat.last)) stat.last = now
                    if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                } else {
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                }
                stat.total += 1
                stat.last = now
                if (m.error == null) {
                    stat.success += 1
                    stat.lastSuccess = now
                }
            }
        }

        try {
            if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        
        if (opts['autoread'])
            await this.readMessages([m.key])
    }
}

/**
 * Handle groups participants update
 */
export async function participantsUpdate({ id, participants, action }) {
    if (opts['self'])
        return
    
    if (this.isInit) 
        return
    if (global.db.data == null)
        await loadDatabase()
    let chat = global.db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
        case 'remove':
            if (chat.welcome) {
                let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata
                for (let user of participants) {
                    let pp = './icone/benvenuto.png'
                    try {
                        pp = await this.profilePictureUrl(user, 'image')
                    } catch (e) {
                    } finally {
                    let apii = await this.getFile(pp)
                        text = (action === 'add' ? (chat.sWelcome || this.welcome || conn.welcome || 'benvenuto, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc?.toString() || 'bot') :
                              (chat.sBye || this.bye || conn.bye || 'bye bye, @user!')).replace('@user', '@' + user.split('@')[0])
this.sendMessage(id, { text: text, 
  contextInfo:{ 
  mentionedJid:[user],
      forwardingScore: 3,
        isForwarded: false,                    forwardedNewsletterMessageInfo: {
},
  "externalAdReply": {
  "title": `${action === 'add' ? '𝑩𝑬𝑵𝑽𝑬𝑵𝑼𝑻𝑶/𝑨 🤗' : '𝑨𝑫𝑫𝑰𝑶 😞'}`, 
 "body": ``, 
  "previewType": "PHOTO", 
 "thumbnailUrl": ``, 
 "thumbnail": apii.data,
  "mediaType": 1
                                }
                            }
                        }) 
                    } 
                } 
            }
            break
    }
}

/**
 * Handle groups update
 */
export async function groupsUpdate(groupsUpdate) {
    if (opts['self']) return
    
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        
        let chats = global.db.data.chats[id], text = ''
        if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```immagine modificata```').replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```link reimpostato, nuovo link:```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if (!text) continue
        
        await this.sendMessage(id, { text, mentions: this.parseMention(text) })
    }
}

export async function callUpdate(callUpdate) {
    // Handle call updates
}

export async function deleteUpdate(message) {
    // Handle message deletions
}

// Default fail messages
global.dfail = (type, m, conn) => {
    let msg = {
        rowner: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐝𝐢𝐬𝐩𝐨𝐧𝐢𝐛𝐢𝐥𝐞 𝐬𝐨𝐥𝐨 𝐩𝐞𝐫 𝐨𝐰𝐧𝐞𝐫 🕵🏻‍♂️',
        owner: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐝𝐢𝐬𝐩𝐨𝐧𝐢𝐛𝐢𝐥𝐞 𝐬𝐨𝐥𝐨 𝐩𝐞𝐫 𝐨𝐰𝐧𝐞𝐫 🕵🏻‍♂️',
        mods: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐥𝐨 𝐩𝐨𝐬𝐬𝐨𝐧𝐨 𝐮𝐭𝐢𝐥𝐢𝐳𝐳𝐚𝐫𝐞 𝐬𝐨𝐥𝐨 𝐚𝐝𝐦𝐢𝐧 𝐞 𝐨𝐰𝐧𝐞𝐫 ⚙️',
        premium: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐩𝐞𝐫 𝐦𝐞𝐦𝐛𝐫𝐢 𝐩𝐫𝐞𝐦𝐢𝐮𝐦 ✅',
        group: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐩𝐮𝐨𝐢 𝐮𝐭𝐢𝐥𝐢𝐳𝐳𝐚𝐫𝐥𝐨 𝐢𝐧 𝐮𝐧 𝐠𝐫𝐮𝐩𝐩𝐨 👥',
        private: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐩𝐮𝐨𝐢 𝐮𝐭𝐢𝐥𝐢𝐳𝐳𝐚𝐫𝐥𝐨 𝐢𝐧 𝐜𝐡𝐚𝐭 𝐩𝐫𝐢𝐯𝐚𝐭𝐚 👤',
        admin: '𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐞̀ 𝐝𝐢𝐬𝐩𝐨𝐧𝐢𝐛𝐢𝐥𝐞 𝐩𝐞𝐫 𝐬𝐨𝐥𝐢 𝐚𝐝𝐦𝐢𝐧 👑',
        botAdmin: '𝐃𝐞𝐯𝐢 𝐝𝐚𝐫𝐞 𝐚𝐝𝐦𝐢𝐧 𝐚𝐥 𝐛𝐨𝐭 👑',
        restrict: '🔐 𝐑𝐞𝐬𝐭𝐫𝐢𝐜𝐭 𝐞 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨 🔐'
    }[type]
    
    if (msg) {
        return conn.sendMessage(m.chat, { 
            text: msg 
        }, { quoted: m })
    }
}

// Watch for file changes
let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})