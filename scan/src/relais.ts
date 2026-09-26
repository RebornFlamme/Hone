const RELAY_URL = "wss://hone-relay.lasky.workers.dev";

export class Relais {
    socket: WebSocket | null = null;
    sessionId: string;
    stopped = false;                      
    onPhone: (connected: boolean) => void;

    constructor(sessionId: string, onPhone: (connected: boolean) => void) {
        this.sessionId = sessionId;
        this.onPhone = onPhone;
    }

    connect(): void {
        const ws = new WebSocket(`${RELAY_URL}/session/${encodeURIComponent(this.sessionId)}?role=desktop`);
        ws.binaryType = "arraybuffer";           
        this.socket = ws;

        ws.onmessage = (event) => {
            if (typeof event.data !== "string") return;   
            const message = JSON.parse(event.data);
            if (message.type === "peer" && message.role === "phone") {
                this.onPhone(true);
            }
        };

        ws.onclose = (event) => {
            this.onPhone(false);
            if (!this.stopped && event.code !== 4000) {
                setTimeout(() => this.connect(), 2000);
            }
        };
    }

    close(): void {
        this.stopped = true;
        this.socket?.close(1000);
    }
}
