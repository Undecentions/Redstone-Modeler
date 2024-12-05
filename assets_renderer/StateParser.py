from Parser import Parser
from collections import defaultdict


class StateParser(Parser):
    states: dict[str, list]

    def parse(self) -> None:
        self.load()

        # There should be one singular key in
        # Minecraft assets representation
        if len(self.properties) > 1:
            raise ValueError(
                f"Too many entries in {self.file} properties: {len(self.properties)}."
            )
        key = next(iter(self.properties.keys()))
        data = self.properties[key]

        # Block states
        states: defaultdict[str, set[str]] = defaultdict(set)
        match key:
            case "variants":
                # Keys come in the form
                # [property]=[state], ...
                if not isinstance(data, dict):
                    raise ValueError(f"Malformed json of {self.file}.")

                for data_key in data.keys():
                    if not isinstance(data_key, str):
                        raise ValueError(
                            f"you didn't use the correct files, did you? :skull:"
                            f"(Invalid JSON: expected str key in {self.file})."
                        )

                    if data_key != "":
                        for state in data_key.split(","):
                            k, v = state.split("=")
                            states[k].add(v)

            case "multipart":
                # Format consists of "apply" and "when"
                # "apply" has the model and rotation,
                # while "when" is a boolean sequence
                if not isinstance(data, list):
                    raise ValueError(f"Malformed json of {self.file}.")

                def dfs(section: dict[str, str | list]) -> None:
                    # Minecraft multipart assets have very weird
                    # boolean logic representation, shown in the other parser
                    # that determines which model to use
                    for k, v in section.items():
                        if k in {"OR", "AND"}:
                            if isinstance(v, list):
                                for s in v:
                                    dfs(s)
                            else:
                                raise ValueError(
                                    f"What the heck is Mojang doing?"
                                    f"(Invalid value of key {k}, expected list)."
                                )
                        else:
                            v = str(v)
                            # "|" means OR
                            for v_section in v.split("|"):
                                states[k].add(v_section)

                for part in data:
                    if "when" in part:
                        dfs(part["when"])

            case other:
                raise ValueError(
                    f'Expected either "variants" or "multipart" textures, got {other}.'
                )

        sorted_states: dict[str, list[str]] = {}

        # Too lazy to write the entire thing
        shorthands = {
            "N": "north",
            "W": "west",
            "S": "south",
            "E": "east",
            "U": "up",
            "D": "down",
            "A": "ascending",
            "I": "inner",
            "O": "outer",
            "L": "left",
            "R": "right",
        }
        
        def parse_shorthand(s: tuple | str, /):
            return tuple("_".join(shorthands[v] for v in p) for p in s)

        bools = ["false", "true"]
        directions = ("_floor",) + parse_shorthand("NWSEUD")
        stair_shape = ("straight",) + parse_shorthand(("IL", "IR", "OL", "OR"))
        rail_shape = parse_shorthand(("EW", "NS", "NE", "NW", "SE", "SW", "AN", "AW", "AS", "AE"))
        chest_shape = ("single", "right", "left") # Chests have inverted left/rightness
        for k_, v_ in states.items():
            # Make things easier
            if all(value.isdigit() for value in v_):
                # All ints, sort by value
                sorted_states[k_] = sorted(v_, key=lambda x: int(x))
            elif v_ == set(bools):
                # All booleans, sort to [false, true]
                sorted_states[k_] = bools
            elif v_ <= set(directions):
                # Directions, sort by direction
                sorted_states[k_] = sorted(v_, key=lambda x: directions.index(x))
            elif v_ <= set(rail_shape):
                # Rail, sort shape
                sorted_states[k_] = sorted(v_, key=lambda x: rail_shape.index(x))
            elif v_ <= set(stair_shape):
                # Stair, sort shape
                sorted_states[k_] = sorted(v_, key=lambda x: stair_shape.index(x))
            elif v_ <= set(chest_shape):
                # Stair, sort shape
                sorted_states[k_] = sorted(v_, key=lambda x: chest_shape.index(x))
            else:
                sorted_states[k_] = sorted(v_) 
                # lexiographical just so it's not awfully random
            # and a lot of other random things, such as:
            # - walls, with "none," "low," "high," (only "low" and "high" since "none" is nothing, multipart)

        self.states = sorted_states

    def get_state(self, state: dict[str, str]) -> list[dict]:
        key = next(iter(self.properties.keys()))
        data = self.properties[key]

        match key:
            case "variants":
                if not isinstance(data, dict):
                    raise ValueError(f"Malformed json of {self.file}.")
                for k_, v_ in data.items():
                    if k_ == "":
                        if isinstance(v_, list):
                            return [v_[0]]
                        elif isinstance(v_, dict):
                            return [v_]
                    state_ = {}
                    for property in k_.split(","):
                        k, v = property.split("=")
                        state_[k] = v
                    if state_ == state:
                        return [v_]
                raise ValueError(f"Invalid state: {state}.")
            case "multipart":
                if not isinstance(data, list):
                    raise ValueError(f"Malformed json of {self.file}.")

                result: list[dict] = []

                def dfs(section: dict[str, str | list]) -> bool:
                    # Minecraft multipart assets have very weird
                    # boolean logic representation, shown here
                    for k, v in section.items():
                        if k in {"OR", "AND"}:
                            if isinstance(v, list):
                                if (
                                    k == "AND"and not all(dfs(s) for s in v) 
                                    or k == "OR" and not any(dfs(s) for s in v)
                                ):
                                    return False
                            else:
                                raise ValueError(
                                    f"Invalid value of key {k}, expected list."
                                )
                        else:
                            v = str(v)
                            # "|" means OR in assets
                            if not any(state[k] == v_section for v_section in v.split("|")):
                                return False
                    return True
                for part in data:
                    if "when" not in part or dfs(part["when"]):
                        # I hate assets
                        if isinstance(part["apply"], dict):
                            result.append(part["apply"])
                        elif isinstance(part["apply"], list):
                            result.extend(part["apply"])
                return result
            case other:
                raise ValueError(
                    f'Expected either "variants" or "multipart" textures, got {other}.'
                )
