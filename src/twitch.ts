import { Channel, TwitchChat } from "https://deno.land/x/tmi_beta@v0.1.4/mod.ts";
import { ChatHandler } from "./chat/ChatHandler.ts";

export class Twitch implements ChatHandler{

    twitchClient: TwitchChat|undefined;
    twitchChat: Channel | undefined;
    twitchHanlders: ((user: string,message:string) => void|Promise<void>)[] = [];


async connect(env: Record<string,string>) {
        this.twitchClient = new TwitchChat(env["TWITCH_TOKEN"])
        await this.twitchClient.connect();
    
        this.twitchChat = this.twitchClient.join(env["TWITCH_CHANNEL"]?env["TWITCH_CHANNEL"]:env["TWITCH_USER"], env["TWITCH_USER"]);
        this.twitchChat.listener("privmsg",(msg)=>{
            this.twitchHanlders.forEach((handler) => handler(msg.username,msg.message));
        })
        console.log("Twitch chat loaded!")
}
sendMessage(message: string): void|Promise<void> {
this.twitchChat?.send(message);
}
addMessageHandler(handler: (user: string,message: string) => void|Promise<void>): void|Promise<void> {
    this.twitchHanlders.push(handler);

}
removeMessageHandler(handler: (user: string,message: string) => void|Promise<void>): void|Promise<void> {
    this.twitchHanlders = this.twitchHanlders.filter((e) => e != handler)
}
disconnect(): void|Promise<void> {
    this.twitchClient?.disconnect();
}
    
}