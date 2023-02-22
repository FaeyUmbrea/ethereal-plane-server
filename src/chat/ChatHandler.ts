export interface ChatHandler {
    connect(env:Record<string,string>):void|Promise<void>;
    sendMessage(message:string):void|Promise<void>;
    addMessageHandler(handler: ((user: string,message:string) => void|Promise<void>)):void|Promise<void>
    removeMessageHandler(handler: ((user: string,message:string) => void|Promise<void>)):void|Promise<void>
    disconnect():void|Promise<void>;
}