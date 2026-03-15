

class KijijiAd():

    def __init__(self, ad):
        title_elem = ad.find(attrs={"data-testid": "listing-title"})
        self.title = title_elem.text.strip() if title_elem else "No Title"
        self.id = ad.get('data-listingid', '0')
        self.ad = ad
        self.info = {}

        self.__locate_info()
        self.__parse_info()

    def __locate_info(self):
        # Locate ad information using data-testid
        self.info["Title"] = self.title
        
        img_elem = self.ad.find(attrs={"data-testid": "listing-card-image"})
        self.info["Image"] = str(img_elem) if img_elem else ""
        self.info["DataSource"] = img_elem.get('src') if img_elem else ""
        
        link_elem = self.ad.find(attrs={"data-testid": "listing-link"})
        self.info["Url"] = link_elem.get("href") if link_elem else ""
        
        details_elem = self.ad.find(attrs={"data-testid": "listing-details"})
        self.info["Details"] = details_elem.text.strip() if details_elem else ""
        
        desc_elem = self.ad.find(attrs={"data-testid": "listing-description"})
        self.info["Description"] = desc_elem.text.strip() if desc_elem else ""
        
        self.info["Date"] = ""
        
        loc_elem = self.ad.find(attrs={"data-testid": "listing-location"})
        self.info["Location"] = loc_elem.text.strip() if loc_elem else ""
        
        price_elem = self.ad.find(attrs={"data-testid": "listing-price"})
        self.info["Price"] = price_elem.text.strip() if price_elem else ""
        
        # Initialize scores
        self.info["Walk_Score"] = ""
        self.info["Transit_Score"] = ""
        self.info["Bike_Score"] = ""

    def __parse_info(self):
        # Parse remaining ad information
        for key, value in self.info.items():
            if value:
                if key == "Url" and not value.startswith("http"):
                    self.info[key] = 'http://www.kijiji.ca' + value

                elif key == "Image" and self.info.get("DataSource"):
                    self.info[key] = '<img src =\"' + self.info["DataSource"] + '\"/>'
