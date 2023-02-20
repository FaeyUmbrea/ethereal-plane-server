import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { router } from "https://deno.land/x/rutt@0.0.14/mod.ts";
import { load } from "https://deno.land/std@0.177.0/dotenv/mod.ts";
import { TwitchChat, Channel } from "https://deno.land/x/tmi_beta@v0.1.4/mod.ts";
import { YouTube } from './youtube.ts';
import { Poll } from "./polls.ts";

const env = await load();


const io = new Server({ cors: { allowedHeaders: "*" } });

const polls = new Map<number,Poll>();

let twitchHanlders: ((user: string,message:string) => void|Promise<void>)[] = [];

let twitchChat: Channel | undefined;
if (env["TWITCH_CHANNEL"] && env["TWITCH_TOKEN"]) {
    /*twitchChat = new tmi.Client({
      channels: [env["TWITCH_CHANNEL"]],
      identity: {
        username: env["TWITCH_CHANNEL"],
        password: env["TWITCH_TOKEN"]
      }
    })
    twitchChat.connect();*/
    const client = new TwitchChat(env["TWITCH_TOKEN"])
    await client.connect();

    twitchChat = client.join(env["TWITCH_CHANNEL"], env["TWITCH_CHANNEL"]);
    twitchChat.listener("privmsg",(msg)=>{
        twitchHanlders.forEach((handler) => handler(msg.username,msg.message));
    })
    console.log("Twitch chat loaded!")
}

let youtubeChat: YouTube;
if (env["YOUTUBE_CLIENT_ID"]) {
    youtubeChat = new YouTube(env);
    if (!env["YOUTUBE_REFRESH_TOKEN"]) {
        console.log((await youtubeChat.getAuthURL()));
    }
    else {
        youtubeChat = new YouTube(env)
        youtubeChat.authenticate(env["YOUTUBE_REFRESH_TOKEN"])
        const liveChatID = await getLivechatIDfromVideoID(env["YOUTUBE_VIDEO_ID"])
        youtubeChat.setLiveChatId(liveChatID);
        console.log("Youtube chat loaded!")
    }
}

io.on("connection", (socket) => {
    socket.on("message", (message) => {
        if (twitchChat) {
            twitchChat.send(message);
        }
        if (youtubeChat) {
            youtubeChat.send(message);
        }
    })
    socket.on("createPoll", (options,time,id) => {
        const poll = new Poll(options);
        polls.set(id,poll);
        if(twitchChat){
            twitchHanlders.push(poll.processChat);
        }
        if(youtubeChat){
            youtubeChat.addMessageHandler(poll.processChat);
        }
        setTimeout(()=>{
            if(twitchChat){
                twitchHanlders = twitchHanlders.filter((e) => e != poll.processChat)
            }
            if(youtubeChat){
                youtubeChat.removeMessageHanlder(poll.processChat)
            }
            socket.emit("poll",poll.tally(),id)
        },time)
        poll.changeCallback = ()=>{
            socket.emit("poll",poll.tally(),id);
        }
    })
    socket.on("getPoll",(id)=>{
        const poll = polls.get(id);
        if(poll)
        socket.emit("poll",poll.tally(),id);
    })
    socket.on("startChat",()=>{
        if(youtubeChat){
            youtubeChat.addMessageHandler(messageProcess);
        }
        if(twitchChat){
            twitchHanlders.push(messageProcess);
        }
    })
    socket.on("stopChat",()=>{
        if(youtubeChat){
            youtubeChat.removeMessageHanlder(messageProcess);
        }
        if(twitchChat){
            twitchHanlders = twitchHanlders.filter((e) => e != messageProcess)
        }
    })
});

function messageProcess(user:string,message:string){
    io.emit("chatMessageRecieved",user,message)
}

const routeHandler = router({
    "/youtube/oauthcallback": async (req) => {
        await youtubeChat.code(req.url);
        if(env["YOUTUBE_STORE_REFRESH_TOKEN"] && youtubeChat.getRefreshToken() != ""){
            const text = await Deno.readTextFile("./.env");
            const newText = text.replace(/^.*YOUTUBE_REFRESH_TOKEN=*$/mg, "")+ `\nYOUTUBE_REFRESH_TOKEN=${youtubeChat.getRefreshToken()}`;
            Deno.writeTextFile("./.env",newText);
        }
        const liveChatID = await getLivechatIDfromVideoID(env["YOUTUBE_VIDEO_ID"])
        youtubeChat.setLiveChatId(liveChatID);
        console.log("Youtube chat loaded!")
        return new Response("You can now close this tab", { status: 200 });
    }
})

await serve(io.handler(routeHandler), {
    port: 3000
})

async function getLivechatIDfromVideoID(videoID: string) {
    const res = await youtubeChat.videosList({
        part: "liveStreamingDetails",
        id: videoID
    })
    if (res && res.items && res.items[0].liveStreamingDetails?.activeLiveChatId) {
        return res.items[0].liveStreamingDetails.activeLiveChatId;
    }

    throw new Error("No Live Chat Found with Video URL");
}