This is the server component for the Ethereal Plane Foundry Plugin

# Building

This repository uses xc for task definitions!
As such only deno and xc are required.

### Dependencies
| Project   | Version  |
|-----------|----------|
| deno.land | ^1.31.1  |

## Tasks

### run
```
deno run --allow-net --allow-env --allow-read=.env --allow-write=.env ./src/server.ts 
```

### build:linux
```
deno compile --allow-net --allow-env --allow-read=.env --allow-write=.env --target x86_64-unknown-linux-gnu --output server-linux ./src/server.ts 
```
### build:windows
```
deno compile --allow-net --allow-env --allow-read=.env --allow-write=.env --target x86_64-pc-windows-msvc --output server.exe ./src/server.ts 
```

### build:macos86
``` 
deno compile --allow-net --allow-env --allow-read=.env --allow-write=.env --target x86_64-apple-darwin  --output server-macos-x86 ./src/server.ts  
```

### build:macos
```
deno compile --allow-net --allow-env --allow-read=.env --allow-write=.env --target aarch64-apple-darwin --output server-macos-aarch64 ./src/server.ts 
```


