
 var express = require('express');
var app  = express();
var path = require("path");
var port = process.env.PORT || 80;
var exec = require('child_process').exec,child,responseResult={};
var routes=require("./routes/api");


app.use(express.static(__dirname + '/public'));
app.use(express.static(path.normalize(__dirname + '../../../../../../'))); // grab root dev-ops
// CORS

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/api/status',routes.status);

app.listen(port);

console.log('Server running on port ' + port);
