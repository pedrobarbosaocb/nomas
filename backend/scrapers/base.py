import abc
import typing

class BaseScraper(abc.ABC):
    """
    Base class for all property/apartment scrapers.
    Defines the interface that all scrapers must implement, allowing them
    to be executing polymorphically in main.py.
    """
    def __init__(self, city: typing.Optional[str] = None):
        # Default to canada if no city is provided
        self.city = city if city else "canada"
        
    @abc.abstractmethod
    def search(self) -> typing.List[typing.Dict[str, typing.Any]]:
        """
        Execute the scraper.
        Returns a list of dictionaries, where each dictionary represents 
        a single scraped listing.
        """
        pass
