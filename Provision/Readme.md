## Description
This contains the code necessary to provision the application on the Cloudlet or run purely on the client.

*`CloudletFolder`: The folder contains the code to be run on the Cloudlet machine.
*`server`: The folder contains the code to be run on the web-server. This also contains the library which we have written to detect the cloudlet and provision the application to run on the Cloudlet.

## Usage
* Download this whole folder and copy each folder to its corresponding machine, i.e. the Cloudlet folder should go in the cloudlet machine and the server folder should go in the machine where the web-server is to be run.
* Install `nodejs` on each of the machines.
* `cd` into the folder on each machine and install the node dependencies using `npm install`.
* Execute the following command from inside the cloudlet folder in the Cloudlet machine
`node cloudletServerSticky.js`.
This would run the cloudlet server on port 1235 and it is ready to receive the files from the client.
* Modify the `index_compact.html` file in the server machine. Provide the ip address where the cloudlet server is running.
* Execute the following command from inside the server folder in the server machine
`node-dev webServer.js`
* Open your browser and run the web server.

## Behavior
If the cloudlet server is up and running, the client would transfer the server-side files to the cloudlet and start communicating with the cloudlet. If the cloudlet is not running, the client would run the file `js/cloth_server_browser.js`. This file is auto-generated using the following command:
`browserify cloth_server_compact.js > cloth_server_compact.js`
This file should not be changed. Any changes should be done on the `cloth_server_compact.js` file and browser side file should be generated.
