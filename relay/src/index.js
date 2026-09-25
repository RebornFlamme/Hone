import {DurableObject} from "cloudflare:workers"; 


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
            
        const identifiant = env.SESSIONS.idFromName(id);
        const stub = env.SESSIONS.get(identifiant);
        return stub.fetch(request)
        
    },
};


export class Session extends DurableObject{
    count = 0; // provisoire : pour vérifier qu'on retombe sur le même salon

    async fetch(request){
        this.count++;
        return new Response(`Bienvenue dans le salon, visite n°${this.count}`)
    }
}


