# Integrate Bosch Indego in Loxone

## USE AT YOUR OWN RISK

## Requirements
- nodejs
- Bosch Indego Controller

## Installation
```sh
npm install
```

Compile the iot-device-bosch-indego-controller by yourself or use a precompiled one.

Source: https://github.com/zazaz-de/iot-device-bosch-indego-controller 
Precompiled: https://cloud.zazaz.de/zazaz-export/dev/api/indego/

Place the compiled iot-device-bosch-indego-controller to executable to that you afterwards 
have the following structure:

```
executable/
├── bin
└── repo
    ├── com
    ├── commons-cli
    ├── commons-codec
    ├── commons-logging
    ├── de
    └── org
```

lox2indego expects to use executable/bin/IndegoController for querying the state / execute
commands.

## Configuration
Have a look at config/default.json

## Start with
```sh
nodejs lox2indego.js
```

Have a look at "pm2" for starting / stopping lox2indego. See:
http://pm2.keymetrics.io/

## HTTP Server
nodejs will start a HTTP server running on 8081 (per default)
For receiving data, start a browser and access
 - http://[ip-address]/status

## Send commands

http://[ip-address]/command?action=[action]

[action] is one of "mow", "return" or "pause"

## Loxone Configuration
![Loxone config](/doc/config.png)

![Virtual Output](/doc/config2.png)

![Virtual Output Command](/doc/config3.png)


## Issues
Currently it's only possible to run one transaction (query status, mow, return, pause). In case 
there is already a transcation up, the second transaction will fail. 

## Thanks
Thanks to zazaz-de for https://github.com/zazaz-de/iot-device-bosch-indego-controller 

## USE AT YOUR OWN RISK

# Copyright

Copyright(c) 2017 Bernhard Suttner / https://bernhard-suttner.de

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
