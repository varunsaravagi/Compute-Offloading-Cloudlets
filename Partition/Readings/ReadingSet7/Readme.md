
This is the final set of readings obtained as part of the experiments.
This has readings for the following cases:

1. Offloading to Cloudlet using Socket.io
2. Offloading to Cloud
2. No Offloading.

The following scenarios have been tested:

1. Increasing computation
2. Increasing data size
Since increasing data size also increases computation to some extent, the readings
for data case were taken for three different physics accuracy.

- The method of calculation is same as ReadingSet6.

- The following files were used to run the node.js server:
-- cloth_server_compact.js
-- index.js

- Calculations were done on a 100Mbps private Wireless network.
Two servers had been used in this reading set.

Cloudlet Server had the following configuration:

Architecture:          x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                4
On-line CPU(s) list:   0-3
Thread(s) per core:    2
Core(s) per socket:    2
Socket(s):             1
NUMA node(s):          1
Vendor ID:             GenuineIntel
CPU family:            6
Model:                 69
Model name:            Intel(R) Core(TM) i5-4300U CPU @ 1.90GHz
Stepping:              1
CPU MHz:               2800.878
CPU max MHz:           2900.0000
CPU min MHz:           800.0000
BogoMIPS:              4988.25
Virtualization:        VT-x
L1d cache:             32K
L1i cache:             32K
L2 cache:              256K
L3 cache:              3072K
NUMA node0 CPU(s):     0-3

System Memory:	       7629 MiB
OS:    		       Ubuntu 14,04.2 LTS
