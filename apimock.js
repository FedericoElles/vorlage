var request = require('request');
var Q = require('q');
var marked = require('marked');
var apimock = {};

var contentful = require('contentful')
var client = contentful.createClient({
  space: 'jj1cixz0dqds',
  accessToken: '21a0c6f21b4530429f5b8f5594a5cc1cc34b71ec11a1908344ca01ee16b1c9b8'
})

apimock.example = function(){
  var deferred = Q.defer();
  
  var uri = 'https://ghibliapi.herokuapp.com/films';
  
  request(uri, "utf-8", function (error, response, body) {
      if (error) {
          deferred.reject(new Error(error));
      } else {
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;  
}

apimock.exampleLocal = function(){
var deferred = Q.defer();
  
  var uri = 'https://ghibliapi.herokuapp.com/films';
  
  deferred.resolve(['Berlin', 'München', 'Düsseldorf', 'Köln']);

  return deferred.promise;  
}



apimock.posts = function(){
  var deferred = Q.defer();
  
  client.getEntries({
    'content_type': '2wKn6yEnZewu2SCCkus4as'
  })
  .then(function (entries) {
      //console.log(JSON.stringify(entries))
      var data = [];
      entries.items.forEach(function (entry) {
        console.log(entry.fields.body)
        data.push({
          title: entry.fields.title,
          body: entry.fields.body,
          html: marked(entry.fields.body)
        });
      });
      deferred.resolve(data);
  })
  .catch(function(err){
    console.log(err);
    deferred.reject(new Error(err));
    
  })
 
  return deferred.promise;  
}

module.exports = apimock;