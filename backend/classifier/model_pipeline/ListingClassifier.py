import os
import joblib
from sentence_transformers import SentenceTransformer

class ListingClassifier:
    def __init__(self, model_dir=None):
        if model_dir is None:
            # Assuming this script is inside a subdirectory (e.g. model_pipeline)
            base_dir = os.path.dirname(os.path.dirname(__file__))
            self.model_dir = os.path.join(base_dir, 'models')
        else:
            self.model_dir = model_dir
            
        self.encoder = None
        self.clf = None
        self.embedder = None
        self._load_models()
        
    def _load_models(self):
        print("Loading embedding model...")
        self.embedder = SentenceTransformer('intfloat/multilingual-e5-base')
        
        encoder_path = os.path.join(self.model_dir, 'label_encoder.joblib')
        model_path = os.path.join(self.model_dir, 'lgbm_model.joblib')
        
        if not os.path.exists(encoder_path) or not os.path.exists(model_path):
            raise FileNotFoundError(f"Models not found in {self.model_dir}. Please run train_lgbm.py first.")
            
        print("Loading LightGBM classifier and label encoder...")
        self.encoder = joblib.load(encoder_path)
        self.clf = joblib.load(model_path)
        
    def predict(self, title, description):
        """
        Takes in a title and description, and returns the predicted class (integer)
        """
        title = title if title else ""
        description = description if description else ""
        
        text = title + " | " + description
        
        # Get embeddings
        embedding = self.embedder.encode([text])
        
        # Predict encoded label
        pred_encoded = self.clf.predict(embedding)
        
        # Decode to original int class
        pred_class = self.encoder.inverse_transform(pred_encoded)[0]
        
        return int(pred_class)
