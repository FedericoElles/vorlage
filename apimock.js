var request = require('request');
var Q = require('q');
var marked = require('marked');
var apimock = {};


if (!process.env.space){
  throw 'Please define space variable from Contentful in ENVIRONMENT';
}

if (!process.env.accessToken){
  throw 'Please define accessToken variable from Contentful in ENVIRONMENT';
}

if (!process.env.accessTokenPreview){
  throw 'Please define accessTokenPreview variable from Contentful in ENVIRONMENT';
}

var contentful = require('contentful')
var clientLive= contentful.createClient({
  space: process.env.space,
  accessToken: process.env.accessToken
});

console.log('accessTokenPreview', process.env.accessTokenPreview);

var clientPreview = contentful.createClient({
  space: process.env.space,
  accessToken: process.env.accessTokenPreview,
  host: 'preview.contentful.com'
});


function getClient(config){
  return config.live ? clientLive : clientPreview;
}


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





apimock.articles = function(config){
  var deferred = Q.defer();
  
  getClient(config).getEntries({
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



function elementify(items){
  
  var elements = [];

  items.forEach(function(element){
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

    elements.push(stageElement);

  });  
  
  return elements;
  
}

apimock.index = function(config, id){
  var deferred = Q.defer();
  
  getClient(config).getEntries({
    'content_type': 'website',
    'sys.id': id,
    'include': 3
  })
  .then(function (entries) {
      var stage = entries.items.pop(); 
      var data = {};
      data.title = stage.fields.title;
    
      data.configs = {};
      if (stage.fields.configs){ 
        stage.fields.configs.forEach(function(config){
          data.configs[config.fields.key] = config.fields.value || '';
        });
      }
    
      data.menu = [];
      if (stage.fields.menu) {
        stage.fields.menu.forEach(function(item){
          var stage = {};
          var type = item.sys.contentType.sys.id;
          if (type === 'article'){
            stage.type = 'link';
          }
          //TODO: type === container
          stage.title = item.fields.title;
          stage.slug = item.fields.slug
          data.menu.push(stage);
        });
      }
    
      data.elements = [];
    
      if (stage.fields.homepage){
        data.elements = elementify(stage.fields.homepage.fields.elements);
      }
    
      //data.slug = stage.fields.slug;
    
      //data.page = elementify(stage.fields.elements);
                                      
      data.stage = stage;
      deferred.resolve(data);
  })
  .catch(function(err){
    console.log(err);
    deferred.reject(new Error(err));
  })
 
  return deferred.promise;  
}


apimock.article = function(config, slug){
  var deferred = Q.defer();
  
  getClient(config).getEntries({
    'content_type': 'article',
    'fields.slug': slug,
    'include': 3
  })
  .then(function (entries) {
      var stage = entries.items.pop() 
      var data = {};
      data.title = stage.fields.title;
      data.slug = stage.fields.slug;
      data.elements = elementify(stage.fields.elements);
      deferred.resolve(data);
  })
  .catch(function(err){
    console.log(err);
    deferred.reject(new Error(err));
  })
 
  return deferred.promise;  
}

module.exports = apimock;