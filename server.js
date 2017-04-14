// server.js
// where your node app starts

// init project
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



/**
 * CONTEXT
 */
function getContext(req, data){
  var context = {
    debug: !!req.query.debug,
    dev: !!req.query.dev,    
    data: data
  }
  if (context.debug){
    context.json = JSON.stringify(context, undefined, 4);
  }
  return context;
}

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
   apimock.example().then(function(data){     
     
     res.render('home', getContext(req, data));  
     
   }).catch(function(err){catchError(res, err);});
});


app.get("/about", function (req, res) {
   apimock.exampleLocal().then(function(data){     
     
     res.render('about', getContext(req, data));
     
   }).catch(function(err){catchError(res, err);});
});




// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
