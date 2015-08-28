## Description
This is a small utility to obtain the final readings from the set of files. It needs as an input the path to the directory which contains the set of readings. As an output, it will create files (equal to the number of sub-directories) containing the final readings.

#### Directory Structure
The directory structure required is as follows:

Directory     
->-> Sub-Directory 1      
->->-> File 1     
->->-> File 2     
->->-> ...     
->-> Sub-Directory 2      
->->-> File 1     
->->-> File 2     
->->-> ...     
->-> Sub-Directory 3     
->->-> File 1     
->->-> File 2     
->->-> ...     

#### Input
Each file is of the given format:

Mobile:    
End-to-end Latency: 66.45,39.86,40.45,35.56,39.58,38.58,37.95,37.41,37.81,37.22    
FPS: Infinity,18.65,19.28,20.61,19.53,20.13,20.22,19.74,20.06,20.24    

Socket:    
End-to-end Latency: 54.63,54.35,51.68,49.51,47.40,50.38,53.27,49.49,52.50,52.07    
FPS: Infinity,19.99,20.77,21.95,22.49,21.64,19.78,21.75,20.41,20.82    

Socket (AWS):    
End-to-end Latency: 143.29,140.29,147.11,297.06,140.64,273.48,137.93,142.10,138.80,180.15    
FPS: Infinity,7.30,6.94,7.86,7.33,7.07,7.39,7.21,7.36,6.91    

#### Output
The final result file is a comma separated file created with the name of the Sub-Directory and is of the following format:    

Id, Cloudlet Latency, Mobile Latency, AWS Latency, Cloudlet FPS, Mobile FPS, AWS FPS    
P5_H80_W90, 51.53, 41.09, 174.08, 18.96, 17.85, 6.54    
P5_H120_W182, 114.46, 122.14, 232.24, 8.19, 6.33, 3.93    
P5_H260_W245, 309.41, 345.00, 1349.01, 2.94, 2.23, 0.65    
P5_H210_W244, 264.16, 297.12, 652.26, 3.47, 2.73, 1.39    
P5_H317_W260, 381.72, 438.66, 1278.81, 2.38, 1.80, 0.69    
P5_H150_W244, 186.84, 204.91, 571.71, 4.99, 3.84, 1.56    
