const RELAY_URL = "wss://hone-relay.lasky.workers.dev";

export class Relais {
    socket: WebSocket | null = null;
    sessionId: string;
    stopped = false;                      
    onPhone: (connected: boolean) => void;
    onPhoto: (photo: Blob, id: string) => void;
    incoming: { id: string; mime: string; size: number; chunks: ArrayBuffer[] } | null = null;   


    constructor(sessionId: string, onPhone: (connected: boolean) => void, onPhoto: (photo: Blob, id: string)=> void, ) {
        this.sessionId = sessionId;
        this.onPhone = onPhone;
        this.onPhoto = onPhoto;

    }

    connect(): void {
        const ws = new WebSocket(`${RELAY_URL}/session/${encodeURIComponent(this.sessionId)}?role=desktop`);
        ws.binaryType = "arraybuffer";           
        this.socket = ws;

        ws.onmessage = (event) => {
            if (typeof event.data !== "string"){
                this.incoming?.chunks.push(event.data);
            };   
            const message = JSON.parse(event.data);
            if (message.type === "peer" && message.role === "phone") {
                this.onPhone(true);
            }
            else if (message.type === "photo-start"){
                this.incoming = { id : this.onPhoto.id, mime : message.mime || "Image/jpeg", size: this.onPhoto.photo.size, chunks: []};
            }
            else if (message.type ==="photo-end"){
                if (this.incoming === null || this.incoming.id !== null) return;
                const photo = new Blob(this.incoming.chunks, {type : this.incoming.mime});
                this.incoming = null;
                this.onPhoto(photo, message.id);
            }
        };
    

        ws.onclose = (event) => {
            this.onPhone(false);
            if (!this.stopped && event.code !== 4000) {
                setTimeout(() => this.connect(), 2000);
            }
        };
    }

    send(message: object): void{
        if (this.socket?.readyState === WebSocket.OPEN){
            this.socket.send(JSON.stringify(message));
        }
    }

    close(): void {
        this.stopped = true;
        this.socket?.close(1000);
    }
}
