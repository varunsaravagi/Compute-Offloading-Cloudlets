This contains a single file which is responsible for running the Cloudlet server, accept files from the client and spawn worker processes to handle requests originating from each unique ip.
For each file obtained, it would store the file with a different name and then dynamically load it. When the socket connection is closed, that file is also deleted from the disk.
