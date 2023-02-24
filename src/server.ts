import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { router } from "https://deno.land/x/rutt@0.0.14/mod.ts";
import { load } from "https://deno.land/std@0.177.0/dotenv/mod.ts";
import { YouTube } from './youtube.ts';
import { Poll } from "./polls.ts";
import { ChatHandler } from "./chat/ChatHandler.ts";
import { Twitch } from "./twitch.ts";
import { LoginHandler } from "./login/LoginHandler.ts";

const env = await load();


const io = new Server({ cors: { allowedHeaders: "*" } });

const polls = new Map<number,Poll>();

const chatHandlers: ChatHandler[] = [];
const loginHandlers: LoginHandler[] =[];

// load handlers (specific)

if (env["TWITCH_USER"] && env["TWITCH_TOKEN"]) {
    chatHandlers.push(new Twitch())
    console.log("Twitch Loading...")
}

if (env["YOUTUBE_CLIENT_ID"]){
    const yt = new YouTube(env)
    chatHandlers.push(yt);
    loginHandlers.push(yt);
    console.log("YT Loading...")
}

// connect chats

chatHandlers.forEach((handler)=>handler.connect(env));

io.on("connection", (socket) => {
    socket.on("message", (message) => {
        chatHandlers.forEach((handlers)=>handlers.sendMessage(message))
    })
    socket.on("createPoll", (options,time,id) => {
        const poll = new Poll(options);
        polls.set(id,poll);
        const msghandler = (user:string,message:string) => {poll.processChat(user,message)}
        chatHandlers.forEach((handler)=>handler.addMessageHandler(msghandler))
        setTimeout(()=>{
            chatHandlers.forEach((handler)=>handler.removeMessageHandler(msghandler))
            io.emit("poll",Array.from(poll.tally()),id);
        },time)
        poll.changeCallback = ()=>{
            const tally = poll.tally();
            io.emit("poll",Array.from(tally),id);
        }
    })
    socket.on("getPoll",(id)=>{
        const poll = polls.get(id);
        if(poll) {
        io.emit("poll",Array.from(poll.tally()),id);
        }
        else {
        io.emit("noPoll",id);
        }
    })
    socket.on("endPoll", (id) => {
        const poll = polls.get(id);
        if(poll){
            chatHandlers.forEach((handler)=>handler.removeMessageHandler(poll.processChat))
        }
    })
    socket.on("startChat",()=>{
        chatHandlers.forEach((handler)=>handler.addMessageHandler(messageProcess))
    })
    socket.on("stopChat",()=>{
        chatHandlers.forEach((handler)=>handler.removeMessageHandler(messageProcess))
    })
});

function messageProcess(user:string,message:string){
    io.emit("chatMessageRecieved",user,message)
}

const routes = [...loginHandlers.map((h) => h.getRoute(env)),{"/": (_req: Request) => {return new Response("Hello!")}}];
const routeHandler = router(routes.reduce((a,v)=>{return {...a,...v}}))

await serve(io.handler(routeHandler), {
    port: 3000
})