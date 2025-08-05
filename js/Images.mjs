import { IMAGE_HEIGHT, IMAGE_WIDTH } from "./config.mjs";

export const imageURLs = [
    "air.png",
    "smooth_stone.png",
    "smooth_stone_slab.png",
    "polished_andesite_stairs.png",
    "quartz_block.png",
    "quartz_slab.png",
    "quartz_stairs.png",
    "wall.png",
    "glass.png",
    "concrete.png",
    "wool.png",
    "obsidian.png",
    "moss_block.png",
    "terracotta.png",
    "glazed_terracotta.png",
    "lever.png",
    "button.png",
    "redstone_block.png",
    "redstone_wire.png",
    "redstone_torch.png",
    "repeater.png",
    "comparator.png",
    "note_block.png",
    "scaffolding.png",
    "log.png",
    "leaves.png",
    "copper_bulb.png",
    "target.png",
    "daylight_detector.png",
    "trapdoor.png",
    "door.png",
    "fence_gate.png",
    "observer.png",
    "piston.png",
    "sticky_piston.png",
    "slime_block.png",
    "honey_block.png",
    "chest.png",
    "hopper.png",
    "dropper.png",
    "dispenser.png",
    "crafter.png",
    "barrel.png",
    "composter.png",
    "water_cauldron.png",
    "cake.png",
    "tripwire_hook.png",
    "tripwire.png",
    "pressure_plate.png",
    "weighted_pressure_plate.png",
    "rail.png",
    "powered_rail.png",
    "activator_rail.png",
    "detector_rail.png",
    "mineral_blocks.png",
    "ancient_debris.png",
    "packed_ice.png",
    "powder_snow.png",
    "soul_sand.png",
    "sand.png",
].map(s => `assets/${s}`);

export const promises = [];
export const blocks = [];
export const widths = [];
export const heights = [];

export async function load_images() {
    for (let imageURL of imageURLs) {
        promises.push(
            new Promise((resolve) => {
                const image = new Image();
                image.onload = () => {
                    heights[imageURL] = Math.floor(image.height / IMAGE_HEIGHT);
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
