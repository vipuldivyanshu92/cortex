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

	private HashMap<String, byte[]> site = new HashMap<String, byte[]>();
	private HashMap<String, String> nodeData = new HashMap<String, String>();
	
	private ArrayList<String> log = new ArrayList<String>();
	private boolean logLock = false;
	private DateFormat logDateFormat = new SimpleDateFormat("HH:mm:ss");
	
	private boolean mqLock = false;
	private ArrayList<String> msgQueue = new ArrayList<String>();

	public boolean killSwitch = false;	
	
	public ResManager() {
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
	
	private synchronized void logLock() {
		while (logLock == true) {
			try {
				wait();
			} catch (Exception e) {
				error("logLock: " + e.toString());
			}
		}
		logLock = true;
		//javax.swing.JOptionPane.showMessageDialog(null, " Locked");
	}
	
	private synchronized void logUnlock() {
		logLock = false;
		//javax.swing.JOptionPane.showMessageDialog(null, " UnLocked");
	}
	
	public synchronized void log(String l) {
		logLock();
		Date d = new Date();
		log.add(logDateFormat.format(d) + ": " + l);
		logUnlock();
	}
	
	private synchronized void mqLock() {
		while(mqLock == true) {
			try { 
				wait();
			} catch (Exception e) {
				error("mqLock: " + e.toString());
			}
		}
		mqLock = true;
	}
	
	private synchronized void mqUnlock() {
		mqLock = false;
	}
	
	public synchronized void queueMsg(String m) {
		mqLock();
		msgQueue.add(m);
		mqUnlock();
	}
	
	public synchronized ArrayList<String> getMsgs() {
		mqLock();
		ArrayList<String> mq = msgQueue;
		msgQueue = new ArrayList<String>();
		mqUnlock();
		return mq;
	}
	
	
	public void alert(String a) {
		javax.swing.JOptionPane.showMessageDialog(null, a);
		log("ALERT> " + a);
	}
	
	public void error(String e) {
		javax.swing.JOptionPane.showMessageDialog(null, e);
		log("ERROR> " + e);
	}
	
	// returns the current log and RESETS it
	public synchronized ArrayList<String> getLog() 
	{
		logLock();
		ArrayList<String> tmp = log;
		log = new ArrayList<String>();
		logUnlock();
		return tmp;
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
	
	
	/*
	public synchronized void put(String key, String val) {
		//javax.swing.JOptionPane.showMessageDialog(null, "putting: '" + key + "'");
		//javax.swing.JOptionPane.showMessageDialog(null, val);
		//data.put(key, val);
	}
	
	public synchronized String get(String key) {
		//javax.swing.JOptionPane.showMessageDialog(null, "getting: '" + key + "'");
		//javax.swing.JOptionPane.showMessageDialog(null, "from: " + data.keySet().toString());
		
		//return data.get(key);
	}*/



}
