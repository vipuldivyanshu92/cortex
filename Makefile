Cortex.jar: Cortex.class ConnHandler.class ResManager.class
	jar cvf Cortex.jar Cortex.class Server.class ConnHandler.class ResManager.class
	jarsigner Cortex.jar cortex_cert 

ResManager.class: ResManager.java
	javac ResManager.java

ConnHandler.class: ConnHandler.java
	javac ConnHandler.java

Server.class: Server.java
	javac Server.java

Cortex.class: Cortex.java
	javac Cortex.java
	
clean:	
	rm -f *.class *.jar
