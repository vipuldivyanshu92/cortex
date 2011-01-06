import java.applet.*;
//import java.awt.*;
import java.awt.event.*;
import javax.swing.Timer;
import java.awt.image.*;
import java.net.InetSocketAddress;
import java.net.InetAddress;

import java.lang.*;
import java.io.*;
import java.net.*;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.Scanner;
import java.util.HashMap;
import javax.swing.JOptionPane.*;

import java.util.Enumeration;
import java.util.List;
import java.util.ArrayList;

class ConnHandler implements Runnable {
		Socket sock;
		ResManager res;
		
		final int TYPE_GET = 0;
		final int TYPE_POST = 1;
		
		public ConnHandler(Socket s, ResManager r) {
			sock = s;
			res = r;
		}
		
		/* parseAjax
		 * Ajax content is in form of 
		 * (key=value\n)*\n\n
		 * returns a string:string hashmap of key value pairs
		 */
		HashMap<String, String> parseAjax(BufferedReader sin) {
			HashMap<String, String> req = new HashMap<String, String>();	
			Scanner scan = new Scanner(sin);
			scan.useDelimiter("\n\n");
			String all = scan.next();
			req.put("req", all);		
			for ( String line : all.split("\n")) {
				String kv[] = line.split("=");
				req.put(kv[0], kv[1]);
			}
			return req;
		}
		
		String ajaxCall(String dest, BufferedReader sin) {
			Socket client = null;
			PrintWriter out = null;
			BufferedReader in = null;
			// Get Ajax call
			Scanner scan = new Scanner(sin);
			scan.useDelimiter("\n\n");
			String all = scan.next();	
			//res.log("Sending to " + dest + ": '" + all +"'");
			// clean up dest

			// Connect to dest
			try {
				//res.alert(dest);
				String[] d = dest.split(":");
				//res.alert(Integer.toString( d.length));
				String p = "2600";
				if (d.length > 1)
					p = d[1];
				client = new Socket(d[0], Integer.parseInt(p));
				//InetAddress addr = new InetSocketAddress("127.0.0.1");
				if (!client.isConnected()) 
					res.error("failed to connect!!!!!!!");
				
				out = new PrintWriter(client.getOutputStream(), true);
				in = new BufferedReader(new InputStreamReader(client.getInputStream()));
			} catch (Exception e) {
				res.log( "ERROR> Exception in ajaxCall (Connecting): " + e.toString());	
				return "";
			}
			//res.alert("Established connection");
			// HTTP / AJAX Header + call
			out.print("POST / HTTP/1.1\r\n" +
				"Host: " + dest + "\r\n" +
				"User-Agent: Cortex\r\n" +
				"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n" + 
				"Accept-Language: en-us,en;q=0.5\r\n"+
				"Accept-Encoding: gzip,deflate\r\n" + 
				"Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7\r\n" +
				"Keep-Alive: 300\r\n" + 
				"Connection: keep-alive\r\n" +
				"Content-Type: application/x-www-form-urlencoded; charset=UTF-8\r\n" + 
				"Referer: " + getIPAddress() + ":" + Integer.toString(res.PORT) + "/client.html\r\n" +
				"Content-Length: " + (all.length()+2) + "\r\n" +
				"Pragma: no-cache\r\n" + 
				"Cache-Control: no-cache\r\n" + 
					"\r\n");
			out.print(all + "\n\n");
			out.flush();
			//res.alert("SENT: " + all);
			//res.log("sent message");
			//out.close();
				
			//res.alert("printed request, trying to read");
			
			// Read response
			String resp = "";

			// read http header
			//res.log("Reading resp header");
			try {
				if (in.ready()) {
					String header = in.readLine();
					if (header.length() >= 3) {
						//res.log("header: " + header);
						header = in.readLine();
					}
				}
			} catch (Exception e) {
				res.error("Exception in ajaxCall (reading HTTP response header): " + e.toString());
				return "";
			}
			//res.log("Reading response body");
			//res.alert("done reading resp header");
			// read actual response
			scan = new Scanner(in);
			scan.useDelimiter("\n\n");
			resp = scan.next();	
			//res.alert("done reading resp");			
			//res.log("Closing ajaxCall");
			try {
				in.close();
				out.close();
				client.close();
			} catch (Exception e) {
				res.error( "Exception in ajaxCall (Closing Connection): " + e.toString());
			}
			//res.alert("closed connections");
			//res.log("ajaxCall returning response to js caller: '" + resp + "'");
			return resp;
		}
		
		// Function to enumerate all IP addresses of a computer 
		// and then try and select the web facing one
		private String getIPAddress() {
			ArrayList<String> ips = new ArrayList<String>();
			try {
				Enumeration e = NetworkInterface.getNetworkInterfaces();

				while(e.hasMoreElements()) {
					NetworkInterface ni = (NetworkInterface) e.nextElement();
					Enumeration e2 = ni.getInetAddresses();
					InetAddress ip=null;
					String istr = null;
					while (e2.hasMoreElements()){
						ip = (InetAddress) e2.nextElement();
						istr = ip.toString();
						if (istr.substring(0,1).equals("/")) 
							istr = istr.substring(1);
						if (istr.charAt(0) >= '0' && istr.charAt(0) <= '9' && istr.indexOf(':') == -1) {
							//res.log("adding: '" + istr +"'");
							ips.add(istr);
						}
							
						//ip = (InetAddress) e2.nextElement();
					}
					/*if (ip == null)
						continue;
					istr = ip.toString();
					if (istr.substring(0,1).equals("/"))
						istr = istr.substring(1);
					ips.add(istr);*/
				}		
			} catch (Exception e) {
					res.error( "Exception in ConnHandler.getIPAddress(): " + e.toString());
			}
			// Now we have a list of IPs associated with this machine. Lets pick the best one
			if (ips.size() == 0) 
				return "";
			else if (ips.size() == 1)
				return ips.get(0);
			else {
				ips.remove("127.0.0.1");
				/*for (int i=0; i< ips.size(); i++) {
					if(ips.size() ==1)
						break;
					
					String ip = ips.get(i);
					if (
				*/
				// Many IPs so weed out baddies
				for (int i=0; i < ips.size(); i++) {
					
					if (ips.size() == 1) 
						break;	
					
					String ip = ips.get(i);
					// remove local private subnets
					if(ip.substring(0, 7).equals("192.168")) {
						ips.remove(i);
						i--;
					} else if (ip.substring(0, 3).equals("10.")) {
						ips.remove(i);
						i--;
					}
				}
				
				return ips.get(0);
			}
				
		}
			
		
		/* handleAjax
		 * handle the various ajax commands appropriately
		 */
		private String handleAjax(HashMap<String, String> req) {
			String response = "";
			String cmd = req.get("cmd");
			//res.log("AJAX " + cmd);
			if (cmd.equals("ping")) {
				response = "pong";
				//res.log("PING pong");
			} else if (cmd.equals("greet")) {
				response = getIPAddress() + ":" + res.PORT + " " + res.getNodeData("originURL") ;
			} else if (cmd.equals("getLog")) {
				res.debug("getLog");
				ArrayList<String> l = res.getLog();
				if (l.size() == 0) {
					res.debug("logWait");
					res.logWait();
					l = res.getLog();
				}
				res.debug("process Log");
				response = "";
				for (int i = l.size()-1; i >= 0; i--) {
					response +=  l.get(i) + "\n";
				}
			//	response += " ";
			} else if (cmd.equals("reloadHTML")) {
				res.log("Reloading HTML from src...");
				res.reloadSite();
			} else if (cmd.equals("sendMsg")) {
				//res.log("sendMsg: query=" + req.get("query"));
				res.queueMsg(req.get("req"));	
				response = "received on " + res.PORT;
			} else if (cmd.equals("getMsgs")) {
				res.debug("getMsgs");
				ArrayList<String> mq = res.getMsgs();
				if (mq.size() == 0) {
					res.debug("mqWait");
					res.mqWait();
					mq = res.getMsgs();
				}
				res.debug("mq process");
				for(int i =0; i < mq.size(); i++) {
					response += mq.get(i) + "\n\n";
				}
				//res.log("getMsgs: '" + response + "'");
				//response = "";
			} else if (cmd.equals("kill")) {
				res.killSwitch = true;		
			} else {
				response = "Unknown cmd: " + cmd;
				res.log("Unknown cmd: " + cmd);
			}
			return response;
		}
					

		
		/* Handle GET requests
		 * A GET request is a generic browser request, 
		 *   meaning not an AJAX request, so we serve the main 
		 *   interface html file.
		 */
		private byte[] handleGet(String req) {
			//javax.swing.JOptionPane.showMessageDialog(null, "GET: " + req);
			int end = req.indexOf(' ');
			req = req.substring(1, end);
			//res.alert("'" + req + "'");
			if (req.equals("")) 
				req = "shell.html";
			byte[] r = res.getSite(req);
			if (r == null) {
				//javax.swing.JOptionPane.showMessageDialog(null, "Error: file not found: " + req);
				return new byte[0];
			} else
				return r;
		}
		
		/* run
		 *   Handle a HTTP connection
		 *   Read the HTTP request and handle accordingly
		 *   GET requests all get the main html file
		 *   AJAX requests are managed accordingly
		 */
		public void run() {
			/*try {
				Thread.currentThread().sleep(10000);
		 	} catch (Exception e) {
		 		res.alert("EXCEPTION : " + e.toString());
		 	}
			res.alert("Done waiting");*/
			try {
				// READ HTTP / AJAX call	
				BufferedReader sin = new BufferedReader(new InputStreamReader(sock.getInputStream()));	
				String header= "";
				
				int i = 0;
				int type = TYPE_POST;
				String reqLine = "";
				int contentLength = 0;
				
				header = sin.readLine();
				if (header == null) {
					// no header, not a valid HTTP conn
					res.log("Invalid connection");
					return;
				}
				String userAgent = "agent";
				while (header != null && header.length() >= 3) {
					if ( header.substring(0, 3).equals("GET")) {
						type = TYPE_GET;
						reqLine = header;
						
					} else if (header.length() > 4 && header.substring(0, 4).equals("POST")) {
						reqLine = header;
						reqLine = reqLine.substring(5);
						int end = reqLine.indexOf(' ');
						reqLine = reqLine.substring(0, end);
						if (reqLine.charAt(0) == '/')
							reqLine = reqLine.substring(1);
						
					} else if (header.length() > 14 && header.substring(0, 14).toLowerCase().equals("content-length")) {
						contentLength = Integer.parseInt(header.substring(16));			
					} else if (header.length() > 10 && header.substring(0, 10).equals("User-Agent")) {
					//javax.swing.JOptionPane.showMessageDialog(null, header);	
						userAgent = header;
						
					}
					//System.out.println(i + ": '" + header + "'");
					i++;
					header = sin.readLine();
				}
				//res.alert("Done reading header");
				
					
					
				// Figure out response
				String ajax_resp="";
				byte[] get_resp= null;
				String  CODE = "200 OK";
				int resp_length = 0;
				String content_type = "text/html";
				if (type == TYPE_GET) {
					reqLine = reqLine.substring(4);
					res.log("GET " + reqLine);
					get_resp = handleGet(reqLine);
					if (get_resp.length == 0) {
						CODE = "404 Not Found";
					}
					resp_length = get_resp.length;
					String end = reqLine.substring(reqLine.length()-4);
					if (end == ".js")
						content_type = "text/javascript";
					else if (end == "css")
						content_type= "text/css";
				} else {
					// No forward
					if (reqLine.equals("")) {
						//res.alert("no forward, parse ajax");
						HashMap<String, String> req = parseAjax(sin);
						//res.alert("handleAjax");
						ajax_resp = handleAjax(req);		
						//res.alert("ajax resp: " + ajax_resp);
					} else { // Forward request to node
						//res.log("AJAX forward to '" + reqLine + "'");
						
						ajax_resp = reqLine;		
						ajax_resp = ajaxCall(reqLine, sin);						
						 
					}
					resp_length = ajax_resp.length();
				}
				
				// HTTP Response
				PrintWriter sout = new PrintWriter(sock.getOutputStream(), true);		
				Date now = new java.util.Date();
				SimpleDateFormat formater = new SimpleDateFormat("E, d M y H:m:s z");		
				sout.print("HTTP/1.1 " + CODE + "\r\n"+
					"Date: " + 					formater.format(now) + "\r\n" +
					"Content-Type: " + content_type + "; charset=UTF-8\r\n" +
					"Server: Cortex @ " + Integer.toString(res.PORT) + "\r\n");

				// Print response
				
				sout.print("Content-Length: " + resp_length + "\r\n" +
					"\r\n");
				sout.flush();
				if (type == TYPE_GET) {
					//sout.write(get_resp);
					sock.getOutputStream().write(get_resp);	
				} else {
					sout.print(ajax_resp);
					//res.alert("ajax returning: " + ajax_resp);
				}
				sout.flush();
				sin.close();
				sout.close();
				sock.close();
			} catch (IOException e) {
				res.error( "IOException in ConnHandler.run(): " + e.toString());
				System.out.println("IOException in ConnHandler.run()");	
			}
			System.out.println("DONE run()");
		}
	
	}

