import java.applet.*;
//import java.awt.*;
import java.awt.event.*;
import javax.swing.Timer;
import java.awt.image.*;

import java.lang.*;
import java.io.*;
import java.net.*;

class Server implements Runnable {

	private ServerSocket server;
	
	private ResManager res;
	private Applet applet;

	public Server(ResManager r, String codeBase, Applet a) {
		applet = a;
		res = r;
		res.putNodeData("originURL", codeBase);
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
		applet.repaint();
		res.openDebugLog("me");
	}
	
	
	public void run() {			
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

		applet.repaint();

	}
}
