const express = require('express');
const router = express.Router();
const fs = require('fs');
const CHARALENS = `/Applications/MAMP/htdocs/charalens`;

router.get('/play', (req, res, next) => {
  fs.readFile(`${CHARALENS}/inf.txt`, 'utf8', (err, data) => {
    let position = data.split(':')[1];
    fs.writeFile(`${CHARALENS}/inf.txt`, `play:${position}`, () => {
      res.send(position);
    });
  });
});

router.get('/pause', (req, res, next) => {
  fs.readFile(`${CHARALENS}/inf.txt`, 'utf8', (err, data) => {
    let position = data.split(':')[1];
    fs.writeFile(`${CHARALENS}/inf.txt`, `pause:${position}`, () => {
      res.send(position);
    });
  });
});

router.get('/state', (req, res, next) => {
  fs.readFile(`${CHARALENS}/inf.txt`, 'utf8', (err, data) => {
    res.send(data);
  });
});

module.exports = router;
