import { TWEEN } from "../lib/tween.module.min.js"

let toastTimeout = null

function showToast(message, turn, timeout) {

    if (toastTimeout) { 
        clearTimeout(toastTimeout); 
        toastTimeout = null;
    }

    const toast = document.getElementById("liveToast")
    document.getElementById("mainToastText").innerHTML = message

    const turnText = document.getElementById("turnText")
    switch (turn) {        

        case 0: // Rojo
            turnText.innerHTML = 'Turno: <span style="color: red; font-weight: bold;">Rojo</span>'
            break
        case 1: // Azul
            turnText.innerHTML = 'Turno: <span style="color: blue; font-weight: bold;">Azul</span>'
            break
        case 2: // Amarillo
            turnText.innerHTML = 'Turno: <span style="color: #FFBF00; font-weight: bold;">Amarillo</span>'
            break
        case 3: // Verde
            turnText.innerHTML = 'Turno: <span style="color: green; font-weight: bold;">Verde</span>'
            break

    }

    toast.classList.remove("hide")
    toast.classList.add("show")

    toast.style.opacity = 0;
    let opacidad = {valor: 0}

    new TWEEN.Tween(opacidad)
        .to({valor: [1]}, 500)
        .onUpdate((value) => { toast.style.opacity = value["valor"] })
        .onComplete(() => {
            if (timeout) {
                //toastTimeout = setTimeout(() => { hideToast() }, timeout)
            }
        })
        .start()

}

function hideToast() {

    if (toastTimeout) {
        clearTimeout(toastTimeout)
        toastTimeout = null
    }

    const toast = document.getElementById("liveToast")

    let opacidad = {valor: 1}

    new TWEEN.Tween(opacidad)
        .to({valor: [0]}, 500)
        .onUpdate((value) => { toast.style.opacity = value["valor"] })
        .onComplete(() => {
            toast.classList.remove("show")
            toast.classList.add("hide")
        })
        .start()

}

export { showToast, hideToast }