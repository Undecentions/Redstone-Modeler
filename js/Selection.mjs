import * as Images from "./Images.mjs";
import { BLOCK_FULL_HEIGHT, BLOCK_WIDTH, DEFAULT_BLOCK, HOTBAR_ITEM_COUNT, IMAGE_WIDTH, SELECTOR_ITEM_COUNT } from "./config.mjs";

export class Selection {
    // Funny JavaScript enum
    static selector_modes = Object.freeze({
        UNSELECTED: 0,
        HOTBAR: 1,
        SELECTOR: 2,
    });

    static selection_bar_elements = {
        selector: document.getElementById("selector"),
        hotbar: document.getElementById("hotbar"),
    };

    constructor() {
        this.selection = {
            hotbar: 0,
            selector: 0,
        };
        this.selection_element = {
            hotbar: null,
            selector: null,
        };

        this.mode = Selection.selector_modes.UNSELECTED;
    }

    initialize() {
        for (let i = 0; i < SELECTOR_ITEM_COUNT; i++) {
            const selector_item = document.createElement("div");
            selector_item.id = `selector_item_${i}`;
            selector_item.classList.add("selection_item");
            selector_item.style.backgroundImage = `url("${Images.imageURLs[i]}")`;
            selector_item.style.backgroundSize = `${Images.widths[Images.imageURLs[i]] * IMAGE_WIDTH / 2}px`;
            selector_item.style.width = `${BLOCK_WIDTH / 2}px`;
            selector_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
            selector_item.addEventListener("click", () => {
                this.selection_element.hotbar?.classList.remove("selected");
                this.select_item("selector", i);
                this.mode = Selection.selector_modes.SELECTOR;
            });
            Selection.selection_bar_elements.selector.appendChild(selector_item);
        }

        for (let i = 0; i < HOTBAR_ITEM_COUNT; i++) {
            const hotbar_item = document.createElement("div");
            hotbar_item.id = `hotbar_item_${i}`;
            hotbar_item.classList.add("selection_item");
            hotbar_item.style.backgroundImage = `url("${DEFAULT_BLOCK}")`;
            hotbar_item.style.width = `${BLOCK_WIDTH / 2}px`;
            hotbar_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
            hotbar_item.addEventListener("click", () => {
                this.selection_element.selector?.classList.remove("selected");
                this.select_item("hotbar", i);
                if (this.mode === Selection.selector_modes.SELECTOR) {
                    // Set hotbar slot
                    this.selection_element.hotbar.style.backgroundImage
                        = this.selection_element.selector.style.backgroundImage;
                    this.selection_element.hotbar.style.backgroundSize
                        = this.selection_element.selector.style.backgroundSize;
                }
                this.mode = Selection.selector_modes.HOTBAR;
            });
            Selection.selection_bar_elements.hotbar.appendChild(hotbar_item);
        }
    }

    select_item(selector, item) {
        this.selection_element[selector]?.classList.remove("selected");
        this.selection[selector] = item;
        this.selection_element[selector] = document.getElementById(
            `${selector}_item_${item}`,
        );
        this.selection_element[selector].classList.add("selected");
    }
}
