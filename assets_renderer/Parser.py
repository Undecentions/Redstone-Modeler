import json
from abc import abstractmethod


class Parser:
    """
    Base parser class. A parser parses a json file in the assets
    and extracts its information.
    """
    file: str
    properties: dict[str, int|str|list|dict|bool]
    parsed: bool

    def __init__(self, file: str):
        self.file = file

    def load(self) -> None:
        """
        Opens the file and reads it, setting :attr:`properties`

        Returns
        -------
        None
        """
        with open(self.file) as file:
            self.properties = json.load(file)

    @abstractmethod
    def parse(self) -> None:
        """
        Parses and processes the file. Usually calls :meth:`load`.

        Returns
        -------
        None
        """
        pass