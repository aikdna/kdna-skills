#!/usr/bin/env node
// This npm coordinate is retired. The only behavior this bin may ever have is
// to print the approved retirement notice and exit non-zero: it never reads
// inputs, files, stdin, or the network.
const RETIREMENT = "This npm coordinate is retired. The current KDNA MCP server is delivered from the Git channel aikdna/kdna-skills and is not published to npm. The supported stable npm surface is the five stable packages (Core, Read, CLI, Studio Core, Studio CLI). This coordinate is not an install path and is not a sixth stable package.";
process.stderr.write(RETIREMENT + "\n");
process.exitCode = 1;
