/*
NOTE: x, y, z are layer, column, and cell,
z is equivilent to the y-level in-game.
Also note that x goes forwards to backwards,
y goes left to right, and z top to bottom.
*/

import * as Images from "./Images.mjs";
import { Model } from "./Model.mjs";
import {
    BLOCK_FULL_HEIGHT,
    BLOCK_HEIGHT,
    BLOCK_TOP_HEIGHT,
    BLOCK_WIDTH,
    DEFAULT_BLOCK,
    HOTBAR_ITEM_COUNT,
    MODEL_SIZE,
    SELECTOR_ITEM_COUNT,
} from "./config.mjs";

// Funny js enum
const selector_modes = Object.freeze({
    UNSELECTED: 0,
    HOTBAR: 1,
    SELECTOR: 2,
});

const canvas_hover = {
    x: null,
    y: null,
    hover: false,
};

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

const selection = {
    hotbar: 0,
    selector: 0,
};
// These `null`s cause a lot of `?.`s
const selection_element = {
    hotbar: null,
    selector: null,
};
let mode = selector_modes.UNSELECTED;

const model = new Model(MODEL_SIZE, context);

function open_property_selection() {
    // TODO
}

function select_item(selector, item) {
    selection_element[selector]?.classList.remove("selected");
    selection[selector] = item;
    selection_element[selector] = document.getElementById(
        `${selector}_item_${item}`,
    );
    selection_element[selector].classList.add("selected");
}

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
    if (
        grid_x < 0
        || grid_x > model.size.y
        || grid_y < 0
        || grid_y > model.size.z
        || (e.type !== "click"
        && canvas_hover.x === grid_x
        && canvas_hover.y === grid_y
        && canvas_hover.hover === hover)
    ) {
        return;
    }

    if (hover) {
        canvas_hover_off();
    }

    canvas_hover.x = grid_x;
    canvas_hover.y = grid_y;
    canvas_hover.hover = hover;

    const background_image = selection_element.hotbar.style.backgroundImage;
    // Remove `url("` and `")` in css property
    const block = background_image.substring(5, background_image.length - 2);
    model.set({ x: model.layer, y: grid_x, z: grid_y }, block, hover);
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
        model.set(old_position, DEFAULT_BLOCK);
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

Images.load_images(Images.imageURLs).then(main);

for (let i = 0; i < SELECTOR_ITEM_COUNT; i++) {
    const selector_item = document.createElement("div");
    selector_item.id = `selector_item_${i}`;
    selector_item.classList.add("selection_item");
    selector_item.style.backgroundImage = `url("${Images.imageURLs[i]}")`;
    selector_item.style.width = `${BLOCK_WIDTH / 2}px`;
    selector_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
    selector_item.addEventListener("click", () => {
        selection_element.hotbar?.classList.remove("selected");
        select_item("selector", i);
        mode = selector_modes.SELECTOR;
    });
    selector.appendChild(selector_item);
}

for (let i = 0; i < HOTBAR_ITEM_COUNT; i++) {
    const hotbar_item = document.createElement("div");
    hotbar_item.id = `hotbar_item_${i}`;
    hotbar_item.classList.add("selection_item");
    hotbar_item.style.backgroundImage = `url("${DEFAULT_BLOCK}")`;
    hotbar_item.style.width = `${BLOCK_WIDTH / 2}px`;
    hotbar_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
    hotbar_item.addEventListener("click", () => {
        selection_element.selector?.classList.remove("selected");
        select_item("hotbar", i);
        if (mode === selector_modes.SELECTOR) {
            // Set hotbar slot
            selection_element.hotbar.style.backgroundImage
                = selection_element.selector.style.backgroundImage;
        }
        mode = selector_modes.HOTBAR;
    });
    hotbar.appendChild(hotbar_item);
}

function main() {
    canvas.addEventListener("click", canvas_set);
    canvas.addEventListener("mousemove", (e) => {
        if (mode === selector_modes.HOTBAR) {
            canvas_set(e, !(e.buttons & 1));
        }
    });
    canvas.addEventListener("mouseout", canvas_hover_off);

    canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 1 || !e.cancelable) {
            return;
        }
        e.preventDefault();
        if (mode === selector_modes.HOTBAR) {
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
