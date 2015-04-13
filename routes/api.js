var exec = require('child_process').exec,child;
var path= require('path');
var dir=require("node-dir");


// finding disk space
function diskspace(callback,responseResult) {
    var df_command=exec(' df -h  / | awk \'NR>1 {print $1 "*-" $3 "*--"$4}\'',  function (error, stdout, stderr) {
		var df_result=stdout.split("\n");
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
	var jenkin_command=exec('ps -ef | grep "jenkins" | grep "8080" | grep -v /bin/sh |  head -1 | awk \'{print $1"*-"$2"*-"$5}\'',  function (error, stdout, stderr) {
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
	var cq5_command=exec('ps -ef | grep "4502" | grep "cq-quickstart" | grep -v /bin/sh | head -1 | awk \'{print $1"*-"$2"*-"$5}\'',  function (error, stdout, stderr) {
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

function puppetstatus(callback,responseResult){
	var puupet_command=exec('ps -ef | grep agent | grep -v /bin/sh | awk \'{print $1"*-"$2"*-"$5}\'',  function (error, stdout, stderr) {
		responseResult.puppet={"status":"down","start_time":""}
		if(stdout){
			console.log(stdout);
			var service_result=stdout.split("*-");
			responseResult.puppet.status="up";
			responseResult.puppet.start_time=service_result[2];
		}
		callback();
	});
}


function readPuppetDirectory(callback,responseResult){
	responseResult.puppet={};
	dir.readFiles("/home/devops/data",function(err, content,filename, next) {
			if (err) throw err;
			responseResult.puppet[path.basename(filename)]=content;
			next();
		},
		function(err, files){
			if (err) throw err;
			callback();
			console.log('finished reading files:', files);
	 });

}

function jenkinJob_deploy_lastBuild(callback,responseResult){
	responseResult.deploy_lastBuild={status:"",error:"" };
  request({url:"http://chili.cisco.com:8080/job/DEPLOY_LOCALHOST/lastBuild/api/json"},function(error,response,body){
				if ( error || response.statusCode !== 200 ) {
          responseResult.deploy_lastBuild.error=error;
            callback();
            return;
        }
	      var data=JSON.parse((response.body);
        responseResult.deploy_lastBuild.status=data.result;
				callback();
	 }
}

function jenkinJob_gitwem_lastBuild(callback,responseResult){
	responseResult.gitwem_lastBuild={actions:"",error:"" };
  request({url:"http://chili.cisco.com:8080/job/GIT_WEM/lastBuild/api/json"},function(error,response,body){
				if ( error || response.statusCode !== 200 ) {
          responseResult.gitwem_lastBuild.error=error;
            callback();
            return;
        }
	      var data=JSON.parse(response.body);
        responseResult.gitwem_lastBuild.actions=data.actions;
				callback();
	 }
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
    var callbackSeries = [diskspace,jenkinstatus,cq5status,readPuppetDirectory,puppetstatus,puppetstatus,jenkinJob_deploy_lastBuild,jenkinJob_gitwem_lastBuild];
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
