/*
NOTE: x, y, z are layer, column, and cell,
z is equivilent to the y-level in-game.
Also note that x goes forwards to backwards,
y goes left to right, and z top to bottom.
*/

import * as Images from "./Images.mjs";
import { Model } from "./Model.mjs";
import { BLOCK_FULL_HEIGHT, BLOCK_HEIGHT, BLOCK_TOP_HEIGHT, BLOCK_WIDTH, DEFAULT_BLOCK, HOTBAR_ITEM_COUNT, MODEL_SIZE, SELECTOR_ITEM_COUNT } from "./config.mjs";

const selector_modes = Object.freeze({
    UNSELECTED: 0,
    HOTBAR_SELECTED: 1,
    SELECTOR_SELECTED: 2,
});

const canvas_hover = {
    x: null,
    y: null,
};
let mousedown = false;

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

let hotbar_selection = 0;
let selector_selection = 0;
let mode = selector_modes.UNSELECTED;

const model = new Model(MODEL_SIZE, context);

function open_property_selection() {}

function select_selector_item(selector_item) {
    document
        .getElementById(`hotbar_item_${hotbar_selection}`)
        .classList.remove("selected");
    document
        .getElementById(`selector_item_${selector_selection}`)
        .classList.remove("selected");
    document
        .getElementById(`selector_item_${selector_item}`)
        .classList.add("selected");
    selector_selection = selector_item;
    mode = selector_modes.SELECTOR_SELECTED;
}

function select_hotbar_item(hotbar_item) {
    document
        .getElementById(`hotbar_item_${hotbar_selection}`)
        .classList.remove("selected");
    document
        .getElementById(`selector_item_${selector_selection}`)
        .classList.remove("selected");
    document
        .getElementById(`hotbar_item_${hotbar_item}`)
        .classList.add("selected");
    if (mode === selector_modes.SELECTOR_SELECTED) {
        // Set hotbar slot
        document.getElementById(
            `hotbar_item_${hotbar_item}`
        ).style.backgroundImage = document.getElementById(
            `selector_item_${selector_selection}`
        ).style.backgroundImage;
    }
    hotbar_selection = hotbar_item;
    mode = selector_modes.HOTBAR_SELECTED;
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
        grid_x < 0 ||
        grid_x > model.size.y ||
        grid_y < 0 ||
        grid_y > model.size.z
    ) {
        return;
    }

    const position = { x: model.layer, y: grid_x, z: grid_y };

    if (hover) {
        if (canvas_hover.x == grid_x && canvas_hover.y == grid_y) {
            return;
        }
        canvas_hover_off();
        canvas_hover.x = grid_x;
        canvas_hover.y = grid_y;
    }

    const background_image = document.getElementById(
        `hotbar_item_${hotbar_selection}`
    ).style.backgroundImage;
    // Remove `url("` and `")` in css property
    const block = background_image.substring(5, background_image.length - 2);
    model.set(position, block, hover);
}

function canvas_hover_off() {
    const old_position = {
        x: model.layer,
        y: canvas_hover.x,
        z: canvas_hover.y,
    };
    if (
        canvas_hover.x !== null &&
        canvas_hover.y !== null &&
        model.get(old_position).texture.name == DEFAULT_BLOCK
    ) {
        model.set(old_position, DEFAULT_BLOCK);
    }
}

Images.load_images(Images.imageURLs).then(main);

for (let i = 0; i < SELECTOR_ITEM_COUNT; i++) {
    const selector_item = document.createElement("div");
    selector_item.id = `selector_item_${i}`;
    selector_item.classList.add("item");
    selector_item.style.backgroundImage = `url("${Images.imageURLs[i]}")`;
    selector_item.style.width = `${BLOCK_WIDTH / 2}px`;
    selector_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
    selector_item.addEventListener("click", () => {
        select_selector_item(i);
    });
    selector.appendChild(selector_item);
}

for (let i = 0; i < HOTBAR_ITEM_COUNT; i++) {
    const hotbar_item = document.createElement("div");
    hotbar_item.id = `hotbar_item_${i}`;
    hotbar_item.classList.add("item");
    hotbar_item.style.backgroundImage = `url("${DEFAULT_BLOCK}")`;
    hotbar_item.style.width = `${BLOCK_WIDTH / 2}px`;
    hotbar_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
    hotbar_item.addEventListener("click", () => {
        select_hotbar_item(i);
    });
    hotbar.appendChild(hotbar_item);
}

function main() {
    canvas.addEventListener("click", canvas_set);
    canvas.addEventListener("mousemove", (e) => {
        if (mode == selector_modes.HOTBAR_SELECTED) {
            canvas_set(e, !mousedown);
        }
    });
    canvas.addEventListener("mouseout", canvas_hover_off);
    canvas.addEventListener("mousedown", () => {
        mousedown = true;
    });
    canvas.addEventListener("mouseup", () => {
        mousedown = false;
    });

    document
        .getElementById("copy_image_button")
        .addEventListener("click", model.copy_model_as_image);

    const layer_number = document.getElementById("layer_number");
    document.getElementById("layer_forwards").addEventListener("click", () => {
        model.change_layer(1);
        layer_number.innerText = `Layer: ${model.layer}`;
    });
    document.getElementById("layer_backwards").addEventListener("click", () => {
        model.change_layer(-1);
        layer_number.innerText = `Layer: ${model.layer}`;
    });
    layer_number.innerText = `Layer: ${model.layer}`;
}
