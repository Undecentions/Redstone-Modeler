from Parser import Parser
import ParserCollection
from ModelElement import ModelElement
from typing import Optional


class ModelParser(Parser):
    """
    A parser for model files.

    Rough format:
    .. code-block:: json

        {
            "parent": "parent/identifier/path",
            "textures": {
                "ref": "texture/identifier/path"
            },
            "elements": [
                {
                    "from": [x, y, z],
                    "to": [x, y, z],
                    "rotation": { "origin": [x, y, z], "axis": "x|y|z", "angle": deg, "rescale": false },
                    "faces": {
                        "north": { "uv": [u, v, s, t], "texture": "#ref", "rotation": 90|180|270},
                        ...
                    }
                }
            ]
        }
    """

    collection: "ParserCollection.ParserCollection"
    parent: "Optional[ModelParser]"
    elements: list[ModelElement]

    def __init__(self, file, collection):
        super().__init__(file)
        self.collection = collection

    def parse(self) -> None:
        self.load()
        if "parent" in self.properties and isinstance(self.properties["parent"], str):
            name = self.properties["parent"]
            if name not in self.collection.models:
                self.collection.add(name)
            self.parent = self.collection.get(name)
        else:
            self.parent = None

        self.parsed = True

    def get_elements(self, top_class: "ModelParser") -> list[ModelElement]:
        """
        Recursively gets elements of the model. Models can either have
        elements, or have a parent providing the elements.

        Parameters
        ----------
        top_class
            The original class that called in the recursion, used when
            creating the :class:`~.ModelElement`.

        Returns
        -------
        list
            A list of :class:`~.ModelElement`s for the model.
        """
        self.load()
        if "elements" in self.properties:
            elements = self.properties["elements"]
            if isinstance(elements, list):
                return [ModelElement(top_class, element) for element in elements]
            else:
                raise ValueError(f"Malformed asset json of {top_class.file}")
        elif self.parent:
            return self.parent.get_elements(top_class)
        else:
            raise ValueError(f"Elements do not exist for {top_class.file}")

    def get_texture(self, texture: str) -> str:
        """
        Get the given texture file name from reference recursively.
        Texture must either exist on the model or in one of its parents,
        although for the majority of cases it exists in the child.

        Parameters
        ----------
        texture
            The texture reference (the part after "#") name.

        Returns
        -------
        str
            The texture file name based on the reference name.
        """
        if (
            "textures" in self.properties
            and isinstance(self.properties["textures"], dict)
            and texture in self.properties["textures"]
        ):
            return self.properties["textures"][texture]
        elif self.parent:
            return self.parent.get_texture(texture)
        else:
            raise ValueError(f"Texture {texture} does not exist on {self.file}")
