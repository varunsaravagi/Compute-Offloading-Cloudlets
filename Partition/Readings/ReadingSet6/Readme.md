
This is the sixth set of readings obtained as part of the experiments.
This has readings for the following two cases:

1. Offloading to Cloudlet using Socket.io
2. Offloading to Amazon AWS (West)
2. No Offloading.

The following scenarios have been tested:

1. Increasing computation
2. Increasing data size (though this also increases the computation to some extent)
Since increasing the data size also increases the computation to some extent, the
readings for data case have been taken for three different physics accuracy.

- The method of calculation is same as ReadingSet5.
- The following files were used to run the node.js server:
-- cloth_server_diffser.js
-- index.js

- Calculations for offloading case were done on a 100Mbps private Wireless network.

Two servers had been used in this reading set.
Cloudlet server was set on open stack. Cloud server was on Amazon AWS
