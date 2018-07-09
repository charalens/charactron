'use strict';

const {app, Menu, BrowserWindow, ipcMain} = require('electron');
const net = require('net');
const os = require('os');
const mkdirp = require('mkdirp');
const fs = require('fs');
const qrCode = require('qrcode');
const opn = require('opn');
const express = require('express');
const path = require('path');
const exp = express();
const http = require('http');

const template = [
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  });

  // Edit menu
  template[1].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  );

  // Window menu
  template[3].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

const getLocalAddress = () => {
  let ifacesObj = {};
  ifacesObj.ipv4 = [];
  ifacesObj.ipv6 = [];
  let interfaces = os.networkInterfaces();

  for (let dev in interfaces) {
    interfaces[dev].forEach(function(details){
      if (!details.internal){
        switch(details.family){
          case 'IPv4':
            ifacesObj.ipv4.push({name:dev, address:details.address});
            break;
          case 'IPv6':
            ifacesObj.ipv6.push({name:dev, address:details.address});
            break;
        }
      }
    });
  }
  return ifacesObj;
};

const localIp = getLocalAddress().ipv4[0].address;
const HOME = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const CHARALENS = `/Applications/MAMP/htdocs/charalens`;

const HOST = '0.0.0.0';
const PORT = 2700;

mkdirp(CHARALENS, () => {
  qrCode.toFile(
    `${CHARALENS}/charalens.png`,
    localIp,
    {color: {dark: '#000000', light: '#FFFFFF'}},
    () => {
      opn(`${CHARALENS}/charalens.png`);
    }
  );
});

/*
let socket;
net.createServer((sock) => {
  socket = sock;
  console.log(`CONNECTED: ${sock.remoteAddress}:${sock.remotePort}`);
  sock.on('data', (data) => {
    console.log('DATA: ' + data);
    sock.write('RECIEVED');
  });
  sock.on('close', (hadError) => {
    console.log(`CLOSED. Had Error: ${hadError}`);
  });
  sock.on('error', (err) => {
    console.log(`ERROR: ${err.stack}`);
  });
}).listen(PORT, HOST);
console.log(`Server listening on ${HOST} : ${PORT}`);
*/

let mainWindow = null;
let map = '';
app.on('ready', () => {
  fs.readFile(`${CHARALENS}/map.json`, 'utf8', (err,data) => {
    map = data;
    mainWindow = new BrowserWindow({width: 600, height: 600});
    mainWindow.loadURL(`file://${__dirname}/ui/index.html`);
    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.webContents.openDevTools();
  });
});

ipcMain.on('map', (event) => {
  event.sender.send('mapCatch', map);
});

ipcMain.on('seek', (event, seek) => {
  fs.readFile(`${CHARALENS}/inf.txt`, 'utf8', (err, data) => {
    fs.writeFile(`${CHARALENS}/inf.txt`, `${data.split(':')[0]}:${seek}`);
  });
});

const stateWord = ['pause', 'play'];
ipcMain.on('state', (event, state) => {
  fs.readFile(`${CHARALENS}/inf.txt`, 'utf8', (err, data) => {
    fs.writeFile(`${CHARALENS}/inf.txt`, `${stateWord[state]}:${data.split(':')[1]}`);
  });
});

ipcMain.on('browserDoc', (event, url) => {
  opn(url);
});

ipcMain.on('browserMp4', (event, url) => {
  opn(url);
});

setInterval(() => {
  fs.readFile(`${CHARALENS}/inf.txt`, 'utf8', (err, data) => {
    mainWindow.webContents.send('outState', data.split(':')[0]);
  });
}, 500);

const apiExp = require('./routes/api');
exp.use('/charalens/api/', apiExp);
exp.set('port', PORT);
http.createServer(exp).listen(PORT);
