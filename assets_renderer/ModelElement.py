import ModelParser
from typing import Optional

class ModelElement:
    start: tuple[int, int, int]
    end: tuple[int, int, int]
    rotation: Optional[dict]
    faces: dict[str, dict]
    model_parser: "ModelParser.ModelParser"

    def __init__(self, model_parser: "ModelParser.ModelParser", element: dict):
        self.model_parser = model_parser
        self.start = element["from"]
        self.end = element["to"]
        self.faces = element["faces"]
        if "rotation" in element:
            self.rotation = element["rotation"]
        else:
            self.rotation = None
    
    def do_textures(self) -> None:
        """
        Compute textures in the element by following references.
        Minecraft uses `#` as a reference, so #all would refer to
        the `"all"` entry in `"textures"`.
        
        Returns
        -------
        None
        """
        for direction, face in self.faces.items():
            while self.faces[direction]["texture"].startswith("#"):
                self.faces[direction]["texture"] = self.model_parser.get_texture(face["texture"][1:])
