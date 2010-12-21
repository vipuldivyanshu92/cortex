import java.applet.*;
//import java.awt.*;
import java.awt.event.*;
import javax.swing.Timer;
import java.awt.image.*;

import java.lang.*;
import java.io.*;
import java.net.*;
import java.util.Date;
import java.text.SimpleDateFormat;

import java.util.HashMap;

import java.util.List;

import javax.swing.JOptionPane.*;


public class Cortex extends Applet {
	//private final int PORT = 2600; // in ResManager now
	private ServerSocket server;
	
	private ResManager res = new ResManager();
	
	
	/*URL getCodeBase() throws Exception {
			return new URL("file:///home/dan/src/school/cpsc416/cortex/");
	}*/
	
	/* main
	 * Main HTTP server.  Accepts connections on PORT and passes them to threads 
	 *   in the form of ConnHandlers to deal with
	 */
	public void init() {
		//javax.swing.JOptionPane.showMessageDialog(null, "APPLET STARTING!!!!");
		//res.alert("Starting...");
		res.putNodeData("originURL", getCodeBase().toString());
		res.reloadSite();
		
		//res.alert("Loaded site");
		
		boolean bound = false;
		while(!bound)
		{
			try {
				server = new ServerSocket(res.PORT);
				bound = true;
			} catch (IOException e) {
				res.PORT++;
			}
		}
		
		
		/*
		try {
			server = new ServerSocket(res.PORT);	
		} catch (IOException e) {
			res.error( "It appears another Cortex Node is already running on this computer, making this one superfulous.\nShutting down..."); 
		}*/
		
		/*try {
			JSObject win = JSObject.getWindow(this);
			win.eval("load();");
		} catch(Exception e) {
			res.error(e.toString());
		}*/
		
		try {
			//res.alert("running server");
			while (!res.killSwitch) {		
				Socket sock = server.accept();
				//res.alert("ACCEPTED!");
				
				new Thread(new ConnHandler(sock, res)).start();		
				
				//handler.run();
				//res.alert("RESTARTING LOOP");
			}
			server.close();
		} catch (IOException e) {
			System.out.println("IOException in init(): " + e.toString());
			res.error( "IOException in init(): " + e.toString());
		}

		//res.error("QUITING!");
 	}
}
