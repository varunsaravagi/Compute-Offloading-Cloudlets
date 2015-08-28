This contains the main code which would be responsible for provisioning the application on the Cloudlet.
The library can be found in `js/glue.js`.

This library would detect a Cloudlet and if the connection is successfully established, transfer the necessary server side files to the Cloudlet and tell the client to start communicating with the Cloudlet from now on.
