## Description
This repository contains work done as part of Summer fellowship during Summer 2015 at
Carnegie Mellon University under [Kiryong Ha](http://krha.kr/), Ph.D Student under [Prof. Mahadev Satyanarayanan](https://www.cs.cmu.edu/~satya/) and
[Padmanabhan Pillai](http://www.pittsburgh.intel-research.net/people/pillai/), a senior researcher at Intel Labs.

In this work, we have tried to analyze the feasibility of using Cloudlets to speed-up standalone
mobile based javascript applications. Cloudlet is a new architectural element that arises from the convergence of mobile computing and cloud computing. It is being actively researched upon by the research group under Prof. Satya. More information on cloudlet can be had from [Elijah](http://elijah.cs.cmu.edu/)

We took an already existing javascript application (which can be easily modified to increase both computation and data size) and split it to run in client and server mode. Both client and server are pure javascript based and attempt had been made to do minimal changes to the code base of the original application.

## Frameworks
[NodeJS](https://nodejs.org/) has been used to write the server side of the application. [Socket.io](http://socket.io/) has been used to communicate between the client and the server. More details on how exactly the application was partitioned can be had from the Partition folder.

## Directory Structure
* Partition: This directory contains the work and experiments done to split the application into client and server side.
* Provision: This directory contains the code to dynamically provision the application on the cloudlet or have it run purely on client side.
