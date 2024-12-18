/*
NOTE: x, y, z are layer, column, and cell,
z is equivilent to the y-level in-game.
Also note that x goes forwards to backwards,
y goes left to right, and z top to bottom.
*/

import { Canvas } from "./Canvas.mjs";
import * as Images from "./Images.mjs";
import { Model } from "./Model.mjs";
import { Selection } from "./Selection.mjs";
import {
    BLOCK_FULL_HEIGHT,
    MODEL_SIZE,
} from "./config.mjs";

/**
 * @type {HTMLCanvasElement}
 */
const canvas_element = document.getElementById("canvas");

const selector = document.getElementById("selector");
const hotbar = document.getElementById("hotbar");
selector.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
hotbar.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;

const model = new Model(MODEL_SIZE, canvas_element.getContext("2d"));
const selection = new Selection();
const canvas = new Canvas(canvas_element, model, selection);

let messages = {};
function show_message(button, message, error = false) {
    if (Object.prototype.hasOwnProperty.call(messages, button)) {
        clearTimeout(messages[button].timeoutID);
    }
    const old_text = messages[button]?.old_text ?? button.innerText;
    button.innerText = message;
    button.style.color = error ? "red" : "";
    messages[button] = {
        timeoutID: setTimeout(() => {
            button.innerText = messages[button].old_text;
            button.style.color = "";
            delete messages[button];
        }, 1000),
        old_text: old_text,
    };
}

function main() {
    selection.initialize();

    canvas_element.addEventListener("mousedown", e => canvas.set(e));
    canvas_element.addEventListener("mousemove", (e) => {
        if (selection.mode !== Selection.selector_modes.UNSELECTED) {
            canvas.set(e, !(e.buttons & 1));
        }
    });
    canvas_element.addEventListener("mouseout", () => canvas.hover_off());

    canvas_element.addEventListener("touchmove", (e) => {
        if (e.touches.length > 1 || !e.cancelable) {
            return;
        }
        e.preventDefault();
        if (selection.mode !== Selection.selector_modes.UNSELECTED) {
            canvas.set(e.changedTouches[0]);
        }
    });

    const copy_image_button = document.getElementById("copy_image_button");
    const load_button = document.getElementById("load_button");
    const save_button = document.getElementById("save_button");
    copy_image_button.addEventListener("click", () => {
        if (model.border.x1 === null) {
            show_message(copy_image_button, "Model empty", true);
            return;
        }
        try {
            model.copy_model_as_image();
            show_message(copy_image_button, "Copied");
        }
        catch (e) {
            show_message(copy_image_button, "Error", true);
            throw e;
        }
    });
    save_button.addEventListener("click", () => {
        try {
            model.save();
            show_message(save_button, "Code copied");
        }
        catch (e) {
            show_message(save_button, "Error encountered", true);
            throw e;
        }
    });
    load_button.addEventListener("click", () => {
        try {
            model.load(document.getElementById("load_input").value);
            show_message(load_button, "Loaded");
        }
        catch {
            show_message(load_button, "Invalid code", true);
        }
    });

    // After automatic model resizing is implemented,
    // the "End" of model will be removed
    const layer_number = document.getElementById("layer_number");
    const layer_forwards = document.getElementById("layer_forwards");
    const layer_backwards = document.getElementById("layer_backwards");
    layer_forwards.addEventListener("click", () => {
        if (model.layer < model.size.x - 1) {
            model.change_layer(1);
        }
        else {
            show_message(layer_forwards, "End", true);
        }
        layer_number.innerText = `Layer: ${model.layer}`;
    });
    layer_backwards.addEventListener("click", () => {
        if (model.layer > 0) {
            model.change_layer(-1);
        }
        else {
            show_message(layer_backwards, "End", true);
        }
        layer_number.innerText = `Layer: ${model.layer}`;
    });
    layer_number.innerText = `Layer: ${model.layer}`;
}

window.addEventListener("error", (e) => {
    const { error } = e;
    alert(
`This message will be made unobtrusive later.
An error occured:
${e.error.stack}`,
    );
});

const start = new Date().getTime();

document.getElementById("logo_source").src = `logo${window.innerWidth > window.innerHeight ? "_wide" : "_tall"}.mp4`;
document.getElementById("logo").addEventListener("loadeddata", () => {
    console.log("Logo loaded:", new Date().getTime() - start);
});
document.getElementById("logo").load();

await Images.load_images(Images.imageURLs);
console.log("Images loaded:", new Date().getTime() - start);

const splash = new Promise(resolve => setTimeout(resolve, 4000));
const load_main = new Promise((resolve) => {
    main();
    resolve();
});

await splash;
await load_main;

document.getElementById("splash").style.pointerEvents = "none";
document.getElementById("splash").style.opacity = "0";
