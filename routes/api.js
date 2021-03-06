var exec = require('child_process').exec;
var path = require('path');
var dir = require("node-dir");
var request = require("request");

// finding disk space
function diskspace(callback, responseResult) {
    var df_command = exec(' df -h  / data 2>/dev/null | awk \'NR>1 {print $1 "=" $3 "="$4}\'', function(error, stdout, stderr) {
        var df_result = stdout.split("\n");
        responseResult.diskspace = [];
        for (i in df_result) {
            var result = df_result[i].split("=");
            if (result[0] != "") {
                responseResult.diskspace.push({
                    "disk_partition": result[0],
                    "disk_used": result[1],
                    "disk_avail": result[2]
                });
            }
        }
        callback();
    });
}

function jenkinstatus(callback, responseResult) {
    var jenkin_command = exec('ps -ef | grep "jenkins" | grep "8080" | grep -v /bin/sh |  head -1 | awk \'{print $1"="$2"="$5}\'', function(error, stdout, stderr) {
        responseResult.jenkins = {
            "status": "down",
            "start_time": ""
        }
        if (stdout) {
            var service_result = stdout.split("=");
            responseResult.jenkins.status = "up";
            responseResult.jenkins.start_time = service_result[2];
        }
        callback();
    });
}

function cq5status(callback, responseResult) {
    var cq5_command = exec('ps -ef | grep "4502" | grep "cq-quickstart" | grep -v /bin/sh | head -1 | awk \'{print $1"="$2"="$5}\'', function(error, stdout, stderr) {
        responseResult.cq5 = {
            "status": "down",
            "start_time": "",
            "last_started_time": ""
        }
        if (stdout) {
            var service_result = stdout.split("=");
            responseResult.cq5.status = "up";
            responseResult.cq5.start_time = service_result[2];
        }
        callback();
    });
}

function puppetstatus(callback, responseResult) {
    var puupet_command = exec('ps -ef | grep agent | grep -v /bin/sh | grep -v grep | awk \'{print $1"="$2"="$5}\'', function(error, stdout, stderr) {
        responseResult.puppet = {
            "status": "down",
            "start_time": ""
        }
        if (stdout) {
            var service_result = stdout.split("=");
            responseResult.puppet.status = "up";
            responseResult.puppet.start_time = service_result[2];
        }
        callback();
    });
}


function readPuppetDirectory(callback, responseResult) {
    responseResult.puppet.info = {};
    dir.readFiles("/home/devops/data", function(err, content, filename, next) {
            if (err) {
                console.log("error while reading the directory");
                return callback();
            };
            if (path.basename(filename) == "cq5-last-run.json") {
                responseResult.cq5.last_started_time = content;
            } else {
                responseResult.puppet.info[path.basename(filename)] = content;
            }
            next();
        },
        function(err, files) {
            if (err) {
                console.log("error while reading the directory");
				return callback();
            };
            callback();
        });

}

function jenkinJob_deploy_lastBuild(callback, responseResult) {
    responseResult.deploy_lastBuild = {
        status: "",
        error: ""
    };
    request({
        url: "http://localhost:8080/job/DEPLOY_LOCALHOST/lastBuild/api/json"
    }, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            responseResult.deploy_lastBuild.error = "Not able to pull the data from jenkin";
            return callback();            
        }
        var data = JSON.parse(response.body);
        responseResult.deploy_lastBuild.status = data;
        callback();
    })
}

function jenkinJob_gitwem_lastBuild(callback, responseResult) {
    responseResult.gitwem_lastBuild = {
        actions: "",
        error: ""
    };
    request({
        url: "http://localhost:8080/job/GIT_WEM/lastBuild/api/json"
    }, function(error, response, body) {
        if (error || response.statusCode !== 200) {
            responseResult.gitwem_lastBuild.error = "Not able to pull the data from jenkin";
            return callback();            
        }
        var data = JSON.parse(response.body);
        responseResult.gitwem_lastBuild.actions = data;
        callback();
    })
}


// prints output as JSON
function finish(response, responseResult) {
    response.writeHead(200, {
        "Content-Type": "application/json"
    });
    var json = JSON.stringify(responseResult);
    response.end(json);

}

// executes the callbacks one after another
function series(response) {
    var callbackSeries = [diskspace, jenkinstatus, cq5status, puppetstatus, readPuppetDirectory, jenkinJob_deploy_lastBuild, jenkinJob_gitwem_lastBuild];
    var responseResult = {};

    function next() {
        var callback = callbackSeries.shift();
        if (callback) {
            callback(next, responseResult);
        } else {
            finish(response, responseResult);
        }
    }
    next();
};

exports.status = function(request, response) {
    series(response);
}