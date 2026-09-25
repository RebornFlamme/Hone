const video = document.getElementById("camera");
const cancelCamera = document.getElementById("cancel-camera");
const shutter = document.getElementById("shutter");
const photo = document.getElementById("input_photo");
const preview = document.getElementById("preview");
const welcomeScreen = document.getElementById("screen-welcome");
const errorMessage = document.getElementById("error-message");
let url = null;
let stream = null; 
const retry = document.getElementById("error-retry");
const authorization = document.getElementById("allow-camera");

photo.addEventListener("change", () => {
    const file = photo.files[0];

    if (file==undefined) {
        return;
    }

    photo.value = "";

    if (!file.type.startsWith("image/")){
        showError("Ce fichier n'est pas une image");
        return;
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size> MAX_SIZE){
        showError("Image trop lourde(20 Mo maximum)");
        return;
    }

    showPhoto(file);
});

// Affiche une image (fichier importé ou photo prise) dans le viseur
function showPhoto(image){
    if (url != null){
        URL.revokeObjectURL(url);
    }
    url = URL.createObjectURL(image);

    preview.src = url;
    welcomeScreen.classList.add("has-photo");
}




function showScreen(id){
    const listScreen = document.querySelectorAll(".screen");
    const update = () =>{
        listScreen.forEach((screen) => {
            screen.hidden = screen.id !==id;
        });
    };

    if (document.startViewTransition){
        document.startViewTransition(update); 
    }
    else{
        update();
    }
    
}

function showError(message){
    errorMessage.textContent  = message;
    showScreen("screen-error");
}


retry.addEventListener("click", () => {
    showScreen("screen-welcome");
})

authorization.addEventListener("click", async () => {
    authorization.disabled = true; 

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 3840 },  // l'appareil donne le max qu'il peut (4K si possible)
                height: { ideal: 2160 },
            },
 
            audio: false,
        });
        video.srcObject = stream;
        welcomeScreen.classList.add("has-camera");
    } catch (err) {
        console.error(err.name, err.message);
        if (err.name === "NotAllowedError") {
            showError("Tu as refusé l'accès à la caméra. Autorise-la depuis le cadenas à gauche de l'adresse, ou importe une photo.");
        } else if (err.name === "NotFoundError") {
            showError("Aucune caméra trouvée sur cet appareil.");
        } else if (err.name === "NotReadableError") {
            showError("La caméra est déjà utilisée par une autre application.");
        } else {
            showError("Impossible d'ouvrir la caméra.");
        }
    } finally {
        authorization.disabled = false;
    }
})

function stopCamera() {
    if (stream == null) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    welcomeScreen.classList.remove("has-camera");
}

cancelCamera.addEventListener("click", () => {
    stopCamera();

})

shutter.addEventListener("click", () => {
    // La vidéo n'a pas encore reçu d'image : rien à capturer
    if (video.videoWidth === 0) return;

    // On dessine l'image actuelle de la vidéo dans un canvas à sa taille réelle
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    // Puis on en fait un fichier JPEG, comme une photo importée
    canvas.toBlob((blob) => {
        if (blob == null) {
            showError("Impossible de prendre la photo.");
            return;
        }
        showPhoto(blob);
        stopCamera();
    }, "image/jpeg", 0.92);
})

document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
});
window.addEventListener("pagehide", stopCamera);