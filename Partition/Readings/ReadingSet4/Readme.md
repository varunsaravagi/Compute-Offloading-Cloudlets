
This is the fourth set of readings obtained as part of the experiments.
This has readings for the following two cases:

1. Offloading using Socket.io
2. No Offloading.

The following scenarios have been tested:

1. Increasing computation
2. Increasing data size (though this also increases the computation to some extent)
3. Increasing data and computation

- The method of calculation has been changed from ReadingSet 3.
-- The readings in offloading case had jitters in many cases. It was noticed that jitters
happened when the parameters were changed using the dialog box provided on the web-page.
Specifically, this started to happen after the parameters were changed two times. To counter this,
the parameters were specified exclusively on the html source and then the page was reloaded for 
every reading.
- Some weird behavior was noticed on the readings in the No Offloading case. Specifically, if the 
page was reloaded for every reading (as in offloading case), high readings were reported for the initial
few seconds before it became normalized. This didn't happen if the parameters were set using the dialog
provided on the web-page. The readings were obtained using the dialog provided on web-page.
- The latency and fps calculations for the offloading case have been done on the client side.
- The following files were used to run the node.js server:
-- cloth_server_diffser.js
-- index.js

- Calculations were done on a 100Mbps private Wireless network. Server had the following configuration:

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
