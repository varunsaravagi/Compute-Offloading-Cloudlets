This is the second reading set obtained as part of the experiments.
It contains readings for the following two cases:

1. Offloading using Socket.io
2. No offloading.

The following scenarios are tested:

1. Increasing computation
2. Increasing data size (this also increases computation to some extent)
3. Increasing both computation and data size.

- The code uses a different serialization mechanism as compared to Reading Set 1.
The following files were used to run the node.js server:
-- cloth_server_diffser.js
-- index.js
- Each file has ~10 readings for each of Latency and FPS. Each reading is an average
obtained over an interval of 6 seconds.
- There are two set of readings for Socket in the files.
-- The first set is the readings obtained while calculating the latency and fps on the 
client side. The readings had jitters in them.
-- The second set is the readings obtained while calculating the latency and fps on the 
server side. The readings did not have any jitters in them.

- Calculations were done on a 10Mbps Wireless network. Server had the following configuration:

Architecture:          x86_64    
CPU op-mode(s):        32-bit, 64-bit          
Byte Order:            Little Endian    
CPU(s):                4    
On-line CPU(s) list:   0-3    
Thread(s) per core:    1    
Core(s) per socket:    4    
Socket(s):             1    
NUMA node(s):          1    
Vendor ID:             GenuineIntel    
CPU family:            6    
Model:                 23    
Stepping:              6    
CPU MHz:               2992.354    
BogoMIPS:              5984.70    
Virtualization:        VT-x    
L1d cache:             32K    
L1i cache:             32K    
L2 cache:              6144K    
NUMA node0 CPU(s):     0-3    

System Memory:	       3886MiB    
OS:    		       Ubuntu 14,04.2 LTS    
