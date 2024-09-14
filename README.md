# Sketch Search

## What is Sketch Search?

![cover](https://github.com/user-attachments/assets/543c7707-584c-47c3-a1f3-682fbb65117f)

Sketch Search is a desktop application designed to help artists find image references from rough sketches. Reference searching is one of the most important but challenging processes when creating illustrations, animations, videos, and other creative projects. This software performs an image retrieval task using a pose estimation model and returns images relevant to the given sketch.

The main goal of this project is to use technology to make creative work, such as illustration and video creation, easier and more enjoyable.

## Overview

Using a fine-tuned YOLO v8 Pose Estimation model to estimate poses for animation illustrations, Sketch Search can accurately estimate poses from a given illustration. Based on these poses, it then runs the nearest neighbors search to find similar image references.

The application runs entirely on-device, meaning no data is sent over the Internet.

## Technology

Sketch Search is a native desktop application built with Electron. Thanks to Electron's high compatibility across multiple operating systems, it has the potential to run on any computer (though it currently supports only Windows). The machine learning model uses the ONNX Runtime Node to run the model locally with Node.js. Image preprocessing and postprocessing were the most challenging aspects of this project, especially since Node.js was used instead of Python, which is more commonly employed for machine learning tasks.

## Datasets

First, we tuned the model with a COCO-compliant illustration dataset with annotations, provided by the [Bizarre Pose Estimator Model](https://github.com/ShuhongChen/bizarre-pose-estimator).
After fine-tuning the model with the dataset provided by the Bizarre Pose Estimator, we then tuned the model with our custom dataset, which includes 20 rough sketch illustrations with annotations.

## Download
Download the latest version from releases. [Open Releases](https://github.com/rogue1starwars/sketch-search/releases)

## Usage

![usage](https://github.com/user-attachments/assets/02fc9ed2-3720-4081-8f24-bc387ff4c7dd)

In this application, you can upload two types of images: reference images and sketch images. Reference images are those you want to store within the application.

When you first use the application, you need to upload reference images that you own. These are the images you will search through later. Once an image is uploaded, the application automatically runs the pose estimation model and stores the estimated pose data in local storage.

After uploading all your reference images, you can begin searching. Upload a sketch image, and the application will quickly find similar reference images that you previously uploaded.

