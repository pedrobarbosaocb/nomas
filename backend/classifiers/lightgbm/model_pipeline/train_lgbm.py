import json
import os
import joblib
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import lightgbm as lgb
import optuna

def main():
    # Script is in model_pipeline, so we move one directory up to get back to classifier root
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_path = os.path.join(base_dir, 'training_data', 'kijiji_canada_labeled.json')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"Loading data from {data_path}...")
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    df = pd.DataFrame(data)
    
    # Ensure title and description are strings and handle nulls
    df['title'] = df['title'].fillna('')
    df['description'] = df['description'].fillna('')
    
    # Combine title and description for embedding
    df['text'] = df['title'] + " | " + df['description']
    
    # Filter out entries where ai_label_int is missing
    df = df.dropna(subset=['ai_label_int'])
    
    texts = df['text'].tolist()
    labels = df['ai_label_int'].tolist()
    
    print("Loading embedding model...")
    embedder = SentenceTransformer('intfloat/multilingual-e5-base')
    
    print(f"Extracting embeddings for {len(texts)} samples (this might take a minute)...")
    embeddings = embedder.encode(texts, show_progress_bar=True, batch_size=32)
    
    print("Encoding labels...")
    le = LabelEncoder()
    y = le.fit_transform(labels)
    
    print("Splitting data into train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        embeddings, y, test_size=0.2, random_state=42, shuffle=True
    )
    
    print("Optimizing hyperparameters using Optuna (n_trials=20)...")
    
    def objective(trial):
        param = {
            'objective': 'multiclass',
            'num_class': len(le.classes_),
            'metric': 'multi_logloss',
            'verbosity': -1,
            'boosting_type': 'gbdt',
            'random_state': 42,
            'n_jobs': -1,
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'num_leaves': trial.suggest_int('num_leaves', 20, 100),
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        }
        
        clf_trial = lgb.LGBMClassifier(**param)
        clf_trial.fit(X_train, y_train)
        preds = clf_trial.predict(X_test)
        return accuracy_score(y_test, preds)

    # Note: Running more trials yields better results. Set to 20 for time purposes.
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=20)
    
    print("Best trial:")
    trial = study.best_trial
    print(f"  Value (Accuracy): {trial.value}")
    print("  Params: ")
    last_best = {}
    for key, value in trial.params.items():
        print(f"    {key}: {value}")
        last_best[key] = value
        
    print("Training final model with best parameters...")
    last_best['random_state'] = 42
    last_best['n_jobs'] = -1
    last_best['objective'] = 'multiclass'
    last_best['verbosity'] = -1
    
    clf = lgb.LGBMClassifier(**last_best)
    clf.fit(X_train, y_train)
    
    print("Evaluating final model...")
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"Accuracy: {acc:.4f}")
    print("Classification Report:")
    # We map back the labels to their original integers for interpretation
    print(classification_report(y_test, y_pred, target_names=[str(c) for c in le.classes_]))
    
    model_path = os.path.join(models_dir, 'lgbm_model.joblib')
    encoder_path = os.path.join(models_dir, 'label_encoder.joblib')
    
    print(f"Saving final model to {model_path}...")
    joblib.dump(clf, model_path)
    joblib.dump(le, encoder_path)
    
    print("Done!")

if __name__ == "__main__":
    main()
