var Crawler = require("crawler");

const { URL } = require('url');
var _ = require('lodash');

let data = {}

let seen = []

let comp = e => e[1]

var c = new Crawler({
    maxConnections : 50,
    callback : function (error, res, done) {
      if(error){
          console.log(error);
      }else{
          var $ = res.$;
          if($ !== undefined){
            $("a").each((i,elem)=> {
              let url = $(elem).attr('href')
              if(url !== undefined && (url.startsWith('http') || url.startsWith('https'))){
                try {
                  let parsed = new URL(url)
                  data[parsed.host] = (data[parsed.host] || 0) + 1
                  let next = parsed.protocol + '//' +  parsed.host
                  if(!seen.includes(next)){
                    var highest = _.maxBy(Object.entries(data), comp)
                    console.log('Queue size:' + c.queueSize + '\tSeen size : ' + seen.length + '\thighest: ' + highest + '\tnew: ' + parsed.host)
                    seen.push(next)
                    c.queue(next);
                  }
                } catch(error){
                  console.error('WRONG URL: ' + url + ' => ' + error)
                }
              }
            });
          }
      }
      done();
    }
});

// Queue just one URL, with default callback
c.queue('http://www.google.com');
