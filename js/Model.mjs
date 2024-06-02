import { ModelBlock } from "./ModelBlock.mjs";
import { BLOCK_FULL_HEIGHT, BLOCK_HEIGHT, BLOCK_TOP_HEIGHT, BLOCK_WIDTH } from "./config.mjs";

export class Model {
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
                                    new ModelBlock(
                                        this,
                                        this.canvases[x],
                                        x,
                                        y,
                                        z
                                    )
                            )
                    )
            );
    }

    get({ x, y, z }) {
        const block = this.blocks[x][y][z];
        if (block !== undefined) {
            return block;
        }
        throw Error(
            `Model get block out-of-bounds, tried to get [${x}][${y}][${z}]`
        );
    }

    set({ x, y, z }, name, hover = false) {
        this.get({ x, y, z }).set_block(name, hover);
        this.draw();
    }

    change_layer(change) {
        this.layer += change;
        this.draw();
    }

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

    copy_model_as_image() {
        if (this.border.x1 === null) {
            return;
        }

        const image_copying_canvas = document.createElement("canvas");
        image_copying_canvas.width =
            (this.border.y2 - this.border.y1) * BLOCK_HEIGHT;
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
