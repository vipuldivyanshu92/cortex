#!/bin/sh

# 5 years should be good
VALIDITY=1825
echo "Deleting old cortex_cert..."
keytool -delete -alias cortex_cert
echo "Generating new cortex_cert"
keytool -genkey -alias cortex_cert -validity $VALIDITY
