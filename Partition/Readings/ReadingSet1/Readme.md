This is the first reading set obtained as part of the experiment.
It has readings for three different cases:

1. Offloading using Socket.io
2. Offloading using Binary.js
3. No offloading.

The readings have been taken for following scenarios:

1. Increasing computation
2. Increasing data size over network (this also increases computation to some extent)
3. Increasing both computation and data size

- The readings are instantaneous readings over a period of ~30s.
- The following files were used to run the node.js server:
-- cloth_server_buffer.js
-- cloth_server_binary.js
-- index.js
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

- The readings gave an initial idea of how the offloading would perform. However, 
the Socket and Binary libraries have jitters in their readings. Since the readings
shown are instantaneous, the jitters do not give any conclusive result.
