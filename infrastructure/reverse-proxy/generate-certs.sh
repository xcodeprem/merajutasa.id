#!/bin/bash
# SSL Certificate Generation for MerajutASA.id Development Environment
# Generates self-signed certificates for local development and testing
# Production environments should use proper CA-signed certificates

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/ssl-certs"

# Create certificates directory
mkdir -p "${CERT_DIR}"
cd "${CERT_DIR}"

echo "🔐 Generating SSL certificates for MerajutASA.id..."

# Generate private key (RSA 4096-bit for stronger security)
openssl genrsa -out server.key 4096
chmod 600 server.key

# Create certificate configuration
cat > server.conf << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN=localhost
O=MerajutASA.id
OU=Governance Infrastructure
L=Jakarta
ST=Jakarta
C=ID
emailAddress=governance@merajutasa.id

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = merajutasa.local
DNS.3 = *.merajutasa.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate certificate signing request
openssl req -new -key server.key -out server.csr -config server.conf

# Generate self-signed certificate (valid for 1 year)
openssl x509 -req -in server.csr -signkey server.key -out server.crt -days 365 -extensions v3_req -extfile server.conf

# Generate PEM bundle for some applications
cat server.crt server.key > server.pem

# Set appropriate permissions
chmod 644 server.crt server.pem
chmod 600 server.key server.csr

# Verify certificate
echo "📋 Certificate Information:"
openssl x509 -in server.crt -text -noout | grep -E "(Subject:|DNS:|IP Address:|Not Before|Not After)"

echo "✅ SSL certificates generated successfully!"
echo "📁 Files created:"
echo "   - server.key (private key)"
echo "   - server.crt (certificate)"  
echo "   - server.pem (bundle)"
echo ""
echo "🚨 WARNING: These are self-signed certificates for development only!"
echo "   For production, use certificates from a trusted CA."
echo ""
echo "💡 To trust these certificates locally:"
echo "   - Add server.crt to your system's trusted certificate store"
echo "   - Or add 'merajutasa.local' to your /etc/hosts file"

# Clean up temporary files
rm -f server.csr server.conf

echo "🎉 Certificate generation complete!"