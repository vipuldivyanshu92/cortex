import java.applet.*;
import java.awt.*;
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

	private Server server;	
	private ResManager res = new ResManager(this);
	
	public void update(Graphics g)
        {
                paint(g);
        }


	public void paint(Graphics g) {
		Dimension size = getSize();
		g.setColor(Color.black);
		g.fillRect(0, 0, (int) size.getWidth(), (int) size.getHeight());
		
		g.setColor(new Color(223, 200, 255));
		g.drawString("Cortex Server",8,12);
		
		if(!res.killSwitch) {
			g.setColor(new Color(40, 255, 80));
			g.drawString("Online on port",2, 28);
			g.drawString(Integer.toString(res.PORT), 35, 42);
			/*if (res.mqSize() > 0) {
				g.setColor(Color.green);
				g.drawString(".", 80, 42);
			} else {
				g.setColor(Color.red);
				g.drawString(".", 80, 42);
			}*/
		} else {
			g.setColor(Color.red);
			g.drawString("Offline", 25,28);
		}
	}

	
	
	/* main
	 * Main HTTP server.  Accepts connections on PORT and passes them to threads 
	 *   in the form of ConnHandlers to deal with
	 */
	public void init() {
		//server = 
		new Thread(new Server(res, getCodeBase().toString(), this)).start();	
		
		// be reasonably sure we've secured a valid port
		try {
			Thread.sleep(100);
		} catch (Exception e) { /* meh */ }
		repaint();
		
		// HANDLE QUIT?

 	}
}
