# Explainable Fashion Design AI

## Explainable Multi-Objective Generative Fashion Design Using Deep Learning and Machine Learning for Pre-Production Market Optimization

A university Deep Learning group project developed for **CCS4310 – Deep Learning** at **SLTC Research University**.

---

## Project Overview

Fashion businesses need to make important decisions before launching a new product, including selecting the right design, colour, style, season, and target customer segment. However, a newly created design has no direct sales history, and fashion trends can change quickly over time.

This project proposes an **explainable and time-aware AI system** that combines **Deep Learning** and **Machine Learning** to support pre-production fashion decisions.

The proposed system will:

- Generate fashion design concepts using Deep Learning.
- Extract visual and semantic features from generated designs.
- Predict expected demand and customer preference using Machine Learning.
- Explain the main factors behind each prediction.
- Refine low-performing designs using the explanation feedback.
- Re-evaluate designs using recent market information before launch.

---

## Core Workflow

```text
Design Brief
    ↓
Fashion Design Generation
    ↓
Visual Feature Extraction
    ↓
Demand & Customer Preference Prediction
    ↓
Time-Aware Market Re-Evaluation
    ↓
Explainability
    ↓
Design Refinement
    ↓
Final Recommendation
```

---

## Main Research Objective

To develop and evaluate an **explainable, time-aware, closed-loop fashion design system** that uses Deep Learning for design generation and visual analysis, and Machine Learning for demand and customer-preference prediction before production.

---

## Selected Datasets

### 1. DeepFashion-MultiModal
**Purpose:** Fashion generation, visual feature extraction, and attribute recognition.

**Source:**  
https://github.com/yumingj/DeepFashion-MultiModal

### 2. Visuelle 2.0
**Purpose:** Demand prediction, sales forecasting, seasonal analysis, and new-product forecasting.

**Source:**  
https://humaticslab.github.io/forecasting/visuelle

### 3. H&M Personalized Fashion Recommendations
**Purpose:** Customer-preference modelling, product popularity analysis, and product ranking.

**Source:**  
https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/data

> **Note:** Large raw datasets will not be stored directly in this repository. Dataset access instructions and preprocessing steps will be documented separately.

---

## Planned Deep Learning Models

- Stable Diffusion
- Latent Diffusion
- LoRA
- CLIP
- ResNet50
- EfficientNet
- Neural Collaborative Filtering

---

## Planned Machine Learning Models

- Linear Regression
- Random Forest
- XGBoost
- LightGBM
- LightGBM Ranker
- Popularity Baseline

---

## Explainability

The project will use explainable AI techniques to identify the factors that influence predictions.

Planned method:

- SHAP

The explanation output will later be used to guide the design-refinement stage.

---

## Time-Aware Market Re-Evaluation

Fashion trends and customer preferences change over time. A prediction made during early design development may become outdated before the actual product launch.

To reduce this issue, the project plans to use:

- Chronological train / validation / test splitting
- Season and month features
- Launch-period features
- Product recency features
- Recent product popularity
- Recent customer behaviour
- Similar-product recent performance
- Pre-launch re-evaluation using the latest available market information

---

## Planned Data Analysis

### Descriptive Analysis
- Count
- Mean
- Median
- Standard Deviation
- Minimum
- Maximum
- Frequency
- Percentage
- Mode

### Visual Analysis
- Histogram
- Box Plot
- Bar Chart
- Scatter Plot
- Correlation Heatmap

### Relationship Analysis
- Univariate Analysis
- Bivariate Analysis
- Multivariate Analysis

---

## Planned Data Transformations

### Image
- Resize
- Normalize
- Center Crop
- Random Crop
- Horizontal Flip
- Small Rotation
- Brightness Adjustment

### Text
- Text Cleaning
- Lowercasing
- Category Standardization
- Tokenization

### Tabular
- Null Value Handling
- Duplicate Removal
- Categorical Encoding
- Numerical Standardization
- Date Conversion
- Outlier Handling
- Chronological Splitting

---

## Planned Feature Engineering

### Visual Features
- Image Embeddings
- Garment Category
- Dominant Colour
- Pattern
- Style
- Silhouette

### Product Features
- Category
- Price
- Season
- Stock
- Product Type

### Customer Features
- Purchase Frequency
- Recent Purchases
- Preferred Category
- Preferred Colour
- Price Preference
- Customer Segment

### Time-Based Features
- Month
- Season
- Week
- Product Recency
- Trend Age
- Launch Period
- Recent Category Popularity
- Recent Colour Popularity

### Similar-Product Features
- Similarity Score
- Similar-Product Average Sales
- Similar-Product Popularity
- Similar-Product Recent Demand

---

## Planned Evaluation Metrics

### Fashion Generation
- FID
- CLIPScore
- LPIPS

### Attribute Classification
- Accuracy
- Precision
- Recall
- F1-Score

### Demand Prediction
- MAE
- RMSE
- WAPE
- R²

### Customer Preference / Ranking
- MAP@12
- Recall@K
- NDCG@K

### Closed-Loop Evaluation
- Pairwise Preference Rate
- Market-Alignment Score Improvement
- Expert Rating

---

## Proposed Repository Structure

```text
Explainable-Fashion-Design-AI/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── notebooks/
│   ├── 01_visuelle_eda.ipynb
│   ├── 02_hm_eda.ipynb
│   ├── 03_deepfashion_eda.ipynb
│   ├── 04_preprocessing.ipynb
│   ├── 05_feature_engineering.ipynb
│   ├── 06_demand_models.ipynb
│   ├── 07_customer_preference.ipynb
│   ├── 08_visual_features.ipynb
│   ├── 09_fashion_generation.ipynb
│   ├── 10_explainability.ipynb
│   └── 11_closed_loop.ipynb
│
├── src/
│   ├── preprocessing/
│   ├── feature_engineering/
│   ├── models/
│   ├── explainability/
│   └── utils/
│
├── models/
├── outputs/
├── app/
├── docs/
├── references/
├── requirements.txt
└── README.md
```

---

## Technologies

- Python
- PyTorch
- Scikit-learn
- Hugging Face Transformers
- Diffusers
- XGBoost
- LightGBM
- SHAP
- OpenCV
- Pandas
- NumPy
- Matplotlib
- Streamlit / FastAPI

---

## Team Members

| Member | Registration Number |
|---|---|
| Dasith Randula | 23UG1-0057 |
| Maleesha Viraj | 23UG1-0035 |
| Nilakshi Sandeepani | 23UG1-0028 |
| Pramodya Dewmi | CIT-23-02-0090 |
| Binara Hasanka | CIT-23-02-0137 |

---

## Module Information

- **Module:** CCS4310 – Deep Learning
- **University:** SLTC Research University
- **Group:** Group 07

---

## Project Status

**Implementation Stage – In Progress**

Current focus:

1. Dataset acquisition
2. Dataset inspection
3. Exploratory Data Analysis
4. Data cleaning and preprocessing
5. Feature engineering
6. Baseline model development

---

## Disclaimer

This project is developed for academic and research purposes. The system is intended to provide **decision support** and does not guarantee future fashion sales, customer behaviour, or commercial success.
