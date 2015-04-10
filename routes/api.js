
var exec = require('child_process').exec,child;
// finding disk space
function diskspace(callback,responseResult) {
	
    var df_command=exec(' df -h  / | awk \'NR>1 {print $1 "*-" $3 "*--"$4}\'',  function (error, stdout, stderr) {
		var df_result=stdout.toString().split("\n");
		responseResult.diskspace=[];
		for(i in df_result) {
			var result=df_result[i].split("*-");
			if(result[0]!=""){
				responseResult.diskspace.push({"disk_partition":result[0],"disk_used":result[1],"disk_avail":result[2]});	
			}
			
		}
		callback();
	});    
}

function jenkinstatus(callback,responseResult){
	
	var service_command=exec('ps -ef | grep "jenkins" | grep "8080" | head -1 | awk \'{print $1"*-"$2"*-"$5}\'',  function (error, stdout, stderr) {
		responseResult.jenkins={"status":"down","start_time":""}
		if(stdout){
			console.log(stdout);
			var service_result=stdout.split("*-");
			responseResult.jenkins.status="up";
			responseResult.jenkins.start_time=service_result[2];
		}	
		callback();
	});
}
 
function cq5status(callback,responseResult){
	
	var service_command=exec('ps -ef | grep "4502" | grep "cq-quickstart" | head -1 | awk \'{print $1"*-"$2"*-"$5}\'',  function (error, stdout, stderr) {
		responseResult.cq5={"status":"down","start_time":""}
		if(stdout){
			console.log(stdout);
			var service_result=stdout.split("*-");
			responseResult.cq5.status="up";
			responseResult.cq5.start_time=service_result[2];
		}	
		callback();
	});
}


// prints text
function finish(response,responseResult) { 
	console.log('Finished.');
	console.log(responseResult);
	response.writeHead(200, {"Content-Type": "application/json"});
	var json = JSON.stringify(responseResult);
	response.end(json);
	
 }

// executes the callbacks one after another
function series(response) {
    var callbackSeries = [diskspace,jenkinstatus,cq5status];
    var responseResult={};
    function next() {
        var callback = callbackSeries.shift();
        if (callback) {
            callback(next,responseResult);
        }
        else {
            finish(response,responseResult);
        }
    }
    next();
};
 
// run the example


exports.status=function(request,response){
	series(response);	
}
