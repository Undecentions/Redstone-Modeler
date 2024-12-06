/*
NOTE: x, y, z are layer, column, and cell,
z is equivilent to the y-level in-game.
Also note that x goes forwards to backwards,
y goes left to right, and z top to bottom.
*/

import * as Images from "./Images.mjs";
import { Model } from "./Model.mjs";
import { Selection } from "./Selection.mjs";
import {
    BLOCK_FULL_HEIGHT,
    BLOCK_HEIGHT,
    BLOCK_TOP_HEIGHT,
    BLOCK_WIDTH,
    DEFAULT_BLOCK,
    MODEL_SIZE,
} from "./config.mjs";

const canvas_hover = {
    x: null,
    y: null,
    hover: false,
};

let canvas_moved = true;

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("model");
canvas.width = BLOCK_WIDTH * MODEL_SIZE.y;
canvas.height = BLOCK_HEIGHT * MODEL_SIZE.z - BLOCK_HEIGHT + BLOCK_FULL_HEIGHT;
canvas.style.width = `${canvas.width / 2}px`;
canvas.style.height = `${canvas.height / 2}px`;
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false; // Prevent blur

const selector = document.getElementById("selector");
const hotbar = document.getElementById("hotbar");
selector.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
hotbar.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;

const model = new Model(MODEL_SIZE, context);
const selection = new Selection();

function canvas_set(e, hover = false) {
    // For convenience, x and y in this are the y and z in the 3D
    // Get canvas click coordinates
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Get block click coordinates
    const grid_x = Math.floor(x / BLOCK_WIDTH);
    const grid_y = Math.floor((y - BLOCK_TOP_HEIGHT) / BLOCK_HEIGHT);

    // Check if on canvas at all (with mouse move, it might go off canvas)
    // and if it's on a different block than last time
    if (
        grid_x < 0
        || grid_x > model.size.y
        || grid_y < 0
        || grid_y > model.size.z
        || (
            e.type !== "mousedown"
            && canvas_hover.x === grid_x
            && canvas_hover.y === grid_y
            && canvas_hover.hover === hover
        )
    ) {
        return;
    }

    if (hover) {
        canvas_hover_off();
    }

    if (canvas_hover.x !== grid_x || canvas_hover.y !== grid_y) {
        canvas_moved = true;
    }

    canvas_hover.x = grid_x;
    canvas_hover.y = grid_y;
    canvas_hover.hover = hover;

    let selected_element;
    switch (selection.mode) {
        case Selection.selector_modes.HOTBAR:
            selected_element = selection.selection_element.hotbar;
            break;
        case Selection.selector_modes.SELECTOR:
            selected_element = selection.selection_element.selector;
            break;

        default:
            return;
    }

    const background_image = selected_element.style.backgroundImage;
    // Remove `url("` and `")` in css property
    const block_name = background_image.substring(5, background_image.length - 2);

    const background_position_x = selected_element.style.backgroundPositionX || "0px";
    const background_position_y = selected_element.style.backgroundPositionY || "0px";
    let texture_x = -parseInt(background_position_x.substring(0, background_position_x.length - 2)) / 36;
    const texture_y = -parseInt(background_position_y.substring(0, background_position_y.length - 2)) / 48;

    const block = model.get({ x: model.layer, y: grid_x, z: grid_y });
    if (!canvas_moved) {
        texture_x = (block.texture.y + 1) % Images.widths[block.texture.name];
    }
    else if (!hover) {
        canvas_moved = false;
    }

    if (!hover || block.texture.name === DEFAULT_BLOCK) {
        model.set({ x: model.layer, y: grid_x, z: grid_y }, { name: block_name, y: texture_x, z: texture_y }, hover);
    }
}

function canvas_hover_off() {
    const old_position = {
        x: model.layer,
        y: canvas_hover.x,
        z: canvas_hover.y,
    };
    if (
        canvas_hover.x !== null
        && canvas_hover.y !== null
        && model.get(old_position).texture.name === DEFAULT_BLOCK
    ) {
        model.set(old_position, { name: DEFAULT_BLOCK, y: 0, z: 0 });
    }
}

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

    canvas.addEventListener("mousedown", canvas_set);
    canvas.addEventListener("mousemove", (e) => {
        if (selection.mode !== Selection.selector_modes.UNSELECTED) {
            canvas_set(e, !(e.buttons & 1));
        }
    });
    canvas.addEventListener("mouseout", canvas_hover_off);

    canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 1 || !e.cancelable) {
            return;
        }
        e.preventDefault();
        if (selection.mode !== Selection.selector_modes.UNSELECTED) {
            canvas_set(e.changedTouches[0]);
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
        catch (e) {
            show_message(load_button, "Invalid code", true);
            throw e;
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
    const { message, filename, lineno, colno } = e;
    alert(
`This message will be made unobtrusive later.
An error occured:
${message}
${filename}:${lineno}, ${colno}`,
    );
});

document.getElementById("logo_source").src = `logo${window.innerWidth > window.innerHeight ? "_wide" : "_tall"}.mp4`;
document.getElementById("logo").load();
const splash = new Promise(resolve => setTimeout(resolve, 4000));
await Images.load_images(Images.imageURLs);

const load_main = new Promise((resolve) => {
    main();
    resolve();
});

await splash;
await load_main;

document.getElementById("splash").style.pointerEvents = "none";
document.getElementById("splash").style.opacity = "0";
