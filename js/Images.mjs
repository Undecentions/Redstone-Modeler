import { IMAGE_WIDTH } from "./config.mjs";

export const imageURLs = [
    "air.png",
    "smooth_stone.png",
    "glass.png",
    "obsidian.png",
    "glazed_terracotta.png",
    "redstone_block.png",
    "redstone_wire.png",
    "repeater.png",
    "observer.png",
    "piston.png",
    "piston_extended.png",
    "piston_head.png",
    "sticky_piston.png",
    "sticky_piston_extended.png",
    "sticky_piston_head.png",
    "slime_block.png",
].map(s => `assets/${s}`);

const image_abbreviations = [
    " ",
    "b",
    "t",
    "obs",
    "tc",
    "rb",
    "rd",
    "rp",
    "ob",
    "p",
    "px",
    "ph",
    "sp",
    "spx",
    "sph",
    "sb",
];

export const image_name_encodings = Object.fromEntries(
    imageURLs.map((v, i) => [v, image_abbreviations[i]]),
);
export const image_name_decodings = Object.fromEntries(
    imageURLs.map((v, i) => [image_abbreviations[i], v]),
);

export const promises = [];
export const blocks = [];
export const widths = [];

export async function load_images() {
    for (let imageURL of imageURLs) {
        promises.push(
            new Promise((resolve) => {
                const image = new Image();
                image.onload = () => {
                    widths[imageURL] = Math.floor(image.width / IMAGE_WIDTH);
                    resolve();
                };
                image.src = imageURL;
                blocks[imageURL] = image;
            }),
        );
    }

    await Promise.all(promises);
}
