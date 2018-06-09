var Crawler = require("crawler");

const { URL } = require('url');
var _ = require('lodash');
var neo4j = require('neo4j-driver');

let data = {}

let seen = []

let comp = e => e[1]

var driver = neo4j.v1.driver("bolt://localhost", neo4j.v1.auth.basic("neo4j", process.env.NEO4J_PASSWORD));
var session = driver.session();

// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!

function storeLink(from, to){
  // console.log('Storing link from ' + from + ' to ' + to)
  return session
    .run('MERGE (from: Site {host:{from}}) MERGE (to: Site {host:{to}}) MERGE (from)-[:link]->(to)', {from: from, to: to})
    .then(function (result) {

    })
    .catch(function (error) {
      console.log(error);
    });
}

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

                  let hostKey = parsed.host

                  data[hostKey] = (data[hostKey] || 0) + 1
                  let next = parsed.protocol + '//' +  parsed.host

                  let from = res.options.from
                  let to = hostKey

                  if(from !== to){
                    storeLink(from, to).then(() => {
                      if(!seen.includes(next)){
                        var highest = _.maxBy(Object.entries(data), comp)
                        console.log('Queue size:' + c.queueSize + '\tSeen size : ' + seen.length + '\thighest: ' + highest + '\tnew: ' + hostKey)
                        seen.push(next)
                        c.queue({
                          uri: next,
                          from: hostKey
                        });
                      }
                    })
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

c.on('drain',function(){
  session.close();
  driver.close();
});

// Queue just one URL, with default callback
c.queue('http://www.google.com');
