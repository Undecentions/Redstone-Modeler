from Joiner import Joiner

j = Joiner("assets_renderer/mcassets", "minecraft", "assets")
j_custom = Joiner("assets_renderer/mcassets", "custom", "assets")


def render_blocks():
    def parse_blocks(*args: str, out=None) -> None:
        if len(args) == 1:
            out = args[0]
        elif out is None:
            raise ValueError("Output file name is None.")
        j.parse_state([f"{v}.json" for v in args], [], f"{out}.png")

    parse_blocks("smooth_stone")
    parse_blocks("quartz_block")
    parse_blocks("slime_block")
    parse_blocks("honey_block")
    parse_blocks("obsidian")
    parse_blocks("redstone_block")
    parse_blocks("packed_ice")
    parse_blocks(
        "iron_block",
        "gold_block",
        "emerald_block",
        "diamond_block",
        "netherite_block",
        out="mineral_blocks",
    )
    parse_blocks("ancient_debris")
    parse_blocks("sand")
    parse_blocks("soul_sand")
    parse_blocks("moss_block")
    parse_blocks("powder_snow")
    parse_blocks("mangrove_roots")
    j.parse_state(["smooth_stone_slab.json"], ["type"], "smooth_stone_slab.png")
    j.parse_state(["quartz_slab.json"], ["type"], "quartz_slab.png")

    def stair_key(d: dict[str, str], /):
        return d["shape"] not in {"inner_right", "outer_right"}
    j.parse_state(
        ["polished_andesite_stairs.json"],
        ["facing", "half", "shape"],
        "polished_andesite_stairs.png",
        key=stair_key,
    )
    j.parse_state(
        ["quartz_stairs.json"],
        ["facing", "half", "shape"],
        "quartz_stairs.png",
        key=stair_key,
    )


def render_colored_blocks():
    def color(s: str, sep: str = "", /, *, raw=True) -> list[str]:
        colors = [
            "white",
            "light_gray",
            "gray",
            "black",
            "pink",
            "red",
            "orange",
            "yellow",
            "lime",
            "green",
            "light_blue",
            "cyan",
            "blue",
            "magenta",
            "purple",
            "brown",
        ]
        return ([s + ".json"] if raw else []) + [
            "_".join((e, sep, s) if sep != "" else (e, s)) + ".json" for e in colors
        ]

    j.parse_state(color("glass", "stained") + ["tinted_glass.json"], [], "glass.png")
    j.parse_state(color("glass_pane", "stained"), ["north", "west", "south", "east"], "glass_pane.png")
    j.parse_state(color("terracotta"), [], "terracotta.png")
    j.parse_state(
        color("glazed_terracotta", raw=False), ["facing"], "glazed_terracotta.png"
    )
    j.parse_state(color("wool", raw=False), [], "wool.png")
    j.parse_state(color("concrete", raw=False), [], "concrete.png")


def render_wooden_blocks():
    def wood(s: str, /, *, nether=True, azalea=False, bamboo=True) -> list[str]:
        woods = [
            "acacia",
            "birch",
            "cherry",
            "dark_oak",
            "jungle",
            "mangrove",
            "oak",
            "spruce",
        ]
        if nether:
            woods.extend(["crimson", "warped"])
        if azalea:
            woods.extend(["azalea", "flowering_azalea"])
        if bamboo:
            woods.append("bamboo")
        return ["_".join((e, s)) + ".json" for e in woods]

    j.parse_state(
        ["iron_trapdoor.json", "copper_trapdoor.json"] + wood("trapdoor"),
        ["open", "facing", "half"],
        "trapdoor.png",
    )
    j.parse_state(
        ["iron_door.json", "copper_door.json"] + wood("door"),
        ["open", "facing", "half", "hinge"],
        "door.png",
    )
    j.parse_state(
        ["stone_button.json", "polished_blackstone_button.json"] + wood("button"),
        ["powered", "facing", "face"],
        "button.png",
    )
    j.parse_state(
        ["stone_pressure_plate.json", "polished_blackstone_pressure_plate.json"]
        + wood("pressure_plate"),
        ["powered"],
        "pressure_plate.png",
    )
    j.parse_state(
        ["heavy_weighted_pressure_plate.json", "light_weighted_pressure_plate.json"],
        ["power"],
        "weighted_pressure_plate.png",
    )
    j.parse_state(wood("fence_gate"), ["open", "facing", "in_wall"], "fence_gate.png")
    j.parse_state(wood("leaves", nether=False, azalea=True, bamboo=False), ["distance", "persistent"], "leaves.png", key=lambda d: d["persistent"] == "true", color=lambda _: (0x77, 0xAB, 0x2F, 0xFF))
    j.parse_state(wood("log", nether=False, bamboo=False), ["axis"], "log.png")


def render_stone_blocks():
    def stone(s: str, /, *, stone=True):
        stones = [
            "stone_brick",
            "mossy_stone_brick",
            "cobblestone",
            "mossy_cobblestone",
            "brick",
            "andesite",
            "diorite",
            "granite",
            "cobbled_deepslate",
            "polished_deepslate",
            "deepslate_brick",
            "deepslate_tile",
            "tuff",
            "polished_tuff",
            "tuff_brick",
            "mud_brick",
            # "resin_brick",
            "sandstone",
            "red_sandstone",
            "prismarine",
            "nether_brick",
            "red_nether_brick",
            "blackstone",
            "polished_blackstone",
            "polished_blackstone_brick",
            "end_stone_brick",
        ]
        if stone:
            stones.append("stone")
        return ["_".join((e, s)) + ".json" for e in stones]

    def wall_key(d: dict[str, str], /):
        north, west, south, east, up = d["north"], d["west"], d["south"], d["east"], d["up"]
        return (
            # Can't have low and tall in the same wall block
            not {"low", "tall"} <= {north, west, south, east}
            and not (up == "true" and north == "low")  # Renders behind the post
            and (
                # If center post, no 2 opposite sides can both be tall
                up == "true" and not (west == east == "tall" or north == south == "tall")

                # No center post means either 2 opposite sides or all 4
                or up == "false" and (
                    west == east
                    and north == south
                    and not west == north == "none"
                )
            )
        )

    j.parse_state(
        stone("wall", stone=False),
        ["north", "west", "south", "east", "up"],
        "wall.png",
        custom_values={
            "north": ["none", "low", "tall"],
            "west": ["none", "low", "tall"],
            "south": ["none", "low", "tall"],
            "east": ["none", "low", "tall"],
            "up": ["false", "true"],
        },
        key=wall_key,
    )


def render_redstone():
    # Common and uncomon redstone components
    j.parse_state(
        ["repeater.json"], ["delay", "locked", "facing", "powered"], "repeater.png"
    )
    # The default sorting (lexiographical) sorts mode as [compare, subtract] which is fine
    j.parse_state(["comparator.json"], ["powered", "facing", "mode"], "comparator.png")
    j.parse_state(["observer.json"], ["facing", "powered"], "observer.png")
    j.parse_state(["redstone_lamp.json"], ["lit"], "redstone_lamp.png")
    j.parse_state(["copper_bulb.json"], ["lit", "powered"], "copper_bulb.png")
    j.parse_state(
        ["crafter.json"], ["orientation", "triggered", "crafting"], "crafter.png"
    )
    j.parse_state(["tnt.json"], [], "tnt.png")
    j.parse_state(["target.json"], ["power"], "target.png")
    j.parse_state(["daylight_detector.json"], ["inverted", "power"], "daylight_detector.png")
    j.parse_state(["lever.json"], ["powered", "face", "facing"], "lever.png")


def render_time_takers():
    # Big bombs (long time takers)
    # Redstone wire: takes ~60s
    def redstone_key(d: dict[str, str], /):
        sides = (d["north"], d["west"], d["east"], d["south"])
        return sides.count("none") != 3 and d["east"] != "up" and d["west"] != "up"

    def redstone_color(d: dict[str, str], /):
        # Decompiled source code segment:
        # for (int i = 0; i <= 15; i++) {
        #     float f = (float)i / 15.0F;
        #     float g = f * 0.6F + (f > 0.0F ? 0.4F : 0.3F);
        #     float h = MathHelper.clamp(f * f * 0.7F - 0.5F, 0.0F, 1.0F);
        #     float j = MathHelper.clamp(f * f * 0.6F - 0.7F, 0.0F, 1.0F);
        #     colors[i] = ColorHelper.fromFloats(1.0F, g, h, j);
        # }
        a = int(d["power"]) / 15
        r = int((a * 0.6 + (0.4 if a > 0 else 0.3)) * 255)
        g = int(min(max(a * a * 0.7 - 0.5, 0), 1) * 255)
        b = int(min(max(a * a * 0.6 - 0.7, 0), 1) * 255)
        return (r, g, b, 255)

    j.parse_state(
        ["redstone_wire.json"],
        ["power", "north", "west", "east", "south"],
        "redstone_wire.png",
        key=redstone_key,
        color=redstone_color,
    )

    # Note block: takes ~100s
    j.parse_state(
        ["note_block.json"], ["powered", "note", "instrument"], "note_block.png", key=lambda d: d["note"] == "0" and d["instrument"] == "harp"
    )


def render_fillers():
    j.parse_state(["composter.json"], ["level"], "composter.png")
    j.parse_state(["water_cauldron.json"], ["level"], "water_cauldron.png")
    j.parse_state(["cauldron.json", "lava_cauldron.json"], [], "cauldron.png")
    j.parse_state(["cake.json"], ["bites"], "cake.png")


def render_rails():
    j.parse_state(
        ["rail.json"],
        ["shape"],
        "rail.png",
    )
    for type in ("activator", "powered", "detector"):
        j.parse_state(
            [f"{type}_rail.json"],
            ["shape", "powered"],
            f"{type}_rail.png",
        )


def render_storage_blocks():
    # Chests have an entity model, done separately
    j.parse_state(["barrel.json"], ["facing", "open"], "barrel.png")
    j.parse_state(["hopper.json"], ["facing", "enabled"], "hopper.png")
    j.parse_state(["dropper.json"], ["facing", "triggered"], "dropper.png")
    j.parse_state(["dispenser.json"], ["facing", "triggered"], "dispenser.png")


def render_custom_blocks():
    # Blocks with custom models, separated to make things easier
    j_custom.parse_state(
        ["redstone_torch.json"], ["lit", "facing"], "redstone_torch.png"
    )
    j_custom.parse_state(["chest.json"], ["facing", "type"], "chest.png")
    j_custom.parse_state(["shulker_box.json"], ["facing"], "shulker_box.png")
    j_custom.parse_state(["bell.json"], ["powered", "attachment", "facing"], "bell.png")

    # Tripwire is to thin to show up, so the model was tweaked a bit
    j_custom.parse_state(["tripwire.json"], ["powered", "north", "west", "east", "south", "attached"], "tripwire.png")
    j_custom.parse_state(["tripwire_hook.json"], ["facing", "attached", "powered"], "tripwire_hook.png")

    # Custom extended piston models (piston base) to include part of the shaft
    j_custom.parse_state(["piston.json"], ["facing", "extended"], "piston.png")
    j_custom.parse_state(["sticky_piston.json"], ["facing", "extended"], "sticky_piston.png")

    # Redstone Tweaks has 2 commas in the scaffolding.json, changed to one
    j_custom.parse_state(["scaffolding.json"], ["distance", "bottom"], "scaffolding.png")


render_blocks()
render_colored_blocks()
render_redstone()
render_rails()
render_fillers()
render_storage_blocks()
render_wooden_blocks()
render_stone_blocks()
render_time_takers()
render_custom_blocks()
