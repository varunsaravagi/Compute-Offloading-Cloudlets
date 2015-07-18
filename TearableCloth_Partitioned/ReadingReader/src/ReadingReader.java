import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.sun.xml.internal.bind.v2.runtime.unmarshaller.XsiNilLoader.Array;

/**
 * 
 */

/**
 * @author vsaravag
 *
 */
public class ReadingReader {
	
	static String header = "Id, Socket Latency, Mobile Latency, Socket FPS, Mobile FPS\n";
	
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		String path = null;
		if(args.length == 0){
			path = ".";
		}
		else {
			path = args[0];
		}
		try {
			File dir = new File(path);
			for (File subDir : dir.listFiles()) {
				if(subDir.isDirectory())
					computeDir(subDir);	
			}
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}
	
	
	public static void computeDir(File dir) throws IOException{
		String[] reading = new String[5]; //id, Socket latency, Mobile latency, Socket FPS, Mobile FPS
		String dirName =  dir.getName();
		FileWriter out = new FileWriter(dirName);
		out.write(header);
		for (File file : dir.listFiles()){
			reading[0] = file.getName();
			Scanner scan = new Scanner(file);
			while(scan.hasNextLine()){
				String line = scan.nextLine();
				String[] contents = line.split(":");
				if(contents.length > 0){
					if(contents[0].equals("Socket")){
						reading[1] = computeReading(scan.nextLine());
						reading[3] = computeReading(scan.nextLine());
					}
					if(contents[0].equals("Mobile")){
						reading[2] = computeReading(scan.nextLine());
						reading[4] = computeReading(scan.nextLine());
					}
				}
			}
			scan.close();
			out.write(convertToString(Arrays.toString(reading)));
			out.write("\n");
		}
		out.close();
	}
	
	public static String computeReading(String line){
		String[] readings = line.split(":")[1].trim().split(",");
		double latency = 0.0;
		for (String reading : readings) {
			try{
				if(reading.equals("Infinity"))
					continue;
				double r = Double.parseDouble(reading);
				latency += r;
			} catch(Exception e){
				continue;
			}
		}
		latency = latency/readings.length;
		return String.format("%.2f", latency);
	}
	
	public static String convertToString(String readings){
		return readings.split("\\[")[1].split("\\]")[0];
	}
}
