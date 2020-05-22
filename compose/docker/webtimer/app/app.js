/* Node.JS

	 ____________________________________________________________
	|                                                            |
	|  SOFTWARE + WebTimer                                       |
	|  VERSIONE + 1.0                                            |
	|    ENGINE + Complic  { http://complic.eu }                 |
	|      DATE + 2020 Aprile 13                                 |
	|   CREDITS + Complic                                        |
	| COPYRIGHT + Copyright Complic 2020                         |
	|____________________________________________________________|

*/

var version = "1.0 - 20200413";
var port = process.env.WS_PORT;
const http = require('http');
const fs = require('fs');

var serverUrl = process.env.WB_SERVER;
var timeoutInMilliseconds = 10*1000;
var cookieAge = 60*60*24;
var currentDomain = 'localhost';
var timer;
var time = 0;
var totalTime = 0;

var server = http.createServer(function(request, response) {
  var postValue = [];
  let parsedData = "";
  request.on('data', function(data) {
    parsedData += data.toString();
  })
  request.on('end', () => {
    if (parsedData.length > 3) {
      var values = parsedData.split("&");
      for (var index in values) {
        if (values[index].length > 0) {
          var target = values[index].split("=");
          var keyName = target[0];
          postValue[keyName] = target[1];
        }
      }
    }
    console.log("# Pagina: "+ request.url);
    var urlParams = request.url.split("/");
    pageRequest(urlParams, postValue, request, response);
  });
});

function pageRequest(urlParams, postValue, request, response) {

  console.log(urlParams);

  if (urlParams[1] == "favicon.ico") {
    response.write("Ciao");
    response.end();
  } else if (urlParams[1] == "assets") {

    try {
      if (fs.existsSync('assets/'+ urlParams[2])) {
        fs.readFile('assets/'+ urlParams[2], function (err, data) {
          var fileData = data.toString('utf8');
          if (urlParams[2] == "style.css") {
          	response.writeHead(200, {'Content-Type': 'text/css','Content-Length': fileData.length});
          }
          response.write(fileData);
          response.end();
        });
      }
    } catch(err) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
    }

  } else if (urlParams[1] == "api") {

    //if (!checkAuth(postValue, request)) {

      if (urlParams[2] == "startserver") {

        time = parseInt(urlParams[3]);
        totalTime = parseInt(urlParams[3]); 
        serverTimer();

      } else if (urlParams[2] == "addTime") {

        time += parseInt(urlParams[3]);
        totalTime += parseInt(urlParams[3]); 

      } else if (urlParams[2] == "removeTime") {

        time -= parseInt(urlParams[3]);
        totalTime -= parseInt(urlParams[3]); 

      } else if (urlParams[2] == "start") {

        io.sockets.emit("starTimer", urlParams[3]);

      } else if (urlParams[2] == "stop") {

        time = 0;
        io.sockets.emit("stopTimer", "");

      }

      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write("ricevuto");
      response.end();

    //} else {
    //  response.writeHead(301, {"Location": "/login"});
    //  response.end();
    //}

  } else if (urlParams[1] == "login") {

    if (!checkAuth(postValue, request)) {
      fs.readFile('page/login.htm',function (err, data){
        var html = data.toString('utf8');
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(html);
        response.end();
      });
    } else {
      response.writeHead(301, {"Location": "/home"});
      response.end();
    }

  } else if (urlParams[1] == "logout") {

    // To Write a Cookie
    response.writeHead(200, {
      'Set-Cookie': 'login=deleted; Max-Age=1; Path=/; Domain='+ currentDomain +';',
      'Content-Type': 'text/plain'
    });
    fs.readFile('page/login.htm',function (err, data) {
        var html = data.toString('utf8');
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(html);
        response.end();
    });

  } else if (urlParams[1] == "home") {

    if (!checkAuth(postValue, request, response)) {
      response.writeHead(301, {"Location": "/logout"});
      response.end();
    } else {
      fs.readFile('page/home.htm',function (err, data) {
        var html = data.toString('utf8');

        console.log(html);

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(html);
        response.end();
      });
    }

  } else {
    response.writeHead(200, {'Content-Type': 'text/plain'});
  	response.write('Web Timer 1.0');
  	response.end();
  }

}

function serverTimer() {
	setTimeout(function () {
		console.log("timer: "+ time);
		time--;
		sendTime();
	}, 1000);
}

function sendTime() {
	io.sockets.emit("timeNow", totalTime, time);
	if (time >= 0) {
      serverTimer();
    }
}

function checkAuth(postValue, request, response = false) {
  if (postValue.hasOwnProperty('username') && postValue.hasOwnProperty('password')) {
    if (postValue['username'] == "paolo" && postValue['password'] == "12345" || postValue['username'] == "demo" && postValue['password'] == "demo") {
      if (response != false) {

        console.log("# set cookie");

        response.writeHead(200, {
          'Set-Cookie': 'login='+ postValue['username'] +'; Max-Age='+ cookieAge +'; Path=/; Domain='+ currentDomain +';',
          'Content-Type': 'text/plain'
        });
      }
      return true;
    } else {
      var cookies = parseCookies(request);
      if (cookies.lenght > 0) {
        if (cookies.hasOwnProperty('login')) {
          if (cookies["login"] == "paolo") {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/* Welcome Message */
console.log('************************************************');
console.log('WebTimer WebSocket '+ version +' listening on port '+ port);
console.log('************************************************');
server.listen(port, function() {});

var io = require('socket.io')(server);

//List of all users currently sharing their location (tracked users)
var trackedUsers = {}
//List of all users currently tracking someones location (tracking users)
var trackedUsersTrackers = {}

io.on('connection', function(clientSocket){

  console.log('a user connected');

});

function parseCookies (request) {
  var list = {};
  var rc = request.headers.cookie;

  console.log(rc);

  rc && rc.split(';').forEach(function( cookie ) {
      var parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}

/* end of app.js */
