# olgitbridge

A hack that allows you to pull and push changes via git on an Overleaf Community Edition (CE) or Pro server.

This gitbridge uses the web API of Overleaf to down- and upsync changes. This means it does not need to run on the same server as Overleaf. In fact it is recommended to run it on another so it can directly use https port 443.

Note that contrary to the cloud version this bridge does not use realtime change operations, any files changed by git will result in a "this file has been changed externally" interruption in the online editor.

## Getting started



