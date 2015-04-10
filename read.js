var dir = require('node-dir');
var path= require('path');

var contentJson={};
dir.readFiles(path.join(__dirname,"test"),
    function(err, content,filename, next) {
        if (err) throw err;
		contentJson[path.basename(filename)]=content;
        console.log('content:', content,path.basename(filename));
        next();
    },
    function(err, files){
        if (err) throw err;
        console.log(contentJson);
    });
