This is the server component for the Ethereal Plane Foundry Plugin

# Usage

### Preperation
1. Download the file for your operating system from the latest release
2. Download .env.example to the same folder as the executable
3. Rename .env.example to .env
4. Delete the section for any platform you are NOT using

### Twitch
1. Fill in your login name
2. Optionally the channel ID for which to run the bot
3. Finally, grab a token for that twitch user from [the TMI token generator](https://twitchapps.com/tmi/).
4. You're ready to go!

### Youtube

1. Create a Google Cloud Console project
2. Go to ``APIs & Services`` > ``Library``
3. Click ``Enable APIs and services`` 
4. Search for and turn on the ``YouTube Data API v3``
5. Go to ``APIs & Services`` > ``Credentials``
6. Click ``Create Credentials`` > ``OAuth client ID``
7. Select ``Desktop app`` as the Application Type, give it any name and click ``create``
8. Once created, copy and paste the ``Client ID`` and ``Client secret`` into the respective fields in .env

You can also set the Video ID of your Live-Stream if you know it ahead of time. Note that this is required for streams that are not public.

Finally, you can configure the client to Store the refresh token in the .env file. This way you stay logged in, however, it is not recommended for security reasons.

# Building

This repository uses xc for task definitions!
As such only deno and xc are required.

### Dependencies
| Project   | Version  |
|-----------|----------|
| deno.land | ^1.31.1  |
| xcfile.dev| ^0.0.159 | 

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

### tag
Inputs: MAJOR, MINOR, PATCH
```
echo Adding git tag with version $MAJOR.$MINOR.$PATCH
git tag $MAJOR.$MINOR.$PATCH
git push origin $MAJOR.$MINOR.$PATCH
```


