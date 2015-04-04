
 var express = require('express');
var app  = express();
var path = require("path");
var port = process.env.PORT || 80;
var exec = require('child_process').exec,child,responseResult={};


app.use(express.static(__dirname + '/public'));
app.use(express.static(path.normalize(__dirname + '../../../../../../'))); // grab root dev-ops

function generateResponse(response){
	response.writeHead(200, {"Content-Type": "application/json"});
	 var json = JSON.stringify(responseResult);
	 response.end(json);
	
}

app.get("/api/status",function(request,response){
    //finding total space-total space and available space
	child = exec(' df -h  / | awk \'NR>1 {print $2 "-" $5}\'',  function (error, stdout, stderr) {	
		if (error !== null) {
			console.log('exec error: ' + error);
		}
		responseResult.diskspace=stdout;
		
		//find status of local instance of pupet process id and start time
		var puppetcmd=exec('ps -ef | grep "puppet" | awk \'{print $2"-"$5}\'',  function (error, stdout, stderr) {	
			if (error !== null) {
				console.log('exec error: ' + error);
			}
			responseResult.puppet=stdout;	
			//find status of local instance of jenkins process id and start time
			var jenkinscmd=exec('ps -ef | grep "jenkin" | grep 8080| awk \'{print $2"-"$5}\'',  function (error, stdout, stderr) {	
				if (error !== null) {
					console.log('exec error: ' + error);
				}
				responseResult.jenkins=stdout;	
				//call this function to generate response
				generateResponse(response);
			});
		});
		
	});
});
app.listen(port);

console.log('Server running on port ' + port);
