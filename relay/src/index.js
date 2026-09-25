export default {
    async fetch(request){
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
            
        return new Response(`OK : session ${id}, role  ${role} `);
    },
};
