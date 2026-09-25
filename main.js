


const photo = document.getElementById("input_photo")
const preview = document.getElementById("preview");
const welcomeScreen = document.getElementById("screen-welcome");
const errorMessage = document.getElementById("error-message")
let url = null;
let stream = null; // flux caméra en cours
const retry = document.getElementById("error-retry");
const authorization = document.getElementById("allow-camera")

photo.addEventListener("change", (event) => {
    const file = photo.files[0]

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
        showError("Image trop lourde(20 Mo maximum");
        return;
    }

    if (url != null){
        URL.revokeObjectURL(url);
    }
    const photo_url = URL.createObjectURL(file);
    url = photo_url;
    preview.src = photo_url;
    welcomeScreen.classList.add("has-photo")    
});




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
            video: { facingMode: { ideal: "environment" } }, 
            audio: false,
        });
        console.log("Caméra OK :", stream);
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
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
});
window.addEventListener("pagehide", stopCamera);