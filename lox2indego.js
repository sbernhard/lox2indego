const http = require('http');
const express = require('express');
const basicAuth = require('basic-auth-connect');
const config = require('config');
const childProcess = require('child_process');
const sleep = require('system-sleep');

// initialize the app
const app = express();

var app_locked = false;

// the last indego state
var current_state_date = 0;
var mode_code = 0;
var mode_msg = '';
var error = 0;
var completed = 0;
var mow_mode = 0;
var runtime_total_operate = 0;
var runtime_total_charge = 0;
var runtime_session_operate = 0;
var runtime_session_charge = 0;
var last_command_error = 0;

// set authentication
app.use(basicAuth(config.get('httpServer.username'), config.get('httpServer.password')));

// run a command with the indego controller binary
function run_command(option, resp) {
  var result = true;
  var retval = '';
  var command = '';
  var subcommand = '';

  switch (option) {
    case 'query':
      command = "-q";
      break;

    case 'mow':
      command = "-c";
      subcommand = "MOW";
      break;

    case 'pause':
      command = "-c";
      subcommand = "PAUSE";
      break;

    case 'return':
      command = "-c";
      subcommand = "RETURN";
      break;

    default:
      console.log("Error: \""+ option +"\" is invalid");
      break;
  }

  // error handling
  if (command == '') {
    var data = '';

    result = false;
    console.log("Error occurd!");
    data = { "retval": retval, "result": result };
    resp(data);

    return false;
  }

	// call indego app
	var child = childProcess.spawn(config.get('lox2indego.executable'), [
		"--username",
		config.get('indego.username'),
		"--password",
		config.get('indego.password'),
    command,
    subcommand 
	]);

	// put stdout to result
	child.stdout.on('data', function(data) {
		retval += data;
	})

	// put stderr to result
	child.stderr.on('data', function(data) {
    result = false;
		console.log("stderr: "+ data);
	})

	// error handling
	child.on('error', (err) => {
		msg = 'Failed to start child process.';
    result = false;
		console.log(msg);
	});

	// action which should happen on close
	child.on('close', function(code) {
    var data = { "retval": retval, "result": result };
		console.log(`child process exited with code ${code}`);

    if ((code != "0") || (retval == '')) {
      result = false;
    }

    resp(data);
	});
}

// generate the output line for the indego state
function generate_state_line(param, value) {
  return param +":\""+ value + "\"\n";
}

// handle the /status request
app.get('/status', function(request, response) {
  var data = '';

  console.log("Returning latest indego status.");
  data += generate_state_line("current_state_date", current_state_date);
  data += generate_state_line("mode_code", mode_code);
  data += generate_state_line("mode_msg", mode_msg);
  data += generate_state_line("error", error);
  data += generate_state_line("completed", completed);
  data += generate_state_line("mow_mode", mow_mode);
  data += generate_state_line("runtime_total_operate", runtime_total_operate);
  data += generate_state_line("runtime_total_charge", runtime_total_charge);
  data += generate_state_line("runtime_session_operate", runtime_total_operate);
  data += generate_state_line("runtime_session_charge", runtime_total_charge);
  data += generate_state_line("last_command_error", last_command_error);

	response.send(data)
});

// handle the /command request
app.get('/command', function(request, response) {
	var action = request.query.action;

  console.log("Running command \""+ action +"\"");
  last_command_error = 0;

  // return error if app is already used
  if (app_locked == true) {
    response.send("failed");
    console.log("App is locked. Could not run indego command \""+ action +"\"");
    last_command_error = 1;
    return false;
  }

  // lock the app
  app_locked = true;

  // run the command now...
  run_command(action, function(data) {

    // unlock the app
    app_locked = false;

    // query the state immediately afterwards
    setTimeout(function() {
      query_state();
    }, 30*1000);

    // send response
    if (data['result'] == true) {
      if (data["retval"].includes("Command sent successfully")) {
        response.send("success");
      } else {
        last_command_error = 1;
        response.send("failed");
      }
    } else {
      console.log("Something went wrong while running indego command \""+ action +"\"");
      last_command_error = 1;
      response.send("failed");
    }
  });
});

// query status
function query_state() {
  console.log("Starting to query status");

  // return error if app is already used
  if (app_locked == true) {
    console.log("App is locked. Could not query indego state!");
    return false;
  }

  // lock the app
  app_locked = true;

  // run the command now...
  run_command("query", function(data) {

    // unlock the app
    app_locked = false;

    // send response
    if (data['result'] == true) {
      var regex, match;

      current_state_date = new Date();

      regex = /Mode: DeviceStatus \[code=([0-9]*), message=([a-zA-z0-9\s]*)\]/ 
      match = data["retval"].match(regex);
      if (match) {
        mode_code = match[1];
        mode_msg = match[2];
      }

      regex = /Error: ([0-9]*)/ 
      match = data["retval"].match(regex);
      if (match) {
        error = match[1];
      }

      regex = /Completed: ([0-9]*) %/ 
      match = data["retval"].match(regex);
      if (match) {
        completed = match[1];
      }

      regex = /Mow mode: ([0-9]*)/ 
      match = data["retval"].match(regex);
      if (match) {
        mow_mode = match[1];
      }

      regex = /Runtime total \/ operate: ([0-9]*\.[0-9]* h)/ 
      match = data["retval"].match(regex);
      if (match) {
        runtime_total_operate = match[1];
      }

      regex = /Runtime total \/ charge: ([0-9]*\.[0-9]* h)/ 
      match = data["retval"].match(regex);
      if (match) {
        runtime_total_charge = match[1];
      }

      regex = /Runtime session \/ operate: ([0-9]*\.[0-9]* h)/ 
      match = data["retval"].match(regex);
      if (match) {
        runtime_session_operate = match[1];
      }

      regex = /Runtime session \/ charge: ([0-9]*\.[0-9]* h)/ 
      match = data["retval"].match(regex);
      if (match) {
        runtime_session_charge = match[1];
      }

      console.log("Indege state for "+ current_state_date);
      console.log("Mode code "+ mode_code +" and msg "+ mode_msg);
      console.log("Error "+ error);
      console.log("Completed "+ completed);
      console.log("Mow mode "+ mow_mode);
      console.log("Runtime total / operate "+ runtime_total_operate);
      console.log("Runtime total / charge "+ runtime_total_charge);
      console.log("Runtime session / operate "+ runtime_session_operate);
      console.log("Runtime session / charge "+ runtime_session_charge);

    } else {
      console.log("Something went wrong while collecting indego status.");
    }
  });
}

setInterval(function() {
  query_state();
}, config.get('lox2indego.interval')*1000);

// HTTP listen
console.log("Starting HTTP server listening on "+ config.get('httpServer.port'));
http.createServer(app).listen(config.get('httpServer.port'), '0.0.0.0');

// vim: ts=2 sw=2 sts=2 et
