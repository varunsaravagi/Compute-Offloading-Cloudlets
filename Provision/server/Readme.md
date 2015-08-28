##Description
This contains the necessary code and files required to provision the application
on the Cloudlet.
It contains a simple webserver written in NodeJs which would serve the files to the client.
The client-side JS functions would decide whether to run the application on the Cloudlet
or on the cloud.
If the application is to be run on the Cloudlet, the `cloth_server_compact.js` file is
sent to the Cloudlet and the client starts communicating with the server at the Cloudlet.
If the application is to be run on the client, the `js\cloth_server_browser.js` file is
loaded. This browser file is created using the `browserify` command.
