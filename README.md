Explainable Multi-Objective Generative Fashion Design

CCS4310 – Deep Learning | Group 07 | SLTC Research University

An explainable AI-based fashion design decision-support system that combines Deep Learning, Machine Learning, and Explainable AI to generate fashion concepts, estimate pre-production market potential, model customer preference, explain model decisions, and refine designs before final selection.

Table of Contents

Project Overview

Problem Statement

Project Objectives

Proposed System

System Architecture

Datasets

AI and ML Components

Explainability and Refinement

Time-Aware Market Re-Evaluation

Evaluation Metrics

Technology Stack

Repository Structure

Implementation Roadmap

Current Status

Team

Scope and Limitations

Academic Use

Project Overview

Fashion products are often designed and produced before there is strong evidence that customers will prefer them or that they will perform well in the market.

This project investigates a pre-production AI decision-support workflow where fashion concepts can be generated using Deep Learning, represented using visual and product features, evaluated for expected demand and customer preference, explained using interpretable AI methods, refined based on identified strengths and weaknesses, and re-evaluated before human approval.

The aim is not to replace fashion designers or guarantee sales. The system is intended to provide data-driven support during early design decision-making.

Problem Statement

A newly generated fashion design has no direct historical sales record. In addition, fashion demand and customer preferences can change over time.

The project therefore addresses two key challenges:

Cold-start evaluation: estimating the potential of a new design using visual, product, seasonal, and similar-product information.

Time sensitivity: reducing the effect of outdated market information by using chronological evaluation and time-aware re-evaluation.

Project Objectives

Generate 2D fashion design concepts using Deep Learning.

Extract meaningful visual representations from fashion images.

Predict expected demand for new fashion designs before production.

Model customer preference and product ranking behaviour.

Explain the factors that influence demand and preference predictions.

Convert explanation results into practical design refinement suggestions.

Regenerate and re-evaluate improved design concepts.

Incorporate time-aware market features to support later re-evaluation.

Present the complete workflow through a professional web dashboard.

Proposed System

Design Brief
    |
    v
Fashion Design Generation
    |
    v
Visual Feature Extraction
    |
    +-------------------+
    |                   |
    v                   v
Demand Prediction   Preference / Ranking
    |                   |
    +---------+---------+
              |
              v
Time-Aware Market Re-Evaluation
              |
              v
Explainability
              |
              v
Refinement Suggestions
              |
              v
Design Regeneration
              |
              v
Re-Evaluation and Ranking
              |
              v
Human Approval

System Architecture

The final application is planned as a separated frontend and AI backend architecture.

Flutter Web Dashboard
        |
        | REST API
        v
Python Backend
        |
        +-----------------------------+
        |              |              |
        v              v              v
Generation       Demand Model   Preference Model
        |              |              |
        +--------------+--------------+
                       |
                       v
               Explainability Layer
                       |
                       v
              Refinement / Re-Scoring

Frontend

Flutter

Dart

Web dashboard

Planned deployment: Vercel

Backend

Python

REST API

Model inference services

Data processing services

Explainability services

Heavy Deep Learning inference may require a separate GPU-enabled hosting environment rather than being executed directly on the frontend hosting platform.

Datasets

1. DeepFashion-MultiModal

Primary use

Fashion image understanding

Text-image conditioning

Visual attribute learning

Visual feature extraction

Support for fashion generation experiments

Source: https://github.com/yumingj/DeepFashion-MultiModal

2. Visuelle 2.0

Primary use

Fashion demand forecasting

Sales-related modelling

Seasonal analysis

Time-aware evaluation

Source: https://humaticslab.github.io/forecasting/visuelle

3. H&M Personalized Fashion Recommendations

Primary use

Customer-product interaction analysis

Customer preference modelling

Product popularity analysis

Ranking and recommendation experiments

Source: https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/data

Dataset Integration Strategy

The datasets contain different products and are not directly joined using product IDs.

Instead, project modules are connected using compatible representations and features such as:

CLIP image embeddings

Product category

Colour

Pattern

Style

Season

Time-related variables

Similar-product signals

Large raw datasets are not committed to this repository because of dataset size and licensing or usage restrictions.

AI and ML Components

Deep Learning

Stable Diffusion / Latent Diffusion

LoRA fine-tuning

CLIP image embeddings

CNN-based visual feature extraction where required

Demand Forecasting

Candidate models:

Linear Regression

Random Forest

XGBoost

LightGBM

Customer Preference and Ranking

Candidate approaches:

Popularity baseline

Collaborative Filtering

Neural Collaborative Filtering

Learning-to-Rank approaches

Final models will be selected based on experimental performance.

Explainability and Refinement

Planned methods include:

SHAP for suitable prediction models

Feature importance

Similar-product evidence

Attribute-level explanations

The explanation layer will support refinement suggestions such as modifying colour, pattern, style-related attributes, seasonal alignment, and other model-relevant factors.

The refined design can then be regenerated and evaluated again.

Time-Aware Market Re-Evaluation

The project plans to use:

Chronological train / validation / test splits

Month and week features

Season

Intended launch period

Product recency

Trend age

Recent category popularity

Recent colour popularity

Recent similar-product performance

Recent customer behaviour

A design can be re-evaluated closer to its intended launch period when newer market information becomes available.

This is a decision-support mechanism and does not guarantee future sales performance.

Evaluation Metrics

Fashion Generation

FID

CLIPScore

LPIPS

Human preference evaluation

Demand Forecasting

MAE

RMSE

WAPE

R²

Preference / Ranking

MAP@12

Recall@K

NDCG@K

Closed-Loop Evaluation

Original vs refined design comparison

Pairwise human preference

Market-alignment score improvement

Before/after model score comparison

Technology Stack

AI / Machine Learning

Python

PyTorch

scikit-learn

XGBoost

LightGBM

Hugging Face Transformers

Hugging Face Diffusers

SHAP

Data Analysis

Pandas

NumPy

Matplotlib

Computer Vision

CLIP

OpenCV

Pillow

Application

Flutter

Dart

Python REST API

Deployment

Frontend: Vercel

AI backend: separate backend / GPU hosting environment to be selected during implementation

Repository Structure

Explainable-Fashion-Design-AI/
|
|-- backend/
|   |-- api/
|   `-- services/
|
|-- frontend/
|
|-- data/
|   |-- raw/
|   |   |-- deepfashion/
|   |   |-- hm/
|   |   `-- visuelle/
|   |-- interim/
|   `-- processed/
|
|-- notebooks/
|   |-- eda/
|   |-- preprocessing/
|   |-- models/
|   `-- explainability/
|
|-- src/
|   |-- preprocessing/
|   |-- feature_engineering/
|   |-- models/
|   |-- explainability/
|   |-- pipeline/
|   `-- utils/
|
|-- models/
|   |-- generation/
|   |-- demand/
|   `-- preference/
|
|-- outputs/
|   |-- figures/
|   |-- generated_designs/
|   |-- logs/
|   `-- metrics/
|
|-- docs/
|   |-- presentations/
|   |-- proposal/
|   `-- report/
|
|-- references/
|   `-- papers/
|
|-- .gitignore
|-- config.yaml
|-- environment.yml
|-- requirements.txt
`-- README.md

Implementation Roadmap

Repository and environment setup

Dataset preparation

Exploratory Data Analysis

Data cleaning and preprocessing

Feature engineering

Baseline demand forecasting

Customer preference / ranking modelling

Visual feature extraction

Fashion generation experiments

Explainability

Time-aware re-evaluation

Closed-loop refinement

Backend API integration

Flutter dashboard development

Deployment and final evaluation

Current Status

Project stage: Implementation

Current focus:

Repository setup

Dataset preparation

EDA planning

Preprocessing design

The first dataset planned for implementation is Visuelle 2.0.

Results and final model selections will be added only after experiments are completed.

Team

Group 07 – CCS4310 Deep Learning

Member

Registration Number

Dasith Randula

23UG1-0057

Maleesha Viraj

23UG1-0035

Nilakshi Sandeepani

23UG1-0028

Pramodya Dewmi

CIT-23-02-0090

Binara Hasanka

CIT-23-02-0137

Scope and Limitations

In Scope

2D fashion concept generation

Pre-production demand estimation

Customer preference modelling

Explainable prediction

Design refinement

Time-aware re-evaluation

Human approval

Web-based dashboard

Out of Scope

Production-ready sewing patterns

3D garment simulation

Virtual try-on

Guaranteed sales prediction

Exact manufacturing cost or profit estimation

Replacing human designers

Full enterprise production deployment

Academic Use

This repository is developed as part of the CCS4310 – Deep Learning group project at SLTC Research University.

The project is intended for academic research and educational purposes.