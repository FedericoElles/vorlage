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



apimock.articles = function(){
  var deferred = Q.defer();
  
  client.getEntries({
    'content_type': 'article'
  })
  .then(function (entries) {
      //console.log(JSON.stringify(entries))
      var data = [];
      entries.items.forEach(function (entry) {
        console.log(entry)
        data.push({
          title: entry.fields.title,
          slug: entry.fields.slug,
          id: entry.sys.id
          //,
          //body: entry.fields.body,
          //html: marked(entry.fields.body)
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



apimock.article = function(slug){
  var deferred = Q.defer();
  
  client.getEntries({
    'content_type': 'article',
    'fields.slug': slug,
    'include': 3
  })
  .then(function (entries) {
      //console.log(JSON.stringify(entries))
      var stage = client.parseEntries(entries.items.pop());
      var data = {};
      data.title = stage.fields.title;
      data.slug = stage.fields.slug;
      data.elements = [];
                                      
      stage.fields.elements.forEach(function(element){
        var stageElement = {
          type: element.sys.contentType.sys.id
        };
        
        switch (stageElement.type){
          case 'blockText':
            stageElement.textHTML = marked(element.fields.text);
            break;
          case 'blockImage':
            stageElement.title = element.fields.title;
            stageElement.description = element.fields.description;
            stageElement.image = element.fields.image.fields;
            break;
          case 'blockHtml':
            stageElement.html = element.fields.html;
            break;
          default:
            stageElement.error = 'Unknown Block';
        }
        
        data.elements.push(stageElement);
        
      });                                
                                      
      //console.log(client.parseEntries(entry));
        
        //data = {
          //title: entry.fields.title,
          //id: entry.sys.id
          //,
          //body: entry.fields.body,
          //html: marked(entry.fields.body)
        //};
    
      deferred.resolve(data);
  })
  .catch(function(err){
    console.log(err);
    deferred.reject(new Error(err));
    
  })
 
  return deferred.promise;  
}

module.exports = apimock;