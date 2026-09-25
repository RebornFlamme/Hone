import {DurableObject} from "cloudflare:workers"; 

const OTHER = {phone : "desktop", desktop: "phone"};

export default {
    async fetch(request, env){
        const url = new URL(request.url);

        const match = url.pathname.match(/^\/session\/([^/]+)$/);

        if (match === null){
            return new Response("Introuvable", { status : 404});
        }

        const id = match[1];
        const role = url.searchParams.get("role");
        const idValide = /^[A-Za-z0-9_-]{16,128}$/.test(id);
        const roleValide = role === "phone" || role === "desktop";
        if (!idValide || !roleValide){
            return new Response("Paramètres invalides", {status : 400});
        }
            
        const head = (request.headers.get("upgrade"))?.toLowerCase();
        if (head != "websocket"){
            return  new Response("Upgrade required", {status : 426});
        }

        const identifiant = env.SESSIONS.idFromName(id);
        const stub = env.SESSIONS.get(identifiant);
        return stub.fetch(request)
        
    },
};


export class Session extends DurableObject{
    

    async fetch(request){
        const [client, server] = Object.values(new WebSocketPair());
        const role = new URL(request.url).searchParams.get("role");
        this.ctx.acceptWebSocket(server, [role]);
        return new Response(null, {status : 101, webSocket: client })
    }

    webSocketMessage(ws, message){
        const role = this.ctx.getTags(ws)[0];
        const destinataires = this.ctx.getWebSockets(OTHER[role]);
        for (const dest of destinataires){
            dest.send(message)

        }
    }
}


