import * as Images from "./Images.mjs";
import { BLOCK_FULL_HEIGHT, BLOCK_WIDTH, DEFAULT_BLOCK, HOTBAR_ITEM_COUNT, IMAGE_WIDTH, SELECTOR_ITEM_COUNT } from "./config.mjs";

export class Selection {
    // Funny JavaScript enum
    static selector_modes = Object.freeze({
        UNSELECTED: 0,
        HOTBAR: 1,
        SELECTOR: 2,
    });

    static selection_bars = {
        selector: document.getElementById("selector"),
        hotbar: document.getElementById("hotbar"),
        property_1: document.getElementById("property_1"),
        property_2: document.getElementById("property_2"),
    };

    constructor() {
        this.selection_element = {
            hotbar: null,
            selector: null,
            property_1: null,
            property_2: null,
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
            Selection.selection_bars.selector.appendChild(selector_item);
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
                if (this.mode === Selection.selector_modes.HOTBAR
                    && this.selection_element["hotbar"].id === `hotbar_item_${i}`
                    && document.getElementById("selection_properties").style.display === "block") {
                    document.getElementById("selection_properties").style.display = "none";
                    return;
                }
                this.select_item("hotbar", i);
                if (this.mode === Selection.selector_modes.SELECTOR) {
                    // Set hotbar slot
                    this.selection_element.hotbar.style.backgroundImage
                        = this.selection_element.selector.style.backgroundImage;
                    this.selection_element.hotbar.style.backgroundSize
                        = this.selection_element.selector.style.backgroundSize;
                }
                this.mode = Selection.selector_modes.HOTBAR;
                this.open_property_selection();
            });
            Selection.selection_bars.hotbar.appendChild(hotbar_item);
        }
    }

    open_property_selection() {
        if (this.mode !== Selection.selector_modes.HOTBAR) return;

        const background_image = this.selection_element.hotbar.style.backgroundImage;
        // Remove `url("` and `")` in css property
        const name = background_image.substring(5, background_image.length - 2);

        Selection.selection_bars.property_1.replaceChildren();
        Selection.selection_bars.property_2.replaceChildren();

        Selection.selection_bars.property_1.parentElement.style.display = Images.heights[name] <= 1 ? "none" : "block";

        for (let i = 0; i < Images.heights[name]; i++) {
            const property_bar_1_item = document.createElement("div");
            property_bar_1_item.id = `property_1_item_${i}`;
            property_bar_1_item.classList.add("selection_item");
            property_bar_1_item.style.backgroundImage = this.selection_element.hotbar.style.backgroundImage;
            property_bar_1_item.style.backgroundSize = this.selection_element.hotbar.style.backgroundSize;
            property_bar_1_item.style.backgroundPositionY = `-${48 * i}px`;
            property_bar_1_item.style.width = `${BLOCK_WIDTH / 2}px`;
            property_bar_1_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
            property_bar_1_item.addEventListener("click", () => {
                this.select_item("property_1", i);
                for (let item of Selection.selection_bars.property_2.children) {
                    item.style.backgroundPositionY = `-${48 * i}px`;
                }
                this.selection_element.hotbar.style.backgroundPositionX = this.selection_element.property_2.style.backgroundPositionX;
                this.selection_element.hotbar.style.backgroundPositionY = this.selection_element.property_2.style.backgroundPositionY;
            });
            Selection.selection_bars.property_1.appendChild(property_bar_1_item);
        }

        for (let i = 0; i < Images.widths[name]; i++) {
            const property_bar_2_item = document.createElement("div");
            property_bar_2_item.id = `property_2_item_${i}`;
            property_bar_2_item.classList.add("selection_item");
            property_bar_2_item.style.backgroundImage = this.selection_element.hotbar.style.backgroundImage;
            property_bar_2_item.style.backgroundSize = this.selection_element.hotbar.style.backgroundSize;
            property_bar_2_item.style.backgroundPositionX = `-${36 * i}px`;
            property_bar_2_item.style.width = `${BLOCK_WIDTH / 2}px`;
            property_bar_2_item.style.height = `${BLOCK_FULL_HEIGHT / 2}px`;
            property_bar_2_item.addEventListener("click", () => {
                this.select_item("property_2", i);
                for (let item of Selection.selection_bars.property_1.children) {
                    item.style.backgroundPositionX = `-${36 * i}px`;
                }
                this.selection_element.hotbar.style.backgroundPositionX = this.selection_element.property_1.style.backgroundPositionX;
                this.selection_element.hotbar.style.backgroundPositionY = this.selection_element.property_1.style.backgroundPositionY;
            });
            Selection.selection_bars.property_2.appendChild(property_bar_2_item);
        }

        const property_1_item = -(parseInt(this.selection_element.hotbar.style.backgroundPositionY, 10) || 0) / 48;
        this.select_item("property_1", property_1_item);
        for (let item of Selection.selection_bars.property_2.children) {
            item.style.backgroundPositionY = `-${48 * property_1_item}px`;
        }

        const property_2_item = -(parseInt(this.selection_element.hotbar.style.backgroundPositionX, 10) || 0) / 36;
        this.select_item("property_2", property_2_item);
        for (let item of Selection.selection_bars.property_1.children) {
            item.style.backgroundPositionX = `-${36 * property_2_item}px`;
        }

        document.getElementById("selection_properties").style.display = "block";
    }

    select_item(selector, item) {
        this.selection_element[selector]?.classList.remove("selected");
        this.selection_element[selector] = document.getElementById(
            `${selector}_item_${item}`,
        );
        this.selection_element[selector].classList.add("selected");
    }
}
