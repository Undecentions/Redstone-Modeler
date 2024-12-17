import { BLOCK_FULL_HEIGHT, BLOCK_HEIGHT, BLOCK_TOP_HEIGHT, BLOCK_WIDTH, DEFAULT_BLOCK, MODEL_SIZE } from "./config.mjs";
import * as Images from "./Images.mjs";
import { Selection } from "./Selection.mjs";

/**
 * Canvas methods
 */
export class Canvas {
    /**
     *
     * @param {HTMLCanvasElement} canvas Canvas element.
     * @param {Model} model Model in the canvas.
     * @param {Selection} selection Selection that goes with the canvas.
     */
    constructor(canvas, model, selection) {
        this.canvas = canvas;
        this.model = model;
        this.selection = selection;
        this.init();
        this.moved = true;
        this.hover = {
            x: null,
            y: null,
            hover: false,
        };
    }

    /**
     * Initialize canvas properties
     */
    init() {
        this.canvas.width = BLOCK_WIDTH * MODEL_SIZE.y;
        this.canvas.height = BLOCK_HEIGHT * MODEL_SIZE.z - BLOCK_HEIGHT + BLOCK_FULL_HEIGHT;
        this.canvas.style.width = `${this.canvas.width / 2}px`;
        this.canvas.style.height = `${this.canvas.height / 2}px`;
        const context = this.canvas.getContext("2d");
        context.imageSmoothingEnabled = false; // Prevent blur
    }

    /**
     * Set a block on the canvas from an event.
     * @param {Event} e The event (mouse or touch events on canvas).
     * @param {boolean} hover Whether the event was a press or hover.
     */
    set(e, hover = false) {
        // For convenience, x and y in this are the y and z in the 3D
        // Get canvas click coordinates
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Get block click coordinates
        const grid_x = Math.floor(x / BLOCK_WIDTH);
        const grid_y = Math.floor((y - BLOCK_TOP_HEIGHT) / BLOCK_HEIGHT);

        // Check if on canvas at all (with mouse move, it might go off canvas)
        // and if it's on a different block than last time
        if (
            grid_x < 0
            || grid_x >= this.model.size.y
            || grid_y < 0
            || grid_y >= this.model.size.z
            || (
                e.type !== "mousedown"
                && this.hover.x === grid_x
                && this.hover.y === grid_y
                && this.hover.hover === hover
            )
        ) {
            return;
        }

        if (hover) {
            this.hover_off();
        }

        if (this.hover.x !== grid_x || this.hover.y !== grid_y) {
            this.moved = true;
        }

        this.hover.x = grid_x;
        this.hover.y = grid_y;
        this.hover.hover = hover;

        let selected_element;
        switch (this.selection.mode) {
            case Selection.selector_modes.HOTBAR:
                selected_element = this.selection.selection_element.hotbar;
                break;
            case Selection.selector_modes.SELECTOR:
                selected_element = this.selection.selection_element.selector;
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

        const block = this.model.get({ x: this.model.layer, y: grid_x, z: grid_y });
        if (!this.moved) {
            texture_x = (block.texture.y + 1) % Images.widths[block.texture.name];
        }
        else if (!hover) {
            this.moved = false;
        }

        if (!hover || block.texture.name === DEFAULT_BLOCK) {
            this.model.set(
                { x: this.model.layer, y: grid_x, z: grid_y },
                { name: block_name, y: texture_x, z: texture_y },
                hover,
            );
        }
    }

    /**
     * Mouse hovers off of canvas, removes the hover preview.
     */
    hover_off() {
        const old_position = {
            x: this.model.layer,
            y: this.hover.x,
            z: this.hover.y,
        };
        if (
            this.hover.x !== null
            && this.hover.y !== null
            && this.model.get(old_position).texture.name === DEFAULT_BLOCK
        ) {
            this.model.set(old_position, { name: DEFAULT_BLOCK, y: 0, z: 0 });
        }
    }
}
