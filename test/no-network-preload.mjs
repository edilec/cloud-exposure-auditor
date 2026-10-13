import http from 'node:http';import https from 'node:https';import net from 'node:net';import tls from 'node:tls';import dns from 'node:dns';import dgram from 'node:dgram';
import {syncBuiltinESMExports} from 'node:module';
const deny=()=>{throw new Error('Network disabled in tests.');};
globalThis.fetch=deny;
for(const m of [http,https]){m.request=deny;m.get=deny;m.Agent.prototype.createConnection=deny;}
net.connect=deny;net.createConnection=deny;net.Socket.prototype.connect=deny;net.Server.prototype.listen=deny;tls.connect=deny;
for(const obj of [dns,dns.promises,dns.Resolver.prototype,dns.promises.Resolver.prototype])for(const name of Object.getOwnPropertyNames(obj))if(/^(?:lookup|resolve|reverse)/.test(name)&&typeof obj[name]==='function')obj[name]=deny;
dgram.createSocket=deny;dgram.Socket.prototype.send=deny;dgram.Socket.prototype.bind=deny;dgram.Socket.prototype.connect=deny;
syncBuiltinESMExports();
