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


function getUrl(element, type){
  var r = '';
  if (type === 'page'){
    if (element.fields.slug){
      r = '/' + element.fields.slug + '.html';
    }
    if (element.fields.folder && element.fields.folder.fields && element.fields.folder.fields.slug){
      r = '/' + element.fields.folder.fields.slug + r;
    }
  }
  return r;
}

function getImage(element){
  var r = false
  if (element.fields.image){
    r = element.fields.image.fields;
  }
  if (r && r.file.details.image.width > r.file.details.image.height){
    r.isHorz = true;
    r.ratio = 'horz';
  } else {
    r.isVert = true;
    r.ratio = 'vert';
  }
  if (r && r.file.details.image.width > r.file.details.image.height){
    r.isSquare = true;
    r.ratio = 'square';
  }
  if (r){
    var url = r.file.url;
    var SRCSET = {"320": 320, "640": 640, "1000": 1000};
    var srcset = [];
    for (var set in SRCSET){
      srcset.push(url + '?' + (r.isVert ? 'h' : 'w') + '=' + SRCSET[set] + ' ' + set + 'w');
    }
    r.srcset = srcset.join(', ');
  }
  return r;
}


function elementify(items){
  
  var elements = [];

  items.forEach(function(element){
    var stageElement = {
      type: element.sys.contentType.sys.id
    };

    switch (stageElement.type){
      //page elements
      case 'blockText':
        stageElement.textHTML = marked(element.fields.text);
        break;
      case 'blockLink':
        stageElement.title = element.fields.title;
        stageElement.description = element.fields.description;
        stageElement.url = element.fields.url;
        stageElement.image = getImage(element);
        if (element.fields.view){
          stageElement.view = element.fields.view;
          stageElement.hasView = true;
          stageElement.partialName = stageElement.type + '-' + stageElement.view;
        }
        break;
      case 'blockImage':
        stageElement.title = element.fields.title;
        stageElement.view = element.fields.view;
        stageElement.description = element.fields.description;
        stageElement.image = getImage(element);
        break;
      case 'blockHtml':
        stageElement.html = element.fields.html;
        break;
      case 'blockMap':
        //stageElement.fields = element.fields;
        stageElement.title = element.fields.title;
        if (element.fields.view){
          stageElement.view = element.fields.view;
          stageElement.hasView = true;
          stageElement.partialName = stageElement.type + '-' + stageElement.view;
        }
        stageElement.descriptionHTML = marked(element.fields.description);
        stageElement.location = element.fields.location;
        stageElement.googleMapsImageLink = 'https://maps.googleapis.com/maps/api/staticmap?center='+element.fields.location.lat+','+element.fields.location.lon+'&zoom=15&size=640x640&maptype=roadmap' +
         '&markers=color:blue%7Clabel:S%7C'+element.fields.location.lat+','+element.fields.location.lon;
        stageElement.googleMapsLink = 'https://www.google.com/maps?q='+element.fields.location.lat+','+element.fields.location.lon;
        
        break;
      
        //container elements
      case 'page':
        stageElement.title = element.fields.title;
        stageElement.slug = element.fields.slug;
        stageElement.url = getUrl(element, stageElement.type);
        stageElement.folder = element.fields.folder;
        break;
      case 'container':
        stageElement.title = element.fields.title;
        stageElement.slug = element.fields.slug;
        if (element.fields.view){
          stageElement.view = element.fields.view;
          stageElement.hasView = true;
          stageElement.partialName = stageElement.type + '-' + stageElement.view;
        }
        stageElement.description = element.fields.description;
        stageElement.image = getImage(element);
        stageElement.elements = elementify(element.fields.elements);
        break;
      default:
        for (var x in element.fields){
          stageElement[x] = element.fields[x];
          if (x === 'image'){
            stageElement.image = getImage(element);
          }
        }
        
        
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
          data.configs[config.fields.key] = {
            value: config.fields.value || '',
            html: marked(config.fields.value) || ''
          };
        });
      }
    
    
      function menufy(menu){
        var r = []
        menu.forEach(function(item){
          var stage = {};
          var type = item.sys.contentType.sys.id;
          stage.type = type;
          stage['is' + type[0].toUpperCase() + type.substr(1)] = true;
          //TODO: type === container
          stage.title = item.fields.titleMenu || item.fields.title;
          //stage.titleMenu = ;
          stage.slug =  getUrl(item, type);
          if (stage.isContainer){
            stage.elements = menufy(item.fields.elements);
          }
          r.push(stage);
        });
        return r;
      }
    
      data.menu = [];
      if (stage.fields.menu) {
        data.menu = menufy(stage.fields.menu);
        // stage.fields.menu.forEach(function(item){
        //   var stage = {};
        //   var type = item.sys.contentType.sys.id;
        //   stage.type = type;
        //   stage['is' + type[0].toUpperCase() + type.substr(1)] = true;
        //   //TODO: type === container
        //   stage.title = item.fields.title;
        //   stage.slug =  getUrl(item, type);
        //   data.menu.push(stage);
        // });
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

apimock.slug = function(config, slug){
  var deferred = Q.defer();
  
  getClient(config).getEntries({
    'content_type': 'page',
    'fields.slug': slug,
    'include': 3
  })
  .then(function (entries) {
      if (entries.items.length > 0){
        var stage = entries.items.pop() 
        var data = {};
        var type = stage.sys.contentType.sys.id;
        data.title = stage.fields.title;
        data.slug = stage.fields.slug;
        data.type = type;
        if (stage.fields.elements){
          data.elements = elementify(stage.fields.elements);
        }
        deferred.resolve(data);
      } else {
        getClient(config).getEntries({
          'content_type': 'container',
          'fields.slug': slug,
          'include': 3
        }).then(function (entries) {
          if (entries.items.length > 0){
            var stage = entries.items.pop() 
            var data = {};
            var type = stage.sys.contentType.sys.id;
            data.title = stage.fields.title;
            data.slug = stage.fields.slug;
            data.type = type;
            if (stage.fields.elements){
              data.elements = elementify(stage.fields.elements);
            }
            deferred.resolve(data);
          } else {
            deferred.reject(new Error('page not found'));
          }
        })
        .catch(function(err){
          console.log(err);
          deferred.reject(new Error(err));
        });
      }
  })
  .catch(function(err){
    console.log(err);
    deferred.reject(new Error(err));
  })
 
  return deferred.promise;  
}


module.exports = apimock;