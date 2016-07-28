/* app.js */

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var sockAndroid, sockPi;

app.use(express.static('static/js'));
app.use(express.static('static/css'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function(req, res) {
  res.sendFile( __dirname + "/static/html/index.html" );
});

app.post('/', function (req, res) {
  console.log(req.body.asdf);
  res.send(req.body.asdf);
  if(sockPi){
    sockPi.emit('response', "received : "+req.body.asdf);
  }
});

var messageHandler = function(msg){
  console.log('message: ' + msg);

  sockAndroid.emit('response', "received : "+msg);
  sockPi.emit('response', "received : "+msg);
}

var connectionHandler = function(socket){

  console.log('user connected');
  var userID = '';
  //broadcast state to all
  io.emit('connection-state', "on");

  socket.on('register', function (data) {
      userID = JSON.parse(data).userID;
      if(userID === 'android'){
        sockAndroid = socket;
        sockAndroid.emit('response',"welcome, "+userID);
      }
      else if(userID === 'raspberry'){
        sockPi = socket;
        sockPi.emit('response',"welcome, "+userID);
      }

  });

  socket.on('disconnect', function(){
      socket.leave(userID);
      console.log('user disconnected');
  });

  socket.on('android-message', messageHandler);
}

io.on('connection', connectionHandler);

/* for handling the process exit */
//process.stdin.resume();//so the program will not close instantly
function exitHandler(options, err) {
    if (options.cleanup) {
		io.emit('connection-state', "off");
		console.log('clean');
	}
    if (err) {
		io.emit('connection-state', "off");
		console.log(err.stack);
	}
    if (options.exit) {
		io.emit('connection-state', "off");
		process.exit();
	}
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

/* exit handler ends */

http.listen(8090, function(){
  console.log('listening on *:8090');
});
