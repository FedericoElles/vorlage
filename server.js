// server.js
// where your node app starts

// init project
var compression = require('compression')

var express = require('express');
var exphbs  = require('express-handlebars');
var sass = require('node-sass'); 
var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var apimock = require('./apimock');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use(compression());


if (!process.env.websiteId){
  throw 'Please define websiteId variable from Contentful in ENVIRONMENT';
}

var WEBSITEID = process.env.websiteId;

app.use(function(req, res, next){
  req.apimock = {
    live: (typeof req.query.preview === 'undefined')
  };
  console.log(req.apimock)
  next();
});


/**
 * CONTEXT
 */
function getContext(req, data, indexData){
  var context = {
    debug: !!req.query.debug, // Are we in debug mode? ?debug=true
    dev: !!req.query.dev,     //Are we in dev mode? ?dev=true
    data: data, //data is always the external payload
      style: sass.renderSync({
      file: './scss/style.scss',
      includePaths: ['./scss/mixins/'],
      outputStyle: 'compressed'
    }).css.toString()
  }
  if (indexData){
    delete indexData.stage;
    context.index = indexData;
  }
  if (context.debug){ //shortcut to display context in template
    context.json = JSON.stringify(context, undefined, 4);
  }


  return context;
}

/**
 * Central Error handling
 */
function catchError(res, err){
  res.send(err);
}



/**
 * STYLE - please use style.scss to include all required sass files
 */

app.get('/style.css', (req, res) => {
  var style = sass.renderSync({
    file: './scss/style.scss',
    outputStyle: 'compressed'
  });
  res.header("Content-type", "text/css");
  res.end(style.css);
});


/**
 * Basic route
 */
app.get("/", function (req, res) {
   apimock.index(req.apimock, WEBSITEID).then(function(data){     
     res.render('home', getContext(req, data, data));  
     
   }).catch(function(err){catchError(res, err);});
});


/**
 * Just another route
 */
app.get("/about", function (req, res) {
   apimock.exampleLocal().then(function(data){     
     
     res.render('about', getContext(req, data));
     
   }).catch(function(err){catchError(res, err);});
});



/**
 * Just another route
 */
app.get("/articles", function (req, res) {
   apimock.articles(req.apimock).then(function(data){     
     
     res.render('articles', getContext(req, data));
     
   }).catch(function(err){catchError(res, err);});
});


/**
 * Display article with webseite info
 */
app.get("/article/:id", function (req, res) {
   var index;
   apimock.index(req.apimock, WEBSITEID).then(function(data){ 
     index = data;
     return apimock.article(req.apimock, req.params.id);
   }).then(function(data){     
     res.render('article', getContext(req, data, index));
     
   }).catch(function(err){catchError(res, err);});
});


/**
 * Display article with webseite info
 */
app.get("*", function (req, res) {
   var index;
   apimock.index(req.apimock, WEBSITEID).then(function(data){ 
     index = data;
     
     //id equals the last path element, without html suffix
     var id = '';
     
     var ids = req.path.replace('.html','').split('/');
       
     while (id === '' && ids.length){
       id = ids.pop();
     }
          
     if (id){
       return apimock.slug(req.apimock, id);
     } else {
       res.render('home', getContext(req, index, index));
     }
   }).then(function(data){     
     res.render('article', getContext(req, data, index));
     
   }).catch(function(err){catchError(res, err);});
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
