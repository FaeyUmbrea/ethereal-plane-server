import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";

const api = "https://www.googleapis.com/youtube/v3/"

export class YouTube {
    refreshToken: string;
    accessToken: string;
    auth: OAuth2Client;
    nextPageToken = "";
    waitInterval = 0; 
    listenerThread: number|undefined;
    messageHandlers: ((user: string,message:string) => void|Promise<void>)[]=[];
    liveChatId = "";
    constructor(env: Record<string,string>) {
        this.refreshToken = "";
        this.accessToken = "";
        this.auth = new OAuth2Client({
            clientId: env["YOUTUBE_CLIENT_ID"],
            clientSecret: env["YOUTUBE_CLIENT_SECRET"],
            authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUri: "https://oauth2.googleapis.com/token",
            redirectUri: env["YOUTUBE_REDIRECT_URL"],
            defaults: {
                scope: "https://www.googleapis.com/auth/youtube.force-ssl",
                requestOptions:{
                    urlParams:{
                        "access_type": "offline"
                    }
                }
            }
        })
    }

    async getAuthURL(){
        return (await this.auth.code.getAuthorizationUri({disablePkce: true})).uri.href
    }

    async code(url: string){
        const tokens = (await this.auth.code.getToken(url))
        this.accessToken = tokens.accessToken;
        console.log(tokens);
        if(tokens.refreshToken)
        this.refreshToken = tokens.refreshToken;
    }

    getRefreshToken(){
        return this.refreshToken;
    }

    async authenticate(refreshToken: string | undefined = undefined){
        if(refreshToken){
            const tokens = await this.auth.refreshToken.refresh(refreshToken);
            this.accessToken = tokens.accessToken;
            if(tokens.refreshToken)
            this.refreshToken = tokens.refreshToken;
        }
        else {
            const tokens = await this.auth.refreshToken.refresh(this.refreshToken);
            this.accessToken = tokens.accessToken;
            if(tokens.refreshToken)
            this.refreshToken = tokens.refreshToken;
        }
    }

    send(message: string){
        this.liveMessagesInsert({
            snippet: {
                liveChatId: this.liveChatId,
                type: "textMessageEvent",
                textMessageDetails: {
                    messageText: message
                }
            }
        })
    }

    async liveMessagesInsert(body: Record<string, unknown>) {
        const url = buildURL("liveChat/messages", { part: "snippet" })

        const opt: RequestInit = {
            body: JSON.stringify(body),
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            },
            method: "POST"
        }

        const res = await fetch(url, opt);
        if (res.ok) {
            return res.json();
        }
        throw new Error(await res.text());
    }

    async videosList(query: videosListQuery){
        const url = buildURL("videos", query);

        const opt: RequestInit = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        }

        const res = await fetch(url, opt);
        if(res.ok){
            return (await res.json()) as VideoList
        }
    }

    async chatMessagesList(query: liveChatMessagesListQuery){
        const url = buildURL("liveChat/messages",query);

        const opt: RequestInit = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        }

        const res = await fetch(url,opt);
        if(res.ok){
            return (await res.json()) as LiveChatMessageList
        }
    }

    async getMessages(){
        if(this.waitInterval == 0 && this.nextPageToken == ""){
            const res = await this.chatMessagesList({
                part: "snippet",
                liveChatId: this.liveChatId
            });
            if(res){
                this.waitInterval = res.pollingIntervalMillis;
                this.nextPageToken = res.nextPageToken;
                //discard previous chat
                //this.processMessages(res.items);
            }
        }
        else {
            const res = await this.chatMessagesList({
                part: "snippet",
                liveChatId: this.liveChatId,
                pageToken: this.nextPageToken
            });
            if(res){
                this.waitInterval = res.pollingIntervalMillis;
                this.nextPageToken = res.nextPageToken;
                this.processMessages(res.items);
            }
        }
        if(this.listenerThread){
            this.listenerThread = setTimeout(() => this.getMessages(),this.waitInterval);
        }
    }

    processMessages(messages:ChatMessage[]){
        messages.forEach((message) => {
            if(message.snippet.type == "textMessageEvent")
            this.messageHandlers.forEach((handler) => handler(message.snippet.authorChannelId,message.snippet.textMessageDetails.messageText))
        })
    }

    start(){
        if(!this.listenerThread){
            this.listenerThread = setTimeout(() => this.getMessages(),0);
        }
    }

    stop(){
        if(this.listenerThread){
            clearTimeout(this.listenerThread);
        }
    }

    addMessageHandler(handler: ((user: string,message:string) => void|Promise<void>)){
        //start automatically if a handler is added
        if(!this.listenerThread){
            this.start();
        }
        this.messageHandlers.push(handler);
    }

    removeMessageHanlder(handler: ((user: string,message:string) => void|Promise<void>)){
        this.messageHandlers = this.messageHandlers.filter((e) => e != handler)
        //If there is no more hanldlers, stop chat listener to save resources
        if(this.messageHandlers.length == 0){
            this.stop();
        }
    }

    setLiveChatId(liveChatId: string){
        this.liveChatId = liveChatId;
    }
}

function buildURL(endpoint: string, query: query) {
    let url = api + endpoint + "?";

    if (query) {
        for (const q in query) {
            url += `&${q}=${query[q].toString()}`
        }
    }

    return url;
}

interface query {
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
}

interface liveChatMessagesListQuery extends query{
    liveChatId: string;
    part: string;
    hl?: string;
    maxResults?: number;
    pageToken?: string;
    profileImageSize?: number;
}

interface videosListQuery extends query{
    part: string;
    chart?: string;
    id?: string;
    myRating?: string;
    hl?: string;
    maxHeight?: string;
    maxResults?: string;
    maxWidth?: string;
    onBehalfOfContentOwner?: string;
    pageToken?: string;
    regionCode?: string;
    videoCategoryId?: string;
}

interface VideoList {
    kind: "youtube#videoListResponse";
    etag: string;
    nextPageToken: string;
    prevPageToken: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: Video[]
}

interface Video {
    kind: "youtube#video";
    etag: string;
    id: string;
    liveStreamingDetails?: {
        activeLiveChatId: string;
    }
}

interface LiveChatMessageList {
    kind: "youtube#liveChatMessageListResponse";
    etag: string;
    nextPageToken: string;
    pollingIntervalMillis: number;
    offlineAt?: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: ChatMessage[]
}

interface ChatMessage {
    kind: "youtube#liveChatMessage";
    etag: string;
    id: string;
    snippet: {
        type: string;
        liveChatId: string;
        authorChannelId: string;
        publishedAt: string;
        hasDisplayContent: boolean;
        displayMessage: string;
        fanFundingEventDetails?: {
            amountMicros: number;
            currency: string;
            amountDisplayString: string;
            userComment: string;
        }
        textMessageDetails: {
            messageText: string;
        }
    }
}