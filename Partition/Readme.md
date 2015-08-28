This directory contains several files created as part of experiments to run the original Tearable Cloth application ([GitHub](https://github.com/suffick), [CodePen](http://codepen.io/suffick)) in client-server mode. Each file contains the description of what it does in its beginning. 
The final file is `cloth_server_compact.js`

##Frameworks used

* In order to run the javascript on server, NodeJs was used. 
* Socket.io, BinaryJS and WebSockets were used to communicate between client and server. Final settlement was done on Socket.io

##Usage
To test the application, follow these steps:

* Download the necessary server, client and css files.
* Install `nodejs` for your machine
* 'cd' in the folder where the source code is downloaded and run `npm install`. This would install the necessary node modules.
* Run `node-dev <server file name>` from the terminal. This will run a server on `localhost:1234`
* Open the url in the browser. The application should be running.
