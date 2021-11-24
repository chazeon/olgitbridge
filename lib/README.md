These is a modified socket.io-client and xmlhttprequest
( based on "https://github.com/overleaf/socket.io/archive/0.9.19-overleaf-5.tar.gz" )
to be able to make a socket.io connection with Overleaf CE 3.0.1 passing the session ID Cookie.

Newer socket.io versions have a different handshake it seems.

Also xmlhttprequest needed to be modified to accept the custom cookie header.
Newer versions have a call for this, but older socket.io needs an older xmlhttprequest
version that needed to be acted.
