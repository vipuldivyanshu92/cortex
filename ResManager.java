import java.applet.*;
import java.util.HashMap;
import javax.swing.JOptionPane.*;
import java.util.ArrayList;
import java.util.Date;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import javax.swing.JOptionPane.*;
import java.lang.*;
import java.io.*;
import java.net.*;

class ResManager {
	public /*final*/ int PORT = 2600;
	private Applet applet;
	
	FileWriter debugFW = null;
	BufferedWriter debugOut = null;

	private HashMap<String, byte[]> site = new HashMap<String, byte[]>();
	private HashMap<String, String> nodeData = new HashMap<String, String>();
	
	// Internal Activity Log
	private ArrayList<String> log = new ArrayList<String>();
	//private boolean logLock = false;
	private DateFormat logDateFormat = new SimpleDateFormat("HH:mm:ss");
	
	// Message Queue
	//private boolean mqLock = false;
	private ArrayList<String> msgQueue = new ArrayList<String>();

	public boolean killSwitch = false;	
	
	public ResManager(Applet a) {
		applet = a;
	}
	
	public void putSite(String key, byte[] val) {
		site.put(key, val);
	}
	
	public byte[] getSite(String key) {
		return site.get(key);
	}
	
	public void putNodeData(String key, String val) {
		nodeData.put(key, val);
	}
	
	public String getNodeData(String key) {
		return nodeData.get(key);
	}
	
	public void log(String l) {
		synchronized (log) {
			Date d = new Date();
			log.add(logDateFormat.format(d) + ": " + l);
			log.notifyAll();
			if (debugOut != null) {
			try {
					debugOut.write(logDateFormat.format(d) + ": " + l + "\n");
					debugOut.flush();
				} catch (IOException e) {
					// Fail
				}
			}
		}
	}
	
	public void debug(String l) {
		synchronized (log) {
			Date d = new Date();
			try {
				debugOut.write(logDateFormat.format(d) + ": " + l + "\n");
				debugOut.flush();
			} catch (IOException e) {
				// Fail
			}
		}
	}
	
	public void logWait() {
		synchronized(log) {
			try {
				log.wait();
			} catch (Exception e) { }
		}
	}
	
	public void queueMsg(String m) {
		synchronized (msgQueue) {
			msgQueue.add(m);
			msgQueue.notifyAll();
		}
		//applet.repaint();
	}
	
	public void mqWait() {
		synchronized(msgQueue) {
			try {
				msgQueue.wait();
			} catch (Exception e) { }
		}
	}
	
	public ArrayList<String> getMsgs() {
		ArrayList<String> mq;
		synchronized(msgQueue) {
			mq = msgQueue;
			msgQueue = new ArrayList<String>();
		}
		//applet.repaint();
		return mq;
	}
	
	public int mqSize() {
		return msgQueue.size();
	}
	
	public void alert(String a) {
		javax.swing.JOptionPane.showMessageDialog(null, Integer.toString(PORT)  + ": " + a);
		log("ALERT> " + a);
	}
	
	public void error(String e) {
		javax.swing.JOptionPane.showMessageDialog(null, e);
		log("ERROR> " + e);
	}
	
	// returns the current log and RESETS it
	public ArrayList<String> getLog() 
	{
		synchronized(log) {
			ArrayList<String> tmp = log;
			log = new ArrayList<String>();
			return tmp;
		}
	}
	
	public void reloadSite() {
		String baseurl = getNodeData("originURL");
		try {
			putSite("Cortex.jar", readURL(new URL(baseurl + "Cortex.jar")));			
			putSite("Cortex.class", readURL(new URL(baseurl + "Cortex.jar")));
			putSite("client.html", readURL(new URL(baseurl + "client.html")));
			putSite("shell.html", readURL(new URL(baseurl + "shell.html")));
			putSite("ajax.js", readURL(new URL(baseurl + "ajax.js")));
			
			
			
		} catch (Exception e) {			
			error( "URL Exception in ResManager.reloadSite(): " + e.toString());
		}
	
	}
	
	private byte[] readURL(URL url) {
		byte[] buff=null;
		try {
			URLConnection urlConn = url.openConnection();
			urlConn.setDoInput(true); 
			urlConn.setUseCaches(false);
			DataInputStream dis = new DataInputStream(urlConn.getInputStream());
			int length = urlConn.getContentLength();
		
			buff = new byte[length];
			
			int totalRead = 0;
			
			while ( totalRead != length) {
				totalRead += dis.read(buff, totalRead, length-totalRead); //, 0, length);
				//alert(totalRead + "/" + length);
			}
			return buff;
		} catch (Exception e) {
			error( "Exception in ResManager.readURLIntoBuff(): " + e.toString());
			return null;
		}
		
	}

	public void openDebugLog(String ip) {
		String fname = "cortex." + ip + ":" + Integer.toString(PORT) + ".log";
		//FileWriter debugFileW = new FileWriter("/tmp/" + fname);
		try {
			debugFW = new FileWriter("/tmp/" + fname);
	        	debugOut = new BufferedWriter(debugFW);
	        } catch (IOException e) {
	        	debugFW = null;
	        	debugOut = null;
	        	error("Failed to open debug log");
	        }
	}	

}
