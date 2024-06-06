import { image_name_encodings, image_name_decodings } from "./Images.mjs";
import { ModelBlock } from "./ModelBlock.mjs";
import {
    BLOCK_FULL_HEIGHT,
    BLOCK_HEIGHT,
    BLOCK_TOP_HEIGHT,
    BLOCK_WIDTH,
} from "./config.mjs";

/**
 * The 3D RSM model.
 */
export class Model {
    /**
     *
     * @param {{x: Number, y: Numder, z: Number}} size Size of the model
     * @param {CanvasRenderingContext2D} canvas_context Canvas context that this model is to be drawn on
     */
    constructor(size, canvas_context) {
        this.size = size;
        const { x: size_x, y: size_y, z: size_z } = size;
        this.border = {
            x1: null,
            x2: null,
            y1: null,
            y2: null,
            z1: null,
            z2: null,
        };

        this.layer = Math.floor(size_x / 2);
        this.canvas_context = canvas_context;
        this.canvases = Array(size_x)
            .fill("")
            .map(() => {
                const canvas = document.createElement("canvas");
                canvas.width = BLOCK_WIDTH * size_y;
                canvas.height =
                    BLOCK_HEIGHT * size_z - BLOCK_HEIGHT + BLOCK_FULL_HEIGHT;
                return canvas;
            });

        // Honestly js should have list comprehension
        // Type ModelBlock[][][]
        this.blocks = Array(size_x)
            .fill("")
            .map((_, x) =>
                Array(size_y)
                    .fill("")
                    .map((_, y) =>
                        Array(size_z)
                            .fill("")
                            .map(
                                (_, z) =>
                                    new ModelBlock(this, this.canvases[x], {
                                        x,
                                        y,
                                        z,
                                    })
                            )
                    )
            );
    }

    /**
     * Generate model save code and copy to clipboard
     */
    save() {
        const save_object = this.blocks.map((s1) =>
            s1.map((s2) =>
                s2.map((model_block) => {
                    const { name, y, z } = model_block.texture;
                    return [image_name_encodings[name], y, z];
                })
            )
        );
        LZMA.compress(JSON.stringify(save_object), 9, (result) => {
            console.log(result);
            navigator.clipboard.writeText(
                btoa(result.map((v) => String.fromCharCode(v + 128)).join(""))
            );
        });
    }

    /**
     * Load save code into model
     * @param {String} code 
     */
    load(code) {
        const save_object = JSON.parse(
            LZMA.decompress(
                atob(code)
                    .split("")
                    .map((v) => v.codePointAt(0) - 128)
            )
        );
        this.canvases.forEach((canvas) => {
            canvas.getContext("2d").reset();
        });
        this.blocks = save_object.map((s1, x) =>
            s1.map((s2, y) =>
                s2
                    .toReversed()
                    .map((block_texture, z) => {
                        z = this.size.z - z - 1;
                        const position = { x, y, z };
                        const [id, y_, z_] = block_texture;
                        const block = new ModelBlock(
                            this,
                            this.canvases[x],
                            position,
                            { name: image_name_decodings[id], y: y_, z: z_ }
                        );
                        block.draw();
                        return block;
                    })
                    .toReversed()
            )
        );
        this.draw();
    }

    /**
     * Gets a block in the model
     * @param {{x: Number, y: Number, z: Numder}} param0 position of block
     * @returns the block in the position
     */
    get({ x, y, z }) {
        if (
            x < 0 ||
            x >= this.size.x ||
            y < 0 ||
            y >= this.size.y ||
            z < 0 ||
            z >= this.size.z
        ) {
            throw Error(
                `Model get block out-of-bounds, tried to get [${x}][${y}][${z}]`
            );
        }
        const block = this.blocks[x][y][z];
        return block;
    }

    /**
     * Sets a block (texture) in the model
     * @param {{x: Number, y: Number: z: Number}} param0 position of block
     * @param {String} name name of the texture
     * @param {Boolean} hover whether the mouse is down
     */
    set({ x, y, z }, name, hover = false) {
        this.get({ x, y, z }).set_block(name, hover);
        this.draw();
    }

    /**
     * Changes to another layer
     * @param {Number} change change in the layer number
     */
    change_layer(change) {
        this.layer += change;
        this.draw();
    }

    /**
     * Draws the model
     * @see {@link ModelBlock.draw}
     */
    draw() {
        this.canvas_context.reset();
        this.canvas_context.save();
        for (let layer = 0; layer < this.canvases.length; layer++) {
            if (layer > this.layer) {
                this.canvas_context.globalAlpha *= 0.5;
            }
            this.canvas_context.drawImage(
                this.canvases[layer],
                0,
                (layer - this.layer) * BLOCK_TOP_HEIGHT
            );
        }
        this.canvas_context.restore();
    }

    /**
     * Copies the model as an image to the clipboard
     */
    copy_model_as_image() {
        if (this.border.x1 === null) {
            return;
        }

        const image_copying_canvas = document.createElement("canvas");
        image_copying_canvas.width =
            (this.border.y2 - this.border.y1) * BLOCK_WIDTH;
        image_copying_canvas.height =
            (this.border.z2 - this.border.z1) * BLOCK_HEIGHT +
            (this.border.x2 - this.border.x1) * BLOCK_TOP_HEIGHT;

        const context = image_copying_canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        for (let layer = this.border.x1; layer < this.border.x2; layer++) {
            context.drawImage(
                this.canvases[layer],
                -this.border.y1 * BLOCK_WIDTH,
                (layer - this.border.x1) * BLOCK_TOP_HEIGHT -
                    this.border.z1 * BLOCK_HEIGHT
            );
        }
        image_copying_canvas.toBlob((blob) =>
            navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ])
        );
    }
}
