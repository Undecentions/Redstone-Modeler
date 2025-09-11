from ParserCollection import ParserCollection
from StateParser import StateParser
from Renderer import Renderer
from itertools import product
from PIL import Image
from math import prod
from typing import Callable, Optional
import os.path
from time import perf_counter


class Joiner:
    """
    Joiner that renders blocks and joins them together in one texture atlas.
    """
    root: str
    namespace: str
    output_root: str
    parser_collection: ParserCollection

    def __init__(self, root: str, namespace: str, output_root: str) -> None:
        self.root = root
        self.namespace = namespace
        self.output_root = output_root
        self.parser_collection = ParserCollection(
            root, "models"
        )

    def parse_state(
        self,
        files: list[str],
        keys_order: list[str],
        output: str,
        /,
        *,
        custom_values: Optional[dict[str, list]] = None,
        key: Optional[Callable[[dict[str, str]], bool]] = None,
        color: Optional[Callable[[dict[str, str]], tuple[int, int, int, int]]] = None,
    ) -> None:
        """
        Parse state of file, printing its status as it goes.

        Parameters
        ----------
        files
            A list of file names to parse from.
        keys_order
            A list of keys specifying the order the `product` should be done in.
        output
            The output file name.
        custom_values
            Custom values if not all values are used in the assets.
            By default, the :class:`StateParser` will parse the source for values.
        key
            A function that is called for each value using the value dictionary,
            used to filter through some illegal block states.
        color
            A function that is called for each value using the value dictionary
            (similar to `key`) that returns the color of the block, used for color maps.

        Returns
        -------
        None

        Raises
        ------
        :exc:`ValueError`
            If the keys_order is incorrect
        """
        # If using multiple files, and keys_order exists, they must be
        # the exact same format for all the files, otherwise the renderer breaks.

        # Note: "by" means width by height
        # If key exists, skipped textures are counted as non-existent
        # If one file and no keys_order, 1 by 1
        # If one file and 1 keys_order, length of only state by 1
        # If one file and more, length of first state by max length of combinations of remaining states
        # If multiple files, combination of states by number of files
        file = files[0]  # Arbitrary one, doesn't matter
        state_parser = StateParser(os.path.join(self.root, self.namespace, "blockstates", file))
        state_parser.parse()
        states = custom_values if custom_values is not None else state_parser.states
        if set(keys_order) != set(states.keys()):
            raise ValueError(f"Keys order incorrect for {file}, expected {set(state_parser.states.keys())}.")
        values = sorted(states.items(), key=lambda x: keys_order.index(x[0]))
        lens = [len(value[1]) for value in values]
        if len(files) == 1:
            if len(keys_order) == 0:
                width = height = 1
            elif len(keys_order) == 1:
                if key is not None:
                    width = 0
                    height = 1
                    for combination in values[0][1]:
                        if key(dict(zip(keys_order, [combination]))):
                            width += 1
                else:
                    width, height = lens[0], 1
            else:
                if key is not None:
                    width = 0
                    height = 0
                    file = files[0]
                    for combination_start in values[0][1]:
                        height_ = 0
                        for combination_end in product(*(value[1] for value in values[1:])):
                            if key(dict(zip(keys_order, [combination_start, *combination_end]))):
                                height_ += 1
                        if height_ != 0:
                            width += 1
                            height = max(height, height_)
                    values = [*values[1:], values[0]]
                    keys_order = [*keys_order[1:], keys_order[0]]
                else:
                    width, height = lens[0], prod(lens[1:])
                    values = [*values[1:], values[0]]
                    keys_order = [*keys_order[1:], keys_order[0]]
        else:
            if key is None:
                width, height = prod(lens), len(files)
            else:
                width, height = 0, len(files)
                for combination in product(*(value[1] for value in values)):
                    if key(dict(zip(keys_order, combination))):
                        width += 1

        atlas = Image.new("RGBA", (width * Renderer.size[0], height * Renderer.size[1]))
        i = 0
        for file in files:
            start = perf_counter()
            state_parser = StateParser(
                os.path.join(self.root, self.namespace, "blockstates", file)
            )
            state_parser.parse()
            for combination in product(*(value[1] for value in values)):
                print(f"{i / (width * height):7.2%} - {perf_counter() - start:6.2f} - {file}", end="\r", flush=True)
                state_dict = dict(zip(keys_order, combination))  # Dict creation from k/v
                if key is not None and not key(state_dict):
                    continue
                r = Renderer()
                for model in state_parser.get_state(state_dict):
                    if model["model"] not in self.parser_collection.models:
                        self.parser_collection.add(model["model"])
                    r.render(
                        self.parser_collection.get(model["model"]),
                        x=model.get("x", 0),
                        y=model.get("y", 0),
                        z=model.get("z", 0),
                        color=(color(state_dict) if color is not None else None),
                        uv_lock=model.get("uvlock", False),
                    )
                y, x = divmod(i, width)
                atlas.paste(r.get_image(), (x * Renderer.size[0], y * Renderer.size[1]))
                i += 1  # Skip ones skipped by `key`
            print(f"{i / (width * height):7.2%} - {perf_counter() - start:6.2f} - {file}", flush=True)
        atlas.save(os.path.join(self.output_root, output))
