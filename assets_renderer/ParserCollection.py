import ModelParser
from os.path import join

class ParserCollection:
    """
    A collection of parsers, used for models with hierarchy (a `parent` attribute).
    """

    models: dict[str, "ModelParser.ModelParser"]
    root: str
    def __init__(self, root, branch) -> None:
        self.models = {}
        self.root = root
        self.branch = branch

    def add(self, model: str) -> None:
        """
        Add model to the collection.
        
        Parameters
        ----------
        model
            The model to add, as an identifier name.
        
        Returns
        -------
        None
        """
        if ":" in model:
            namespace, rest = model.split(":")
        else:
            namespace, rest = "minecraft", model
        parser = ModelParser.ModelParser(join(self.root, namespace, self.branch, f"{rest}.json"), self)
        parser.parse()
        self.models[model] = parser

    def get(self, model: str) -> "ModelParser.ModelParser":
        """
        Gets a model from the collection.
        
        Parameters
        ----------
        model
            An identifier for a model to get.
        
        Returns
        -------
        :class:`~.ModelParser`
            The model parser requested.
        """
        return self.models[model]