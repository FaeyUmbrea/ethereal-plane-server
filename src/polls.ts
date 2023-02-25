export class Poll {
    prefix: string;
    options: Array<string>;
    votes: Map<string,string>;
    changeCallback:() => void

    constructor(options:Array<string>,prefix:string = "",changeCallback:() => void = ()=>{}){
        this.prefix = prefix;
        this.options = options;
        this.votes = new Map<string,string>();
        this.changeCallback = changeCallback;
    }

    processChat = (sender:string,message:string) => {
        if(this.prefix != ""){
            if(message.startsWith(this.prefix)){
                const parts = message.split("")
                this.options.forEach((val)=>{
                    if(val === parts[1]){
                        this.votes.set(sender,val);
                        this.changeCallback();
                    }
                })
            }
        }else{
            this.options.forEach((val)=>{
                if(val === message){
                    this.votes.set(sender,val);
                    this.changeCallback();
                }
            })
        }
    }

    tally(){
        const tally = new Map<string,number>(this.options.map((obj) => [obj,0]));
        this.votes.forEach((val) =>{
            const prev = tally.get(val)
            if(prev!=undefined)
            tally.set(val,prev+1)
        })
        return tally
    }    
}