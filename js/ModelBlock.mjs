import * as Images from "./Images.mjs";
import {
    BLOCK_FULL_HEIGHT,
    BLOCK_HEIGHT,
    BLOCK_TOP_HEIGHT,
    BLOCK_WIDTH,
    DEFAULT_BLOCK,
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
} from "./config.mjs";

export class ModelBlock {
    constructor(
        parent_model,
        parent_canvas,
        position,
        texture = {
            name: DEFAULT_BLOCK,
            y: 0,
            z: 0,
        }
    ) {
        this.texture = texture;
        this.position = position;
        this.canvas_context = parent_canvas.getContext("2d");
        this.model = parent_model;
    }

    draw(front = false) {
        this.canvas_context.drawImage(
            Images.blocks[this.texture.name],
            IMAGE_WIDTH * this.texture.y,
            IMAGE_HEIGHT * this.texture.z +
                (front ? Math.floor(IMAGE_HEIGHT * (1 / 3)) : 0),
            IMAGE_WIDTH,
            front ? Math.floor(IMAGE_HEIGHT * (2 / 3)) : IMAGE_HEIGHT,
            this.position.y * BLOCK_WIDTH,
            this.position.z * BLOCK_HEIGHT + (front ? BLOCK_TOP_HEIGHT : 0),
            BLOCK_WIDTH,
            front ? BLOCK_HEIGHT : BLOCK_FULL_HEIGHT
        );
    }

    set_block(name, hover = false) {
        let draw_hover = false;
        if (hover) {
            if (this.texture.name === DEFAULT_BLOCK) {
                this.texture.name = name;
                draw_hover = true;
            }
        } else if (this.texture.name === name) {
            this.texture.y += 1;
            this.texture.y %= Images.widths[this.texture.name];
        } else {
            this.texture.name = name;

            this.model.border.x1 = Math.min(
                this.model.border.x1 ?? this.model.size.x,
                this.position.x
            );
            this.model.border.y1 = Math.min(
                this.model.border.y1 ?? this.model.size.y,
                this.position.y
            );
            this.model.border.z1 = Math.min(
                this.model.border.z1 ?? this.model.size.z,
                this.position.z
            );
            this.model.border.x2 = Math.max(
                this.model.border.x2 ?? 0,
                this.position.x + 1
            );
            this.model.border.y2 = Math.max(
                this.model.border.y2 ?? 0,
                this.position.y + 1
            );
            this.model.border.z2 = Math.max(
                this.model.border.z2 ?? 0,
                this.position.z + 1
            );
        }
        const temp_position = structuredClone(this.position);
        this.canvas_context.clearRect(
            this.position.y * BLOCK_WIDTH,
            this.position.z * BLOCK_HEIGHT,
            BLOCK_WIDTH,
            BLOCK_FULL_HEIGHT
        );
        // Draw bottom to top (lower z means higher)
        temp_position.z += 1;
        if (temp_position.z < this.model.size.z) {
            this.model.get(temp_position).draw();
        }

        temp_position.z -= 1;
        this.canvas_context.save();
        if (draw_hover) {
            this.canvas_context.globalAlpha = 0.8;
        }
        this.model.get(temp_position).draw();
        this.canvas_context.restore();

        temp_position.z -= 1;
        if (temp_position.z >= 0) {
            this.model.get(temp_position).draw(true);
        }

        // Real texture is blank
        if (draw_hover) {
            this.texture.name = DEFAULT_BLOCK;
        }
    }
}
